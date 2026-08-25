"use strict";

(() => {
  const root = document.documentElement;

  if (typeof IntersectionObserver !== "function") return;

  root.classList.add("has-intro-swap");

  const reset = () => root.classList.remove("has-intro-swap", "is-intro-past");

  const init = () => {
    const header = document.querySelector(".site-header");
    const trigger = document.querySelector(".brand-intro-trigger");

    if (!header || !trigger) {
      reset();
      return;
    }

    const headerHeight = Math.ceil(header.getBoundingClientRect().height);
    const observer = new IntersectionObserver(([entry]) => {
      const introIsPast = !entry.isIntersecting && entry.boundingClientRect.top <= headerHeight;
      root.classList.toggle("is-intro-past", introIsPast);
    }, {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
      threshold: 0,
    });

    observer.observe(trigger);
  };

  const start = () => {
    try {
      init();
    } catch {
      reset();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
