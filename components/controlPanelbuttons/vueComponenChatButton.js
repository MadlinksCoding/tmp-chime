// vueComponentBottomRightControls.js
(function (global) {
    function register(app) {
      app.component('chat-button', {
        props: {
          toggleChat: { type: Function, required: false },
          chimeCallSettings: { type: Object, required: false },
        },
        template: `
            <div data-icon-style="toggle" @click="toggleChat"
                  :class="['h-[68px] w-[68px] rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300',
                    chimeCallSettings?.callChatStatus ? 'bg-white/75' : 'bg-white/10'
                  ]"
                 aria-label="Toggle chat">
                 <img v-if="chimeCallSettings.callChatStatus" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/message-dots-circle-black.svg" class="w-8 h-8 black-chat-icon" alt="Chat">
                 <img v-else src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/chat-icon.svg" class="w-8 h-8" alt="Chat">
            </div>
        `
      });
    }
    global.registerChatButton = register;
  })(window);
  