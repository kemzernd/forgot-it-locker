// ====================================
// SIDEBAR: RETRACT (<) AND EXPAND (>)
// The saved state is restored by sidebar-init.js (in the <head>) before the
// page paints, so the sidebar keeps its position when a link is touched.
// It only changes when the < or > button is clicked.
// ====================================
(function () {
  const STORAGE_KEY = "sidebarCollapsed";
  const root = document.documentElement;
  const collapseBtn = document.getElementById("sidebar-collapse-btn");
  const expandBtn = document.getElementById("sidebar-expand-btn");
  if (!collapseBtn || !expandBtn) return;

  function setCollapsed(collapsed) {
    root.classList.toggle("sidebar-collapsed", collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch (err) {
      console.log("Could not save sidebar state:", err);
    }
  }

  collapseBtn.addEventListener("click", function () {
    setCollapsed(true);
  });
  expandBtn.addEventListener("click", function () {
    setCollapsed(false);
  });
})();
