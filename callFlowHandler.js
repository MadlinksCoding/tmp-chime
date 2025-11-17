/* ======================================================================
 * CLASS: CallHandler
 * - Pure dispatch + listeners. NO UI mutations.
 * - Alerts for ALL critical actions.
 * - Console logs EVERYWHERE (direct console.log).
 * - NO fallbacks (no "||" defaults).
 * - Instant one-on-one ONLY.
 * - 25s timeout ENDS THE FLOW FOR BOTH SIDES.
 * - meeting:ready includes {callerRole, calleeRole}; each side joins with its role.
 * - call:ringing is LOCAL-ONLY (no socket listener).
 * - On incoming, the callee/target IDs/roles come from SOCKET body (not from inputs).
 * - 🚨 NEW: single UI bridge method `dipatchUI()` invoked at EVERY step to trigger Vue.
 * - 🚨 NEW: caller also runs its own 25s ring timer (symmetry with callee).
 * ==================================================================== */

console.log("[CallHandler] [FIX v1.1] ✅ FIXED VERSION LOADED");

class CallHandler {
  /* === GLOBAL CONFIGURATION === */
  static CALLEE_MANUAL_JOIN_ENABLED = true; // set to false to auto join and not wait for connect.
 
  /* === STATE TRACKING === */
  static _currentUIState = null;
  static _currentUISubstate = null;
  static _lastDispatchTime = 0;
  static _duplicateThrottleMs = 50; // Only skip if duplicate within 50ms

  /* === STATE RESET === */
  static resetUIState() {
    console.log('[UI] Resetting UI state tracking (call ended)');
    CallHandler._currentUIState = null;
    CallHandler._currentUISubstate = null;
    CallHandler._lastDispatchTime = 0;
  }

  /* === ONLY ADDITION: single UI dispatcher (exact name requested) === */
/* ======================================================================
 * SINGLE UI DISPATCHER (with extra logging and smart duplicate prevention)
 * ====================================================================== */
static dipatchUI(state, substate = "none", payload = {}) {
  console.log("[UI] dispatch requested", {
    gotCallHandler: typeof CallHandler !== "undefined",
    state,
    substate,
    payloadType: typeof payload,
  });

  const now = Date.now();
  const timeSinceLastDispatch = now - CallHandler._lastDispatchTime;
  
  // Check if we're already in this exact state AND it was dispatched recently (within throttle window)
  // This prevents rapid-fire duplicates while allowing intentional state refreshes
  if (CallHandler._currentUIState === state && 
      CallHandler._currentUISubstate === substate && 
      timeSinceLastDispatch < CallHandler._duplicateThrottleMs) {
    console.log(`[UI] ⏭️ SKIPPED duplicate dispatch: already in ${state} / ${substate} (dispatched ${timeSinceLastDispatch}ms ago)`);
    return;
  }

  try {
    if (!document || !document.dispatchEvent) {
      console.error("[UI] document.dispatchEvent not available");
      return;
    }

    const detail = { state, substate, ts: Date.now(), ...payload };

    console.log("[UI] dispatching CustomEvent('chime-ui::state') with:", detail);

    document.dispatchEvent(
      new CustomEvent("chime-ui::state", { detail })
    );

    // Update state tracking
    CallHandler._currentUIState = state;
    CallHandler._currentUISubstate = substate;
    CallHandler._lastDispatchTime = now;

    console.log(`[UI] → ${state} / ${substate}`, detail);
    
    // Auto-reset state tracking if call has ended
    if (state.includes('terminated') || state.includes('rejected') || state.includes('declined') || state === 'ended') {
      console.log('[UI] 🔄 Call ended - will reset state tracking for next call');
      // Reset on next tick to allow current state to be processed
      setTimeout(() => CallHandler.resetUIState(), 0);
    }
  } catch (e) {
    console.error("[UI] dispatch failed", e);
  }
}

  /* ================================================================== */

  static TYPE_INSTANT = "INSTANT_ONE_ON_ONE";
  static TYPE_SCHEDULED = "SCHEDULED_ONE_ON_ONE";
  static TYPE_GROUP = "GROUP_ONE_ON_ONE";

  static FLAGS = {
    CALL_INITIATE: "call:initiate",
    CALL_INCOMING: "call:incoming",
    CALL_RINGING: "call:ringing", // LOCAL-ONLY
    CALL_ACCEPTED: "call:accepted",
    CALL_DECLINED: "call:declined",
    CALL_TIMEOUT: "call:timeout",
    CALL_CANCELLED: "call:cancelled",
    CALL_ENDED: "call:ended",
    SELF_STOP_RING: "call:self:stopRinging",
    MEETING_READY: "meeting:ready",
    MEETING_CONNECT: "meeting:connect",
    MEETING_PROBLEM: "meeting:problem",
  };

  static SCHEMA = {
    initiate: {
      to: { type: "string", required: true },
      callType: { type: "string", required: true },
      callerId: { type: "string", required: true },
      calleeId: { type: "string", required: true },
      role: { type: "string", required: true },
    },
    accept: {
      to: { type: "string", required: true },
      callerId: { type: "string", required: true },
      calleeId: { type: "string", required: true },
    },
    decline: {
      to: { type: "string", required: true },
      callerId: { type: "string", required: true },
      calleeId: { type: "string", required: true },
      reason: { type: "string", required: true },
    },
    cancel: {
      to: { type: "string", required: true },
      callerId: { type: "string", required: true },
      calleeId: { type: "string", required: true },
    },
    timeout: {
      to: { type: "string", required: true },
      callerId: { type: "string", required: true },
      calleeId: { type: "string", required: true },
    },
    selfStop: {
      to: { type: "string", required: true },
      calleeId: { type: "string", required: true },
    },
    meetingReady: {
      to: { type: "string", required: true },
      meetingId: { type: "string", required: true },
      callerId: { type: "string", required: true },
      calleeId: { type: "string", required: true },
      callerRole: { type: "string", required: true },
      calleeRole: { type: "string", required: true },
    },
    meetingProblem: {
      to: { type: "string", required: true },
      meetingId: { type: "string", required: true },
      callerId: { type: "string", required: true },
      calleeId: { type: "string", required: true },
      message: { type: "string", required: true },
    },
  };

  static _els = {
    callType: null,
    role: null,
    currentUserId: null,
    targetUserId: null,
    btnStart: null,
    btnStartAudio: null,
    btnStartVideo: null,
    btnAccept: null,
    btnReject: null,
    btnCancel: null,
    rejectReason: null,
  };

  static _ringTimeoutMs = 25000;
  static _calleeRingTimerId = null; // runs on receiver (incoming)
  static _callerRingTimerId = null; // runs on sender (after initiate)
  static _inCallOrConnecting = false; // NEW: true when answered:setup/connecting or connected
  static _pendingCalleeJoin = null; // Store pending callee join info for manual join
  static _currentSide = null; // Track if we're the caller or callee for UI dispatches

  // Lambda API endpoints
  static _scyllaDatabaseEndpoint =
    "https://fns5h6php6v5qalzaoxmcq532y0dzrro.lambda-url.ap-northeast-1.on.aws/";
  static _chimeMeetingEndpoint =
    "https://huugn2oais26si45yoqoui6byu0iqhtl.lambda-url.ap-northeast-1.on.aws/";

  // Populated from call:incoming (SOCKET) — the source of truth for callee side
  static _invite = {
    callerId: null,
    calleeId: null,
    callerRole: null,
    callType: null,
    callerData: null, // { userId, username, displayName, avatar }
    calleeData: null, // { userId, username, displayName, avatar }
  };
  
  // Store current user and target user data for call
  static _currentUserData = null;
  static _targetUserData = null;

  /**
   * Set user data for current user and target user before making a call
   * @param {Object} currentUser - { userId, username, displayName, avatar }
   * @param {Object} targetUser - { userId, username, displayName, avatar }
   */
  static setUserData(currentUser, targetUser) {
    console.log("[CallHandler] Setting user data", { currentUser, targetUser });
    CallHandler._currentUserData = currentUser;
    CallHandler._targetUserData = targetUser;
  }

