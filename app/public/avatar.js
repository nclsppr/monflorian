"use strict";

(() => {
  const root = document.documentElement;
  const variants = [
    "/assets/florian-original.png?v=2",
    "/assets/florian-wind.png?v=2",
    "/assets/florian-beanie.png?v=2",
    "/assets/florian-summer.png?v=2",
    "/assets/florian-flower.png?v=2",
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
