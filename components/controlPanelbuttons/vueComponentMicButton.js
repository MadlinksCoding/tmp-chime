// Microphone button component (global)
(function initMicrophoneButton() {
    if (!window) return;
    window.VueComponents = window.VueComponents || {};
    const { defineComponent } = Vue;
  
    const MicrophoneButton = defineComponent({
      name: 'MicrophoneButton',
      props: {
        // Boolean to control icon/state
        enabled: { type: Boolean, default: false },
        // Optional direct callback for backward compatibility
        onToggle: { type: Function, required: false },
        // Optional aria label override
        ariaLabel: { type: String, default: 'Toggle microphone' }
      },
      emits: ['toggle'],
      template: `
        <button
          data-microphone-button
          type="button"
          :aria-pressed="enabled"
          :aria-label="ariaLabel"
          :class="[
            'h-[68px] w-[68px] w-12 h-12 min-w-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200',
            enabled ? 'bg-white/75' : 'bg-white/5'
          ]"
          @click="handleClick"
        >
          <img v-if="enabled"
            src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/mic.svg"
            class="w-8 h-8 top-microphone-enabled-icon" alt="Microphone">
          <img v-else
            src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/mute-microphone.svg"
            class="w-8 h-8 top-microphone-disabled-icon" alt="Microphone disabled">
        </button>
      `,
      methods: {
        handleClick() {
          // Prefer backward-compatible callback if provided, otherwise emit
          if (typeof this.onToggle === 'function') {
            try {
              this.onToggle();
            } catch (e) {
              console.warn('[MicrophoneButton] onToggle threw an error:', e);
            }
          } else {
            this.$emit('toggle');
          }
        }
      }
    });
  
    // Expose for global access
    window.VueComponents.MicrophoneButton = MicrophoneButton;
  
    // Registration helper
    window.registerMicrophoneButton = function registerMicrophoneButton(app) {
      if (!app || typeof app.component !== 'function') {
        console.warn('[MicrophoneButton] registerMicrophoneButton: invalid Vue app instance passed.');
        return;
      }
      app.component('microphone-button', MicrophoneButton);
    };
  })();
  