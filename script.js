document.addEventListener("DOMContentLoaded", () => {
  console.log("[Init] DOMContentLoaded triggered");

  const stackWrappers = Array.from(document.querySelectorAll(".stack-item-wrapper"));
  const totalItems = stackWrappers.length;
  let previousPositions = {};
  let isUpdating = false;
  let animationFrameId = null;
  let animationComplete = false;
  let hasNotifiedParent = false;

  function updateStack() {
    if (isUpdating) return;
    isUpdating = true;

    try {
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
      let scrollProgress = scrollY / maxScroll;
      scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);

      scrollProgress = scrollProgress * 0.5;
      const itemsToMove = Math.round(scrollProgress * totalItems);

      const isAnimationComplete = itemsToMove >= totalItems;

      if (isAnimationComplete && !animationComplete) {
        animationComplete = true;
        document.body.classList.add("animation-complete");

        if (window.parent && window.parent !== window && !hasNotifiedParent) {
          hasNotifiedParent = true;
          window.parent.postMessage({
            type: "stackAnimationComplete",
            scrollProgress,
            maxScroll,
            currentScroll: scrollY,
          }, "*");
        }
      } else if (!isAnimationComplete && animationComplete) {
        animationComplete = false;
        hasNotifiedParent = false;
        document.body.classList.remove("animation-complete");

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: "stackAnimationActive",
            scrollProgress,
          }, "*");
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

      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: "stackScrollProgress",
          progress: scrollProgress,
          isComplete: animationComplete,
          scrollY,
          maxScroll,
        }, "*");
      }
    } catch (error) {
      console.error("[updateStack] Error:", error);
    } finally {
      isUpdating = false;
    }
  }

  window.addEventListener("scroll", () => {
    if (!isUpdating && !animationFrameId) {
      animationFrameId = requestAnimationFrame(() => {
        updateStack();
        animationFrameId = null;
      });
    }
  }, { passive: true });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateStack();
    }, 50);
  });

  stackWrappers.forEach((wrapper, i) => {
    previousPositions[wrapper.id] = `position-${i}`;
  });

  console.log("[Init] Initial updateStack");
  updateStack();

  window.addEventListener("beforeunload", () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    clearTimeout(resizeTimeout);
  });
});