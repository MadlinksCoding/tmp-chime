/**
 * Connecting Section Component
 * Displays a loading spinner and connecting message when substate is 'connecting'
 */
(function() {
  'use strict';

  if (typeof window.VueComponents === 'undefined') {
    window.VueComponents = {};
  }

  window.VueComponents.ConnectingSection = {
    props: {
      show: {
        type: Boolean,
        default: false
      }
    },
    template: `
      <div v-if="show" class="absolute top-0 w-full h-full bg-black/75 backdrop-blur-[5px] rounded-[0.25rem] inline-flex flex-col justify-center items-center gap-8 z-10">
        <div class="size-36 relative">
          <img 
            src="assets/spinner-loader.svg" 
            alt="Loading spinner"
            class="lg:w-[150px] sm:w-[100px] w-[80px] lg:h-[150px] sm:h-[100px] h-[80px] animate-spin"
            aria-hidden="true">
        </div>
        <div class="text-right justify-start text-white text-sm font-normal font-['Poppins'] leading-5">
          Connecting you to the call...
        </div>
      </div>
    `
  };

})();

