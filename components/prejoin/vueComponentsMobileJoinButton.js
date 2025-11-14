// Vue component: JoinCallButton (shows when substate !== 'connecting')
(function initJoinCallButton() {
    if (!window) return;
    window.VueComponents = window.VueComponents || {};
  
    const { defineComponent } = Vue;
  
    const MobileJoinButton = defineComponent({
      name: 'MobileJoinButton',
      props: {
        substate: { type: String, default: '' },
      },
      emits: ['join'],
      template: `
        <div v-if="substate !== 'connecting'" data-join-call-button-mobile=""
                class="w-full lg:hidden font-semibold text-lg py-[10px] px-4 text-center rounded-full leading-7 bg-[#07F468] text-gray-950 cursor-pointer"
                @click="$emit('join')">
                Join Call 
              </div>
      `,
    });
  
    window.VueComponents.MobileJoinButton = MobileJoinButton;
  })();
  
  
  