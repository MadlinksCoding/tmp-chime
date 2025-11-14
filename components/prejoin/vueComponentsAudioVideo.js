// Vue component: SettingsAudioVideo (Audio & Video Section)
(function initSettingsAudioVideo() {
  // guard: require window and global Vue
  if (typeof window === 'undefined' || typeof Vue === 'undefined') return;
  window.VueComponents = window.VueComponents || {};

  const { defineComponent, ref, nextTick, onMounted, onBeforeUnmount } = Vue;

  const SettingsAudioVideo = defineComponent({
    name: 'SettingsAudioVideo',
    template: `
      <div class="flex flex-col gap-2 md:!gap-0">
        <!-- Audio Video Accordion Header -->
        <header
          data-audio-video-accordion-header
          @click="toggle"
          class="flex justify-between items-center p-2 md:!p-4 cursor-pointer hover:bg-white/5 transition-colors duration-200"
          :aria-expanded="isOpen.toString()"
        >
          <div class="flex items-center gap-2">
            <img src="assets/settings-02.svg" alt="icon" />
            <h2 class="text-white lg:text-base text-sm font-medium">Audio &amp; Video Setting</h2>
          </div>
          <img
            src="assets/chevron-down-white.svg"
            alt="icon"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
          />
        </header>

        <!-- Audio Video Accordion Content -->
        <div
          data-audio-video-accordion-content
          :data-open="isOpen ? 'true' : 'false'"
          :class="isOpen ? 'flex flex-col gap-4' : 'hidden'"
          class="transition-all duration-300 ease-in-out overflow-hidden px-2 md:!px-4 pb-2 md:!pb-4"
          ref="content"
        >
          <!-- CAMERA -->
          <div class="flex flex-col gap-2">
            <div class="h-6 flex items-center">
              <h3 class="text-gray-50 text-sm font-semibold">CAMERA</h3>
            </div>
            <div class="relative">
              <div data-camera-drop-dropdown-trigger=""
                class="py-2 px-3 h-[4.4rem] flex items-center border border-[#EAECF080] rounded-[6px] bg-black/50 justify-between cursor-pointer hover:bg-black/70 transition-colors">
                <div class="flex items-center gap-2 lg:flex-1 lg:w-auto w-[87%]">
                  <img src="assets/video-recorder.svg" />
                  <span class="text-gray-200 lg:text-base text-sm font-medium truncate" data-camera-device="">FaceTime HD Camera</span>
                </div>
                <img data-camera-dropdown-icon="" src="assets/chevron-down-white.svg" />
              </div>
              <div data-camera-dropdown-menu=""
                class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 hidden max-h-64 overflow-y-auto">
                <div class="py-1"><!-- Options will be populated dynamically --></div>
                <div class="border-t border-gray-600 p-2">
                  <button id="refreshCameraDevices"
                    class="w-full px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2">
                    Refresh Devices
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- MICROPHONE -->
          <div class="flex flex-col gap-2">
            <div class="h-6 flex items-center">
              <h3 class="text-gray-50 text-sm font-semibold">MICROPHONE</h3>
            </div>
            <div class="relative">
              <div data-microphone-dropdown-trigger=""
                class="py-2 px-3 h-[4.4rem] flex items-center border border-[#EAECF080] rounded-[6px] bg-black/50 justify-between cursor-pointer hover:bg-black/70 transition-colors">
                <div class="flex items-center gap-2 lg:flex-1 lg:w-auto w-[87%]">
                  <img src="assets/microphone-01.svg" />
                  <span class="text-gray-200 lg:text-base text-sm font-medium truncate" data-microphone-device="">
                    MacBook Pro Microphone <span class="lg:inline hidden">(Built-in)</span>
                  </span>
                </div>
                <img src="assets/chevron-down-white.svg" alt="icon" />
              </div>
              <div data-microphone-dropdown-menu=""
                class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 hidden max-h-64 overflow-y-auto">
                <div class="py-1"><!-- Options will be populated dynamically --></div>
                <div class="border-t border-gray-600 p-2">
                  <button data-refresh-microphone-devices=""
                    class="w-full px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2">
                    Refresh Devices
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- SPEAKER -->
          <div class="flex flex-col gap-2">
            <div class="h-6 flex items-center">
              <h3 class="text-gray-50 text-sm font-semibold">SPEAKER</h3>
            </div>
            <div class="relative">
              <div data-speaker-dropdown-trigger=""
                class="py-2 px-3 h-[4.4rem] flex items-center border border-[#EAECF080] rounded-[6px] bg-black/50 justify-between cursor-pointer hover:bg-black/70 transition-colors">
                <div class="flex items-center gap-2 lg:flex-1 lg:w-auto w-[87%]">
                  <img src="assets/volume-max.svg" alt="icon" />
                  <span class="text-gray-200 lg:text-base text-sm font-medium truncate" data-speaker-device="">
                    MacBook Pro Speakers <span class="lg:inline hidden">(Built-in)</span>
                  </span>
                </div>
                <img data-speaker-dropdown-icon="" id="speakerDropdownIcon" src="assets/chevron-down-white.svg" alt="icon" />
              </div>
              <div data-speaker-dropdown-menu=""
                class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 hidden max-h-64 overflow-y-auto">
                <div class="py-1"><!-- Options will be populated dynamically --></div>
                <div class="border-t border-gray-600 p-2">
                  <button data-refresh-speaker-devices=""
                    class="w-full px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2">
                    Refresh Devices
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    setup() {
      const accordionId = 'settings-audio-video';
      // open by default
      const isOpen = ref(true);
      const content = ref(null);

      // listen for other accordions opening
      function onAccordionOpen(e) {
        const incomingId = e?.detail;
        if (incomingId && incomingId !== accordionId) {
          isOpen.value = false;
        }
      }

      async function toggle() {
        const willOpen = !isOpen.value;
        isOpen.value = willOpen;
        // if opening, broadcast to others
        if (willOpen && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('accordion-open', { detail: accordionId }));
        }
        await nextTick();
      }

      onMounted(() => {
        // notify others on mount so only this stays open
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('accordion-open', { detail: accordionId }));
        }
        window.addEventListener('accordion-open', onAccordionOpen);
      });

      onBeforeUnmount(() => {
        window.removeEventListener('accordion-open', onAccordionOpen);
      });

      return {
        isOpen,
        content,
        toggle,
      };
    },
  });

  // expose to window for your existing registration flow
  window.VueComponents.SettingsAudioVideo = SettingsAudioVideo;
})();
