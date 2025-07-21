// Add this to your main website's JavaScript
window.addEventListener("message", (event) => {
    // Make sure the message is from your iframe (add origin check for security)
    // if (event.origin !== 'your-iframe-domain.com') return;
  
    const iframe = document.querySelector("#your-iframe-id") // Replace with your iframe selector
  
    switch (event.data.type) {
      case "stackAnimationComplete":
        console.log("Stack animation completed")
        // Animation is complete, you can now allow normal page scrolling
        // Optionally hide or modify the iframe
        if (iframe) {
          iframe.style.pointerEvents = "none" // Disable iframe interactions
          // Or reduce iframe height: iframe.style.height = '0px';
        }
        break
  
      case "stackAnimationActive":
        console.log("Stack animation is active again")
        // Re-enable iframe interactions if needed
        if (iframe) {
          iframe.style.pointerEvents = "auto"
        }
        break
  
      case "forwardScroll":
        // Forward scroll events from iframe to main page
        window.scrollBy({
          top: event.data.deltaY * 0.5, // Adjust multiplier as needed
          left: event.data.deltaX * 0.5,
          behavior: "smooth",
        })
        break
  
      case "stackScrollProgress":
        // Optional: Use this for more advanced synchronization
        console.log("Scroll progress:", event.data.progress)
  
        // Example: Fade out iframe as animation completes
        if (iframe && event.data.progress > 0.8) {
          const opacity = Math.max(0, 1 - (event.data.progress - 0.8) * 5)
          iframe.style.opacity = opacity
        }
        break
    }
  })
  
  // Optional: Smooth iframe integration
  function setupIframeScrollIntegration() {
    const iframe = document.querySelector("#your-iframe-id")
    if (!iframe) return
  
    // Initially, the iframe captures scroll
    iframe.style.pointerEvents = "auto"
    iframe.style.position = "fixed" // or 'sticky' depending on your layout
    iframe.style.top = "0"
    iframe.style.left = "0"
    iframe.style.width = "100%"
    iframe.style.height = "100vh"
    iframe.style.zIndex = "1000"
  }
  
  // Call this when your page loads
  document.addEventListener("DOMContentLoaded", setupIframeScrollIntegration)
  