// Vue Components for Chime Call Interface
// This file contains all Vue component definitions

(function() {
const { createApp, reactive, defineComponent, watch, ref, onMounted } = Vue;

// ---- Reactive Meeting State ----
const meeting = reactive({
  status: "ready", // idle → grantPermissions → ready (or stay grantPermissions if denied)
  activePanel: null, // null, "settings", "mediaCards", "chat", "gift", "merchCards", "subscriptionCards", "callSettings"
  videoFeed: false,
  audioFeed: false,
  bgFilter: 'none',
  allowedStatuses: [
    "idle",
    "grantPermissions",
    "initiating",
    "ready",
    "joining",
    "waiting",
    "connected",
    "ended",
    "cancelled",
  ],
  ui: {
    connectingSubstate: false, // drives extra show/hide while connecting
  },
});

function updateTimerVisibility() {
  const show = meeting.status === "connected";
  document.querySelectorAll("[data-timer]").forEach(function (timerSpan) {
    const wrapper = timerSpan.parentElement;
    if (wrapper) wrapper.style.display = show ? "" : "none";
  });
}

function setStatus(next) {
  if (!meeting.allowedStatuses.includes(next)) {
    console.warn("[meetingState] Invalid:", next);
    return false;
  }
  meeting.status = next;
  updateTimerVisibility();
  return true;
}

function setActivePanel(next) {
  meeting.activePanel = next;
  return true;
}

function toggleActivePanel(next, _default = '') {
  meeting.activePanel = meeting.activePanel === next ? _default : next;
  return true;
}

function setVideoFeed(bool, dispatch = false) {
  meeting.videoFeed = !!bool;
  if (dispatch) {
    window.dispatchEvent(new CustomEvent("videoToggle"));
  }
  return true;
}

function setAudioFeed(bool, dispatch = false) {
  meeting.audioFeed = !!bool;
  if (dispatch) {
    window.dispatchEvent(new CustomEvent("audioToggle"));
  }
  return true;
}

function toggleVideoFeed(dispatch = false) {
  setVideoFeed(!meeting.videoFeed, dispatch);
  return true;
}

function toggleAudioFeed(dispatch = false) {
  setAudioFeed(!meeting.audioFeed, dispatch);
  return true;
}

function setBgFilter(value) {
  meeting.bgFilter = value;
  return true;
}

function disconnectChimeCall() {
  const iframe = document.querySelector('#chime-call-iframe');

  if (document.body.contains(iframe)) {
    document.body.removeChild(iframe);
  }
  
  console.log('🔴 Chime call iframe closed by user');

  // Close all modals when user ends the call
  const ringPopup = document.getElementById('ring-popup');
  const creatorModal = document.getElementById('call-initiating-creator');
  const audienceModal = document.getElementById('call-initiating-audience');
  const waitingModal = document.getElementById('waiting-for-creator');

  // Hide all calling modals when call ends with debugging
  [ringPopup, creatorModal, audienceModal, waitingModal].forEach(modal => {
    if (modal) {
      console.log('🔧 Closing modal:', modal.id, 'Current classes:', modal.className);
      modal.classList.remove('block');
      modal.classList.add('dn');
      // Force hide with display style as backup
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
      console.log('✅ Modal closed:', modal.id, 'New classes:', modal.className);
    }
  });

  console.log('🎯 All modals closed when user ended the call');

  // Restore scrolling
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.body.style.position = '';

  if (window.parent) {
    window.parent.location.reload();
  }
}

window.__meetingSetStatus = setStatus;

// ---- Patch your handler to push Vue state → 'ready' once permissions UI is populated
(function wireVueStatusBridge() {
  if (!window.CamMicPermissionsHandler) return;
  const _origGranted =
    CamMicPermissionsHandler.displayPermissionsGrantedUI?.bind(
      CamMicPermissionsHandler
    );
  CamMicPermissionsHandler.displayPermissionsGrantedUI = async function (
    mode
  ) {
    const res = await _origGranted?.(mode);
    // When devices UI is ready, advance to Ready (you can change to 'joining' if desired)
    setStatus("ready");
    return res;
  };

  const _origNotGranted =
    CamMicPermissionsHandler.displayPermissionsNotGrantedUI?.bind(
      CamMicPermissionsHandler
    );
  CamMicPermissionsHandler.displayPermissionsNotGrantedUI = function (
    showCam,
    showMic
  ) {
    const res = _origNotGranted?.(showCam, showMic);
    // Ensure we stay on the permissions screen
    if (meeting.status !== "grantPermissions")
      setStatus("grantPermissions");
    return res;
  };
})();

// ---- Auto mode detection using enumerateDevices
async function detectMode() {
  try {
    const list =
      (await navigator.mediaDevices?.enumerateDevices?.()) ?? [];
    const hasCam = list.some((d) => d && d.kind === "videoinput");
    return hasCam ? "both" : "microphone";
  } catch {
    // If cannot enumerate, try both and let GUM decide
    return "both";
  }
}

// Export for use in other files
window.vueState = {
  meeting,
  setStatus,
  setActivePanel,
  toggleActivePanel,
  setVideoFeed,
  setAudioFeed,
  toggleVideoFeed,
  toggleAudioFeed,
  setBgFilter,
  disconnectChimeCall,
  detectMode
};
})();

