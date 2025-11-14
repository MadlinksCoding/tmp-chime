// vueComponentBottomRightControls.js
(function (global) {
  function register(app) {
    app.component('react-button', {
      data() {
        return {
          isActive: false,
        };
      },
      methods: {
        handleClick(e) {
          // Stop event propagation to prevent triggering parent click handlers (like chat toggle)
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          
          console.log('[react-button] Clicked - showing quick emoji selector');

          const existingPopup = document.getElementById('quick-emoji-selector');
          if (existingPopup) {
            existingPopup.remove();
            this.isActive = false;
            return;
          }

          // Show quick emoji selector only
          this.showQuickEmojiSelector();
        },
        showQuickEmojiSelector() {
          // Quick emoji selector - popular reactions
          const quickEmojis = ['💦', '💗', '🎁', '❤️‍🔥', '💓', '😈'];
          
          // Create a simple popup with quick emojis
          const popup = document.createElement('div');
          popup.id = 'quick-emoji-selector';
          popup.className = [
            'fixed z-[10000] shadow-2xl flex items-center gap-4 backdrop-blur px-4 py-3 transition-all duration-200',
            'bg-black/60 rounded-[16px]',
            'bottom-[100px]',
            'left-1/2 right-auto -translate-x-1/2',
            'md:left-auto md:right-5 md:gap-6 md:translate-x-0',
            'lg:left-1/2 lg:-translate-x-1/2 lg:right-auto lg:bg-white/10 lg:rounded-full lg:gap-6'
          ].join(' ');
          this.isActive = true;

          const closeExisting = document.getElementById('quick-emoji-selector');
          if (closeExisting) {
            closeExisting.remove();
          }

          const dismiss = () => {
            popup.remove();
            this.isActive = false;
            document.removeEventListener('click', closeOnOutside);
          };

          const closeOnOutside = (e) => {
            if (!popup.contains(e.target) && !e.target.closest('[aria-label="Toggle reaction"]')) {
              dismiss();
            }
          };
          
          quickEmojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'group relative flex h-10 w-10 items-center justify-center bg-transparent border-0 cursor-pointer rounded-full transition-colors duration-200 ease-out hover:bg-white/10';

            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.className = 'block text-[32px] leading-none transition-transform duration-200 ease-out origin-bottom group-hover:scale-[2]';
            btn.appendChild(emojiSpan);
            btn.onclick = () => {
              console.log('[react-button] Selected emoji:', emoji);
              // Dispatch sendReaction event
              window.dispatchEvent(new CustomEvent('sendReaction', { 
                detail: { reaction: emoji } 
              }));
              // Remove popup
              dismiss();
            };
            popup.appendChild(btn);
          });
          
          // Add close button
          // const closeBtn = document.createElement('button');
          // closeBtn.textContent = '✕';
          // closeBtn.className = 'absolute top-1 right-1 bg-transparent border-none text-white cursor-pointer text-lg w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded';
          // closeBtn.onclick = () => popup.remove();
          // popup.appendChild(closeBtn);
          
          // Remove existing popup if any
          document.body.appendChild(popup);
          
          // Close on outside click
          setTimeout(() => {
            document.addEventListener('click', closeOnOutside);
          }, 100);
        }
      },
      template: `
          <div 
            :class="[
              'h-[68px] w-[68px] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200',
              isActive ? 'bg-white/75' : 'bg-white/10'
            ]" 
            aria-label="Toggle reaction"
            @click.stop="handleClick"
          >
            <img 
              src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/smile-emoji.svg" 
              :class="[
                'w-8 h-8 transition duration-200 ease-out',
                isActive ? 'filter invert' : ''
              ]"
              alt="Emoji"
            >
          </div>
      `
    });
  }
  global.registerReactButton = register;
})(window);
