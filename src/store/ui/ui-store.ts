import { create } from 'zustand';
import { ReactNode } from 'react';

interface State {
  // Drawer
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openCloseDrawer: () => void;

  // Sidebar
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  openCloseSidebar: () => void;

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;

  // Language
  language: 'en' | 'es';
  toggleLanguage: () => void;

  // tab height
  tabHeaderHeight: number;
  setTabHeaderHeight: (height: number) => void;

  // BottomSheet
  isBottomSheetOpen: boolean;
  bottomSheetMode: 'list' | 'share';
  bottomSheetListItems?: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }>;
  bottomSheetShareData?: {
    pathname: string;
    title: string;
  };
  openBottomSheet: (options: {
    mode: 'list' | 'share';
    listItems?: Array<{
      value: string;
      label: string;
      icon?: React.ReactNode;
      onClick?: () => void;
      className?: string;
    }>;
    shareData?: {
      pathname: string;
      title: string;
    };
  }) => void;
  closeBottomSheet: () => void;
}

interface ModalState {
  showModal: boolean;
  closeButton: boolean;
  fullWidthActions: boolean;
  closeOnClickOverlay: boolean;
  images: string[];
  imageNames: string[];
  currentImage: string;
  sharePaths: string[];
  projectName: string | null;
  openModal: (options: {
    images: string[];
    imageNames?: string[];
    currentImage: string;
    sharePaths?: string[];
    projectName?: string;
    closeButton?: boolean;
    fullWidthActions?: boolean;
    closeOnClickOverlay?: boolean;
  }) => void;
  closeModal: () => void;
  setCurrentImage: (image: string) => void;
  goToNextImage: () => void;
  goToPreviousImage: () => void;
}

export const useUIStore = create<State>()((set) => {
  const storedLanguage =
    typeof window !== 'undefined' ? localStorage.getItem('language') : null;
  // Sync cookie on init so generateMetadata can read the preference server-side
  if (typeof window !== 'undefined' && storedLanguage) {
    document.cookie = `language=${storedLanguage};path=/;max-age=31536000;SameSite=Lax`;
  }

  return {
    // Drawer
    isDrawerOpen: false,
    openDrawer: () => set({ isDrawerOpen: true }),
    closeDrawer: () => set({ isDrawerOpen: false }),
    openCloseDrawer: () =>
      set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

    // Sidebar - siempre inicia con true para SSR (evita mismatch de hidratación)
    // Se sincronizará desde localStorage en el cliente después del primer render
    isSidebarOpen: true,
    openSidebar: () => {
      if (typeof window !== 'undefined')
        localStorage.setItem('sidebarOpen', 'true');
      set({ isSidebarOpen: true });
    },
    closeSidebar: () => {
      if (typeof window !== 'undefined')
        localStorage.setItem('sidebarOpen', 'false');
      set({ isSidebarOpen: false });
    },
    openCloseSidebar: () =>
      set((state) => {
        const newState = !state.isSidebarOpen;
        if (typeof window !== 'undefined')
          localStorage.setItem('sidebarOpen', String(newState));
        return { isSidebarOpen: newState };
      }),

    // Pagination
    currentPage: 1,
    itemsPerPage: 24,
    setCurrentPage: (page) => set({ currentPage: page }),

    // Language
    language: storedLanguage === 'es' ? 'es' : 'en',
    toggleLanguage: () =>
      set((state) => {
        const newLang = state.language === 'en' ? 'es' : 'en';
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', newLang);
          // Cookie so server layouts can read it in generateMetadata
          document.cookie = `language=${newLang};path=/;max-age=31536000;SameSite=Lax`;
        }
        return { language: newLang };
      }),

    // tab
    tabHeaderHeight: 72,
    setTabHeaderHeight: (height) => set({ tabHeaderHeight: height }),

    // BottomSheet
    isBottomSheetOpen: false,
    bottomSheetMode: 'list',
    bottomSheetListItems: undefined,
    bottomSheetShareData: undefined,
    openBottomSheet: ({ mode, listItems, shareData }) =>
      set({
        isBottomSheetOpen: true,
        bottomSheetMode: mode,
        bottomSheetListItems: listItems,
        bottomSheetShareData: shareData,
      }),
    closeBottomSheet: () =>
      set({
        isBottomSheetOpen: false,
        bottomSheetMode: 'list',
        bottomSheetListItems: undefined,
        bottomSheetShareData: undefined,
      }),
  };
});

export const useModalStore = create<ModalState>()((set, get) => ({
  showModal: false,
  closeButton: false,
  fullWidthActions: false,
  closeOnClickOverlay: true,
  images: [],
  imageNames: [],
  currentImage: '',
  sharePaths: [],
  projectName: null,

  openModal: ({
    images,
    imageNames,
    currentImage,
    sharePaths,
    projectName,
    closeButton = false,
    fullWidthActions = false,
    closeOnClickOverlay = true,
  }) =>
    set({
      images,
      imageNames: imageNames ?? [],
      currentImage,
      sharePaths: sharePaths ?? [],
      projectName: projectName || null,
      showModal: true,
      closeButton,
      fullWidthActions,
      closeOnClickOverlay,
    }),

  closeModal: () =>
    set({ showModal: false, projectName: null, sharePaths: [] }),
  setCurrentImage: (image) => set({ currentImage: image }),

  goToNextImage: () => {
    const { images, currentImage } = get();
    const currentIndex = images.indexOf(currentImage);
    const nextIndex = (currentIndex + 1) % images.length;
    set({ currentImage: images[nextIndex] });
  },

  goToPreviousImage: () => {
    const { images, currentImage } = get();
    const currentIndex = images.indexOf(currentImage);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    set({ currentImage: images[prevIndex] });
  },
}));
