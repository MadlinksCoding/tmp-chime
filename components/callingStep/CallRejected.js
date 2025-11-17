// CallAcceptedCard.js
(function (global) {
    function register(app) {
      if (!app) return;
  
      app.component('call-rejected', {
        template: `
          <div class="w-[32.8rem] h-[32.8rem] flex flex-col bg-black/80 relative" >
      <!-- calling-info-section -->
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max flex flex-col justify-center items-center gap-4 pointer-events-none z-0"
      >
        <img
          src="https://i.ibb.co.com/ynbtT1F1/call-rejected.webp"
          alt="call-rejected"
          class="w-[7.5rem] h-[7.5625rem]"
        />

        <span class="text-sm text-white text-center"
          >@jennyben did not answer your call...</span
        >
      </div>

      <!-- bottom-controls-section -->
      <div class="w-full h-full flex justify-end items-end flex-grow">
        <div class="w-full flex justify-center items-center p-4">
          <div class="flex items-center gap-3 py-2">
            <!-- video-block -->
            <div
              class="flex justify-center items-center w-12 h-12 bg-white/5 rounded-full cursor-pointer"
            >
              <img
                src="https://i.ibb.co.com/zVx0JM7X/block-video-1.webp"
                alt="block-video-1"
                class="w-[1.375rem] h-[1.375rem] drop-shadow-[0px_0px_4px_0px_#000000]"
              />
            </div>

            <!-- microphone-off -->
            <div
              class="flex justify-center items-center w-12 h-12 bg-white/5 rounded-full cursor-pointer"
            >
              <img
                src="https://i.ibb.co.com/zVhRMm4s/microphone-off-01.webp"
                alt="microphone-off-01"
                class="w-[1.375rem] h-[1.375rem] drop-shadow-[0px_0px_4px_0px_#000000]"
              />
            </div>

            <!-- cut-call -->
            <div
              class="flex justify-center items-center w-12 h-12 bg-[#FF4405] rounded-full cursor-pointer"
            >
              <img
                src="https://i.ibb.co.com/nshWZFfD/Communication.webp"
                alt="Communication"
                class="w-[1.375rem] h-[1.375rem]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
        `,
      });
    }
  
    // Expose global registration method
    global.registerCallAcceptedCard = register;
  })(window);
  