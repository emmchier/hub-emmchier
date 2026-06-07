/**
 * Lightweight module-level session state.
 *
 * Lives in the JS module scope → resets automatically on every full page
 * refresh (module re-executes). Persists across SPA navigations within the
 * same session.
 */

const NON_PROJECT_PATHS = ['/', '/contact', '/legals'];

function isNonProjectPath(pathname: string): boolean {
  return NON_PROJECT_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/'))
  );
}

export const sessionState = {
  /** true once the first project of the current "home session" has been shown. */
  headerShownOnFirstProject: false,

  /**
   * true when the last project navigation came from the Sidebar.
   * Reset to false when the user clicks a Navbar item or visits a non-project page.
   */
  navigatedFromSidebar: false,

  resetOnNonProjectVisit(pathname: string) {
    if (isNonProjectPath(pathname)) {
      this.headerShownOnFirstProject = false;
      this.navigatedFromSidebar = false;
    }
  },
};
