// Reactions Handler - Shows emoji reactions in center of screen
// Based on original working code from vue_to_integrate/chimes/index.html

(function() {
  console.log('[reactionsHandler] 🎭 Initializing reactions system...');

  // Function to show reaction in center of screen with animation
  function showCenterReaction(emoji) {
    const reactionLayer = document.getElementById('reaction-layer');
    if (!reactionLayer) {
      console.warn('[reactionsHandler] ⚠️ reaction-layer not found');
      return;
    }

    // Create floating emoji element
    const emojiEl = document.createElement('div');
    emojiEl.className = 'reaction-float';
    emojiEl.textContent = emoji;
    emojiEl.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(0.6);
      font-size: 64px;
      pointer-events: none;
      z-index: 3001;
      animation: reactionFadeInOut 2s ease-out forwards;
    `;

    reactionLayer.appendChild(emojiEl);

    // Remove after animation completes
    setTimeout(() => {
      emojiEl.remove();
    }, 2000);

    console.log('[reactionsHandler] 😀 Showed reaction:', emoji);
  }

  // Listen for local sendReaction events (from emoji picker or react button)
  window.addEventListener('sendReaction', (e) => {
    const { reaction } = e.detail;
    console.log('[reactionsHandler] 📤 Sending reaction:', reaction);

    // Show on local screen
    showCenterReaction(reaction);

    // Send to all other participants via chimeHandler
    if (window.chimeHandler?.handleDataSend) {
      window.chimeHandler.handleDataSend('reaction', { emoji: reaction });
    }
  });

  // Listen for incoming reactions from chimeHandler
  window.addEventListener('receiveReaction', (e) => {
    const { emoji, sender } = e.detail;
    console.log('[reactionsHandler] 📥 Received reaction from', sender, ':', emoji);

    // Show on screen
    showCenterReaction(emoji);
  });

  // Export to global for direct use
  window.showCenterReaction = showCenterReaction;

  console.log('[reactionsHandler] ✅ Reactions system initialized');
})();

