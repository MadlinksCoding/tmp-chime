// vueComponentMobileHeader.js
(function (global) {
  function register(app) {
    app.component("mobile-header", {
      props: {
        meetingTime: { type: String, default: "November 5, 2025" },
        userName: { type: String, default: "User" },
        modeText: { type: String, default: "Call with" },
        statusText: { type: String, default: "in 5 min" },
      },
      template: `
        <div
          class="justify-center flex-col w-full absolute top-0 sm:top-20 lg:hidden flex items-center gap-2 px-3 py-2 rounded-pill"
          aria-label="Back to fansocial">
          <div class="flex lg:hidden flex-col">
            <span class="text-white text-sm font-medium block text-center lg:hidden" data-call-type-text>
              {{ modeText }} {{ userName }}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-[#FFFFFFB2] text-xs font-medium" data-meeting-time>{{ meetingTime }}</span>
              <div class="p-1 font-medium text-gray-700 hidden" style="display: none;">
                Timer: <span data-timer>00:00</span>
              </div>
              <div class="flex items-center gap-1 px-2 justify-center rounded-pill bg-[#5549FF] h-[18px]" data-status-indicator>
                <div class="w-2 h-2 rounded-full bg-white" data-status-dot></div>
                <span class="text-white text-xs font-medium" data-status-text>{{ statusText }}</span>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  }

  // Expose the register function globally
  global.registerMobileHeader = register;
})(window);
