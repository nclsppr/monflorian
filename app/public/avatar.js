"use strict";

(() => {
  const root = document.documentElement;
  const variants = ["original", "wind", "beanie", "summer", "flower"];
  const requestedVariant = /(?:^|[?&])avatar=(original|wind|beanie|summer|flower)(?:&|$)/u
    .exec(globalThis.location?.search ?? "")?.[1];
  const selectedVariant = requestedVariant ?? variants[Math.floor(Math.random() * variants.length)];
  const prefix = globalThis.location?.pathname === "/v2" ? "florian-v2" : "florian";
  const sources = {
    compact: `/assets/${prefix}-${selectedVariant}-web.webp`,
    intro: `/assets/${prefix}-${selectedVariant}-intro.webp`,
  };

  root.classList.add("is-florian-loading");

  const reveal = () => root.classList.remove("is-florian-loading");
  const applyVariant = () => {
    document.querySelectorAll("[data-florian-variant]").forEach((image) => {
      image.src = image.hasAttribute("data-florian-intro") ? sources.intro : sources.compact;
    });
    reveal();
  };
  const applyWhenReady = () => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyVariant, { once: true });
      return;
    }
    applyVariant();
  };

  const candidate = new Image();
  candidate.src = sources.intro;
  candidate.decode().then(applyWhenReady, reveal);
})();
