// vueComponentTemplateChimeCalleeConnected.js
(function initTemplateChimeCalleeConnected() {
  if (!window) return;
  window.VueComponents = window.VueComponents || {};

  const { defineComponent } = Vue;

  const TemplateChimeCalleeConnected = defineComponent({
    name: "TemplateChimeCalleeConnected",
    props: {
      substate: { type: String, default: "" },
      toggleCamera: { type: Function, required: false },
      toggleMicrophone: { type: Function, required: false },
      chimeCallSettings: { type: Object, required: false },
    },
    components: (function () {
      const comps = {};
      const vc = window.VueComponents || {};
      if (vc.ConnectingSection) {
        comps.ConnectingSection = vc.ConnectingSection;
      }
      if (vc.PrejoinMobileHeader) {
        comps.PrejoinMobileHeader = vc.PrejoinMobileHeader;
      }
      if (vc.BackButton) {
        comps.BackButton = vc.BackButton;
      }
      if (vc.CameraMicControls) {
        comps.CameraMicControls = vc.CameraMicControls;
      }
      if (vc.MobileJoinButton) {
        comps.MobileJoinButton = vc.MobileJoinButton;
      }
      if (vc.SettingsPanel) {
        comps.SettingsPanel = vc.SettingsPanel;
      }
      if (vc.JoinCallButton) {
        comps.JoinCallButton = vc.JoinCallButton;
      }
      return comps;
    })(),
    methods: {
      handleJoinClick() {
        let dispatchedUiState = false;
        if (window.CallHandler && typeof window.CallHandler.dipatchUI === "function") {
          try {
            window.CallHandler.dipatchUI("callee:connected", "connecting");
            dispatchedUiState = true;
          } catch (err) {
            console.error("[TemplateChimeCalleeConnected] CallHandler.dipatchUI error", err);
          }
        }

        if (!dispatchedUiState) {
          try {
            document.dispatchEvent(
              new CustomEvent("chime-ui::state", {
                detail: {
                  state: "callee:connected",
                  substate: "connecting",
                  ts: Date.now(),
                },
              })
            );
          } catch (err) {
            console.error("[TemplateChimeCalleeConnected] Fallback UI dispatch error", err);
          }
        }

        const detail = {
          source: "template-chime-callee-connected",
          ts: Date.now(),
          substate: this.substate,
          pendingCalleeJoin: (window.CallHandler && window.CallHandler._pendingCalleeJoin) || null,
        };

        try {
          document.dispatchEvent(new CustomEvent("chime:join:meeting", { detail }));
        } catch (err) {
          console.error("[TemplateChimeCalleeConnected] Error dispatching chime:join:meeting", err);
        }

        if (window.CallHandler && typeof window.CallHandler.handleManualCalleeJoin === "function") {
          try {
            window.CallHandler.handleManualCalleeJoin();
          } catch (err) {
            console.error("[TemplateChimeCalleeConnected] handleManualCalleeJoin error", err);
          }
        }
      },
    },
    template: `
      <div template-chime-callee-connected>
        <div class="w-full h-dvh max-h-dvh xl:h-screen relative bg-cover bg-center bg-no-repeat bg-black/50 backdrop-blur-sm bg-[url(assets/bg-girl-image-call.png)]">
          <div class="w-full h-dvh lg:h-full max-h-dvh xl:max-h-full inset-0 bg-black/50 backdrop-blur-lg lg:p-2 flex items-center gap-2 mx-auto">
            <section class="flex-1 flex flex-col gap-2 relative h-dvh lg:h-full max-h-dvh lg:max-h-full">
              <div class="flex-1 relative rounded-card-xs bg-cover bg-center">
                <div class="lg:h-full w-full h-screen">
                  <div class="person" data-local-video-sidebar="" hidden="">
                    <p><span class="handle">@local</span> — <span class="name">Local User</span></p>
                    <div class="aspect-[16/9] bg-black absolute w-full h-full object-cover rounded-md">
                      <video autoplay="" playsinline="" data-local="" style="width: 100%; background: rgb(0, 0, 0);"></video>
                      <div class="text-[0.75rem] opacity-90 max-w-[32.5rem]" data-status-self=""></div>
                    </div>
                  </div>
                 
                 
                  <!--<video data-cm-video-preview="" class="w-full h-full max-w-full object-cover rounded-[0.25rem] py-2 lg:py-0" autoplay="" playsinline=""></video>-->
 <video data-cam-mic-element="video-preview" class="absolute w-full h-full max-w-full object-cover rounded-[0.25rem] py-2 lg:py-0" autoplay="" playsinline=""></video>





                  <connecting-section :show="substate === 'connecting'"></connecting-section>
                </div>
              </div>
              <prejoin-mobile-header></prejoin-mobile-header>
              <back-button :show="substate !== 'connecting'"></back-button>
              <div class="flex flex-col lg:flex-row z-10 gap-2 justify-between left-0 right-0 lg:rounded-none rounded-full items-center lg:relative absolute bottom-4 lg:bottom-0 lg:w-full w-full lg:mx-0 px-4 md:!px-0 py-0">
                <bottom-left-info :user-initials="userInitials" />
                <div class="flex items-center sm:gap-4 gap-3 flex-1 sm:justify-center lg:relative relative pb-[3rem] lg:pb-[0rem] left-0 right-0 lg:mx-0 mx-auto lg:w-1/3 md:w-[calc(100%-424px)] sm:w-full">
                  <camera-mic-controls :toggle-camera="toggleCamera" :toggle-microphone="toggleMicrophone" :chime-call-settings="chimeCallSettings"/>
                </div>
                <div class="w-1/3"></div>
                <mobile-join-button :substate="substate" @join="handleJoinClick"></mobile-join-button>
              </div>
            </section>
            <settings-panel :substate="substate" @join="handleJoinClick"></settings-panel>
          </div>
        </div>
      </div>
    `,
  });

  window.VueComponents.TemplateChimeCalleeConnected = TemplateChimeCalleeConnected;
})();