// CallVideoTemplate Component - Ready/Connecting State UI

(function() {
const { defineComponent } = Vue;

const CallVideoTemplate = defineComponent({
  name: "CallVideoTemplate",
  components: {
    CallSettings: window.VueComponents?.CallSettings,
  },
  template: `
    <div v-show="meeting.status === 'ready' || meeting.status === 'connecting'">
      <div class="w-full h-dvh max-h-dvh xl:h-screen relative bg-cover bg-center bg-no-repeat bg-black/50 backdrop-blur-sm">
        <div class="w-full h-dvh lg:h-full max-h-dvh xl:max-h-full inset-0 bg-black/50 backdrop-blur-lg lg:p-2 flex items-center gap-2 mx-auto">
          <section class="flex-1 flex flex-col gap-2 relative h-dvh xl:h-full max-h-dvh xl:max-h-full">
            <div class="flex-1 relative rounded-card-xs bg-cover bg-center">
              <div class="lg:h-[88.5vh] w-full h-screen ">
                <div class="person" id="local-video-sidebar" hidden>
                  <p>
                    <span class="handle">@local</span> —
                    <span class="name">Local User</span>
                  </p>
                  <div class="feed absolute w-full h-full object-cover rounded-md">
                    <video
                      autoplay
                      playsinline
                      muted
                      data-local
                      style="width: 100%; background: #000"
                    ></video>
                    <div class="statusline" id="status-self"></div>
                  </div>
                </div>

                <video id="cm-video-preview"
                  autoplay
                  playsinline
                  muted
                  style="
                    width:100%;
                    height:100%;
                    max-width:100%;
                    background:#000;
                    border-radius:8px;
                    object-fit:cover;">
                </video>
              </div>
            </div>

            <!-- Mobile header for connecting state -->
            <div class="flex w-full top-2 absolute z-30 lg:hidden flex-col">
              <span class="text-white text-center text-sm font-medium block lg:hidden" data-call-type-text="">
                [[mode_text]] [[userName]]
              </span>
              <div class="flex justify-center gap-2">
                <span class="text-white text-xs font-medium" data-meeting-time="">[[9:00pm-9:15pm]]</span>
                <div class="flex items-center gap-1 px-[8px] justify-center rounded-pill bg-[#5549FF] h-[18px]" data-status-indicator="">
                  <div class="w-2 h-2 rounded-full bg-white" data-status-dot=""></div>
                  <span class="text-white text-xs font-medium" data-status-text="">in 5 min</span>
                </div>
              </div>
            </div>

            <!-- Spinner overlay -->
            <div v-if="meeting.ui.connectingSubstate"
              class="absolute rounded-md h-full w-full connecting-overlay backdrop-blur bg-black/50 flex justify-center items-center">
              <div role="status" class="flex justify-center items-center flex-col">
                <svg aria-hidden="true"
                  class="lg:w-[150px] sm:w-[100px] w-[80px] lg:h-[150px] sm:h-[100px] h-[80px] text-gray-200 animate-spin dark:text-gray-600 fill-[#07F468]"
                  viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor" />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill" />
                </svg>
                <span class="text-white mt-4 text-lg font-medium">Connecting you to the call...</span>
              </div>
            </div>

            <!-- Back button -->
            <div @click="disconnectChimeCall()" v-show="meeting.status === 'ready'" data-back-to-fansocial-button class="sm:w-[178px] lg:flex hidden  justify-center w-10 w-10 sm:h-12 absolute top-6 sm:left-6 left-4 flex items-center gap-2 sm:pr-4 py-2 sm:pl-2 rounded-pill bg-black/50 backdrop-blur-sm cursor-pointer" aria-label="Back to fansocial">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/arrow-left.svg" class="w-6 h-6 drop-shadow-icon" alt="Back arrow">
              <span class="text-white text-sm font-normal sm:block hidden">Back to fansocial</span>
            </div>
            <!-- Back button mobile -->
            <div @click="disconnectChimeCall()" v-show="meeting.status === 'ready'" data-back-to-fansocial-button class="lg:hidden flex justify-center w-10 w-10 sm:h-12 absolute top-2 sm:left-6 left-4 flex items-center cursor-pointer" aria-label="Back to fansocial">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/chevron-left.svg" class="w-6 h-6 drop-shadow-icon" alt="Back arrow">
            </div>

            <!-- Bottom controls for connecting state -->
            <div class="flex flex-col lg:flex-row z-10 gap-2 justify-between left-0 right-0 lg:rounded-none rounded-full items-center lg:relative absolute  bottom-4 lg:bottom-0 lg:w-full w-full lg:mx-0  lg:px-0 px-4 py-0">
              <div class="lg:flex hidden items-center gap-4 w-1/3">
                <div class="w-16 h-16 flex-shrink-0">
                  <!-- Fallback Initial -->
                  <div data-user-initial="" class="w-full h-full bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold avatar--shape--1" style="display: flex">
                    UN
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-1">
                    <span class="text-white text-sm font-medium truncate" data-call-type-text="">[[mode_text]] [[userName]]</span>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0">
                      <path d="M12 16V12M12 8H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" stroke-width="2"></path>
                    </svg>
                  </div>
                  <div class="flex xl:flex-row flex-col xl:items-center items-start gap-2 mt-1">
                    <span class="text-white text-base font-medium" data-meeting-time="">[[9:00pm-9:15pm]]</span>
                    <div class="flex items-center gap-1 px-1.5 justify-center rounded-pill bg-[#5549FF] w-[75px] h-[18px]" data-status-indicator="">
                      <div class="w-2 h-2 rounded-full bg-white" data-status-dot=""></div>
                      <span class="text-white text-xs font-medium" data-status-text="">in 5 min</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Main control buttons -->
              <div class="flex items-center sm:gap-4 gap-3 flex-1 sm:justify-center lg:relative  relative pb-[0rem] left-0 right-0  lg:mx-0 mx-auto lg:w-1/3 md:w-[calc(100%-424px)] sm:w-full">
                <div data-top-toggle-camera class="xl:w-17 xl:h-17 w-12 h-12 min-w-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer" aria-label="Toggle camera">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/camera-icon.svg" class="w-8 h-8 top-camera-enabled-icon" alt="Video camera">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/disableCamera.svg" class="w-8 h-8 top-camera-disabled-icon hidden" alt="Video camera disabled">
                </div>
                <div data-top-toggle-microphone class="xl:w-17 xl:h-17 w-12 h-12 min-w-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer active" aria-label="Toggle microphone">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/mic.svg" class="w-8 h-8 top-microphone-enabled-icon" alt="Microphone">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/mute-microphone.svg" class="w-8 h-8 top-microphone-disabled-icon hidden" alt="Microphone disabled">
                </div>
              </div>

              <div class="w-1/3"></div>

              <div @click="triggerStart();" class="w-full lg:hidden bg-[#07F468] font-semibold text-lg py-[10px] px-4 text-center rounded-full leading-7 cursor-pointer">
                Join Call
              </div>
            </div>
          </section>

          <!-- Settings Sidebar for Connecting State -->
          <CallSettings v-if="meeting.status === 'ready' || meeting.status === 'connecting'" :show-only-mobile="true" />
        </div>
      </div>
    </div>
  `,
  setup() {
    function triggerStart() {
      document.querySelector("[data-start]")?.click();
      window.dispatchEvent(
        new CustomEvent("enableState", { detail: "connectingSubstate" })
      );
    }

    return { 
      meeting: window.vueState.meeting, 
      triggerStart, 
      disconnectChimeCall: window.vueState.disconnectChimeCall 
    };
  },
});

// Export to global
if (!window.VueComponents) window.VueComponents = {};
window.VueComponents.CallVideoTemplate = CallVideoTemplate;
})();

