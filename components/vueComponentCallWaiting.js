// Vue component: CallWaiting (Waiting Screen Section)
(function initCallWaiting() {
  // Guard: require window and Vue
  if (typeof window === 'undefined' || typeof Vue === 'undefined') return;
  window.VueComponents = window.VueComponents || {};

  const { defineComponent } = Vue;

  const CallWaiting = defineComponent({
    name: 'CallWaiting',
    props: {
      show: { type: Boolean, default: false },
    },
    template: `
      <div
        v-if="show"
        class="text-white text-sm font-normal flex flex-col gap-3 lg:h-[89vh] items-center justify-start lg:justify-center relative top-[9rem] lg:top-0"
        data-waiting-text
      >
        <!-- Avatar / Blob -->
        <div class="flex w-[78px] h-[80px] lg:w-[12rem] lg:h-[12rem] flex-shrink-0 rounded-blob-1 aspect-square relative overflow-hidden">
          <div
            data-user-initial
            class="w-full h-full bg-purple-500 flex items-center justify-center text-white text-xl font-bold rounded-blob-1 aspect-square relative overflow-hidden"
          >
            {{ userInitials }}
          </div>
        </div>

        <!-- Waiting Message -->
        <span>Waiting for {{ waitingHandle }} to join...</span>
      </div>
    `,
  });

  // Register globally in window.VueComponents
  window.VueComponents.CallWaiting = CallWaiting;
})();
