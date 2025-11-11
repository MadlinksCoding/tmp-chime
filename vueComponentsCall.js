// Call Interface Components - Idle, GrantPermissions, VideoCallModal

(function() {
const { defineComponent } = Vue;

const VideoCallModal = defineComponent({
  name: "VideoCallModal",
  template: `
    <div class="video-call-modal">
      <header><slot name="header"></slot></header>
      <main><slot></slot></main>
      <footer><slot name="footer"></slot></footer>
    </div>
  `,
});

const Idle = defineComponent({
  name: "Idle",
  template: `
    <!-- Call-Me Card -->
    <div  
      class="w-full h-screen relative bg-cover bg-center bg-no-repeat bg-black/50 backdrop-blur-sm">
      <div
        class="relative rounded-md font-poppins text-base h-full w-full z-10 backdrop-blur-md bg-black/50 flex justify-center items-center">
        <div class="absolute top-50 w-[580px] bg-white rounded-sm shadow-xl">
          <div class="flex">
            <div class="rectangle w-1 bg-[#4640FF]"></div>
            <div class="content p-2 flex w-full flex-col">
              <div class="flex items-center gap-1 justify-between">
                <div class="p-1 text-gray-700 font-semibold" data-meeting-title>
                  Call me and I will sing with you
                </div>
                <div class=""><img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/dots-vertical.png" alt="" /></div>
              </div>
              <span class="p-1 font-medium text-gray-700" data-meeting-time>April 24,2025 2:15pm - 9:30pm</span>
              <div class="flex items-center gap-1">
                <span data-status-indicator class="bg-pink-500 rounded-full w-2 h-2"></span>
                <div data-timer-text class="p-1 text-xs font-semibold text-pink-600">in 5 min</div>
              </div>
              <div class="flex gap-2 w-full">
                <div data-join-call-btn 
                  class="btn1 z-10 py-[3px] px-2 gap-1 flex justify-center items-center w-1/2 rounded-lg bg-[#5549FF] cursor-pointer">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/phone-incoming-02.png" alt="" />
                  <button
                    @click="initiate('audioOnlyCall')"
                    data-join-call-button-audio
                    class="text-white text-sm font-semibold w-full h-full"
                  >
                    Join (Audio Only)
                  </button>
                </div>
                <div data-join-call-btn="" class="btn1 z-10 py-[3px] px-2 gap-1 flex justify-center items-center w-1/2 rounded-lg bg-[#5549FF] cursor-pointer">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/phone-incoming-02.png" alt="">
                  <button @click="initiate('audioVideoCall')" data-join-call-button-audio="" class="text-white text-sm font-semibold w-full h-full"> Join (Audio& Video) </button>
                </div>
                
                <div class="btn2 py-[3px] px-2 gap-1 flex rounded-lg justify-center items-center w-1/2 border-2 border-[#5549FF]">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/dots-horizontal.png" alt="" />
                  <button class="text-[#5549FF] font-semibold">More options</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`,
  setup() {
    function initiate(mode) {
      window.callMode = mode; // 'audioOnlyCall' or 'audioVideoCall'
      
      CamMicPermissionsHandler?.init?.();
      if (mode === "audioOnlyCall") {
        window.addEventListener(
          "CamMicPermissions:microphone-granted",
          () => {
            console.log("[perm] mic granted → READY");
            window.vueState.setStatus("ready");
          },
          { once: true }
        );

        CamMicPermissionsUtility?.requestMicrophone?.();
      } else {
        window.addEventListener(
          "CamMicPermissions:camera-microphone-granted",
          () => {
            console.log("[perm] cam+mic granted → READY");
            window.vueState.setStatus("ready");

            setTimeout(function () {
              if (typeof startQuickCameraPreview === "function") {
                startQuickCameraPreview();
              }
            }, 800);
          },
          { once: true }
        );

        CamMicPermissionsUtility?.requestCameraAndMicrophone?.();
      }
    }

    return { initiate };
  },
});

const GrantPermissions = defineComponent({
  name: "GrantPermissions",
  setup() {
    return { disconnectChimeCall: window.vueState.disconnectChimeCall };
  },
  template: `
    <div data-grant-root class="p-0">
      <!-- Spinner while checking -->
      <div id="cm-loader" hidden="">
        <div class="absolute rounded-md h-full w-full connecting-overlay backdrop-blur bg-black/50 flex justify-center items-center">
          <div role="status" class="flex justify-center items-center flex-col">
            <svg aria-hidden="true" class="lg:w-[150px] sm:w-[100px] w-[80px] lg:h-[150px] sm:h-[100px] h-[80px] text-gray-200 animate-spin dark:text-gray-600 fill-[#07F468]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"></path><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"></path>
            </svg>
            <span class="text-white mt-4 text-lg font-medium">Checking Permissions...</span>
          </div>
        </div>  
      </div>
      <p id="cm-spin" hidden>SPIN</p>

      <div id="cm-permission-icons" hidden class="mt-2 space-y-2"
        style="cursor:pointer"
        onclick="(window.callMode==='audioOnlyCall'
          ? CamMicPermissionsUtility.requestMicrophone()
          : CamMicPermissionsUtility.requestCameraAndMicrophone())">
        <div id="cm-need-camera" hidden>Camera permission required</div>
        <div id="cm-need-microphone" hidden>Microphone permission required</div>
      </div>

      <!-- Invisible buttons (kept for handler compatibility if needed) -->
      <button id="cm-start-both" hidden></button>
      <button id="cm-start-camera" hidden></button>
      <button id="cm-start-microphone" hidden></button>

      <div id="cm-device-select" hidden="">
        <label hidden="">Camera: <select id="cm-video-select"></select></label>
        <br>
        <label hidden="">Microphone: <select id="cm-audio-select"></select></label>
      </div>

      <button id="btn-check-perms" class="hidden">Check Permissions</button>
      <button id="btn-watch-perms" class="hidden">Watch Permission Changes</button>
      <button id="btn-camera" class="hidden">Request Camera Access</button>
      <button id="btn-mic" class="hidden">Request Microphone Access</button>
      <button id="btn-both" class="hidden">Request Camera + Microphone Access</button>
      <button id="btn-list-devices" class="hidden">List Available Devices</button>
      <button id="btn-stop" class="hidden">Stop All Stream</button>

      <div class="w-full h-screen relative bg-cover bg-center bg-no-repeat bg-black/50 backdrop-blur-sm background-image">
        <div class=" absolute rounded-md font-poppins text-base h-full w-full z-10 backdrop-blur-md bg-black/50 flex justify-center items-center">
          <div class="lg:max-w-[616px] w-4/5 max-w-[375px] mx-auto absolute top-52 p-4 lg:w-auto bg-slate-950/90 backdrop-blur-sm rounded-lg shadow-xl">
            <div class="flex ">
              <div class="content flex w-full flex-col">
                <div class="text-center text-[24px] text-white font-bold">
                  Please allow below permissions to start call:
                </div>
                <div class="flex gap-4 mt-6 items-center justify-center">
                  <div class="flex items-center flex-col w-[132px]  lg:w-[165px]">
                    <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/camera-01.png" class="w-[48px]  h-[48px] lg:w-[96px] lg:h-[96px] " alt="">
                    <p class="text-brand-primary text-sm font-medium">Camera</p>
                  </div>
                  <div class="flex items-center flex-col w-[132px] lg:w-[165px]">
                    <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/microphone-01.png"  class="w-[48px] h-[48px] lg:w-[96px] lg:h-[96px]" alt="">
                    <span class="text-brand-primary text-sm font-medium">Microphone</span>
                  </div>
                </div>
                <div class="flex w-full mt-6 lg:hidden gap-2">
                  <div class="w-full bg-[#FFFFFF4D] font-medium text-[#07F468] text-center py-2 px-[9px] border border-[1.5px] border-[#07F468]">Cancel</div>
                  <div class="w-full bg-[#07F468] text-black font-medium text-center  py-2 px-[9px]">Settings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="absolute inset-0 bg-black/50 backdrop-blur-lg lg:p-2 flex items-end gap-2 mx-auto">
          <section class="flex-1 flex flex-col gap-2 h-full relative">
            <div class="flex-1 relative rounded-card-xs bg-cover bg-center">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/bg.png" class="absolute w-full h-full object-cover rounded-md" />
              <div
                @click="disconnectChimeCall()"
                data-back-to-fansocial-button
                class="sm:w-[178px] justify-center w-10 w-10 sm:h-12 absolute top-6 sm:left-6 left-4 flex items-center gap-2 sm:pr-4 py-2 sm:pl-2 rounded-pill bg-black/50 backdrop-blur-sm"
                aria-label="Back to fansocial">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 drop-shadow-icon">
                  <path d="M24 16H8M8 16L16 24M8 16L16 8" stroke="white" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span class="text-white text-sm font-normal sm:block hidden">Back to fansocial</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
});

const Ended = defineComponent({
  name: "Ended",
  template: `<p>Ended/Cancelled</p>`,
});

// Export to global
if (!window.VueComponents) window.VueComponents = {};
window.VueComponents.VideoCallModal = VideoCallModal;
window.VueComponents.Idle = Idle;
window.VueComponents.GrantPermissions = GrantPermissions;
window.VueComponents.Ended = Ended;
})();

