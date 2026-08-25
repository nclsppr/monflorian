"use strict";

(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || typeof window.requestAnimationFrame !== "function") return;

  root.classList.add("has-scroll-motion");

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const smoothstep = (value) => value * value * (3 - 2 * value);
  const resetMotionStyles = () => {
    root.classList.remove("has-scroll-motion", "is-brand-measuring", "is-brand-settled");
    const styles = [
      [".brand", ["transform"]],
      [".site-header-surface", ["opacity"]],
      [".launch-state", ["opacity", "transform"]],
      [".preview-phone-depth", ["transform"]],
      [".preview-sun", ["transform"]],
      [".preview-mountain.back", ["transform"]],
      [".preview-mountain.front", ["transform"]],
    ];

    styles.forEach(([selector, properties]) => {
      const element = document.querySelector(selector);
      properties.forEach((property) => element?.style.removeProperty(property));
    });
  };

  const init = () => {
    const brand = document.querySelector(".brand");
    const intro = document.querySelector(".brand-intro-space");
    const preview = document.querySelector(".travel-preview");
    const headerSurface = document.querySelector(".site-header-surface");
    const launchState = document.querySelector(".launch-state");
    const phone = document.querySelector(".preview-phone-depth");
    const sun = document.querySelector(".preview-sun");
    const mountainBack = document.querySelector(".preview-mountain.back");
    const mountainFront = document.querySelector(".preview-mountain.front");

    if (
      !brand || !intro || !preview || !headerSurface || !launchState || !phone || !sun ||
      !mountainBack || !mountainFront
    ) {
      resetMotionStyles();
      return;
    }

    let animationFrame = 0;
    let previewVisible = false;
    let measuredWidth = 0;
    let introRange = 1;
    let brandScale = 1;
    let brandShiftX = 0;
    let brandShiftY = 0;
    let lastProgress = -1;
    let lastPreviewDepth = null;
    let brandSettled = false;

    const measure = () => {
      root.classList.add("is-brand-measuring");
      const brandRect = brand.getBoundingClientRect();
      root.classList.remove("is-brand-measuring");

      const compact = window.innerWidth <= 620;
      const targetWidth = compact
        ? Math.min(window.innerWidth * 0.78, 330)
        : Math.min(window.innerWidth * 0.5, 520);
      const targetCenterY = window.innerHeight * (compact ? 0.39 : 0.42);

      brandScale = clamp(targetWidth / brandRect.width, compact ? 1.5 : 2, compact ? 2.1 : 2.4);
      brandShiftX = (window.innerWidth / 2) - (brandRect.left + brandRect.width / 2);
      brandShiftY = targetCenterY - (brandRect.top + brandRect.height / 2);
      introRange = Math.max(240, intro.getBoundingClientRect().height * 0.84);
      measuredWidth = window.innerWidth;
    };

    const readPreviewDepth = () => {
      if (!previewVisible) return null;

      const rect = preview.getBoundingClientRect();
      const travel = (window.innerHeight + rect.height) / 2;
      return clamp(
        ((window.innerHeight / 2) - (rect.top + rect.height / 2)) / travel,
        -1,
        1,
      );
    };

    const writePreviewDepth = (depth) => {
      if (depth === null) return;

      const roundedDepth = Number(depth.toFixed(4));
      if (roundedDepth === lastPreviewDepth) return;
      lastPreviewDepth = roundedDepth;

      phone.style.transform = `translate3d(0, ${(roundedDepth * 22).toFixed(2)}px, 0)`;
      sun.style.transform = `translate3d(0, ${(roundedDepth * -10).toFixed(2)}px, 0)`;
      mountainBack.style.transform = `translate3d(0, ${(roundedDepth * -15).toFixed(2)}px, 0)`;
      mountainFront.style.transform = `translate3d(0, ${(roundedDepth * -24).toFixed(2)}px, 0)`;
    };

    const render = () => {
      animationFrame = 0;

      const rawProgress = clamp(window.scrollY / introRange, 0, 1);
      const introChanged = rawProgress !== lastProgress;
      if (!introChanged && !previewVisible) return;

      const previewDepth = readPreviewDepth();

      if (introChanged) {
        const progress = smoothstep(rawProgress);
        const remaining = 1 - progress;
        const scale = 1 + (brandScale - 1) * remaining;
        const launchProgress = clamp((progress - 0.42) / 0.42, 0, 1);
        const settled = rawProgress >= 0.995;

        brand.style.transform = `translate3d(${(brandShiftX * remaining).toFixed(2)}px, ${(brandShiftY * remaining).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        headerSurface.style.opacity = clamp((progress - 0.58) / 0.42, 0, 1).toFixed(3);
        launchState.style.opacity = launchProgress.toFixed(3);
        launchState.style.transform = `translate3d(0, ${((1 - launchProgress) * -8).toFixed(2)}px, 0)`;

        if (settled !== brandSettled) {
          brandSettled = settled;
          root.classList.toggle("is-brand-settled", settled);
        }
        lastProgress = rawProgress;
      }

      writePreviewDepth(previewDepth);
    };

    const scheduleRender = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (Math.abs(window.innerWidth - measuredWidth) > 1) {
        measure();
        lastProgress = -1;
      }
      scheduleRender();
    };

    const previewObserver = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
        previewVisible = entries.some((entry) => entry.isIntersecting);
        preview.classList.toggle("is-parallax-active", previewVisible);
        scheduleRender();
      }, { rootMargin: "25% 0px" })
      : null;

    if (previewObserver) {
      previewObserver.observe(preview);
    } else {
      previewVisible = true;
      preview.classList.add("is-parallax-active");
    }

    measure();
    render();

    window.addEventListener("scroll", scheduleRender, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pageshow", scheduleRender);
  };

  const start = () => {
    try {
      init();
    } catch {
      resetMotionStyles();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
