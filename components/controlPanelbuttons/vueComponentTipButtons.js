// vueComponentBottomRightControls.js
(function (global) {
    function register(app) {
      app.component('tip-buttons', {
        template: `
            <div class="h-[68px] w-[68px] rounded-full bg-white/10 flex items-center justify-center cursor-pointer" aria-label="Toggle chat">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/token.svg" class="w-8 h-8" alt="Chat">
            </div>
        `
      });
    }
    global.registerTipButtons = register;
  })(window);
  