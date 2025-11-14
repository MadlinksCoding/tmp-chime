// Camera button component (global)
(function initCameraButton() {
    if (!window) return;
    window.VueComponents = window.VueComponents || {};
    const { defineComponent } = Vue;
  
    const CameraButton = defineComponent({
      name: 'CameraButton',
      props: {
        // boolean to control icon/state
        enabled: { type: Boolean, default: false },
        // optional direct callback for backward compatibility
        onToggle: { type: Function, required: false },
        // optional aria label override
        ariaLabel: { type: String, default: 'Toggle camera' }
      },
      emits: ['toggle'],
      template: `
        <button
          data-camera-button
          type="button"
          :aria-pressed="enabled"
          :aria-label="ariaLabel"
          :class="[
            'lg:w-17 lg:h-17 w-12 h-12 min-w-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200',
            enabled ? 'bg-white/75' : 'bg-white/5'
          ]"
          @click="handleClick"
        >
          <img v-if="enabled"
            src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/camera-icon.svg"
            class="w-8 h-8 top-camera-enabled-icon" alt="Video camera">
          <img v-else
            src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/disableCamera.svg"
            class="w-8 h-8 top-camera-disabled-icon" alt="Video camera disabled">
        </button>
      `,
      methods: {
        handleClick() {
          // Prefer backwards-compatible callback if provided, otherwise emit event
          if (typeof this.onToggle === 'function') {
            try {
              this.onToggle();
            } catch (e) {
              // keep the app robust if callback throws
              console.warn('[CameraButton] onToggle threw an error:', e);
            }
          } else {
            this.$emit('toggle');
          }
        }
      }
    });
  
    // expose component constructor for manual use / tests
    window.VueComponents.CameraButton = CameraButton;
  
    // function to register into a Vue app instance (same style as your existing code)
    window.registerCameraButton = function registerCameraButton(app) {
      if (!app || typeof app.component !== 'function') {
        console.warn('[CameraButton] registerCameraButton: invalid Vue app instance passed.');
        return;
      }
      app.component('camera-button', CameraButton);
    };
  })();
  