// Vue component: SettingsTrigger (global reusable button)
(function initSettingsTrigger() {
    if (!window) return;
    window.VueComponents = window.VueComponents || {};
  
    const { defineComponent } = Vue;
  
    const SettingsTrigger = defineComponent({
      name: 'SettingsTrigger',
      emits: ['toggle'],
      template: `
        <div
          data-sidebar-trigger
          class="bg-white/5 shadow-[0_0_6.776px_0_rgba(0,0,0,0.25)] rounded-full w-12 h-12 min-w-12
                 lg:hidden flex items-center justify-center cursor-pointer transition-all duration-200"
          role="button"
          aria-label="Open settings"
          @click="$emit('toggle')"
        >
          <img
            src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/settings-02.svg"
            class="w-8 h-8 invert brightness-0"
            alt="Settings"
          />
        </div>
      `,
    });
  
    // Store to global window object for safety / reuse
    window.VueComponents.SettingsTrigger = SettingsTrigger;
  
    // Registration helper function
    window.registerSettingsTrigger = function (app) {
      if (!app || typeof app.component !== 'function') {
        console.warn('[SettingsTrigger] Invalid Vue app instance.');
        return;
      }
      app.component('settings-trigger', SettingsTrigger);
    };
  })();
  