// ====================================
// SIDEBAR: restore the saved state BEFORE the page is painted.
// This file is loaded in the <head> so a collapsed sidebar is already
// collapsed on the first frame of the next page (no jump or flicker).
// ====================================
try {
  if (localStorage.getItem("sidebarCollapsed") === "1") {
    document.documentElement.classList.add("sidebar-collapsed");
  }
} catch (err) {
  // storage unavailable: the sidebar simply starts expanded
}
