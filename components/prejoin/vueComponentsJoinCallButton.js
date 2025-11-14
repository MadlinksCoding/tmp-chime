// Vue component: JoinCallButton (shows when substate !== 'connecting')
(function initJoinCallButton() {
  if (!window) return;
  window.VueComponents = window.VueComponents || {};

  const { defineComponent } = Vue;

  const JoinCallButton = defineComponent({
    name: 'JoinCallButton',
    props: {
      substate: { type: String, default: '' },
    },
    emits: ['join'],
    template: `
      <div v-if="substate !== 'connecting'" data-join-call-button=""
        class="w-full px-4 py-[10px] rounded-pill shadow-button flex items-center justify-center bg-[#07F468] cursor-pointer"
        @click="$emit('join')">
        <span class="text-base font-semibold text-gray-950">JOIN CALL</span>
      </div>
    `,
  });

  window.VueComponents.JoinCallButton = JoinCallButton;
})();


