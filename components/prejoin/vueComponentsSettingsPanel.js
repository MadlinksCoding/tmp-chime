// Vue component: SettingsPanel (wraps the aside; keeps JOIN button inside via component)
(function initSettingsPanel() {
  if (!window) return;
  window.VueComponents = window.VueComponents || {};

  const { defineComponent } = Vue;

  const SettingsPanel = defineComponent({
    name: 'SettingsPanel',
    props: {
      substate: { type: String, default: '' },
    },
    emits: ['join'],
    data() {
      return {
        showSettings: false,
      };
    },
    components: (function () {
      const comps = {};
      if (window.VueComponents && window.VueComponents.JoinCallButton) {
        comps.JoinCallButton = window.VueComponents.JoinCallButton;
      }
      if (window.VueComponents && window.VueComponents.SettingsAudioVideo) {
        comps.SettingsAudioVideo = window.VueComponents.SettingsAudioVideo;
      }
      if (window.VueComponents && window.VueComponents.SettingsBackgroundsEffects) {
        comps.SettingsBackgroundsEffects = window.VueComponents.SettingsBackgroundsEffects;
      }
      return comps;
    })(),
    template: `
    <aside
      data-sidebar-panel
      data-call-settings-panel
      ref="panel"
      :class="[ 
        'z-[99999] flex-col absolute bottom-0 lg:top-0 right-0 h-screen md:h-auto lg:h-full mobile-landscape:h-screen w-full lg:w-40 lg:relative lg:flex  bg-black/50 shadow-[0_0_6.776px_0_rgba(0,0,0,0.25)] rounded-0 md:rounded-[0.625rem] backdrop-blur-[25px] lg:backdrop-blur-none overflow-y-auto transition-transform duration-300 ease-in-out',
        showSettings ? 'translate-x-0 flex mobile-landscape:w-40 mobile-landscape:relative mobile-landscape:top-0 mobile-landscape:bottom-auto' : 'translate-x-full hidden mobile-landscape:w-40',
        'lg:translate-x-0'
      ]"
      @click.stop
    >
      <!-- Settings Header & Content -->
      <div
        class="text-white cursor-pointer lg:hidden flex items-end justify-end absolute top-3 right-3"
      >
        <img
          data-sidebar-close
          src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/x-close.png"
          class="w-6 h-6 object-cover"
          alt="Close"
        />
      </div>

      <div class="pb-20 pt-8 lg:pb-0 lg:pt-0 mobile-landscape:pb-0 flex flex-col gap-2 md:!gap-0">
        <settings-audio-video />
        <settings-backgrounds-effects />
      </div><!-- Chat Setting Section -->

      <div class="p-4 absolute bottom-0 w-full mobile-landscape:hidden">
        <join-call-button :substate="substate" @join="$emit('join')"></join-call-button>
      </div>

      <div class="py-3 block sm:hidden"></div>
    </aside>
    `,
    mounted() {
      // Keep references so we can remove listeners later
      this._onKeydown = (e) => {
        if (e.key === 'Escape' && this.showSettings) this.closeSettings();
      };

      this._onDocClick = (e) => {
        if (!this.showSettings) return;
        const panel = this.$refs.panel;
        const trigger = document.querySelector('[data-sidebar-trigger]');
        if (!panel) return;
        if (panel.contains(e.target) || (trigger && trigger.contains(e.target))) return;
        // click outside -> close
        this.closeSettings();
      };

      this._onTriggerClick = () => {
        this.toggleSettings();
      };

      this._onCloseClick = () => {
        this.closeSettings();
      };

      // global key + click listeners
      document.addEventListener('keydown', this._onKeydown);
      document.addEventListener('click', this._onDocClick);

      // attach to trigger (if present on page)
      this._triggerEl = document.querySelector('[data-sidebar-trigger]');
      if (this._triggerEl) {
        this._triggerEl.addEventListener('click', this._onTriggerClick);
      }

      // attach to close button inside panel (image)
      // since close button is inside this component, we can query within panel
      this.$nextTick(() => {
        const panelEl = this.$refs.panel;
        if (panelEl) {
          this._closeEl = panelEl.querySelector('[data-sidebar-close]');
          if (this._closeEl) {
            this._closeEl.addEventListener('click', this._onCloseClick);
          }
        }
      });
    },
    beforeUnmount() {
      document.removeEventListener('keydown', this._onKeydown);
      document.removeEventListener('click', this._onDocClick);
      if (this._triggerEl) this._triggerEl.removeEventListener('click', this._onTriggerClick);
      if (this._closeEl) this._closeEl.removeEventListener('click', this._onCloseClick);
      // ensure body scroll restored
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    },
    methods: {
      toggleSettings() {
        this.showSettings ? this.closeSettings() : this.openSettings();
      },
      openSettings() {
        this.showSettings = true;
        // lock scroll on mobile
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      },
      closeSettings() {
        this.showSettings = false;
        // restore scroll
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      },
    },
  });

  window.VueComponents.SettingsPanel = SettingsPanel;
})();
