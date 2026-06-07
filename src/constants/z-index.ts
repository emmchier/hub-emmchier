/**
 * App-wide stacking order (low → high).
 * Bottom sheet must render above modal / image viewer (300–301) and the rest of chrome.
 */
export const Z_INDEX = {
  drawerOverlay: 150,
  drawerPanel: 151,
  baseModal: 100,
  navbarNarrow: 180,
  scrollToTop: 101,
  modal: 300,
  modalChrome: 301,
  bottomSheetOverlay: 500,
  bottomSheet: 501,
} as const;
