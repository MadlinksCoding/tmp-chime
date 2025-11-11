// Gift Animation Handler - Shows animated gifts raining down on screen
// Based on original working code pattern from vue_to_integrate/chimes/index.html

(function() {
  console.log('[giftAnimationHandler] 🎁 Initializing gift animation system...');

  const gifts = [
    { id: 1, image: '/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-1.png' },
    { id: 2, image: '/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-2.png' },
    { id: 3, image: '/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-3.png' },
    { id: 4, image: '/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-4.png' },
    { id: 5, image: '/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-5.png' },
    { id: 6, image: '/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-6.png' },
    { id: 7, image: '/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-7.png' },
  ];

  // Create gift animation overlay
  function createGiftOverlay() {
    const overlay = document.getElementById('giftAnimationOverlay');
    if (overlay) return overlay;

    const newOverlay = document.createElement('div');
    newOverlay.id = 'giftAnimationOverlay';
    newOverlay.className = 'fixed inset-0 z-[9999] pointer-events-none';
    newOverlay.style.cssText = 'position: fixed; inset: 0; z-index: 9999; pointer-events: none; overflow: hidden;';
    document.body.appendChild(newOverlay);
    return newOverlay;
  }

  // Show gift animation (raining down effect)
  function showGiftAnimation(giftId, quantity = 1) {
    const overlay = createGiftOverlay();
    const gift = gifts.find(g => g.id === parseInt(giftId)) || gifts[0];

    console.log(`[giftAnimationHandler] 🎁 Showing gift ${giftId} x${quantity}`);

    // Create multiple gift elements that rain down
    const count = Math.min(quantity, 20); // Cap at 20 for performance
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const giftEl = document.createElement('img');
        giftEl.src = `https://new-stage.fansocial.app${gift.image}`;
        giftEl.alt = 'gift';
        giftEl.className = 'absolute w-[80px] h-[80px]';
        
        // Random horizontal position
        const left = Math.random() * 90 + 5; // 5% to 95%
        const delay = Math.random() * 500; // Stagger start times
        const duration = 2 + Math.random(); // 2-3 seconds fall time

        giftEl.style.cssText = `
          position: absolute;
          left: ${left}%;
          top: -100px;
          width: 80px;
          height: 80px;
          animation: giftFall ${duration}s ease-in ${delay}ms forwards, giftRotate 1s linear infinite;
          opacity: 0;
        `;

        overlay.appendChild(giftEl);

        // Remove after animation
        setTimeout(() => {
          giftEl.remove();
        }, (duration * 1000) + delay + 1000);
      }, i * 100); // Stagger creation
    }

    // Clear overlay after all animations
    setTimeout(() => {
      overlay.innerHTML = '';
    }, 5000);
  }

  // Listen for local sendGift events
  window.addEventListener('sendGift', (e) => {
    const { giftId, quantity } = e.detail;
    console.log('[giftAnimationHandler] 📤 Sending gift:', giftId, 'x', quantity);

    // Show on local screen
    showGiftAnimation(giftId, quantity);

    // Send to all other participants via chimeHandler
    if (window.chimeHandler?.handleDataSend) {
      window.chimeHandler.handleDataSend('gift', { 
        giftId: giftId,
        qty: quantity,
        timestamp: Date.now()
      });
    }
  });

  // Listen for incoming gifts from chimeHandler
  window.addEventListener('receiveGift', (e) => {
    const { giftId, qty, sender } = e.detail;
    console.log('[giftAnimationHandler] 📥 Received gift from', sender, ':', giftId, 'x', qty);

    // Show on screen
    showGiftAnimation(giftId, qty);
  });

  // Export to global
  window.showGiftAnimation = showGiftAnimation;

  console.log('[giftAnimationHandler] ✅ Gift animation system initialized');
})();

