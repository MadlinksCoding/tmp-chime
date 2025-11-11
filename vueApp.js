// Main Vue App Initialization
// This file initializes the Vue app and mounts all components

const { createApp, defineComponent } = Vue;

// Wait for all components to be loaded
function initializeVueApp() {
  // Check if all components are loaded
  if (!window.VueComponents || !window.vueState) {
    console.warn("Components not loaded yet, retrying...");
    setTimeout(initializeVueApp, 100);
    return;
  }

  // ---- Root App ----
  const App = defineComponent({
    name: "App",
    components: {
      VideoCallModal: window.VueComponents.VideoCallModal,
      Idle: window.VueComponents.Idle,
      GrantPermissions: window.VueComponents.GrantPermissions,
      CallVideoTemplate: window.VueComponents.CallVideoTemplate,
      WaitingConnected: window.VueComponents.WaitingConnected,
      Ended: window.VueComponents.Ended,
    },
    setup() {
      return { meeting: window.vueState.meeting };
    },
    template: `
      <VideoCallModal>
        <Idle v-show="meeting.status==='idle'" />
        <GrantPermissions v-show="meeting.status==='grantPermissions'" />
        <p v-show="meeting.status==='initiating'">Initiating…</p>
        <CallVideoTemplate v-show="meeting.status==='ready' || meeting.status==='joining'" />
        <WaitingConnected v-show="meeting.status==='waiting' || meeting.status==='connected'" />
        <Ended v-show="meeting.status==='ended' || meeting.status==='cancelled'" />
      </VideoCallModal>
    `,
  });

  // Mount the app
  const app = createApp(App);
  app.mount("#chime-call");

  // Add status attribute to the element
  const element = document.getElementById('chime-call');
  if (element) {
    element.setAttribute('data-meeting-state', window.vueState.meeting.status);

    // Watch for status changes and update the element
    const { watch } = Vue;
    watch(() => window.vueState.meeting.status, (newStatus) => {
      element.setAttribute('data-meeting-state', newStatus);
    });
  }

  // dispatch an event after mounted with meeting object
  window.dispatchEvent(new CustomEvent("vueMounted", { detail: window.vueState.meeting }));

  console.log("✅ Vue app mounted successfully");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVueApp);
} else {
  initializeVueApp();
}

