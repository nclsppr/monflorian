"use strict";

(() => {
  const root = document.documentElement;
  const variants = [
    "/assets/florian-original-web.webp",
    "/assets/florian-wind-web.webp",
    "/assets/florian-beanie-web.webp",
    "/assets/florian-summer-web.webp",
    "/assets/florian-flower-web.webp",
  ];
  const source = variants[Math.floor(Math.random() * variants.length)];

  root.classList.add("is-florian-loading");

  const reveal = () => root.classList.remove("is-florian-loading");
  const applyVariant = () => {
    document.querySelectorAll("[data-florian-variant]").forEach((image) => {
      image.src = source;
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
  candidate.src = source;
  candidate.decode().then(applyWhenReady, reveal);
})();
