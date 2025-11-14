// Vue component: SettingsBackgroundsEffects (Backgrounds & Effects section)
(function initSettingsBackgroundsEffects() {
  // guards
  if (typeof window === 'undefined' || typeof Vue === 'undefined') return;
  window.VueComponents = window.VueComponents || {};

  const { defineComponent, ref, nextTick, onMounted, onBeforeUnmount } = Vue;

  const SettingsBackgroundsEffects = defineComponent({
    name: 'SettingsBackgroundsEffects',
    template: `
      <div class="flex flex-col border-t border-[#475467] gap-2 md:!gap-0">
        <!-- Accordion Header -->
        <header
          data-background-accordion-header
          @click="toggle"
          class="cursor-pointer hover:bg-white/5 flex justify-between items-center p-2 md:!p-4 w-full text-left transition-colors duration-200"
          :aria-expanded="isOpen.toString()"
        >
          <div class="flex items-center gap-2">
            <img src="assets/background-drop-icon.svg" alt="icon" />
            <span class="text-white text-base font-medium">BACKGROUNDS &amp; EFFECTS</span>
          </div>
          <img
            src="assets/chevron-down-white.svg"
            alt="icon"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
          />
        </header>

        <!-- Accordion Content -->
        <div
          data-backgrounds-accordion-content
          :data-open="isOpen ? 'true' : 'false'"
          :class="isOpen ? 'flex flex-col gap-4' : 'hidden'"
          class="transition-all duration-300 ease-in-out overflow-hidden px-2 md:!px-4 pb-2 md:!pb-4"
          ref="content"
        >
          <div>
            <p class="text-white font-medium text-base">Blur Background</p>
            <div class="mt-[10px] grid grid-cols-2 gap-2">
              <div
                class="w-full text-sm font-medium border border-white/50 p-[10px] text-white rounded-lg flex justify-center items-center cursor-pointer active"
                data-apply-background-filter-blur="none">No Blur</div>
              <div
                class="w-full text-sm font-medium border border-white/50 p-[10px] text-white rounded-lg flex justify-center items-center cursor-pointer"
                data-apply-background-filter-blur="high">With Blur</div>
            </div>
          </div>

          <div>
            <p class="text-white font-medium text-base">Virtual Background</p>
            <div class="mt-[10px] flex flex-wrap gap-2">
              <div
                v-for="i in 6"
                :key="i"
                :data-apply-background-filter-predefined="'bg' + i"
                class="h-[72px] w-[86px] border border-[#FFFFFF80] rounded-xl overflow-hidden cursor-pointer"
              >
                <img
                  :src="'https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg' + i + '.jpg'"
                  class="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    setup() {
      const accordionId = 'settings-backgrounds-effects';
      const isOpen = ref(false);
      const content = ref(null);

      function onAccordionOpen(e) {
        const incomingId = e?.detail;
        if (incomingId && incomingId !== accordionId) {
          isOpen.value = false;
        }
      }

      async function toggle() {
        const willOpen = !isOpen.value;
        isOpen.value = willOpen;
        if (willOpen && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('accordion-open', { detail: accordionId }));
        }
        await nextTick();
      }

      onMounted(() => {
        window.addEventListener('accordion-open', onAccordionOpen);
      });

      onBeforeUnmount(() => {
        window.removeEventListener('accordion-open', onAccordionOpen);
      });

      return { isOpen, content, toggle };
    },
  });

  // keep the same global exposure pattern
  window.VueComponents.SettingsBackgroundsEffects = SettingsBackgroundsEffects;
})();
