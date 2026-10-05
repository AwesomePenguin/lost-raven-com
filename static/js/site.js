(function () {
  if (!localStorage.getItem("theme")) {
    localStorage.setItem("theme", "dark");
  }
})();

(function () {
  var aiLink = document.querySelector("[data-ai-link]");
  if (!aiLink) return;

  var visibleAt = Date.parse(aiLink.getAttribute("data-visible-at"));
  if (!Number.isFinite(visibleAt)) {
    throw new Error("Invalid AI statement link visibility date.");
  }

  var previewRequested = new URLSearchParams(window.location.search).get("release-preview") === "1";
  var isLocalPreview = previewRequested && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  var visibilityTimer;

  if (isLocalPreview) {
    document.querySelectorAll(".menu .dropdown-content a").forEach(function (link) {
      var url = new URL(link.href);
      url.searchParams.set("release-preview", "1");
      link.href = url.toString();
    });
  }

  function updateVisibility() {
    if (isLocalPreview || Date.now() >= visibleAt) {
      aiLink.hidden = false;
      if (visibilityTimer) window.clearInterval(visibilityTimer);
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("pageshow", updateVisibility);
    }
  }

  updateVisibility();
  if (aiLink.hidden) {
    visibilityTimer = window.setInterval(updateVisibility, 1000);
    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("pageshow", updateVisibility);
  }
})();
