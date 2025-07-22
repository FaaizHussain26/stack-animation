document.addEventListener("DOMContentLoaded", () => {
  console.log("[Init] DOMContentLoaded triggered");

  const stackWrappers = Array.from(document.querySelectorAll(".stack-item-wrapper"));
  const totalItems = stackWrappers.length;
  let previousPositions = {};
  let isUpdating = false;
  let animationFrameId = null;
  let animationComplete = false;
  let hasNotifiedParent = false;
  let currentItemIndex = 0;
  let lastTapTime = 0;
  let goingForward = true;

  function updateStackManually(index) {
    if (isUpdating) return;
    isUpdating = true;

    try {
      const itemsToMove = index;
      const isAnimationComplete = itemsToMove >= totalItems;

      if (isAnimationComplete && !animationComplete) {
        animationComplete = true;
        document.body.classList.add("animation-complete");

        if (window.parent && window.parent !== window && !hasNotifiedParent) {
          hasNotifiedParent = true;
          window.parent.postMessage({ type: "stackAnimationComplete" }, "*");
        }
      } else if (!isAnimationComplete && animationComplete) {
        animationComplete = false;
        hasNotifiedParent = false;
        document.body.classList.remove("animation-complete");

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "stackAnimationActive" }, "*");
        }
      }

      stackWrappers.forEach((wrapper, i) => {
        wrapper.classList.remove("position-0", "position-1", "position-2", "moving-up", "hidden", "hidden-position-class");

        const stackPosition = i - itemsToMove;

        if (i < itemsToMove) {
          if (i === totalItems - 1) {
            wrapper.classList.add("position-2");
            const textContent = wrapper.querySelector(".text-content");
            if (textContent) textContent.classList.add("opacity-1");
            previousPositions[wrapper.id] = "position-2";
          } else {
            wrapper.classList.add("hidden");
            previousPositions[wrapper.id] = "hidden";
          }
        } else {
          if (stackPosition <= 2) {
            const currentPosition = `position-${stackPosition}`;
            wrapper.classList.add(currentPosition);
            const textContent = wrapper.querySelector(".text-content");
            if (textContent) textContent.classList.remove("opacity-1");
            previousPositions[wrapper.id] = currentPosition;
          } else {
            wrapper.classList.add("hidden");
            previousPositions[wrapper.id] = "hidden";
          }
        }
      });
    } catch (err) {
      console.error("[updateStackManually] Error:", err);
    } finally {
      isUpdating = false;
    }
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTapTime < 400) return; // debounce
    lastTapTime = now;
  
    if (goingForward) {
      currentItemIndex++;
      if (currentItemIndex >= totalItems) {
        currentItemIndex = totalItems;
        goingForward = false;
      }
    } else {
      currentItemIndex--;
      if (currentItemIndex <= 0) {
        currentItemIndex = 0;
        goingForward = true;
      }
    }
  
    updateStackManually(currentItemIndex);
  }
  // Scroll + Wheel events for non-mobile
  function updateStackOnScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const windowHeight = window.innerHeight;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const maxScroll = Math.max(1, docHeight - windowHeight);
    const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1) * 0.5;
    currentItemIndex = Math.floor(scrollProgress * (totalItems + 1));
    updateStackManually(currentItemIndex);
  }

  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  if (isTouchDevice()) {
    // Mobile: use tap to advance
    window.addEventListener("touchstart", handleTap, { passive: true });
  } else {
    // Desktop: use scroll and wheel
    window.addEventListener("scroll", () => {
      if (!isUpdating && !animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          updateStackOnScroll();
          animationFrameId = null;
        });
      }
    }, { passive: true });

    window.addEventListener("wheel", () => {
      if (!isUpdating && !animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
          updateStackOnScroll();
          animationFrameId = null;
        });
      }
    }, { passive: true });
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateStackManually(currentItemIndex);
    }, 50);
  });

  stackWrappers.forEach((wrapper, i) => {
    previousPositions[wrapper.id] = `position-${i}`;
  });

  console.log("[Init] Initial updateStack");
  updateStackManually(currentItemIndex);

  window.addEventListener("beforeunload", () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    clearTimeout(resizeTimeout);
  });
});
