"use strict";

(() => {
  const root = document.documentElement;
  const variants = [
    { compact: "/assets/florian-original-web.webp", intro: "/assets/florian-original-intro.webp" },
    { compact: "/assets/florian-wind-web.webp", intro: "/assets/florian-wind-intro.webp" },
    { compact: "/assets/florian-beanie-web.webp", intro: "/assets/florian-beanie-intro.webp" },
    { compact: "/assets/florian-summer-web.webp", intro: "/assets/florian-summer-intro.webp" },
    { compact: "/assets/florian-flower-web.webp", intro: "/assets/florian-flower-intro.webp" },
  ];
  const sources = variants[Math.floor(Math.random() * variants.length)];

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
