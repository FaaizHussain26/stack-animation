document.addEventListener("DOMContentLoaded", () => {
  const stackWrappers = Array.from(document.querySelectorAll(".stack-item-wrapper"));
  const totalItems = stackWrappers.length;
  let previousPositions = {};
  let isUpdating = false;
  let lastScrollTime = 0;
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
      const maxScroll = docHeight - windowHeight;
      let scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      scrollProgress = Math.min(Math.max(scrollProgress, 0), 1);

      scrollProgress = scrollProgress * 0.5;
      const itemsToMove = Math.floor(scrollProgress * (totalItems + 1));

      const isAnimationComplete = itemsToMove >= totalItems;

      if (isAnimationComplete && !animationComplete) {
        animationComplete = true;
        document.body.classList.add("animation-complete");

        if (window.parent && window.parent !== window && !hasNotifiedParent) {
          hasNotifiedParent = true;
          window.parent.postMessage({
            type: "stackAnimationComplete",
            scrollProgress: scrollProgress,
            maxScroll: maxScroll,
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
            scrollProgress: scrollProgress,
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
          scrollY: scrollY,
          maxScroll: maxScroll,
        }, "*");
      }
    } catch (error) {
      console.error("Error updating stack:", error);
    } finally {
      isUpdating = false;
    }
  }

  function onScroll(event) {
    const now = Date.now();
    if (now - lastScrollTime < 16) return;
    lastScrollTime = now;

    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const windowHeight = window.innerHeight;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    const maxScroll = docHeight - windowHeight;

    if (animationComplete && scrollY >= maxScroll - 10 && event.deltaY > 0) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: "forwardScroll",
          deltaY: event.deltaY,
          deltaX: event.deltaX || 0,
        }, "*");
      }
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    // Smooth update
    animationFrameId = requestAnimationFrame(() => {
      updateStack();
      animationFrameId = null;
    });

    // Fallback in case frame skips
    setTimeout(() => {
      if (!isUpdating) {
        updateStack();
      }
    }, 20);
  }

  window.addEventListener("message", (event) => {
    if (event.data.type === "parentScroll") {
      // Optional: handle if parent scrolls
    }
  });

  // Passive scroll handling
  const scrollOptions = { passive: true, capture: false };
  window.addEventListener("scroll", onScroll, scrollOptions);
  document.addEventListener("scroll", onScroll, scrollOptions);
  window.addEventListener("wheel", onScroll, { passive: true });

  // Resize listener
  let resizeTimeout;
  function onResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateStack, 50);
  }
  window.addEventListener("resize", onResize, { passive: true });

  // Initialize stack
  stackWrappers.forEach((wrapper, i) => {
    previousPositions[wrapper.id] = `position-${i}`;
  });

  updateStack();

  window.addEventListener("beforeunload", () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    clearTimeout(resizeTimeout);
  });
});