  static init() {
    console.log("[CallHandler] init start");

    CallHandler._els.callType = document.getElementById("callType");
    CallHandler._els.role = document.getElementById("role");
    CallHandler._els.currentUserId = document.getElementById("currentUserId");
    CallHandler._els.targetUserId = document.getElementById("targetUserId");
    CallHandler._els.btnStart = document.getElementById("btnStartInstantCall");
    CallHandler._els.btnStartAudio =
      document.getElementById("btnStartAudioCall");
    CallHandler._els.btnStartVideo =
      document.getElementById("btnStartVideoCall");
    CallHandler._els.btnAccept = document.getElementById("btnAccept");
    CallHandler._els.btnReject = document.getElementById("btnReject");
    CallHandler._els.btnCancel = document.getElementById("btnCancelCall");
    CallHandler._els.rejectReason = document.getElementById("rejectReason");

    if (CallHandler._els.btnStart)
      CallHandler._els.btnStart.addEventListener(
        "click",
        CallHandler.handleStartInstantCallClick
      );
    if (CallHandler._els.btnStartAudio)
      CallHandler._els.btnStartAudio.addEventListener(
        "click",
        CallHandler.handleStartAudioCallClick
      );
    if (CallHandler._els.btnStartVideo)
      CallHandler._els.btnStartVideo.addEventListener(
        "click",
        CallHandler.handleStartVideoCallClick
      );
    if (CallHandler._els.btnAccept)
      CallHandler._els.btnAccept.addEventListener(
        "click",
        CallHandler.handleAcceptClick
      );
    if (CallHandler._els.btnReject)
      CallHandler._els.btnReject.addEventListener(
        "click",
        CallHandler.handleRejectClick
      );
    if (CallHandler._els.btnCancel)
      CallHandler._els.btnCancel.addEventListener(
        "click",
        CallHandler.handleCancelClick
      );

    document.addEventListener("app:call:start", CallHandler.handleAppStartCall);
    document.addEventListener(
      "app:call:accept",
      CallHandler.handleAppAcceptCall
    );
    document.addEventListener(
      "app:call:reject",
      CallHandler.handleAppRejectCall
    );
    document.addEventListener(
      "app:call:cancel",
      CallHandler.handleAppCancelCall
    );

    // SOCKET listeners (NO listener for CALL_RINGING — it is local-only)
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.CALL_INCOMING,
      callback: CallHandler.handleSocketIncomingCall,
    });
    // Backend sends "call:initiate" to receiver, not "call:incoming"
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.CALL_INITIATE,
      callback: CallHandler.handleSocketIncomingCall,
    });
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.CALL_ACCEPTED,
      callback: CallHandler.handleSocketAccepted,
    });
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.CALL_DECLINED,
      callback: CallHandler.handleSocketDeclined,
    });
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.CALL_TIMEOUT,
      callback: CallHandler.handleSocketTimeout,
    });
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.CALL_CANCELLED,
      callback: CallHandler.handleSocketCancelled,
    });
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.SELF_STOP_RING,
      callback: CallHandler.handleSocketSelfStopRinging,
    });
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.MEETING_READY,
      callback: CallHandler.handleSocketMeetingReady,
    });
    SocketHandler.registerSocketListener({
      flag: CallHandler.FLAGS.MEETING_PROBLEM,
      callback: CallHandler.handleSocketMeetingProblem,
    });
    SocketHandler.registerSocketListener({
      flag: "meeting:status",
      callback: CallHandler.handleSocketMeetingStatus,
    });
    SocketHandler.registerSocketListener({
      flag: "grace:start",
      callback: CallHandler.handleSocketGraceStart,
    });
    SocketHandler.registerSocketListener({
      flag: "grace:resume",
      callback: CallHandler.handleSocketGraceResume,
    });
    SocketHandler.registerSocketListener({
      flag: "grace:end",
      callback: CallHandler.handleSocketGraceEnd,
    });

    // Wire up Join Meeting button for callee manual join
    const joinMeetingBtn = document.getElementById("link-join-meeting");
    if (joinMeetingBtn) {
      joinMeetingBtn.addEventListener("click", (e) => {
        if (CallHandler._pendingCalleeJoin) {
          e.preventDefault();
          e.stopPropagation();
          CallHandler.handleManualCalleeJoin();
        }
      });
    }

    console.log("[CallHandler] init complete");
    DebugLogger.addLog("initialize", "NOTICE", "CallHandler.init", "Call handler initialized");
  }

  /* =========================
   * BUTTON HANDLERS → DISPATCH
   * ======================= */
  static handleStartInstantCallClick() {
    DebugLogger.addLog("calling", "NOTICE", "handleStartInstantCallClick", "UI click: Start Instant Call");
    console.log("[CallHandler] UI click: Start Instant Call");

    if (!CallHandler._els.callType) {
      console.log("[CallHandler] callType select missing");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleStartInstantCallClick",
        "Missing call type"
      );
      return;
    }
    if (!CallHandler._els.role) {
      console.log("[CallHandler] role select missing");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleStartInstantCallClick",
        "Missing role"
      );
      return;
    }
    if (!CallHandler._els.currentUserId) {
      console.log("[CallHandler] currentUserId input missing");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleStartInstantCallClick",
        "Missing your ID"
      );
      return;
    }
    if (!CallHandler._els.targetUserId) {
      console.log("[CallHandler] targetUserId input missing");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleStartInstantCallClick",
        "Missing target user ID"
      );
      return;
    }

    const callTypeVal = CallHandler._els.callType.value;
    const callerRole = CallHandler._els.role.value;
    const callerIdVal = CallHandler._els.currentUserId.value;
    const calleeIdVal = CallHandler._els.targetUserId.value;

    console.log("[CallHandler] values", {
      callTypeVal,
      callerRole,
      callerIdVal,
      calleeIdVal,
    });

    if (callTypeVal !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant call selected; aborting");
      DebugLogger.addLog(
        "calling",
        "NOTICE",
        "handleStartInstantCallClick",
        "Instant one-on-one only in this flow"
      );
      return;
    }
    if (callerIdVal === undefined || callerIdVal === "") {
      console.log("[CallHandler] missing callerId");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleStartInstantCallClick",
        "Enter your User ID"
      );
      return;
    }
    if (calleeIdVal === undefined || calleeIdVal === "") {
      console.log("[CallHandler] missing calleeId");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleStartInstantCallClick",
        "Enter target User ID"
      );
      return;
    }
    if (callerRole === undefined || callerRole === "") {
      console.log("[CallHandler] missing role");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleStartInstantCallClick",
        "Select a role"
      );
      return;
    }

    console.log(`[CallHandler] dispatch ${CallHandler.FLAGS.CALL_INITIATE}`);
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_INITIATE, {
        detail: {
          callerId: callerIdVal,
          calleeId: calleeIdVal,
          type: callTypeVal,
          role: callerRole,
        },
      })
    );

    console.log("[CallHandler] sending socket CALL_INITIATE");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_INITIATE,
      payload: {
        to: calleeIdVal,
        callType: callTypeVal,
        callerId: callerIdVal,
        calleeId: calleeIdVal,
        role: callerRole,
      },
      schema: CallHandler.SCHEMA.initiate,
    });

    // Set current side to caller
    CallHandler._currentSide = "caller";
    
    // Reset chimeHandler alerts for new call
    if (typeof chimeHandler !== 'undefined') {
      chimeHandler._hasShownJoinedAlert = false;
      chimeHandler._hasShownConnectedAlert = false;
      chimeHandler._hasShownInCallAlert = false;
    }
    
    // Reset UI state tracking for new call
    CallHandler.resetUIState();
    
    // 🔔 UI (caller) → calling state
    CallHandler.dipatchUI("caller:callWaiting", "none", {
      callerId: callerIdVal,
      calleeId: calleeIdVal,
      role: callerRole,
    });

    // ⏲️ caller-side 25s timeout (symmetry with callee)
    CallHandler.clearCallerRingTimer();
    CallHandler._callerRingTimerId = setTimeout(() => {
      console.log(
        "[CallHandler] CALLER ring timeout → notify callee + end locally"
      );
      SocketHandler.sendSocketMessage({
        flag: CallHandler.FLAGS.CALL_TIMEOUT,
        payload: {
          to: calleeIdVal,
          callerId: callerIdVal,
          calleeId: calleeIdVal,
        },
        schema: CallHandler.SCHEMA.timeout,
      });
      // stop own ringing
      SocketHandler.sendSocketMessage({
        flag: CallHandler.FLAGS.SELF_STOP_RING,
        payload: { to: callerIdVal, calleeId: callerIdVal },
        schema: CallHandler.SCHEMA.selfStop,
      });
      CallHandler.dipatchUI("caller:terminated", "timeout", {
        callerId: callerIdVal,
        calleeId: calleeIdVal,
      });
      DebugLogger.addLog(
        "terminated",
        "NOTICE",
        "handleStartInstantCallClick",
        "No answer (timeout)"
      );
    }, CallHandler._ringTimeoutMs);

    DebugLogger.addLog("calling", "NOTICE", "handleStartInstantCallClick", "Calling...");
  }

  static handleStartAudioCallClick() {
    DebugLogger.addLog("calling", "NOTICE", "handleStartAudioCallClick", "UI click: Start Audio Call");
    console.log("[CallHandler] UI click: Start Audio Call");
    CallHandler._initiateCall("audio");
  }

  static handleStartVideoCallClick() {
    DebugLogger.addLog("calling", "NOTICE", "handleStartVideoCallClick", "UI click: Start Video Call");
    console.log("[CallHandler] UI click: Start Video Call");
    CallHandler._initiateCall("video");
  }

  static _initiateCall(mediaType) {
    DebugLogger.addLog("calling", "NOTICE", "_initiateCall", `Initiating ${mediaType} call`);
    if (!CallHandler._els.role) {
      console.log("[CallHandler] role select missing");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "_initiateCall",
        "Missing role"
      );
      return;
    }
    if (!CallHandler._els.currentUserId) {
      console.log("[CallHandler] currentUserId input missing");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "_initiateCall",
        "Missing your ID"
      );
      return;
    }
    if (!CallHandler._els.targetUserId) {
      console.log("[CallHandler] targetUserId input missing");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "_initiateCall",
        "Missing target user ID"
      );
      return;
    }

    const callerRole = CallHandler._els.role.value;
    const callerIdVal = CallHandler._els.currentUserId.value;
    const calleeIdVal = CallHandler._els.targetUserId.value;

    if (callerIdVal === undefined || callerIdVal === "") {
      console.log("[CallHandler] missing callerId");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "_initiateCall",
        "Enter your User ID"
      );
      return;
    }
    if (calleeIdVal === undefined || calleeIdVal === "") {
      console.log("[CallHandler] missing calleeId");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "_initiateCall",
        "Enter target User ID"
      );
      return;
    }
    if (callerRole === undefined || callerRole === "") {
      console.log("[CallHandler] missing role");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "_initiateCall",
        "Select a role"
      );
      return;
    }

    // Initialize CamMic permissions system
    console.log('[CallHandler] Initializing CamMic permissions system');
    window.dispatchEvent(new CustomEvent('CamMic:Init'));

    // Store callType for caller
    CallHandler._invite.callType = mediaType;

    // Populate mockCallData for the call
    if (window.mockCallData) {
      window.mockCallData.callType = CallHandler.TYPE_INSTANT;
      window.mockCallData.mediaType = mediaType;
      window.mockCallData.currentUserRole = callerRole;
      window.mockCallData.currentUserSide = "caller";
      // Use mockCallData users if CallHandler doesn't have them set
      CallHandler._currentUserData = CallHandler._currentUserData || window.mockCallData.currentUser;
      CallHandler._targetUserData = CallHandler._targetUserData || window.mockCallData.targetUser;
    }

    // Validate user data before initiating call
    if (!CallHandler.validateUserData(CallHandler._currentUserData, "Current user data")) return;
    if (!CallHandler.validateUserData(CallHandler._targetUserData, "Target user data")) return;

    console.log(`[CallHandler] dispatch ${CallHandler.FLAGS.CALL_INITIATE}`);
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_INITIATE, {
        detail: {
          callerId: callerIdVal,
          calleeId: calleeIdVal,
          type: CallHandler.TYPE_INSTANT,
          role: callerRole,
        },
      })
    );

    console.log("[CallHandler] sending socket CALL_INITIATE");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_INITIATE,
      payload: {
        to: calleeIdVal,
        callType: CallHandler.TYPE_INSTANT,
        callerId: callerIdVal,
        calleeId: calleeIdVal,
        role: callerRole,
        mediaType: mediaType,
        callerData: CallHandler._currentUserData,
        calleeData: CallHandler._targetUserData,
      },
      schema: CallHandler.SCHEMA.initiate,
    });

    // Set current side to caller
    CallHandler._currentSide = "caller";
    
    // Reset chimeHandler alerts for new call
    if (typeof chimeHandler !== 'undefined') {
      chimeHandler._hasShownJoinedAlert = false;
      chimeHandler._hasShownConnectedAlert = false;
      chimeHandler._hasShownInCallAlert = false;
    }
    
    // 🔔 UI (caller) → calling state
    CallHandler.dipatchUI("caller:callWaiting", "none", {
      callerId: callerIdVal,
      calleeId: calleeIdVal,
      role: callerRole,
      callerData: CallHandler._currentUserData,
      calleeData: CallHandler._targetUserData,
    });
    
    const targetName = CallHandler._targetUserData?.displayName || CallHandler._targetUserData?.username || calleeIdVal;
    DebugLogger.addLog(
      "calling",
      "NOTICE",
      "_initiateCall",
      `📞 Calling ${targetName} for ${mediaType} call...`
    );

    // ⏲️ caller-side 25s timeout (symmetry with callee)
    CallHandler.clearCallerRingTimer();
    CallHandler._callerRingTimerId = setTimeout(() => {
      console.log(
        "[CallHandler] CALLER ring timeout → notify callee + end locally"
      );
      SocketHandler.sendSocketMessage({
        flag: CallHandler.FLAGS.CALL_TIMEOUT,
        payload: {
          to: calleeIdVal,
          callerId: callerIdVal,
          calleeId: calleeIdVal,
        },
        schema: CallHandler.SCHEMA.timeout,
      });
      // stop own ringing
      SocketHandler.sendSocketMessage({
        flag: CallHandler.FLAGS.SELF_STOP_RING,
        payload: { to: callerIdVal, calleeId: callerIdVal },
        schema: CallHandler.SCHEMA.selfStop,
      });
      CallHandler.dipatchUI("caller:terminated", "timeout", {
        callerId: callerIdVal,
        calleeId: calleeIdVal,
      });
      DebugLogger.addLog(
        "terminated",
        "NOTICE",
        "_initiateCall",
        "No answer (timeout)"
      );
    }, CallHandler._ringTimeoutMs);

    DebugLogger.addLog(
      "calling",
      "NOTICE",
      "_initiateCall",
      `calling (${mediaType})`
    );
  }

  static handleAcceptClick() {
    DebugLogger.addLog("receiving call", "NOTICE", "handleAcceptClick", "UI click: Accept");
    console.log("[CallHandler] UI click: Accept");

    if (!CallHandler._els.currentUserId) {
      console.log("[CallHandler] currentUserId input missing");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing your ID"
      );
      return;
    }
    if (!CallHandler._els.targetUserId) {
      console.log("[CallHandler] targetUserId input missing");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing target/caller ID"
      );
      return;
    }
    if (!CallHandler._els.callType) {
      console.log("[CallHandler] callType select missing");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing call type"
      );
      return;
    }
    if (!CallHandler._els.role) {
      console.log("[CallHandler] role select missing");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing role"
      );
      return;
    }

    const callTypeVal = CallHandler._els.callType.value;
    const calleeRole = CallHandler._els.role.value;
    const calleeIdVal = CallHandler._els.currentUserId.value; // receiver (this device user)
    const callerIdVal = CallHandler._els.targetUserId.value; // the original caller (from your input for this demo)

    console.log("[CallHandler] values", {
      callTypeVal,
      calleeRole,
      callerIdVal,
      calleeIdVal,
    });

    if (callTypeVal !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant call; accept aborted");
      DebugLogger.addLog(
        "accepted call",
        "NOTICE",
        "handleAcceptClick",
        "Instant one-on-one only"
      );
      return;
    }
    if (callerIdVal === undefined || callerIdVal === "") {
      console.log("[CallHandler] missing callerId");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing callerId"
      );
      return;
    }
    if (calleeIdVal === undefined || calleeIdVal === "") {
      console.log("[CallHandler] missing calleeId");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing calleeId"
      );
      return;
    }
    if (calleeRole === undefined || calleeRole === "") {
      console.log("[CallHandler] missing callee role");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing role"
      );
      return;
    }

    if (CallHandler._invite.callerRole === null) {
      console.log("[CallHandler] missing stored callerRole from invite");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAcceptClick",
        "Missing caller role from invite"
      );
      return;
    }

    // Validate user data before accepting call
    const currentUserData = CallHandler._invite.calleeData || window.mockCallData?.currentUser;
    const targetUserData = CallHandler._invite.callerData || window.mockCallData?.targetUser;
    if (!CallHandler.validateUserData(currentUserData, "Current user (callee) data")) return;
    if (!CallHandler.validateUserData(targetUserData, "Target user (caller) data")) return;

    // Clear callee's ring timer since we're accepting
    CallHandler.clearCalleeRingTimer();

    // Set current side to callee
    CallHandler._currentSide = "callee";
    
    // Reset chimeHandler alerts for new call
    if (typeof chimeHandler !== 'undefined') {
      chimeHandler._hasShownJoinedAlert = false;
      chimeHandler._hasShownConnectedAlert = false;
      chimeHandler._hasShownInCallAlert = false;
    }
    
    // 🔔 UI (callee) → IMMEDIATELY show accepted state
    console.log('[CallHandler] [Callee] 📺 Showing callAccepted IMMEDIATELY');
    CallHandler.dipatchUI("callee:callAccepted", "none", {
      callerId: callerIdVal,
      calleeId: calleeIdVal,
      role: calleeRole,
    });
    CallHandler._inCallOrConnecting = true;

    console.log("[CallHandler] SELF_STOP_RING to callee (all devices)");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.SELF_STOP_RING,
      payload: { to: calleeIdVal, calleeId: calleeIdVal },
      schema: CallHandler.SCHEMA.selfStop,
    });

    console.log("[CallHandler] CALL_ACCEPTED to caller");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_ACCEPTED,
      payload: {
        to: callerIdVal,
        callerId: callerIdVal,
        calleeId: calleeIdVal,
      },
      schema: CallHandler.SCHEMA.accept,
    });

    console.log("[CallHandler] local dispatch CALL_ACCEPTED");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_ACCEPTED, {
        detail: { callerId: callerIdVal, calleeId: calleeIdVal },
      })
    );

    DebugLogger.addLog("accepted call", "NOTICE", "handleAcceptClick", "Call accepted");
    DebugLogger.addLog("setuping up", "NOTICE", "handleAcceptClick", "Step 1: Creating meeting...");

    // Orchestrate cam/mic permissions for callee based on call type
    console.log('[CallHandler] [Callee] [FIX v1.1] Orchestrating cam/mic permissions');
    
    const mediaType = window.mockCallData?.mediaType || CallHandler._invite?.callType || 'video';
    const isVideoCall = mediaType === 'video';
    console.log('[CallHandler] [Callee] [FIX v1.1] Media type:', mediaType, 'isVideoCall:', isVideoCall);
    
    // Listen for when browser will prompt (shows UI BEFORE browser freezes)
    const onShowWaiting = (ev) => {
      console.log('[CallHandler] [Callee] [FIX v1.1] ⏳ CamMic:UI:ShowWaiting received - showing waiting UI NOW');
      console.log('[CallHandler] [Callee] [FIX v1.1] Event detail:', ev.detail);
      CallHandler.dipatchUI("callee:waitingForCamMicPermissions", "none", {
        callerId: callerIdVal,
        calleeId: calleeIdVal,
        role: calleeRole,
      });
      console.log('[CallHandler] [Callee] [FIX v1.1] ✅ UI transitioned to callee:waitingForCamMicPermissions');
    };
    
    // Listen for permissions resolved
    const onPermissionsResolved = (ev) => {
      const detail = ev.detail || {};
      console.log('[CallHandler] [Callee] [FIX v1.1] 📺 CamMic:UI:PermissionsResolved received:', detail);
      
      // If we were in waiting state, return to callAccepted
      if (CallHandler._currentUIState === 'callee:waitingForCamMicPermissions') {
        console.log('[CallHandler] [Callee] [FIX v1.1] 📺 Current state is waitingForCamMicPermissions - returning to callAccepted');
        CallHandler.dipatchUI("callee:callAccepted", "none", {
          callerId: callerIdVal,
          calleeId: calleeIdVal,
          role: calleeRole,
        });
        console.log('[CallHandler] [Callee] [FIX v1.1] ✅ UI transitioned back to callee:callAccepted');
      } else {
        console.log('[CallHandler] [Callee] [FIX v1.1] ⏭️ Current state is NOT waitingForCamMicPermissions, skipping UI change. Current state:', CallHandler._currentUIState);
      }
    };
    
    if (isVideoCall) {
      // Video call: orchestrate both with no preview
      console.log('[CallHandler] [Callee] [FIX v1.1] Video call - orchestrating both (no preview)');
      
      // Use a callback pattern to wait for orchestration completion
      const onAcceptComplete = (ev) => {
        console.log('[CallHandler] [Callee] [FIX v1.1] 🔔 CamMic:Orchestrate:Complete received');
        window.removeEventListener('CamMic:Orchestrate:Complete', onAcceptComplete);
        window.removeEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
        window.removeEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
        console.log('[CallHandler] [Callee] [FIX v1.1] 🧹 Removed all event listeners');
        
        const detail = ev.detail || {};
        console.log('[CallHandler] [Callee] [FIX v1.1] CamMic orchestration complete:', detail);
        
        // Check permission states
        const camera = detail.permissions?.camera || 'unknown';
        const microphone = detail.permissions?.microphone || 'unknown';
        
        console.log('[CallHandler] [Callee] [FIX v1.1] Permission states:', { camera, microphone });
        console.log('[CallHandler] [Callee] [FIX v1.1] Current UI state:', CallHandler._currentUIState);
        
        // If permissions denied, show error and stay waiting
        if (camera === 'denied' || microphone === 'denied') {
          console.log('[CallHandler] [Callee] [FIX v1.1] ❌ Permissions denied - keeping waiting UI');
          alert('❌ Camera/Microphone access denied. Please enable permissions in browser settings and try again.');
          // Stay in permission waiting state (UI already showing)
          return;
        }
        
        // If permissions granted, proceed
        if (camera === 'granted' && microphone === 'granted') {
          console.log('[CallHandler] [Callee] [FIX v1.1] ✅ Both permissions granted');
          console.log('[CallHandler] [Callee] [FIX v1.1] Current UI state before continueAcceptFlow:', CallHandler._currentUIState);
          
          // If we never showed waiting UI, we're still in callAccepted - that's correct!
          if (CallHandler._currentUIState === 'callee:waitingForCamMicPermissions') {
            console.log('[CallHandler] [Callee] [FIX v1.1] ⚠️ Still in waitingForCamMicPermissions - onPermissionsResolved should have handled this');
          } else {
            console.log('[CallHandler] [Callee] [FIX v1.1] ✅ Still in callAccepted (never showed waiting UI) - correct behavior!');
          }
          
          // Continue with accept flow (stays in callAccepted if we never showed waiting)
          continueAcceptFlow();
          return;
        }
        
        // Unknown state - show warning but proceed
        console.warn('[CallHandler] [Callee] [FIX v1.1] ⚠️ Unknown permission state - proceeding anyway');
        alert('⚠️ Unable to verify camera/microphone permissions. Call may not work properly.');
        continueAcceptFlow();
      };
      
      // Listen for UI events (NEW system)
      console.log('[CallHandler] [Callee] [FIX v1.1] 📡 Registering listeners: CamMic:UI:ShowWaiting, CamMic:UI:PermissionsResolved, CamMic:Orchestrate:Complete');
      window.addEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
      window.addEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
      
      // Listen for orchestration completion
      window.addEventListener('CamMic:Orchestrate:Complete', onAcceptComplete);
      console.log('[CallHandler] [Callee] [FIX v1.1] ✅ All listeners registered');
      
      // Start orchestration
      console.log('[CallHandler] [Callee] [FIX v1.1] 🚀 Dispatching CamMic:Orchestrate:Both:NoPreview');
      window.dispatchEvent(new CustomEvent('CamMic:Orchestrate:Both:NoPreview'));
      console.log('[CallHandler] [Callee] [FIX v1.1] ✅ Orchestration started - waiting for events...');
      
    } else {
      // Audio call: orchestrate microphone only
      console.log('[CallHandler] [Callee] [FIX v1.1] Audio call - orchestrating microphone only');
      
      // Use a callback pattern to wait for orchestration completion
      const onAcceptComplete = (ev) => {
        console.log('[CallHandler] [Callee] [FIX v1.1] 🔔 CamMic:Orchestrate:Complete received (audio)');
        window.removeEventListener('CamMic:Orchestrate:Complete', onAcceptComplete);
        window.removeEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
        window.removeEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
        console.log('[CallHandler] [Callee] [FIX v1.1] 🧹 Removed all event listeners (audio)');
        
        const detail = ev.detail || {};
        console.log('[CallHandler] [Callee] [FIX v1.1] Mic orchestration complete:', detail);
        
        // Check permission states
        const microphone = detail.permissions?.microphone || 'unknown';
        
        console.log('[CallHandler] [Callee] [FIX v1.1] Microphone permission state:', microphone);
        console.log('[CallHandler] [Callee] [FIX v1.1] Current UI state:', CallHandler._currentUIState);
        
        // If permission denied, show error and stay waiting
        if (microphone === 'denied') {
          console.log('[CallHandler] [Callee] [FIX v1.1] ❌ Microphone denied - keeping waiting UI');
          alert('❌ Microphone access denied. Please enable permissions in browser settings and try again.');
          // Stay in permission waiting state (UI already showing)
          return;
        }
        
        // If permission granted, proceed
        if (microphone === 'granted') {
          console.log('[CallHandler] [Callee] [FIX v1.1] ✅ Microphone permission granted');
          console.log('[CallHandler] [Callee] [FIX v1.1] Current UI state before continueAcceptFlow:', CallHandler._currentUIState);
          
          // If we never showed waiting UI, we're still in callAccepted - that's correct!
          if (CallHandler._currentUIState === 'callee:waitingForCamMicPermissions') {
            console.log('[CallHandler] [Callee] [FIX v1.1] ⚠️ Still in waitingForCamMicPermissions - onPermissionsResolved should have handled this');
          } else {
            console.log('[CallHandler] [Callee] [FIX v1.1] ✅ Still in callAccepted (never showed waiting UI) - correct behavior!');
          }
          
          // Continue with accept flow (stays in callAccepted if we never showed waiting)
          continueAcceptFlow();
          return;
        }
        
        // Unknown state - show warning but proceed
        console.warn('[CallHandler] [Callee] [FIX v1.1] ⚠️ Unknown microphone permission state - proceeding anyway');
        alert('⚠️ Unable to verify microphone permissions. Call may not work properly.');
        continueAcceptFlow();
      };
      
      // Listen for UI events (NEW system)
      console.log('[CallHandler] [Callee] [FIX v1.1] 📡 Registering listeners (audio): CamMic:UI:ShowWaiting, CamMic:UI:PermissionsResolved, CamMic:Orchestrate:Complete');
      window.addEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
      window.addEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
      
      // Listen for orchestration completion
      window.addEventListener('CamMic:Orchestrate:Complete', onAcceptComplete);
      console.log('[CallHandler] [Callee] [FIX v1.1] ✅ All listeners registered (audio)');
      
      // Start orchestration
      console.log('[CallHandler] [Callee] [FIX v1.1] 🚀 Dispatching CamMic:Orchestrate:Microphone');
      window.dispatchEvent(new CustomEvent('CamMic:Orchestrate:Microphone'));
      console.log('[CallHandler] [Callee] [FIX v1.1] ✅ Orchestration started (audio) - waiting for events...');
    }
    
    // Return early - the rest of the accept flow will run in continueAcceptFlow()
    console.log('[CallHandler] [Callee] [FIX v1.1] ⏸️ Returning early - accept flow will continue in continueAcceptFlow()');
    return;
    
    // Helper function to continue accept flow after CamMic orchestration
    function continueAcceptFlow() {
      console.log('[CallHandler] [Callee] 🎬 Continuing accept flow after CamMic orchestration (meeting setup)');

    console.log("[CallHandler] meeting ops begin");
    
    // Notify caller: Starting DB creation
    SocketHandler.sendSocketMessage({
      flag: "meeting:status",
      payload: {
        to: callerIdVal,
        status: "creating_db",
        message: "Creating meeting in database...",
      },
    });
    
    CallHandler.getMeetingID(calleeIdVal, calleeRole)
      .then((meetingId) => {
        console.log("[CallHandler] DB meeting id", meetingId);
        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "handleAcceptClick",
          "Step 2: Creating Chime meeting & requesting permissions..."
        );
        
        // Notify caller: DB created, creating Chime
        SocketHandler.sendSocketMessage({
          flag: "meeting:status",
          payload: {
            to: callerIdVal,
            status: "creating_chime",
            message: "Database meeting created. Creating Chime meeting...",
            meetingId: meetingId,
          },
        });
        
        // Check if we need to request permissions now or wait for manual join
        const mediaType = CallHandler._invite.callType || "video";
        if (CallHandler.CALLEE_MANUAL_JOIN_ENABLED) {
          // Manual join: don't request permissions now, wait for Join button click
          return CallHandler.createChimeMeeting(meetingId, calleeIdVal, calleeRole)
            .then((chimeData) => ({ meetingId, chimeId: chimeData.chimeMeetingId, fullMeeting: chimeData.fullMeeting }));
        } else {
          // Auto-join: request permissions now
          return Promise.all([
            CallHandler.createChimeMeeting(meetingId, calleeIdVal, calleeRole),
            CallHandler.ensureCamMicReady(mediaType)
          ]).then(([chimeData]) => ({ meetingId, chimeId: chimeData.chimeMeetingId, fullMeeting: chimeData.fullMeeting }));
        }
      })
      .then(({ meetingId, chimeId, fullMeeting }) => {
        console.log("[CallHandler] MEETING_READY to caller (with roles)", {
          meetingId,
          callerRole: CallHandler._invite.callerRole,
          calleeRole,
        });

        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "handleAcceptClick",
          "Step 3: Permissions granted. Notifying caller..."
        );
        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "handleAcceptClick",
          `Sending to caller: DB ID = ${meetingId}, Chime ID = ${chimeId}`
        );

        SocketHandler.sendSocketMessage({
          flag: CallHandler.FLAGS.MEETING_READY,
          payload: {
            to: CallHandler._invite.callerId || callerIdVal,
            meetingId,
            callerId: callerIdVal,
            calleeId: calleeIdVal,
            callerRole: CallHandler._invite.callerRole,
            calleeRole,
            chimeMeetingId: chimeId,
            dbMeetingId: meetingId,
          },
          schema: CallHandler.SCHEMA.meetingReady,
        });

        // 🔔 UI (callee) → check if manual join is enabled
        if (CallHandler.CALLEE_MANUAL_JOIN_ENABLED) {
          // Callee needs to manually click Join to join with cam/mic
          CallHandler.dipatchUI("callee:connected", "none", {
            meetingId,
            userId: calleeIdVal,
            role: calleeRole,
          });
          
          // Store join info for when the Join button is clicked
          CallHandler._pendingCalleeJoin = {
            meetingId,
            calleeId: calleeIdVal,
            calleeRole,
            chimeId,
            callType: CallHandler._invite.callType,
            fullMeeting,
          };
        } else {
          // Auto-join like before
          DebugLogger.addLog(
            "connecting",
            "NOTICE",
            "handleAcceptClick",
            "Step 4: Joining meeting..."
          );
          console.log(
            "[CallHandler] callee joinChimeMeeting with role",
            calleeRole
          );
          return CallHandler.joinChimeMeeting(
            meetingId,
            calleeIdVal,
            calleeRole,
            chimeId,
            CallHandler._invite.callType,
            fullMeeting
          ).then(() => {
            console.log("[CallHandler] dispatch MEETING_CONNECT (callee)");
            document.dispatchEvent(
              new CustomEvent(CallHandler.FLAGS.MEETING_CONNECT, {
                detail: {
                  meetingId,
                  userId: calleeIdVal,
                  role: calleeRole,
                  chimeMeetingId: chimeId,
                },
              })
            );
          });
        }
      })
      .catch((err) => {
        console.error("[CallHandler] callee meeting flow error", err);
        CallHandler._inCallOrConnecting = false; // Reset so user can try again
        CallHandler.dipatchUI("callee:terminated", "error", {
          message: err && err.message ? err.message : "Unknown error",
        });
        DebugLogger.addLog(
          "terminated",
          "CRITICAL",
          "handleAcceptClick",
          `Meeting Error: ${err && err.message ? err.message : "Unknown error"}`
        );
        SocketHandler.sendSocketMessage({
          flag: CallHandler.FLAGS.MEETING_PROBLEM,
          payload: {
            to: callerIdVal,
            meetingId: "unknown",
            callerId: callerIdVal,
            calleeId: calleeIdVal,
            message: err && err.message ? err.message : "Unknown error",
          },
          schema: CallHandler.SCHEMA.meetingProblem,
        });
      });
    } // End of continueAcceptFlow function
  }

  static handleRejectClick() {
    DebugLogger.addLog("receiving call", "NOTICE", "handleRejectClick", "UI click: Reject");
    console.log("[CallHandler] UI click: Reject");

    if (!CallHandler._els.currentUserId) {
      console.log("[CallHandler] currentUserId input missing");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleRejectClick",
        "Missing your ID"
      );
      return;
    }
    if (!CallHandler._els.targetUserId) {
      console.log("[CallHandler] targetUserId input missing");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleRejectClick",
        "Missing target/caller ID"
      );
      return;
    }
    if (!CallHandler._els.callType) {
      console.log("[CallHandler] callType select missing");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleRejectClick",
        "Missing call type"
      );
      return;
    }
    if (!CallHandler._els.rejectReason) {
      console.log("[CallHandler] rejectReason select missing");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleRejectClick",
        "Missing reject reason"
      );
      return;
    }

    const callTypeVal = CallHandler._els.callType.value;
    const reasonVal = CallHandler._els.rejectReason.value;
    const calleeIdVal = CallHandler._els.currentUserId.value;
    const callerIdVal = CallHandler._els.targetUserId.value;

    console.log("[CallHandler] values", {
      callTypeVal,
      reasonVal,
      callerIdVal,
      calleeIdVal,
    });

    if (callTypeVal !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant call; reject aborted");
      DebugLogger.addLog(
        "rejected",
        "NOTICE",
        "handleRejectClick",
        "Instant one-on-one only"
      );
      return;
    }
    if (callerIdVal === undefined || callerIdVal === "") {
      console.log("[CallHandler] missing callerId");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleRejectClick",
        "Missing callerId"
      );
      return;
    }
    if (calleeIdVal === undefined || calleeIdVal === "") {
      console.log("[CallHandler] missing calleeId");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleRejectClick",
        "Missing calleeId"
      );
      return;
    }
    if (reasonVal === undefined || reasonVal === "") {
      console.log("[CallHandler] missing reason");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleRejectClick",
        "Select a reject reason"
      );
      return;
    }

    console.log("[CallHandler] SELF_STOP_RING to callee");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.SELF_STOP_RING,
      payload: { to: calleeIdVal, calleeId: calleeIdVal },
      schema: CallHandler.SCHEMA.selfStop,
    });

    console.log("[CallHandler] CALL_DECLINED to caller");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_DECLINED,
      payload: {
        to: callerIdVal,
        callerId: callerIdVal,
        calleeId: calleeIdVal,
        reason: reasonVal,
      },
      schema: CallHandler.SCHEMA.decline,
    });

    console.log("[CallHandler] local dispatch CALL_DECLINED");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_DECLINED, {
        detail: {
          callerId: callerIdVal,
          calleeId: calleeIdVal,
          reason: reasonVal,
        },
      })
    );

    // 🔔 UI (callee) → rejected
    CallHandler.dipatchUI("callee:rejected", "none", {
      callerId: callerIdVal,
      calleeId: calleeIdVal,
      reason: reasonVal,
    });

    DebugLogger.addLog("rejected", "NOTICE", "handleRejectClick", "Rejected with answer");
  }

  static handleCancelClick() {
    DebugLogger.addLog("calling", "NOTICE", "handleCancelClick", "UI click: Cancel");
    console.log("[CallHandler] UI click: Cancel");

    if (!CallHandler._els.currentUserId) {
      console.log("[CallHandler] currentUserId input missing");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleCancelClick",
        "Missing your ID"
      );
      return;
    }
    if (!CallHandler._els.targetUserId) {
      console.log("[CallHandler] targetUserId input missing");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleCancelClick",
        "Missing target user ID"
      );
      return;
    }
    if (!CallHandler._els.callType) {
      console.log("[CallHandler] callType select missing");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleCancelClick",
        "Missing call type"
      );
      return;
    }

    const callTypeVal = CallHandler._els.callType.value;
    const callerIdVal = CallHandler._els.currentUserId.value;
    const calleeIdVal = CallHandler._els.targetUserId.value;

    console.log("[CallHandler] values", {
      callTypeVal,
      callerIdVal,
      calleeIdVal,
    });

    if (callTypeVal !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant call; cancel aborted");
      DebugLogger.addLog(
        "terminated",
        "NOTICE",
        "handleCancelClick",
        "Instant one-on-one only"
      );
      return;
    }
    if (callerIdVal === undefined || callerIdVal === "") {
      console.log("[CallHandler] missing callerId");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleCancelClick",
        "Missing callerId"
      );
      return;
    }
    if (calleeIdVal === undefined || calleeIdVal === "") {
      console.log("[CallHandler] missing calleeId");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleCancelClick",
        "Missing calleeId"
      );
      return;
    }

    console.log("[CallHandler] CALL_CANCELLED to callee");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_CANCELLED,
      payload: {
        to: calleeIdVal,
        callerId: callerIdVal,
        calleeId: calleeIdVal,
      },
      schema: CallHandler.SCHEMA.cancel,
    });

    console.log("[CallHandler] local dispatch CALL_CANCELLED");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_CANCELLED, {
        detail: { callerId: callerIdVal, calleeId: calleeIdVal },
      })
    );

    // 🔔 UI (caller) → cancelled
    CallHandler.dipatchUI("caller:terminated", "cancelled", {
      callerId: callerIdVal,
      calleeId: calleeIdVal,
    });

    DebugLogger.addLog("terminated", "NOTICE", "handleCancelClick", "Call cancelled");
  }

  /* ===========================
   * APP DISPATCH (optional)
   * ========================= */
  static handleAppStartCall(e) {
    console.log("[CallHandler] app:call:start", e);
    const d = e && e.detail ? e.detail : undefined;
    if (!d) {
      console.log("[CallHandler] app:call:start missing detail");
      DebugLogger.addLog("calling", "CRITICAL", "handleAppStartCall", "Missing payload");
      return;
    }

    const callerId = d.callerId;
    const calleeId = d.calleeId;
    const callerRole = d.role;
    const callType = d.callType;

    if (callType !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant app start");
      DebugLogger.addLog(
        "calling",
        "NOTICE",
        "handleAppStartCall",
        "Instant one-on-one only"
      );
      return;
    }
    if (callerId === undefined || callerId === "") {
      console.log("[CallHandler] app start missing callerId");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleAppStartCall",
        "Missing callerId"
      );
      return;
    }
    if (calleeId === undefined || calleeId === "") {
      console.log("[CallHandler] app start missing calleeId");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleAppStartCall",
        "Missing calleeId"
      );
      return;
    }
    if (callerRole === undefined || callerRole === "") {
      console.log("[CallHandler] app start missing role");
      DebugLogger.addLog(
        "calling",
        "CRITICAL",
        "handleAppStartCall",
        "Missing role"
      );
      return;
    }

    console.log("[CallHandler] dispatch call:initiate");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_INITIATE, {
        detail: { callerId, calleeId, type: callType, role: callerRole },
      })
    );

    console.log("[CallHandler] socket CALL_INITIATE");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_INITIATE,
      payload: { to: calleeId, callType, callerId, calleeId, role: callerRole },
      schema: CallHandler.SCHEMA.initiate,
    });

    // Set current side to caller
    CallHandler._currentSide = "caller";
    
    // Reset chimeHandler alerts for new call
    if (typeof chimeHandler !== 'undefined') {
      chimeHandler._hasShownJoinedAlert = false;
      chimeHandler._hasShownConnectedAlert = false;
      chimeHandler._hasShownInCallAlert = false;
    }
    
    // 🔔 UI (caller) → calling
    CallHandler.dipatchUI("caller:callWaiting", "none", {
      callerId,
      calleeId,
      role: callerRole,
    });

    // ⏲️ caller-side 25s timeout
    CallHandler.clearCallerRingTimer();
    CallHandler._callerRingTimerId = setTimeout(() => {
      console.log(
        "[CallHandler] CALLER ring timeout (app) → notify callee + end locally"
      );
      SocketHandler.sendSocketMessage({
        flag: CallHandler.FLAGS.CALL_TIMEOUT,
        payload: { to: calleeId, callerId, calleeId },
        schema: CallHandler.SCHEMA.timeout,
      });
      SocketHandler.sendSocketMessage({
        flag: CallHandler.FLAGS.SELF_STOP_RING,
        payload: { to: callerId, calleeId: callerId },
        schema: CallHandler.SCHEMA.selfStop,
      });
      CallHandler.dipatchUI("caller:terminated", "timeout", {
        callerId,
        calleeId,
      });
      DebugLogger.addLog(
        "terminated",
        "NOTICE",
        "handleAppStartCall",
        "No answer (timeout)"
      );
    }, CallHandler._ringTimeoutMs);

    DebugLogger.addLog("calling", "NOTICE", "handleAppStartCall", "Calling...");
  }

  static handleAppAcceptCall(e) {
    console.log("[CallHandler] app:call:accept", e);
    const d = e && e.detail ? e.detail : undefined;
    if (!d) {
      console.log("[CallHandler] app:call:accept missing detail");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAppAcceptCall",
        "Missing payload"
      );
      return;
    }

    const callerId = d.callerId;
    const calleeId = d.calleeId;
    const calleeRole = d.role;
    const callType = d.callType;

    if (callType !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant accept");
      DebugLogger.addLog(
        "accepted call",
        "NOTICE",
        "handleAppAcceptCall",
        "Instant one-on-one only"
      );
      return;
    }
    if (callerId === undefined || callerId === "") {
      console.log("[CallHandler] accept missing callerId");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAppAcceptCall",
        "Missing callerId"
      );
      return;
    }
    if (calleeId === undefined || calleeId === "") {
      console.log("[CallHandler] accept missing calleeId");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAppAcceptCall",
        "Missing calleeId"
      );
      return;
    }
    if (calleeRole === undefined || calleeRole === "") {
      console.log("[CallHandler] accept missing role");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAppAcceptCall",
        "Missing role"
      );
      return;
    }
    if (CallHandler._invite.callerRole === null) {
      console.log("[CallHandler] missing stored callerRole from invite");
      DebugLogger.addLog(
        "accepted call",
        "CRITICAL",
        "handleAppAcceptCall",
        "Missing caller role from invite"
      );
      return;
    }

    // Set current side to callee
    CallHandler._currentSide = "callee";
    
    // 🔔 UI (callee) → accepted call
    CallHandler.dipatchUI("callee:callAccepted", "none", {
      callerId,
      calleeId,
      role: calleeRole,
    });

    console.log("[CallHandler] SELF_STOP_RING to callee");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.SELF_STOP_RING,
      payload: { to: calleeId, calleeId },
      schema: CallHandler.SCHEMA.selfStop,
    });

    console.log("[CallHandler] CALL_ACCEPTED to caller");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_ACCEPTED,
      payload: { to: callerId, callerId, calleeId },
      schema: CallHandler.SCHEMA.accept,
    });

    console.log("[CallHandler] local dispatch CALL_ACCEPTED");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_ACCEPTED, {
        detail: { callerId, calleeId },
      })
    );

    DebugLogger.addLog("accepted call", "NOTICE", "handleAppAcceptCall", "Call accepted");
    DebugLogger.addLog(
      "setuping up",
      "NOTICE",
      "handleAppAcceptCall",
      "Step 1: Creating meeting in database..."
    );

    console.log("[CallHandler] meeting ops begin");
    
    // Notify caller: Starting DB creation
    SocketHandler.sendSocketMessage({
      flag: "meeting:status",
      payload: {
        to: callerId,
        status: "creating_db",
        message: "Creating meeting in database...",
      },
    });
    
    CallHandler.getMeetingID(calleeId, calleeRole)
      .then((meetingId) => {
        console.log("[CallHandler] DB meeting id", meetingId);
        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "handleAppAcceptCall",
          "Step 2: Creating Chime meeting & requesting permissions..."
        );
        
        // Notify caller: DB created, creating Chime
        SocketHandler.sendSocketMessage({
          flag: "meeting:status",
          payload: {
            to: callerId,
            status: "creating_chime",
            message: "Database meeting created. Creating Chime meeting...",
            meetingId: meetingId,
          },
        });
        
        // Check if we need to request permissions now or wait for manual join
        const mediaType = CallHandler._invite.callType || "video";
        if (CallHandler.CALLEE_MANUAL_JOIN_ENABLED) {
          // Manual join: don't request permissions now, wait for Join button click
          return CallHandler.createChimeMeeting(meetingId, calleeId, calleeRole)
            .then((chimeData) => ({ meetingId, chimeId: chimeData.chimeMeetingId, fullMeeting: chimeData.fullMeeting }));
        } else {
          // Auto-join: request permissions now
          return Promise.all([
            CallHandler.createChimeMeeting(meetingId, calleeId, calleeRole),
            CallHandler.ensureCamMicReady(mediaType)
          ]).then(([chimeData]) => ({ meetingId, chimeId: chimeData.chimeMeetingId, fullMeeting: chimeData.fullMeeting }));
        }
      })
      .then(({ meetingId, chimeId, fullMeeting }) => {
        console.log("[CallHandler] MEETING_READY to caller (with roles)", {
          meetingId,
          callerRole: CallHandler._invite.callerRole,
          calleeRole,
        });

        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "handleAppAcceptCall",
          "Step 3: Meeting created. Notifying caller..."
        );
        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "handleAppAcceptCall",
          `Sending to caller: DB ID = ${meetingId}, Chime ID = ${chimeId}`
        );

        SocketHandler.sendSocketMessage({
          flag: CallHandler.FLAGS.MEETING_READY,
          payload: {
            to: callerId,
            meetingId,
            callerId,
            calleeId,
            callerRole: CallHandler._invite.callerRole,
            calleeRole,
            chimeMeetingId: chimeId,
            dbMeetingId: meetingId,
          },
          schema: CallHandler.SCHEMA.meetingReady,
        });

        // 🔔 UI (callee) → check if manual join is enabled
        if (CallHandler.CALLEE_MANUAL_JOIN_ENABLED) {
          // Callee needs to manually click Join to join with cam/mic
          CallHandler.dipatchUI("callee:connected", "none", {
            meetingId,
            userId: calleeId,
            role: calleeRole,
          });
          
          // Store join info for when the Join button is clicked
          CallHandler._pendingCalleeJoin = {
            meetingId,
            calleeId: calleeId,
            calleeRole,
            chimeId,
            callType: CallHandler._invite.callType,
            fullMeeting,
          };
        } else {
          // Auto-join like before
          DebugLogger.addLog(
            "connecting",
            "NOTICE",
            "handleAppAcceptCall",
            "Step 4: Joining meeting..."
          );
          console.log(
            "[CallHandler] callee joinChimeMeeting with role",
            calleeRole
          );
          return CallHandler.joinChimeMeeting(
            meetingId,
            calleeId,
            calleeRole,
            chimeId,
            CallHandler._invite.callType,
            fullMeeting
          ).then(() => {
            console.log("[CallHandler] dispatch MEETING_CONNECT (callee)");
            document.dispatchEvent(
              new CustomEvent(CallHandler.FLAGS.MEETING_CONNECT, {
                detail: {
                  meetingId,
                  userId: calleeId,
                  role: calleeRole,
                  chimeMeetingId: chimeId,
                },
              })
            );
          });
        }
      })
      .catch((err) => {
        console.error("[CallHandler] callee meeting flow error", err);
        CallHandler._inCallOrConnecting = false; // Reset so user can try again
        CallHandler.dipatchUI("callee:terminated", "error", {
          message: err && err.message ? err.message : "Unknown error",
        });
        DebugLogger.addLog(
          "terminated",
          "CRITICAL",
          "handleAppAcceptCall",
          `Meeting Error: ${err && err.message ? err.message : "Unknown error"}`
        );
        SocketHandler.sendSocketMessage({
          flag: CallHandler.FLAGS.MEETING_PROBLEM,
          payload: {
            to: callerId,
            meetingId: "unknown",
            callerId,
            calleeId,
            message: err && err.message ? err.message : "Unknown error",
          },
          schema: CallHandler.SCHEMA.meetingProblem,
        });
      });
  }

  static handleAppRejectCall(e) {
    console.log("[CallHandler] app:call:reject", e);
    const d = e && e.detail ? e.detail : undefined;
    if (!d) {
      console.log("[CallHandler] app:call:reject missing detail");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleAppRejectCall",
        "Missing payload"
      );
      return;
    }

    const callerId = d.callerId;
    const calleeId = d.calleeId;
    const reason = d.reason;
    const callType = d.callType;

    if (callType !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant reject");
      DebugLogger.addLog(
        "rejected",
        "NOTICE",
        "handleAppRejectCall",
        "Instant one-on-one only"
      );
      return;
    }
    if (callerId === undefined || callerId === "") {
      console.log("[CallHandler] reject missing callerId");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleAppRejectCall",
        "Missing callerId"
      );
      return;
    }
    if (calleeId === undefined || calleeId === "") {
      console.log("[CallHandler] reject missing calleeId");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleAppRejectCall",
        "Missing calleeId"
      );
      return;
    }
    if (reason === undefined || reason === "") {
      console.log("[CallHandler] reject missing reason");
      DebugLogger.addLog(
        "rejected",
        "CRITICAL",
        "handleAppRejectCall",
        "Missing reason"
      );
      return;
    }

    console.log("[CallHandler] SELF_STOP_RING to callee");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.SELF_STOP_RING,
      payload: { to: calleeId, calleeId },
      schema: CallHandler.SCHEMA.selfStop,
    });

    console.log("[CallHandler] CALL_DECLINED to caller");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_DECLINED,
      payload: { to: callerId, callerId, calleeId, reason },
      schema: CallHandler.SCHEMA.decline,
    });

    console.log("[CallHandler] local dispatch CALL_DECLINED");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_DECLINED, {
        detail: { callerId, calleeId, reason },
      })
    );

    // 🔔 UI (callee) → rejected
    CallHandler.dipatchUI("callee:rejected", "none", {
      callerId,
      calleeId,
      reason,
    });

    DebugLogger.addLog(
      "rejected",
      "NOTICE",
      "handleAppRejectCall",
      "Rejected with answer"
    );
  }

  static handleAppCancelCall(e) {
    console.log("[CallHandler] app:call:cancel", e);
    const d = e && e.detail ? e.detail : undefined;
    if (!d) {
      console.log("[CallHandler] app:call:cancel missing detail");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleAppCancelCall",
        "Missing payload"
      );
      return;
    }

    const callerId = d.callerId;
    const calleeId = d.calleeId;
    const callType = d.callType;

    if (callType !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] non-instant cancel");
      DebugLogger.addLog(
        "terminated",
        "NOTICE",
        "handleAppCancelCall",
        "Instant one-on-one only"
      );
      return;
    }
    if (callerId === undefined || callerId === "") {
      console.log("[CallHandler] cancel missing callerId");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleAppCancelCall",
        "Missing callerId"
      );
      return;
    }
    if (calleeId === undefined || calleeId === "") {
      console.log("[CallHandler] cancel missing calleeId");
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleAppCancelCall",
        "Missing calleeId"
      );
      return;
    }

    console.log("[CallHandler] CALL_CANCELLED to callee");
    SocketHandler.sendSocketMessage({
      flag: CallHandler.FLAGS.CALL_CANCELLED,
      payload: { to: calleeId, callerId, calleeId },
      schema: CallHandler.SCHEMA.cancel,
    });

    console.log("[CallHandler] local dispatch CALL_CANCELLED");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_CANCELLED, {
        detail: { callerId, calleeId },
      })
    );

    // 🔔 UI (caller) → cancelled
    CallHandler.dipatchUI("caller:terminated", "cancelled", {
      callerId,
      calleeId,
    });

    DebugLogger.addLog(
      "terminated",
      "NOTICE",
      "handleAppCancelCall",
      "Call cancelled"
    );
  }

  /* ===========================
   * SOCKET EVENT HANDLERS
   * ========================= */
  static handleSocketIncomingCall(body) {
    DebugLogger.addLog("receiving call", "NOTICE", "handleSocketIncomingCall", "Incoming call from socket", body);
    console.log("[CallHandler] SOCKET call:incoming", body);
    if (!body) {
      console.log("[CallHandler] incoming missing body");
      return;
    }
    if (body.callType !== CallHandler.TYPE_INSTANT) {
      console.log("[CallHandler] ignore non-instant incoming");
      return;
    }
    if (body.callerId === undefined || body.callerId === "") {
      console.log("[CallHandler] incoming missing callerId");
      return;
    }
    if (body.calleeId === undefined || body.calleeId === "") {
      console.log("[CallHandler] incoming missing calleeId");
      return;
    }
    if (body.role === undefined || body.role === "") {
      console.log("[CallHandler] incoming missing callerRole");
      return;
    }

    // === Busy guard: if already in setup/connecting/connected, alert + auto-decline ===
    if (CallHandler._inCallOrConnecting === true) {
      DebugLogger.addLog(
        "receiving call",
        "NOTICE",
        "handleSocketIncomingCall",
        "Incoming call while in-call/connecting — auto-declining (kept current call)."
      );

      // Auto-decline new incoming without affecting current call
      SocketHandler.sendSocketMessage({
        flag: CallHandler.FLAGS.CALL_DECLINED,
        payload: {
          to: body.callerId,
          callerId: body.callerId,
          calleeId: body.calleeId,
          reason: "in_another_call",
        },
        schema: CallHandler.SCHEMA.decline,
      });

      // Don't dispatch UI change - just decline the new call silently
      // (keep current call active, don't show terminated state)
      console.log("[CallHandler] Auto-declined new incoming call (user already in a call)");
      return; // do not start a new ring timer or incoming UI
    }

    // NOTE: ON INCOMING, WE SOURCE TARGET/CALLER FROM SOCKET (NOT FROM INPUTS)
    CallHandler._invite.callerId = body.callerId;
    CallHandler._invite.calleeId = body.calleeId;
    CallHandler._invite.callerRole = body.role;
    CallHandler._invite.callType = body.mediaType || "video";
    CallHandler._invite.callerData = body.callerData || null;
    CallHandler._invite.calleeData = body.calleeData || null;
    
    // Populate mockCallData for the call
    if (window.mockCallData) {
      window.mockCallData.callType = body.callType || CallHandler.TYPE_INSTANT;
      window.mockCallData.mediaType = body.mediaType || "video";
      
      // For callee: body.role is the CALLER's role, we need the CALLEE's role
      // In one-on-one: if caller is host, callee is attendee (and vice versa)
      const calleeRole = body.role === 'host' ? 'attendee' : 'host';
      window.mockCallData.currentUserRole = calleeRole;
      window.mockCallData.currentUserSide = "callee";
      
      // Swap: current user is the callee, target user is the caller
      window.mockCallData.currentUser = body.calleeData || window.mockCallData.currentUser;
      window.mockCallData.targetUser = body.callerData || window.mockCallData.targetUser;
      
      console.log(`[CallHandler] [Callee] mockCallData populated - Caller role: ${body.role}, Callee role: ${calleeRole}`, window.mockCallData);
    }
    
    // Initialize CamMic permissions system for callee
    console.log('[CallHandler] [Callee] Initializing CamMic permissions system');
    window.dispatchEvent(new CustomEvent('CamMic:Init'));
    
    // Set current side to callee
    CallHandler._currentSide = "callee";
    
    // Reset chimeHandler alerts for new call
    if (typeof chimeHandler !== 'undefined') {
      chimeHandler._hasShownJoinedAlert = false;
      chimeHandler._hasShownConnectedAlert = false;
      chimeHandler._hasShownInCallAlert = false;
    }

    console.log("[CallHandler] dispatch LOCAL call:ringing");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_RINGING, {
        detail: { 
          callerId: body.callerId, 
          calleeId: body.calleeId,
          callerData: body.callerData,
          calleeData: body.calleeData,
        },
      })
    );

    // Reset UI state tracking for new incoming call
    CallHandler.resetUIState();
    
    // 🔔 UI (callee) → incoming - determine if audio or video call
    const mediaType = body.mediaType || "video";
    const incomingState = mediaType === "audio" ? "callee:incomingAudioCall" : "callee:incomingVideoCall";
    CallHandler.dipatchUI(incomingState, "none", {
      callerId: body.callerId,
      calleeId: body.calleeId,
      callerRole: body.role,
      callerData: body.callerData,
      calleeData: body.calleeData,
    });
    
    // Format caller details for logging
    const callerName = body.callerData?.displayName || body.callerData?.username || body.callerId;
    let callerDetailsStr = `User ID: ${body.callerId}`;
    if (body.callerData) {
      callerDetailsStr = [
        `Display Name: ${body.callerData.displayName}`,
        `Username: @${body.callerData.username}`,
        `User ID: ${body.callerData.userId}`,
        body.callerData.avatar ? `Avatar: ${body.callerData.avatar}` : null,
        `Initials: ${body.callerData.initials}`
      ].filter(Boolean).join(', ');
    }
    
    DebugLogger.addLog(
      "receiving call",
      "NOTICE",
      "handleSocketIncomingCall",
      `📞 ${callerName} is calling you for ${mediaType} call — Caller details: ${callerDetailsStr}`
    );

    // 25s TIMEOUT → ENDS FLOW FOR BOTH SIDES (callee side timer)
    CallHandler.clearCalleeRingTimer();
    console.log("[CallHandler] start ring timeout 25s (callee)");
    CallHandler._calleeRingTimerId = setTimeout(() => {
      // ...
    }, CallHandler._ringTimeoutMs);
  }

  static handleSocketAccepted(body) {
    DebugLogger.addLog("calling", "NOTICE", "handleSocketAccepted", "Call accepted by remote", body);
    console.log("[CallHandler] SOCKET call:accepted", body);
    if (!body) {
      console.log("[CallHandler] accepted missing body");
      return;
    }
    if (body.callerId === undefined || body.callerId === "") {
      console.log("[CallHandler] accepted missing callerId");
      return;
    }
    if (body.calleeId === undefined || body.calleeId === "") {
      console.log("[CallHandler] accepted missing calleeId");
      return;
    }

    // Clear caller's ring timer since call is accepted
    CallHandler.clearCallerRingTimer();
    
    // Set current side to caller
    CallHandler._currentSide = "caller";
    
    // Reset chimeHandler alerts for new call
    if (typeof chimeHandler !== 'undefined') {
      chimeHandler._hasShownJoinedAlert = false;
      chimeHandler._hasShownConnectedAlert = false;
      chimeHandler._hasShownInCallAlert = false;
    }

    // 🔔 UI (caller) → accepted call, setting up (waiting for meeting)
    CallHandler.dipatchUI("caller:callAccepted", "none", {
      callerId: body.callerId,
      calleeId: body.calleeId,
      side: "caller",
    });
    CallHandler._inCallOrConnecting = true; // NEW
    DebugLogger.addLog(
      "accepted call",
      "NOTICE",
      "handleSocketAccepted",
      "Call accepted"
    );
    DebugLogger.addLog(
      "setuping up",
      "NOTICE",
      "handleSocketAccepted",
      "Waiting for meetingID"
    );
  }

  static handleSocketDeclined(body) {
    DebugLogger.addLog("calling", "NOTICE", "handleSocketDeclined", "Call declined by remote", body);
    console.log("[CallHandler] SOCKET call:declined", body);
    if (!body) {
      console.log("[CallHandler] declined missing body");
      return;
    }
    if (body.callerId === undefined || body.callerId === "") {
      console.log("[CallHandler] declined missing callerId");
      return;
    }
    if (body.calleeId === undefined || body.calleeId === "") {
      console.log("[CallHandler] declined missing calleeId");
      return;
    }
    if (body.reason === undefined || body.reason === "") {
      console.log("[CallHandler] declined missing reason");
      return;
    }
    
    // Clear caller timer
    CallHandler.clearCallerRingTimer();
    
    DebugLogger.addLog(
      "declined",
      "NOTICE",
      "handleSocketDeclined",
      `Call declined - Reason: ${body.reason}`
    );
    console.log("[CallHandler] dispatch call:ended {reason:'declined'}");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_ENDED, {
        detail: {
          reason: "declined",
          callerId: body.callerId,
          calleeId: body.calleeId,
        },
      })
    );
    // 🔔 UI (caller) → declined
    CallHandler.dipatchUI("caller:declined", "none", {
      callerId: body.callerId,
      calleeId: body.calleeId,
      reason: body.reason,
    });
  }

  static handleSocketTimeout(body) {
    DebugLogger.addLog("terminated", "NOTICE", "handleSocketTimeout", "Call timed out", body);
    console.log("[CallHandler] SOCKET call:timeout", body);
    CallHandler.clearCallerRingTimer();
    CallHandler.clearCalleeRingTimer();
    CallHandler._inCallOrConnecting = false; // NEW

    DebugLogger.addLog(
      "terminated",
      "NOTICE",
      "handleSocketTimeout",
      "No answer (timeout)"
    );
    console.log("[CallHandler] dispatch call:ended {reason:'timeout'}");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_ENDED, {
        detail: {
          reason: "timeout",
          callerId: body ? body.callerId : undefined,
          calleeId: body ? body.calleeId : undefined,
        },
      })
    );
    // 🔔 UI (caller) → timeout
    CallHandler.dipatchUI("caller:terminated", "timeout", {
      callerId: body ? body.callerId : undefined,
      calleeId: body ? body.calleeId : undefined,
    });
  }

  static handleSocketCancelled(body) {
    DebugLogger.addLog("terminated", "NOTICE", "handleSocketCancelled", "Call cancelled by remote", body);
    console.log("[CallHandler] SOCKET call:cancelled", body);
    CallHandler.clearCallerRingTimer();
    CallHandler.clearCalleeRingTimer();
    DebugLogger.addLog(
      "terminated",
      "NOTICE",
      "handleSocketCancelled",
      "Caller cancelled"
    );
    console.log("[CallHandler] dispatch call:ended {reason:'hangup'}");
    document.dispatchEvent(
      new CustomEvent(CallHandler.FLAGS.CALL_ENDED, {
        detail: {
          reason: "hangup",
          callerId: body ? body.callerId : undefined,
          calleeId: body ? body.calleeId : undefined,
        },
      })
    );
    // 🔔 UI (callee) → cancelled by caller
    CallHandler.dipatchUI("callee:terminated", "cancelled", {
      callerId: body ? body.callerId : undefined,
      calleeId: body ? body.calleeId : undefined,
    });
  }

  static handleSocketSelfStopRinging(body) {
    DebugLogger.addLog("receiving call", "NOTICE", "handleSocketSelfStopRinging", "Stopping ringing on all devices", body);
    console.log("[CallHandler] SOCKET call:self:stopRinging", body);
    CallHandler.clearCallerRingTimer();
    CallHandler.clearCalleeRingTimer();
    console.log("[CallHandler] ring timers cleared due to self-stop");
  }

  static handleSocketMeetingReady(body) {
    DebugLogger.addLog("setuping up", "NOTICE", "handleSocketMeetingReady", "Meeting is ready", body);
    console.log("[CallHandler] SOCKET meeting:ready", body);
    if (!body) {
      console.log("[CallHandler] meeting:ready missing body");
      return;
    }
    if (body.meetingId === undefined || body.meetingId === "") {
      console.log("[CallHandler] meeting:ready missing meetingId");
      return;
    }
    if (body.callerId === undefined || body.callerId === "") {
      console.log("[CallHandler] meeting:ready missing callerId");
      return;
    }
    if (body.calleeId === undefined || body.calleeId === "") {
      console.log("[CallHandler] meeting:ready missing calleeId");
      return;
    }
    if (body.callerRole === undefined || body.callerRole === "") {
      console.log("[CallHandler] meeting:ready missing callerRole");
      return;
    }
    if (body.calleeRole === undefined || body.calleeRole === "") {
      console.log("[CallHandler] meeting:ready missing calleeRole");
      return;
    }

    // Construct a join link (placeholder) and dispatch to UI before joining
    const joinUrl = `https://example.com/join/${encodeURIComponent(
      body.meetingId
    )}?user=${encodeURIComponent(body.callerId)}&role=${encodeURIComponent(
      body.callerRole
    )}`;
    CallHandler.dipatchUI("caller:callAccepted", "none", {
      side: "caller",
      meetingId: body.meetingId,
      joinUrl,
      callerId: body.callerId,
      calleeId: body.calleeId,
      callerRole: body.callerRole,
      calleeRole: body.calleeRole,
    });

    // The CALLER joins with callerRole from payload
    DebugLogger.addLog(
      "setuping up",
      "NOTICE",
      "handleSocketMeetingReady",
      "Caller: Meeting ready from callee!"
    );
    DebugLogger.addLog(
      "setuping up",
      "NOTICE",
      "handleSocketMeetingReady",
      `Received: DB ID = ${body.dbMeetingId || body.meetingId}, Chime ID = ${
        body.chimeMeetingId
      }`
    );
    
    // Orchestrate cam/mic permissions for caller based on call type
    console.log('[CallHandler] [Caller] [FIX v1.1] Call accepted - checking cam/mic permissions');
    
    const mediaType = window.mockCallData?.mediaType || 'video';
    const isVideoCall = mediaType === 'video';
    console.log('[CallHandler] [Caller] [FIX v1.1] Media type:', mediaType, 'isVideoCall:', isVideoCall);
    
    // Listen for when permissions are actually needed (ONLY fires if not granted)
    const onShowWaiting = (ev) => {
      console.log('[CallHandler] [Caller] [FIX v1.1] ⏳ CamMic:UI:ShowWaiting received - showing waiting UI NOW');
      console.log('[CallHandler] [Caller] [FIX v1.1] Event detail:', ev.detail);
      CallHandler.dipatchUI("caller:waitingForCamMicPermissions", "none", {
        callerId: body.callerId,
        calleeId: body.calleeId,
        callerRole: body.callerRole,
        calleeRole: body.calleeRole,
      });
      console.log('[CallHandler] [Caller] [FIX v1.1] ✅ UI transitioned to caller:waitingForCamMicPermissions');
    };
    
    // Listen for permissions resolved (returns to callAccepted if we showed waiting)
    const onPermissionsResolved = (ev) => {
      const detail = ev.detail || {};
      console.log('[CallHandler] [Caller] [FIX v1.1] 📺 CamMic:UI:PermissionsResolved received:', detail);
      
      // If we were in waiting state, return to callAccepted
      if (CallHandler._currentUIState === 'caller:waitingForCamMicPermissions') {
        console.log('[CallHandler] [Caller] [FIX v1.1] 📺 Current state is waitingForCamMicPermissions - returning to callAccepted');
        CallHandler.dipatchUI("caller:callAccepted", "none", {
          callerId: body.callerId,
          calleeId: body.calleeId,
          callerRole: body.callerRole,
          calleeRole: body.calleeRole,
        });
        console.log('[CallHandler] [Caller] [FIX v1.1] ✅ UI transitioned back to caller:callAccepted');
      } else {
        console.log('[CallHandler] [Caller] [FIX v1.1] ⏭️ Current state is NOT waitingForCamMicPermissions, skipping UI change. Current state:', CallHandler._currentUIState);
      }
    };
    
    if (isVideoCall) {
      // Video call: orchestrate both with no preview
      console.log('[CallHandler] [Caller] [FIX v1.1] Video call - orchestrating both (no preview)');
      
      const onCallerComplete = (ev) => {
        console.log('[CallHandler] [Caller] [FIX v1.1] 🔔 CamMic:Orchestrate:Complete received');
        window.removeEventListener('CamMic:Orchestrate:Complete', onCallerComplete);
        window.removeEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
        window.removeEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
        console.log('[CallHandler] [Caller] [FIX v1.1] 🧹 Removed all event listeners');
        
        const detail = ev.detail || {};
        console.log('[CallHandler] [Caller] [FIX v1.1] CamMic orchestration complete:', detail);
        
        // Check permission states
        const camera = detail.permissions?.camera || 'unknown';
        const microphone = detail.permissions?.microphone || 'unknown';
        
        console.log('[CallHandler] [Caller] [FIX v1.1] Permission states:', { camera, microphone });
        console.log('[CallHandler] [Caller] [FIX v1.1] Current UI state:', CallHandler._currentUIState);
        
        // If permissions denied, show error and stay waiting
        if (camera === 'denied' || microphone === 'denied') {
          console.log('[CallHandler] [Caller] [FIX v1.1] ❌ Permissions denied - keeping waiting UI');
          alert('❌ Camera/Microphone access denied. Please enable permissions in browser settings and try again.');
          // Stay in permission waiting state (UI already showing)
          return;
        }
        
        // If permissions granted, proceed
        if (camera === 'granted' && microphone === 'granted') {
          console.log('[CallHandler] [Caller] [FIX v1.1] ✅ Both permissions granted');
          console.log('[CallHandler] [Caller] [FIX v1.1] Current UI state before proceedToJoin:', CallHandler._currentUIState);
          
          // If we never showed waiting UI, we're still in callAccepted - that's correct!
          if (CallHandler._currentUIState === 'caller:waitingForCamMicPermissions') {
            console.log('[CallHandler] [Caller] [FIX v1.1] ⚠️ Still in waitingForCamMicPermissions - onPermissionsResolved should have handled this');
          } else {
            console.log('[CallHandler] [Caller] [FIX v1.1] ✅ Still in callAccepted (never showed waiting UI) - correct behavior!');
          }
          
          // Continue with join flow (stays in callAccepted if we never showed waiting)
          proceedToJoin();
          return;
        }
        
        // Unknown state - show warning but proceed
        console.warn('[CallHandler] [Caller] [FIX v1.1] ⚠️ Unknown permission state - proceeding anyway');
        alert('⚠️ Unable to verify camera/microphone permissions. Call may not work properly.');
        proceedToJoin();
      };
      
      // Listen for UI events (NEW system - same as callee)
      console.log('[CallHandler] [Caller] [FIX v1.1] 📡 Registering listeners: CamMic:UI:ShowWaiting, CamMic:UI:PermissionsResolved, CamMic:Orchestrate:Complete');
      window.addEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
      window.addEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
      
      // Listen for orchestration completion
      window.addEventListener('CamMic:Orchestrate:Complete', onCallerComplete);
      console.log('[CallHandler] [Caller] [FIX v1.1] ✅ All listeners registered');
      
      // Start orchestration
      console.log('[CallHandler] [Caller] [FIX v1.1] 🚀 Dispatching CamMic:Orchestrate:Both:NoPreview');
      window.dispatchEvent(new CustomEvent('CamMic:Orchestrate:Both:NoPreview'));
      console.log('[CallHandler] [Caller] [FIX v1.1] ✅ Orchestration started - waiting for events...');
      
    } else {
      // Audio call: orchestrate microphone only
      console.log('[CallHandler] [Caller] [FIX v1.1] Audio call - orchestrating microphone only');
      
      const onCallerComplete = (ev) => {
        console.log('[CallHandler] [Caller] [FIX v1.1] 🔔 CamMic:Orchestrate:Complete received (audio)');
        window.removeEventListener('CamMic:Orchestrate:Complete', onCallerComplete);
        window.removeEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
        window.removeEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
        console.log('[CallHandler] [Caller] [FIX v1.1] 🧹 Removed all event listeners (audio)');
        
        const detail = ev.detail || {};
        console.log('[CallHandler] [Caller] [FIX v1.1] Mic orchestration complete:', detail);
        
        // Check permission states
        const microphone = detail.permissions?.microphone || 'unknown';
        
        console.log('[CallHandler] [Caller] [FIX v1.1] Microphone permission state:', microphone);
        console.log('[CallHandler] [Caller] [FIX v1.1] Current UI state:', CallHandler._currentUIState);
        
        // If permission denied, show error and stay waiting
        if (microphone === 'denied') {
          console.log('[CallHandler] [Caller] [FIX v1.1] ❌ Microphone denied - keeping waiting UI');
          alert('❌ Microphone access denied. Please enable permissions in browser settings and try again.');
          // Stay in permission waiting state (UI already showing)
          return;
        }
        
        // If permission granted, proceed
        if (microphone === 'granted') {
          console.log('[CallHandler] [Caller] [FIX v1.1] ✅ Microphone permission granted');
          console.log('[CallHandler] [Caller] [FIX v1.1] Current UI state before proceedToJoin:', CallHandler._currentUIState);
          
          // If we never showed waiting UI, we're still in callAccepted - that's correct!
          if (CallHandler._currentUIState === 'caller:waitingForCamMicPermissions') {
            console.log('[CallHandler] [Caller] [FIX v1.1] ⚠️ Still in waitingForCamMicPermissions - onPermissionsResolved should have handled this');
          } else {
            console.log('[CallHandler] [Caller] [FIX v1.1] ✅ Still in callAccepted (never showed waiting UI) - correct behavior!');
          }
          
          // Continue with join flow (stays in callAccepted if we never showed waiting)
          proceedToJoin();
          return;
        }
        
        // Unknown state - show warning but proceed
        console.warn('[CallHandler] [Caller] [FIX v1.1] ⚠️ Unknown microphone permission state - proceeding anyway');
        alert('⚠️ Unable to verify microphone permissions. Call may not work properly.');
        proceedToJoin();
      };
      
      // Listen for UI events (NEW system - same as callee)
      console.log('[CallHandler] [Caller] [FIX v1.1] 📡 Registering listeners (audio): CamMic:UI:ShowWaiting, CamMic:UI:PermissionsResolved, CamMic:Orchestrate:Complete');
      window.addEventListener('CamMic:UI:ShowWaiting', onShowWaiting);
      window.addEventListener('CamMic:UI:PermissionsResolved', onPermissionsResolved);
      
      // Listen for orchestration completion
      window.addEventListener('CamMic:Orchestrate:Complete', onCallerComplete);
      console.log('[CallHandler] [Caller] [FIX v1.1] ✅ All listeners registered (audio)');
      
      // Start orchestration
      console.log('[CallHandler] [Caller] [FIX v1.1] 🚀 Dispatching CamMic:Orchestrate:Microphone');
      window.dispatchEvent(new CustomEvent('CamMic:Orchestrate:Microphone'));
      console.log('[CallHandler] [Caller] [FIX v1.1] ✅ Orchestration started (audio) - waiting for events...');
    }
    
    // Return early - join will happen in proceedToJoin()
    console.log('[CallHandler] [Caller] [FIX v1.1] ⏸️ Returning early - join will happen in proceedToJoin()');
    return;
    
    // Helper function to proceed with join after CamMic orchestration
    function proceedToJoin() {
      console.log('[CallHandler] [Caller] Proceeding with join after CamMic orchestration');
    
    console.log(
      "[CallHandler] caller joinChimeMeeting with role",
      body.callerRole
    );
    CallHandler.joinChimeMeeting(
      body.meetingId,
      body.callerId,
      body.callerRole,
      body.chimeMeetingId,
      CallHandler._invite.callType
    )
      .then((joinData) => {
        console.log("[CallHandler] caller join ok", joinData);
        // 🔔 UI (caller) → connected and joining - will transition to caller:connectedJoined when media starts
        // Note: Don't dispatch here, tile-updated will detect when joined
      })
      .catch((err) => {
        console.error("[CallHandler] caller join failed", err);
        CallHandler.dipatchUI("caller:terminated", "error", {
          message: "caller join failed",
          meetingId: body.meetingId,
        });
        DebugLogger.addLog(
          "terminated",
          "CRITICAL",
          "handleSocketMeetingReady",
          "Problems joining meeting to caller"
        );
        document.dispatchEvent(
          new CustomEvent(CallHandler.FLAGS.MEETING_PROBLEM, {
            detail: {
              meetingId: body.meetingId,
              callerId: body.callerId,
              calleeId: body.calleeId,
              message: "join failed",
            },
          })
        );
      });
    } // End of proceedToJoin function
  }

  static handleSocketMeetingProblem(body) {
    DebugLogger.addLog("terminated", "CRITICAL", "handleSocketMeetingProblem", "Meeting problem from remote", body);
    console.log("[CallHandler] SOCKET meeting:problem", body);
    CallHandler._inCallOrConnecting = false; // Reset so user can try again
    CallHandler.dipatchUI("caller:terminated", "error", {
      message: body && body.message ? body.message : "meeting problem",
    });
    DebugLogger.addLog(
      "terminated",
      "CRITICAL",
      "handleSocketMeetingProblem",
      `Meeting Problem: ${body && body.message ? body.message : "Unknown error"}`
    );
  }

  static handleSocketMeetingStatus(body) {
    DebugLogger.addLog("setuping up", "NOTICE", "handleSocketMeetingStatus", "Meeting status update from remote", body);
    console.log("[CallHandler] SOCKET meeting:status", body);
    if (!body || !body.message) return;
    
    // Show alert to caller about callee's progress
    DebugLogger.addLog(
      "setuping up",
      "NOTICE",
      "handleSocketMeetingStatus",
      `Callee: ${body.message}`
    );
    
    // Update UI status if available
    if (window.chimeHandler && window.chimeHandler._updateStatus) {
      window.chimeHandler._updateStatus(body.message);
    }
  }

  /* ===========================
   * MEETING OPS
   * ========================= */

  static async getMeetingID(userId, role) {
    DebugLogger.addLog("setuping up", "NOTICE", "getMeetingID", "Creating meeting in database", { userId, role });
    console.log("[CallHandler] getMeetingID", { userId, role });
    try {
      const eventId = `event_${Date.now()}`;
      console.log("[CallHandler] Creating Scylla meeting", {
        eventId,
        initiatorId: userId,
      });
      const response = await fetch(
        `${CallHandler._scyllaDatabaseEndpoint}createInstantMeeting`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            initiatorId: userId,
          }),
          mode: "cors",
          redirect: "follow",
        }
      );
      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(
          `CreateInstantMeeting failed: ${response.status} ${response.statusText}${
            bodyText ? " | " + bodyText : ""
          }`
        );
      }
      const data = await response.json();
      if (data.success && data.data) {
        console.log("[CallHandler] Scylla meeting created successfully", data);
        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "getMeetingID",
          `✅ DB meeting created: ${data.data}`
        );
        return data.data;
      } else {
        throw new Error(
          `Failed to create Scylla meeting: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("[CallHandler] Error creating Scylla meeting:", error);
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "getMeetingID",
        `DB Error: ${error.message}`
      );
      throw error;
    }
  }

  static async createChimeMeeting(meetingId, userId, role) {
    DebugLogger.addLog("setuping up", "NOTICE", "createChimeMeeting", "Creating Chime meeting", { meetingId, userId, role });
    console.log("[CallHandler] createChimeMeeting", {
      meetingId,
      userId,
      role,
    });
    try {
      console.log("[CallHandler] Creating Chime meeting", {
        externalMeetingId: meetingId,
      });
      const response = await fetch(CallHandler._chimeMeetingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createMeeting",
          externalMeetingId: meetingId,
        }),
        mode: "cors",
      });
      const data = await response.json();
      if (data.meetingId && data.meeting) {
        console.log("[CallHandler] Chime meeting created successfully", data);
        console.log("[CallHandler] Full Meeting object:", data.meeting);
        DebugLogger.addLog(
          "setuping up",
          "NOTICE",
          "createChimeMeeting",
          `✅ Chime meeting created: ${data.meetingId}`
        );
        // Return BOTH meetingId AND full meeting object
        return {
          chimeMeetingId: data.meetingId,
          fullMeeting: data.meeting,
        };
      } else {
        throw new Error(
          `Failed to create Chime meeting: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("[CallHandler] Error creating Chime meeting:", error);
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "createChimeMeeting",
        `Chime Error: ${error.message}`
      );
      throw error;
    }
  }

  static async joinChimeMeeting(meetingId, userId, role, chimeMeetingId, callType, fullMeeting = null) {
    DebugLogger.addLog("connecting", "NOTICE", "joinChimeMeeting", "Joining Chime meeting", { meetingId, userId, role });
    console.log("[CallHandler] joinChimeMeeting", {
      meetingId,
      userId,
      role,
      chimeMeetingId,
      callType,
      hasFullMeeting: !!fullMeeting,
    });

    try {
      const mediaType = callType || "video";
      
      // STEP 1: Call addAttendee to get attendee credentials AND meeting data
      console.log("[CallHandler] Calling addAttendee API", {
        chimeMeetingId,
        userId,
        role,
      });
      
      const response = await fetch(CallHandler._chimeMeetingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAttendee",
          meetingId: chimeMeetingId,
          externalUserId: userId,
          role: role,
        }),
        mode: "cors",
      });
      
      if (!response.ok) {
        throw new Error(`addAttendee failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("[CallHandler] 🔍 RAW addAttendee response:", JSON.stringify(data, null, 2));
      
      if (!data.success || !data.attendeeId) {
        throw new Error(`addAttendee failed: ${data.error || "missing attendeeId"}`);
      }
      
      // STEP 2: Extract Meeting and Attendee from response
      let meeting;
      let attendee;
      let currentMeetingId = chimeMeetingId; // Use chimeMeetingId consistently
      
      // Decode base64 meetingInfo FIRST (most common format from API)
      if (data.meetingInfo) {
        try {
          const decoded = atob(data.meetingInfo);
          const meetingInfoDecoded = JSON.parse(decoded);
          console.log("[CallHandler] 🔍 Decoded meetingInfo:", JSON.stringify(meetingInfoDecoded, null, 2));
          
          // Check if decoded info has MediaPlacement
          if (meetingInfoDecoded.MediaPlacement && meetingInfoDecoded.MediaPlacement.AudioHostUrl) {
            console.log("[CallHandler] ✅ Found MediaPlacement in decoded meetingInfo");
            meeting = {
              MeetingId: meetingInfoDecoded.MeetingId || currentMeetingId,
              MediaPlacement: meetingInfoDecoded.MediaPlacement,
              MediaRegion: meetingInfoDecoded.MediaRegion || "ap-northeast-1",
              ExternalMeetingId: meetingInfoDecoded.ExternalMeetingId || currentMeetingId,
            };
          }
          
          // Extract attendee from decoded info
          if (meetingInfoDecoded.Attendee) {
            console.log("[CallHandler] ✅ Found Attendee in decoded meetingInfo");
            attendee = meetingInfoDecoded.Attendee;
          }
        } catch (err) {
          console.error("[CallHandler] Failed to decode meetingInfo:", err);
        }
      }
      
      // Fallback: Check if response has top-level MediaPlacement (alternative API format)
      if (!meeting && data.MediaPlacement && data.MediaPlacement.AudioHostUrl) {
        console.log("[CallHandler] ✅ Found MediaPlacement at top level of response");
        meeting = {
          MeetingId: currentMeetingId,
          MediaPlacement: data.MediaPlacement,
          MediaRegion: data.MediaRegion || "ap-northeast-1",
          ExternalMeetingId: currentMeetingId,
        };
      }
      
      // Fallback: Check if response has separate 'meeting' field
      if (!meeting && data.meeting && data.meeting.MediaPlacement) {
        console.log("[CallHandler] ✅ Found 'meeting' field in response with MediaPlacement");
        meeting = data.meeting;
      }
      
      // Fallback if meeting still not found but we have fullMeeting from callee
      if (!meeting && fullMeeting) {
        console.log("[CallHandler] ⚠️ Using fullMeeting fallback (callee-side)");
        meeting = fullMeeting;
      }
      
      // Validate we have Meeting with MediaPlacement
      if (!meeting || !meeting.MediaPlacement) {
        console.error("[CallHandler] ❌ CRITICAL: No Meeting with MediaPlacement found!");
        console.error("[CallHandler] Available in response:", Object.keys(data));
        console.error("[CallHandler] Meeting object:", meeting);
        throw new Error("addAttendee response missing Meeting with MediaPlacement");
      }
      
      // Fallback attendee if not extracted
      if (!attendee) {
        console.log("[CallHandler] Using fallback attendee construction");
        attendee = {
          AttendeeId: data.attendeeId,
          ExternalUserId: userId,
        };
      }
      
      console.log("[CallHandler] ✅ Final meeting object:", JSON.stringify(meeting, null, 2));
      console.log("[CallHandler] ✅ Final attendee object:", JSON.stringify(attendee, null, 2));
      
      DebugLogger.addLog(
        "connecting",
        "NOTICE",
        "joinChimeMeeting",
        `✅ Added to meeting as ${role}`
      );

      // Update status before joining
      if (window.chimeHandler && window.chimeHandler._updateStatus) {
        window.chimeHandler._updateStatus(`Joining as ${role}... (Meeting: ${meeting.MeetingId})`);
      }
      
      // Dispatch to chimeHandler with FULL meeting/attendee objects
    const joinEvent = new CustomEvent("chime:join:meeting", {
      detail: {
          meetingInfo: { Meeting: meeting },
          attendeeInfo: { Attendee: attendee },
        userId: userId,
        role: role,
          callType: mediaType,
      },
    });
    document.dispatchEvent(joinEvent);
      console.log("[CallHandler] Dispatched chime:join:meeting with full credentials", {
        meeting,
        attendee,
      });

      return true;
    } catch (error) {
      console.error("[CallHandler] joinChimeMeeting error", error);
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "joinChimeMeeting",
        `Join Error: ${error.message}`
      );
      throw error;
    }
  }

  static clearCalleeRingTimer() {
    if (CallHandler._calleeRingTimerId !== null) {
      console.log(
        "[CallHandler] clearing callee ring timer",
        CallHandler._calleeRingTimerId
      );
      clearTimeout(CallHandler._calleeRingTimerId);
      CallHandler._calleeRingTimerId = null;
    } else {
      console.log("[CallHandler] no callee ring timer to clear");
    }
  }

  static clearCallerRingTimer() {
    if (CallHandler._callerRingTimerId !== null) {
      console.log(
        "[CallHandler] clearing caller ring timer",
        CallHandler._callerRingTimerId
      );
      clearTimeout(CallHandler._callerRingTimerId);
      CallHandler._callerRingTimerId = null;
    } else {
      console.log("[CallHandler] no caller ring timer to clear");
    }
  }

  // ----------------------------------------------------------
  // Handle manual callee join button click
  // ----------------------------------------------------------
  static handleManualCalleeJoin() {
    console.log("[CallHandler] handleManualCalleeJoin called", CallHandler._pendingCalleeJoin);
    
    if (!CallHandler._pendingCalleeJoin) {
      console.log("[CallHandler] No pending callee join info");
      return;
    }
    
    const { meetingId, calleeId, calleeRole, chimeId, callType, fullMeeting } = CallHandler._pendingCalleeJoin;
    
    // Clear pending join info
    CallHandler._pendingCalleeJoin = null;
    
    // Now join the meeting
    CallHandler.joinChimeMeeting(
      meetingId,
      calleeId,
      calleeRole,
      chimeId,
      callType,
      fullMeeting
    ).then(() => {
      console.log("[CallHandler] dispatch MEETING_CONNECT (callee manual join)");
      document.dispatchEvent(
        new CustomEvent(CallHandler.FLAGS.MEETING_CONNECT, {
          detail: {
            meetingId,
            userId: calleeId,
            role: calleeRole,
            chimeMeetingId: chimeId,
          },
        })
      );
    }).catch((err) => {
      console.error("[CallHandler] Manual callee join error", err);
      CallHandler._inCallOrConnecting = false;
      CallHandler.dipatchUI("callee:terminated", "error", {
        message: err && err.message ? err.message : "Unknown error",
      });
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "handleManualCalleeJoin",
        `Join Error: ${err && err.message ? err.message : "Unknown error"}`
      );
    });
  }

  // ----------------------------------------------------------
  // Step: Check Cam/Mic before connecting
  // NOTE: CamMic permissions are now handled by the new CamMicPermissionsUtility
  // via orchestration events (CamMic:Orchestrate:Both, CamMic:Orchestrate:Microphone)
  // This function is kept for compatibility but simplified
  // ----------------------------------------------------------
  static async ensureCamMicReady(callMode = "video") {
    console.log("[CallHandler] ensureCamMicReady - delegating to new CamMic system", { callMode });
    
    // Set window.callMode for compatibility
    const requiresCamera = callMode !== "audio";
    window.callMode = requiresCamera ? "videoCall" : "audioOnlyCall";
    
    // New CamMic system handles permissions via orchestration events
    // Just resolve immediately - orchestration happens in accept/join flows
    return Promise.resolve(true);
  }

  /* ====================================================================
   * User Data Schema Validation
   * ==================================================================== */
  
  static validateUserData(userData, label) {
    const required = ['userId', 'username', 'displayName', 'initials', 'isCreator', 'isFan'];
    const missing = required.filter(field => !userData || userData[field] === undefined);
    
    if (missing.length > 0) {
      const error = `${label} missing required fields: ${missing.join(', ')}`;
      DebugLogger.addLog("ready", "CRITICAL", "validateUserData", error);
      alert(`❌ Call cannot start: ${error}`);
      
      // End call due to schema error
      this.dipatchUI("ended", "schema-error", { 
        reason: error,
        missingFields: missing 
      });
      
      if (window.chimeHandler) {
        chimeHandler.handleDisconnect();
      }
      
      return false;
    }
    
    // Validate that isCreator and isFan are opposites
    if (userData.isCreator === userData.isFan) {
      const error = `${label} invalid: isCreator and isFan must be opposites (one true, one false)`;
      DebugLogger.addLog("ready", "CRITICAL", "validateUserData", error);
      alert(`❌ Call cannot start: ${error}`);
      return false;
    }
    
    console.log(`[CallHandler] ✅ ${label} validated - ${userData.isCreator ? 'Creator' : 'Fan'}`);
    return true;
  }

  /* ====================================================================
   * Grace Period Handlers
   * ==================================================================== */
  
  static handleGracePeriodStart() {
    if (!window.mockCallData) {
      console.error('[CallHandler] mockCallData not initialized');
      return;
    }
    
    window.mockCallData.isInGrace = true;
    
    DebugLogger.addLog("connected", "NOTICE", "handleGracePeriodStart", 
      "Grace period started - disabling audio/video for ALL USERS in one-on-one call");
    
    alert("⏳ Grace period started! Video and audio disabled for ALL USERS, chat remains available.");
    
    // Broadcast grace period start to ALL participants via socket (CRITICAL: One-on-one = both users affected)
    const meetingId = window.mockCallData.callType || 'current-meeting';
    SocketHandler.sendSocketMessage({
      flag: 'grace:start',
      payload: {
        meetingId: meetingId,
        broadcast: true,
        message: 'Grace period started - all participants media disabled'
      }
    });
    
    // Dispatch grace start event locally
    this.dipatchUI("connected", "grace", { 
      graceActive: true,
      message: "Grace period active for all participants" 
    });
    
    // Force disable audio/video locally (initiator)
    if (window.chimeHandler && typeof chimeHandler.forceControlsOff === 'function') {
      chimeHandler.forceControlsOff();
    }
    
    console.log('[CallHandler] ⏸️ Grace period broadcast sent - ALL participants will be affected (media disabled)');
  }

  static handleGracePeriodResume() {
    if (!window.mockCallData) {
      console.error('[CallHandler] mockCallData not initialized');
      return;
    }
    
    window.mockCallData.isInGrace = false;
    
    DebugLogger.addLog("connected", "NOTICE", "handleGracePeriodResume",
      "Resuming from grace period - re-enabling media for ALL USERS in one-on-one call");
    
    // Broadcast grace period resume to ALL participants via socket (CRITICAL: One-on-one = both users affected)
    const meetingId = window.mockCallData.callType || 'current-meeting';
    SocketHandler.sendSocketMessage({
      flag: 'grace:resume',
      payload: {
        meetingId: meetingId,
        broadcast: true,
        message: 'Grace period resumed - all participants media restored'
      }
    });
    
    // Dispatch resume event locally
    this.dipatchUI("connected", "active", {
      graceActive: false,
      message: "Call resumed for all participants"
    });
    
    // Re-enable audio locally (initiator)
    if (window.chimeHandler && typeof chimeHandler.forceControlsOn === 'function') {
      chimeHandler.forceControlsOn();
    }
    
    // Dispatch timer restart event (applies to all)
    window.dispatchEvent(new CustomEvent("call-timer:restart"));
    
    // Show alert AFTER restoring feeds
    alert("✅ Resumed from grace period! ALL USERS feeds restored and timer restarted.");
    
    console.log('[CallHandler] ▶️ Grace period resume broadcast sent - ALL participants will be affected (media restored)');
  }

  static handleGracePeriodEndFail() {
    if (!window.mockCallData) {
      console.error('[CallHandler] mockCallData not initialized');
      return;
    }
    
    window.mockCallData.isInGrace = false;
    
    DebugLogger.addLog("connected", "CRITICAL", "handleGracePeriodEndFail",
      "Grace period ended - call terminated for ALL users with reason: grace-end");
    
    // Broadcast grace period end to ALL participants via socket (CRITICAL: One-on-one = both users disconnected)
    const meetingId = window.mockCallData.callType || 'current-meeting';
    SocketHandler.sendSocketMessage({
      flag: 'grace:end',
      payload: {
        meetingId: meetingId,
        broadcast: true,
        reason: 'grace-end',
        message: 'Call ended for all participants due to grace period failure'
      }
    });
    
    // Show alert first
    alert("❌ Call ended for ALL USERS - Reason: grace-end");
    
    // End call with reason
    this.dipatchUI("ended", "grace-end", {
      reason: "grace-end",
      message: "Call terminated due to grace period failure"
    });
    
    // Trigger call end/disconnect (local user)
    if (window.chimeHandler && typeof chimeHandler.handleDisconnect === 'function') {
      chimeHandler.handleDisconnect();
    }
    
    console.log('[CallHandler] Grace end broadcast sent - all participants will be disconnected with reason: grace-end');
  }

  /* ====================================================================
   * Socket Handlers for Grace Period (received from other users)
   * ==================================================================== */
  
  static handleSocketGraceStart(data) {
    console.log('[CallHandler] [Socket] ⏸️ Received grace:start - APPLYING TO THIS USER', data);
    
    if (!window.mockCallData) return;
    window.mockCallData.isInGrace = true;
    
    alert("⏳ Grace period started! Video and audio disabled for ALL USERS (including you).");
    
    // Force disable audio/video locally (CRITICAL: This user also affected)
    if (window.chimeHandler && typeof chimeHandler.forceControlsOff === 'function') {
      chimeHandler.forceControlsOff(); // This will also show the grace period UI
    }
    
    console.log('[CallHandler] [Socket] ✅ Grace period applied - local user media disabled + Grace UI shown');
    
    CallHandler.dipatchUI("connected", "grace", { 
      graceActive: true,
      message: "Grace period active for all participants" 
    });
  }

  static handleSocketGraceResume(data) {
    console.log('[CallHandler] [Socket] ▶️ Received grace:resume - APPLYING TO THIS USER', data);
    
    if (!window.mockCallData) return;
    window.mockCallData.isInGrace = false;
    
    // Re-enable audio (CRITICAL: This user also restored)
    if (window.chimeHandler && typeof chimeHandler.forceControlsOn === 'function') {
      chimeHandler.forceControlsOn(); // This will also hide the grace period UI
    }
    
    console.log('[CallHandler] [Socket] ✅ Grace period resumed - local user media restored + Grace UI hidden');
    
    alert("✅ Grace period ended! Feeds restored for ALL USERS (including you).");
    
    CallHandler.dipatchUI("connected", "active", {
      graceActive: false,
      message: "Call resumed for all participants"
    });
  }

  static handleSocketGraceEnd(data) {
    console.log('[CallHandler] [Socket] ❌ Received grace:end - ENDING CALL FOR THIS USER', data);
    
    if (!window.mockCallData) return;
    window.mockCallData.isInGrace = false;
    
    // Hide grace period UI before ending
    if (window.chimeHandler && typeof chimeHandler._hideGracePeriodUI === 'function') {
      chimeHandler._hideGracePeriodUI();
    }
    
    const reason = data.payload?.reason || 'grace-end';
    alert(`❌ Call ended for ALL USERS - Reason: ${reason}`);
    
    // End call with reason
    CallHandler.dipatchUI("ended", "grace-end", {
      reason: reason,
      message: data.payload?.message || "Call terminated due to grace period failure"
    });
    
    // Disconnect this user
    if (window.chimeHandler && typeof chimeHandler.handleDisconnect === 'function') {
      chimeHandler.handleDisconnect();
    }
    
    console.log('[CallHandler] [Socket] Call ended for this user due to grace period failure - Reason:', reason);
  }
}

// Expose globally if you want to trigger app-level dispatches elsewhere
window.CallHandler = CallHandler;
