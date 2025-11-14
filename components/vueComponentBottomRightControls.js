// vueComponentBottomRightControls.js
(function (global) {
    function register(app) {
      app.component('bottom-right-controls', {
        props: {
          toggleChat: { type: Function, required: false },
          chimeCallSettings: { type: Object, required: false },
        },
        template: `
          <div class="flex justify-end items-center gap-4 lg:w-1/3">
            <tip-buttons />
            <react-button />
            <chat-button :toggle-chat="toggleChat" :chime-call-settings="chimeCallSettings" />
            <settings-button />
          </div>
        `
      });
    }
    global.registerBottomRightControls = register;
  })(window);
  