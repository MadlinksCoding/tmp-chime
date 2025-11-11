// CallSettings Component - Video/Audio/Background Settings

(function() {
const { defineComponent } = Vue;

const CallSettings = defineComponent({
  name: "CallSettings",
  props: {
    showOnlyMobile: {
      type: Boolean,
      default: false,
    },
  },
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
      setActivePanel: window.vueState.setActivePanel, 
      setBgFilter: window.vueState.setBgFilter 
    };
  },
  template: `
    <aside data-sidebar-pannel data-call-settings-panel
      class="z-[99999] flex-col lg:w-40 py-4 h-full sm:h-screen lg:h-full md:h-screen absolute lg:relative overflow-y-auto g-2 bg-black/50 shadow-control lg:flex w-full backdrop-blur-md flex-col" :class="showOnlyMobile ? 'hidden lg:flex' : 'flex'">
      <!-- Settings Header & Content -->
      <div @click="setActivePanel(null);" class="text-white cursor-pointer lg:hidden flex items-end justify-end pr-3 absolute top-[0.25rem] right-[0]">
        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/x-close.png" class="w-6 h-6 object-cover"> 
      </div>
      <div>
        <div class="">
          <header id="backgroundsAccordionHeader"
            class="cursor-pointer hover:bg-white/5 flex justify-between items-center py-2 px-4 w-full text-left"
            aria-expanded="false">
            <div class="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
                <path
                  d="M3.5 9.35198V7.65973L8.04425 3.11548H9.7365L3.5 9.35198ZM3.5 4.86548V3.40398L3.7885 3.11548H5.25L3.5 4.86548ZM15.598 6.31923C15.457 6.18073 15.3067 6.04481 15.147 5.91148C14.9875 5.77815 14.8269 5.6609 14.6652 5.55973L17.1095 3.11548H18.8018L15.598 6.31923ZM5.0385 15.1865L7.55975 12.6652C7.65708 12.8294 7.75383 12.9769 7.85 13.1077C7.94617 13.2384 8.05325 13.3608 8.17125 13.475L7.45 14.1962C7.06017 14.3001 6.655 14.4379 6.2345 14.6097C5.814 14.7814 5.41533 14.9736 5.0385 15.1865ZM17.0673 9.35773V9.32673C17.0544 9.0999 17.0214 8.86856 16.9682 8.63273C16.9151 8.39673 16.8449 8.17556 16.7578 7.96923L20.5 4.22698V5.92498L17.0673 9.35773ZM10.727 4.96548L12.5922 3.11548H14.2845L12.5308 4.86923C12.4179 4.84873 12.3103 4.83331 12.2078 4.82298C12.1051 4.81281 11.9973 4.80773 11.8845 4.80773C11.7012 4.81406 11.5083 4.83198 11.3058 4.86148C11.1033 4.89098 10.9103 4.92565 10.727 4.96548ZM3.5 13.8845V12.1922L6.9655 8.72698C6.91933 8.92315 6.88308 9.11764 6.85675 9.31048C6.83042 9.50348 6.81725 9.69165 6.81725 9.87498C6.81725 9.98781 6.82242 10.0955 6.83275 10.198C6.84292 10.3006 6.85825 10.4032 6.87875 10.5057L3.5 13.8845ZM19.5807 15.873C19.4537 15.7306 19.3156 15.5951 19.1663 15.4662C19.0169 15.3374 18.8551 15.214 18.6807 15.096L20.5 13.2767V14.969L19.5807 15.873ZM17.1328 13.8037C17.0929 13.7217 17.0483 13.6438 16.999 13.57C16.9497 13.4963 16.8987 13.4236 16.8462 13.3517C16.7796 13.2634 16.709 13.175 16.6345 13.0865C16.5602 12.998 16.4833 12.9178 16.4038 12.846L20.5 8.73448V10.4517L17.1328 13.8037ZM12 13.5C11.0347 13.5 10.21 13.158 9.526 12.474C8.842 11.79 8.5 10.9653 8.5 9.99998C8.5 9.03465 8.842 8.20998 9.526 7.52598C10.21 6.84198 11.0347 6.49998 12 6.49998C12.9653 6.49998 13.79 6.84198 14.474 7.52598C15.158 8.20998 15.5 9.03465 15.5 9.99998C15.5 10.9653 15.158 11.79 14.474 12.474C13.79 13.158 12.9653 13.5 12 13.5ZM12 12C12.55 12 13.0208 11.8041 13.4125 11.4125C13.8042 11.0208 14 10.55 14 9.99998C14 9.44998 13.8042 8.97915 13.4125 8.58748C13.0208 8.19581 12.55 7.99998 12 7.99998C11.45 7.99998 10.9792 8.19581 10.5875 8.58748C10.1958 8.97915 10 9.44998 10 9.99998C10 10.55 10.1958 11.0208 10.5875 11.4125C10.9792 11.8041 11.45 12 12 12ZM4.5 19.596V18.9077C4.5 18.3922 4.63367 17.9297 4.901 17.5202C5.16833 17.1106 5.52317 16.7936 5.9655 16.5692C6.79617 16.1551 7.72017 15.8092 8.7375 15.5317C9.75483 15.2542 10.8423 15.1155 12 15.1155C13.1577 15.1155 14.2452 15.2542 15.2625 15.5317C16.2798 15.8092 17.2038 16.1551 18.0345 16.5692C18.4705 16.7872 18.8238 17.1042 19.0943 17.5202C19.3648 17.9362 19.5 18.3987 19.5 18.9077V19.596C19.5 19.8538 19.4138 20.0689 19.2413 20.2412C19.0689 20.4137 18.8538 20.5 18.596 20.5H5.404C5.14617 20.5 4.93108 20.4137 4.75875 20.2412C4.58625 20.0689 4.5 19.8538 4.5 19.596ZM6.0155 19H17.9845C17.964 18.709 17.9057 18.4805 17.8095 18.3145C17.7135 18.1483 17.5539 18.0127 17.3307 17.9077C16.7179 17.6077 15.9634 17.3173 15.0673 17.0365C14.1711 16.7556 13.1487 16.6152 12 16.6152C10.8513 16.6152 9.82892 16.7556 8.93275 17.0365C8.03658 17.3173 7.28208 17.6077 6.66925 17.9077C6.45258 18.0127 6.29458 18.1508 6.19525 18.322C6.09592 18.4931 6.036 18.7191 6.0155 19Z"
                  fill="white"></path>
              </svg>
              <span class="text-white text-base font-medium">BACKGROUNDS &amp; EFFECTS</span>
            </div>
            <svg id="backgroundsAccordionIcon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 drop-shadow-icon">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="white" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round"></path>
            </svg>
          </header>
          <div id="backgroundsAccordionContent" class="px-4">
            <div class="my-4">
              <p class="text-white font-medium text-base">
                Blur Background
              </p>
              <div class="mt-[10px] grid grid-cols-4 gap-2">
                <div
                  @click="setBgFilter('none')"
                  class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer" data-apply-background-filter-blur="none" :class="{'active': meeting.bgFilter === 'none'}">
                  No Blur
                </div>
                <div
                  @click="setBgFilter('blur-low')"
                  class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer" data-apply-background-filter-blur="low" :class="{'active': meeting.bgFilter === 'blur-low'}">
                  Low
                </div>
                <div
                  @click="setBgFilter('blur-medium')"
                  class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer" data-apply-background-filter-blur="medium" :class="{'active': meeting.bgFilter === 'blur-medium'}">
                  Medium
                </div>
                <div
                  @click="setBgFilter('blur-high')"
                  class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer" data-apply-background-filter-blur="high" :class="{'active': meeting.bgFilter === 'blur-high'}">
                  High
                </div>
              </div>
            </div>
            <div class="my-4">
              <p class="text-white font-medium text-base">
                Virtual Background
              </p>
              <div class="mt-[10px] grid grid-cols-4 gap-2">
                <div
                  @click="setBgFilter('bg1')"
                  class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg1" :class="{'active': meeting.bgFilter === 'bg1'}">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg1.jpg"
                    class="h-full w-full object-cover">
                </div>
                <div
                  @click="setBgFilter('bg2')" 
                  class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2r cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg2" :class="{'active': meeting.bgFilter === 'bg2'}">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg2.jpg"
                    class="h-full w-full object-cover">
                </div>
                <div
                  @click="setBgFilter('bg3')"
                  class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg3" :class="{'active': meeting.bgFilter === 'bg3'}">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg3.jpg"
                    class="h-full w-full object-cover">
                </div>
                <div
                  @click="setBgFilter('bg4')"
                  class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg4" :class="{'active': meeting.bgFilter === 'bg4'}">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg4.jpg"
                    class="h-full w-full object-cover">
                </div>
                <div
                  @click="setBgFilter('bg5')"
                  class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg5" :class="{'active': meeting.bgFilter === 'bg5'}">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg5.jpg"
                    class="h-full w-full object-cover">
                </div>
                <div
                  @click="setBgFilter('bg6')"
                  class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg6" :class="{'active': meeting.bgFilter === 'bg6'}">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg6.jpg"
                    class="h-full w-full object-cover">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Setting Section -->
      <div class="p-4 absolute bottom-0 w-full">
        <div @click="triggerStart();" v-show="meeting.status === 'ready'" data-join-call-button=""
          class="w-full px-4 py-[10px] rounded-pill bg-green-500 shadow-button flex items-center justify-center cursor-pointer">
          <span class="text-gray-950 text-base font-semibold">JOIN CALL</span>
        </div>
      </div>

      <div class="py-3 block sm:hidden"></div>
    </aside>
  `,
});

// Export to global
if (!window.VueComponents) window.VueComponents = {};
window.VueComponents.CallSettings = CallSettings;
})();

