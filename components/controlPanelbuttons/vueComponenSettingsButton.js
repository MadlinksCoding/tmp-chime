// vueComponentBottomRightControls.js
(function (global) {
    function register(app) {
      app.component('settings-button', {
        template: `
            <div data-toggle-call-settings-panel
                 class="h-[68px] w-[48px] rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                 aria-label="Toggle call settings">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/three-dots.svg" class="w-8 h-8" alt="Call Settings">
            </div>
        `
      });
    }
    global.registerSettingsButton = register;
  })(window);
  