// Vue component: UserHeader (static, no props) — renders the exact original markup
(function initUserHeaderComponent() {
    if (!window) return;
    window.VueComponents = window.VueComponents || {};

    const { defineComponent } = Vue;

    const PrejoinMobileHeader = defineComponent({
        name: 'PrejoinMobileHeader',
        template: `
        <div class="flex w-full top-2 absolute z-30 lg:hidden flex-col"><span
                class="text-white text-center text-sm font-medium block lg:hidden" data-call-type-text="">
                [[mode_text]] [[userName]] </span>
              <div class="flex justify-center gap-2"><span class="text-white text-xs font-medium"
                  data-meeting-time="">November 5, 2025</span>
                <div class=" p-1 font-medium text-gray-700 hidden" style="display: none;">Timer: <span
                    data-timer="">00:00</span></div>
                <div class="flex items-center gap-1 px-[8px] justify-center rounded-pill bg-[#5549FF] h-[18px]"
                  data-status-indicator="">
                  <div class="w-2 h-2 rounded-full bg-white" data-status-dot=""></div><span
                    class="text-white text-xs font-medium" data-status-text="">in 5 min</span>
                </div>
              </div>
            </div>
      `,
    });

    window.VueComponents.PrejoinMobileHeader = PrejoinMobileHeader;
})();


