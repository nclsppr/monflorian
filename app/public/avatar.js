"use strict";

(() => {
  const root = document.documentElement;
  const variants = ["original", "wind", "beanie", "summer", "flower"];
  const taglines = [
    "Alors, on part où ?",
    "On met le cap où ?",
    "Tu rêves de partir où ?",
    "On prépare la valise ?",
    "On change d’air ?",
    "Tu m’emmènes où ?",
    "Un coin en tête ?",
    "On part bientôt ?",
    "On vise quelle escale ?",
    "C’est où, la prochaine ?",
  ];
  const requestedVariant = /(?:^|[?&])avatar=(original|wind|beanie|summer|flower)(?:&|$)/u
    .exec(globalThis.location?.search ?? "")?.[1];
  const selectedVariant = requestedVariant ?? variants[Math.floor(Math.random() * variants.length)];
  let previousTaglineIndex = -1;
  try {
    previousTaglineIndex = Number.parseInt(
      globalThis.sessionStorage?.getItem("monflorian:last-tagline") ?? "",
      10,
    );
  } catch {
    previousTaglineIndex = -1;
  }
  const availableTaglineIndexes = taglines
    .map((_, index) => index)
    .filter((index) => index !== previousTaglineIndex);
  const selectedTaglineIndex = availableTaglineIndexes[
    Math.floor(Math.random() * availableTaglineIndexes.length)
  ];
  const selectedTagline = taglines[selectedTaglineIndex];
  try {
    globalThis.sessionStorage?.setItem(
      "monflorian:last-tagline",
      String(selectedTaglineIndex),
    );
  } catch {
    // Session storage is optional.
  }
  const sources = {
    compact: `/assets/florian-v2-${selectedVariant}-web.webp`,
    intro: `/assets/florian-v2-${selectedVariant}-intro.webp`,
  };

  root.classList.add("is-florian-loading");

  const runWhenReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };
  const reveal = () => root.classList.remove("is-florian-loading");
  const applyTagline = () => {
    const tagline = document.querySelector("[data-florian-tagline]");
    if (tagline) tagline.textContent = selectedTagline;
  };
  const applyVariant = () => {
    document.querySelectorAll("[data-florian-variant]").forEach((image) => {
      image.src = image.hasAttribute("data-florian-intro") ? sources.intro : sources.compact;
    });
    reveal();
  };

  runWhenReady(applyTagline);

  const candidate = new Image();
  candidate.src = sources.intro;
  candidate.decode().then(() => runWhenReady(applyVariant), reveal);
})();
