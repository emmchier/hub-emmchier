'use client';
import { useUIStore } from '@/store/ui/ui-store';

export const DrawerTrigger = () => {
  const { isDrawerOpen, openCloseDrawer } = useUIStore();

  const handleDrawer = () => {
    openCloseDrawer();
  };

  return (
    <div className="fixed left-0 top-0 z-180 box-border hidden h-[55px] w-[56px] max-[1265px]:flex md:max-[1265px]:h-[48px] bg-primary-background">
      <button
        aria-label=""
        onClick={handleDrawer}
        className="flex h-[55px] w-[56px] cursor-pointer items-center justify-center border-none bg-transparent md:max-[1265px]:h-[48px]"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
        }}
      >
        <div
          className={`relative w-[24px] h-[20px] transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          {/* Top line */}
          <div
            className={`absolute left-0 top-1/2 h-[4px] w-[24px] transition-all duration-300 ease-in-out ${
              isDrawerOpen
                ? 'bg-selected-text rotate-45'
                : 'bg-primary-text -translate-y-[6px]'
            }`}
          />
          {/* Bottom line */}
          <div
            className={`absolute left-0 top-1/2 h-[4px] transition-all duration-300 ease-in-out ${
              isDrawerOpen
                ? 'w-[24px] bg-selected-text -rotate-45'
                : 'w-[12px] bg-primary-text translate-y-[6px]'
            }`}
          />
        </div>
      </button>
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  );
};
