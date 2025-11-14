/**
 * Back Button Component
 * Displays back to fansocial button (desktop and mobile versions)
 */
(function() {
  'use strict';

  if (typeof window.VueComponents === 'undefined') {
    window.VueComponents = {};
  }

  window.VueComponents.BackButton = {
    props: {
      show: {
        type: Boolean,
        default: true
      }
    },
    template: `
      <template v-if="show">
        <!-- Back button desktop -->
        <div data-back-to-fansocial-button=""
          class=" lg:flex hidden justify-center absolute top-6 sm:left-6 left-4 flex items-center gap-2 px-2 py-2 rounded-pill bg-black/50 backdrop-blur-sm"
          aria-label="Back to fansocial cursor-pointer">
          <img
            src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/arrow-left.svg"
            class="w-6 h-6" alt="Back arrow">
        </div>
        <!-- Back button mobile -->
        <div data-back-to-fansocial-button=""
          class="lg:hidden flex justify-center w-10 w-10 sm:h-12 absolute top-2 sm:left-6 left-4 flex items-center cursor-pointer"
          aria-label="Back to fansocial">
          <img
            src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/chevron-left.svg"
            class="w-6 h-6" alt="Back arrow">
        </div>
      </template>
    `
  };

})();

