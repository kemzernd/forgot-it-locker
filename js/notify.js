// ====================================
// SHARED: TOAST NOTIFICATIONS + SOUND + CART BADGE
// ====================================
(function () {
  // ---------- Sound (generated with the Web Audio API, no files needed) ----------
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playNote(ctx, frequency, startOffset, duration, waveType) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + startOffset;

    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, start);

    // Quick fade in/out so the sound does not click
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function playNotificationSound(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (type === "error") {
        // Two low notes going down
        playNote(ctx, 330, 0, 0.14, "triangle");
        playNote(ctx, 220, 0.15, 0.2, "triangle");
      } else {
        // Two bright notes going up
        playNote(ctx, 660, 0, 0.12, "sine");
        playNote(ctx, 880, 0.12, 0.18, "sine");
      }
    } catch (err) {
      console.log("Notification sound blocked by browser:", err);
    }
  }

  // ---------- Toast ----------
  function getToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }
    return container;
  }

  function removeToast(toast) {
    toast.classList.add("toast-hide");
    setTimeout(function () {
      toast.remove();
    }, 260);
  }

  // type: "success" (green) or "error" (red)
  function notify(message, type) {
    const kind = type === "error" ? "error" : "success";
    const toast = document.createElement("div");

    toast.className = "toast toast-" + kind;
    toast.setAttribute("role", kind === "error" ? "alert" : "status");
    toast.textContent = message; // textContent keeps user-typed text safe
    toast.addEventListener("click", function () {
      removeToast(toast);
    });

    getToastContainer().appendChild(toast);
    playNotificationSound(kind);

    setTimeout(function () {
      removeToast(toast);
    }, 3500);
  }

  window.notify = notify;

  // ---------- Cart badge on the "Cart" navigation link ----------
  function setupCartBadge() {
    document.querySelectorAll(".nav-links a").forEach(function (link) {
      const href = (link.getAttribute("href") || "").toLowerCase();
      if (!href.endsWith("cart.html") || link.querySelector(".cart-badge")) {
        return;
      }
      const label = link.textContent.trim();
      link.innerHTML =
        '<span class="cart-link-text">' +
        label +
        '<span class="cart-badge" hidden>0</span></span>';
    });
  }

  // Shows how many different items are in the cart (hidden when empty)
  function updateCartBadge() {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch (err) {
      cart = [];
    }
    document.querySelectorAll(".cart-badge").forEach(function (badge) {
      badge.textContent = cart.length;
      badge.hidden = cart.length === 0;
    });
  }

  window.updateCartBadge = updateCartBadge;

  function init() {
    setupCartBadge();
    updateCartBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
