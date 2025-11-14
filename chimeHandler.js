/* ========================================================================
 * chimeHandler.js
 * Single responsibility: listen and orchestrate UI & policies
 * - Subscribes to DOM events and coreChime events
 * - Translates them into app actions
 * - Enforces app policies
 * - Updates temporary UI (will be replaced by Vue later)
 * ======================================================================== */

class chimeHandler {
  // UI element cache
  static _ui = {};

  // Mapping cache (attendeeId -> { role, uid, externalUserId, displayName, etc. })
  static _mappingCache = new Map();

  // Pending tile binds (tiles waiting for mapping)
  static _pendingTileBinds = new Map();

  // Track which attendees already have video elements to prevent duplicates
  static _attendeesWithVideos = new Set();

  // Meeting metadata (from URL parameter)
  static _meetingMetadata = null;

  // Current user's role (extracted from meetingInfo)
  static _currentUserRole = null;

  // Lambda API endpoints
  static _scyllaDatabaseEndpoint =
    "https://fns5h6php6v5qalzaoxmcq532y0dzrro.lambda-url.ap-northeast-1.on.aws/";
  static _chimeMeetingEndpoint =
    "https://huugn2oais26si45yoqoui6byu0iqhtl.lambda-url.ap-northeast-1.on.aws/";

  // Private class variables
  static _meetingSession = null;
  static _hasShownJoinedAlert = false; // Track if we've shown joined alert
  static _hasShownInCallAlert = false; // Track if we've shown "both participants joined" alert

  /* ====================================================================
   * init(opts)
   * Initializes the entire Chime meeting UI and logic
   * ==================================================================== */
  static init(opts) {
    DebugLogger.init();
    // DebugLogger.hijackAlerts(); // DISABLED - we need to see alerts for debugging
    console.log("[chimeHandler] [init] Start", opts);

    // Cache UI elements
    this._cacheUI();

    // Wire up UI event listeners
    this._wireUIEvents();

    // Wire up coreChime event listeners
    this._wireCoreChimeEvents();

    // Wire up CamMicPermissions event listeners
    this._wireCamMicEvents();

    // Parse meetingInfo from URL
    this._parseMeetingInfo();

    console.log("[chimeHandler] [init] Complete");
  }

  /* ====================================================================
   * Cache UI Elements
   * ==================================================================== */
  static _cacheUI() {
    console.log("[chimeHandler] [_cacheUI] Start");

    this._ui = {
      // Meeting controls
      joinMeeting: document.getElementById("link-join-meeting"),
      start: document.getElementById("link-start"),
      end: document.getElementById("link-end"),
      videoOn: document.getElementById("link-video-on"),
      videoOff: document.getElementById("link-video-off"),
      audioOn: document.getElementById("link-audio-on"),
      audioOff: document.getElementById("link-audio-off"),

      // Data actions
      react: document.getElementById("link-react"),
      sendGift: document.getElementById("link-send-gift"),
      sendChat: document.getElementById("link-send-chat"),
      sendChatPromo: document.getElementById("link-send-chat-promo"),
      tip: document.getElementById("link-tip"),

      // Host controls
      muteAll: document.getElementById("btn-mute-all"),
      unmuteAll: document.getElementById("btn-unmute-all"),
      endForAll: document.getElementById("btn-end-for-all"),
      setMaxAttendees: document.getElementById("btn-set-max-attendees"),
      assignHost: document.getElementById("btn-assign-host"),
      saveCollabs: document.getElementById("btn-save-collabs"),
      hostCandidate: document.getElementById("select-host-candidate"),
      collabsInput: document.getElementById("input-collabs"),

      // Status displays
      uiStatus: document.getElementById("ui-status"),
      attendeeList: document.getElementById("attendee-list"),
      labelMeetingId: document.getElementById("label-meeting-id"),
      labelMeetingType: document.getElementById("label-meeting-type"),
      labelParticipantCount: document.getElementById("label-participant-count"),
      labelMaxParticipants: document.getElementById("label-max-participants"),

      // Tiles
      tiles: document.getElementById("tiles"),
    };

    console.log("[chimeHandler] [_cacheUI] Complete");
    console.log(
      "[chimeHandler] labelMeetingType element cached:",
      this._ui.labelMeetingType
    );
    console.log(
      "[chimeHandler] labelMeetingType element text:",
      this._ui.labelMeetingType?.textContent
    );
  }

  /* ====================================================================
   * Wire UI Events (button clicks)
   * ==================================================================== */
  static _wireUIEvents() {
    console.log("[chimeHandler] [_wireUIEvents] Start");

    // Meeting controls
    this._ui.joinMeeting?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleJoin({ enableAudio: true, enableVideo: true });
    });

    this._ui.start?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleJoin({ enableAudio: true, enableVideo: true });
    });

    this._ui.end?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleEnd();
    });

    this._ui.videoOn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleVideoToggle(true);
    });

    this._ui.videoOff?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleVideoToggle(false);
    });

    this._ui.audioOn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleAudioToggle(true);
    });

    this._ui.audioOff?.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleAudioToggle(false);
    });

    // Data actions (use data attributes)
    [
      this._ui.react,
      this._ui.sendGift,
      this._ui.sendChat,
      this._ui.sendChatPromo,
      this._ui.tip,
    ].forEach((link) => {
      link?.addEventListener("click", (e) => {
        e.preventDefault();
        const flag = link.getAttribute("data-flag");
        const payloadStr = link.getAttribute("data-payload");
        try {
          const payload = JSON.parse(payloadStr || "{}");
          this.handleDataSend(flag, payload);
        } catch (error) {
          console.error("[chimeHandler] Error parsing data-payload:", error);
        }
      });
    });

    // Host controls
    this._ui.muteAll?.addEventListener("click", () => {
      console.log("[chimeHandler] Mute All clicked");
      DebugLogger.addLog(
        "ready",
        "NOTICE",
        "_wireUIEvents",
        "Mute All feature - to be implemented"
      );
    });

    this._ui.unmuteAll?.addEventListener("click", () => {
      console.log("[chimeHandler] Unmute All clicked");
      DebugLogger.addLog(
        "ready",
        "NOTICE",
        "_wireUIEvents",
        "Unmute All feature - to be implemented"
      );
    });

    this._ui.endForAll?.addEventListener("click", () => {
      this.handleEndForAll();
    });

    this._ui.setMaxAttendees?.addEventListener("click", () => {
      const max = prompt("Enter max attendees:");
      if (max && !isNaN(max)) {
        this.setMaxAttendeesForScheduled(parseInt(max));
      }
    });

    console.log("[chimeHandler] [_wireUIEvents] Complete");
  }

  /* ====================================================================
   * Wire coreChime Events
   * ==================================================================== */
  static _wireCoreChimeEvents() {
    console.log("[chimeHandler] [_wireCoreChimeEvents] Start");

    window.addEventListener("coreChime:connecting", () => {
      this._updateStatus("Connecting to meeting...");
      DebugLogger.addLog(
        "connecting",
        "NOTICE",
        "coreChime:connecting",
        "Connecting to meeting..."
      );
    });

    window.addEventListener("coreChime:connected", (e) => {
      const { attendeeId, externalUserId, connectionId } = e.detail;
      console.log("[chimeHandler] Connected event received", e.detail);
      this._updateStatus(`Connected! Attendee ID: ${attendeeId}`);

      // Show alert to user (only once)
      if (!this._hasShownConnectedAlert) {
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "coreChime:connected",
          "Connected to meeting!",
          { externalUserId, attendeeId }
        );
        this._hasShownConnectedAlert = true;

        // NEW: Dispatch state update - determine if caller or callee based on flow
        if (typeof CallHandler !== 'undefined' && typeof CallHandler.dipatchUI === 'function') {
          const side = CallHandler._currentSide;
          const currentState = CallHandler._currentUIState;
          console.log("[chimeHandler] [FIX] coreChime:connected - side:", side, "currentState:", currentState);
          
          if (side === "caller") {
            // Caller: transition to connectedJoined immediately when connected
            // (don't wait for stream since caller joins with media OFF)
            console.log("[chimeHandler] [FIX] Caller connected - transitioning to caller:connectedJoined");
            CallHandler.dipatchUI("caller:connectedJoined", "none", {
              attendeeId: attendeeId,
              externalUserId: externalUserId,
            });
          } else if (side === "callee") {
            // Callee: transition to joined when they manually join (in callee:connected state)
            // (don't wait for stream since callee joins with media OFF)
            if (currentState === "callee:connected") {
              console.log("[chimeHandler] [FIX] Callee manually joined - transitioning to callee:joined");
              CallHandler.dipatchUI("callee:joined", "none", {
                attendeeId: attendeeId,
                externalUserId: externalUserId,
              });
            } else {
              console.log("[chimeHandler] [FIX] Callee connected but not in callee:connected state, skipping transition. Current state:", currentState);
            }
          } else {
            console.warn("[chimeHandler] [FIX] Unknown side:", side, "currentState:", currentState);
          }
        }
      }

      // Immediately send mapping packet via data channel
      this._sendMappingPacket(attendeeId, externalUserId);

      // Send mapping packet once more after a short delay to ensure delivery
      setTimeout(() => {
        this._sendMappingPacket(attendeeId, externalUserId);
      }, 2000);
    });

    window.addEventListener("coreChime:disconnected", (e) => {
      const { reason } = e.detail;
      this._updateStatus(`Disconnected: ${reason}`);

      // Store meeting info for rejoin
      const localIds = coreChime.getLocalIdentifiers();
      const meetingInfo = coreChime.getMeetingInfo();
      const attendeeInfo = coreChime.getAttendeeInfo();
      
      // Dispatch network issue state
      try {
        if (typeof CallHandler !== "undefined" && CallHandler.dipatchUI) {
          CallHandler.dipatchUI("shared:networkIssue", "none", { reason });
        }
      } catch (err) {
        console.error("[chimeHandler] Failed to dispatch networkIssue state:", err);
      }
      
      // Show alert with rejoin option
      const shouldRejoin = confirm(
        "❌ Disconnected from meeting\n\n" +
        "Reason: " + reason + "\n\n" +
        "Would you like to rejoin the meeting?"
      );

      if (shouldRejoin && meetingInfo && attendeeInfo) {
        console.log("[chimeHandler] User wants to rejoin, attempting reconnection...");
        DebugLogger.addLog(
          "connecting",
          "NOTICE",
          "coreChime:disconnected",
          "Reconnecting to meeting..."
        );
        
        // Reset connection state
        this._hasShownConnectedAlert = false;
        
        // Dispatch reconnecting state
        try {
          if (typeof CallHandler !== "undefined" && CallHandler.dipatchUI) {
            CallHandler.dipatchUI("shared:reconnecting", "none", {});
          }
        } catch (err) {
          console.error("[chimeHandler] Failed to dispatch reconnecting state:", err);
        }
        
        // Reinitialize and rejoin
        setTimeout(async () => {
          try {
            await coreChime.initialize({
              meetingInfo: { Meeting: meetingInfo },
              attendeeInfo: { Attendee: attendeeInfo },
              mediaPolicy: "auto"
            });
            
            await coreChime.join({
              enableAudio: true,
              enableVideo: true,
            });
            
            DebugLogger.addLog(
              "connected",
              "NOTICE",
              "coreChime:disconnected",
              "Reconnected to meeting!"
            );
            alert("✅ Reconnected to meeting!");
          } catch (err) {
            console.error("[chimeHandler] Rejoin failed:", err);
            DebugLogger.addLog(
              "terminated",
              "CRITICAL",
              "coreChime:disconnected",
              "Failed to rejoin meeting: " + err.message
            );
            alert("❌ Failed to rejoin meeting: " + err.message);
          }
        }, 1000);
      } else {
        // User declined to rejoin or no meeting info available
        DebugLogger.addLog(
          "terminated",
          "NOTICE",
          "coreChime:disconnected",
          "Disconnected from meeting",
          { reason }
        );
        alert("❌ Disconnected from meeting\n\nReason: " + reason);
        
        // Dispatch disconnected state
        try {
          if (typeof CallHandler !== "undefined" && CallHandler.dipatchUI) {
            CallHandler.dipatchUI("shared:disconnected", "none", { reason });
          }
        } catch (err) {
          console.error("[chimeHandler] Failed to dispatch disconnected state:", err);
        }
      }

      // Stop all camera/mic streams via event (no direct class calls)
      try {
        window.dispatchEvent(new CustomEvent('CamMic:Streams:Stop'));
        console.log('[chimeHandler] Dispatched CamMic:Streams:Stop event');
      } catch (err) {
        console.error('[chimeHandler] Failed to dispatch CamMic:Streams:Stop:', err);
      }
    });

    window.addEventListener("coreChime:attendee-joined", (e) => {
      const { attendeeId, externalUserId } = e.detail;
      console.log("[chimeHandler] Attendee joined", {
        attendeeId,
        externalUserId,
      });

      // Don't show alert for every participant join - too noisy
      // Just log it
      DebugLogger.addLog(
        "connected",
        "NOTICE",
        "coreChime:attendee-joined",
        `Attendee joined: ${externalUserId}`
      );
      
      // Get our own attendee info
      const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
      const myExternalUserId = coreChime.getLocalIdentifiers().externalUserId;

      // NEW: Detect when both participants are in the call
      // Skip if this is our own join event
      if (attendeeId !== myAttendeeId && !this._hasShownInCallAlert) {
        // This is a remote participant joining
        // In one-on-one calls, when we receive this event for a remote participant, both are joined
        console.log("[chimeHandler] 🎉 Remote participant joined - call is now active!");
        this._hasShownInCallAlert = true;
        
        // Show alert to both users
        alert("✅ Call started! Both participants are connected - your timer will begin shortly.");
        
        // Dispatch shared:inCall state
        if (typeof CallHandler !== "undefined" && CallHandler.dipatchUI) {
          const meetingInfo = coreChime.getMeetingInfo();
          const localIds = coreChime.getLocalIdentifiers();
          
          console.log("[chimeHandler] Getting call data for shared:inCall", {
            meetingInfo,
            localIds
          });
          
          // Get call data from CallHandler if available
          const callData = {
            meetingId: meetingInfo?.MeetingId || meetingInfo?.Meeting?.MeetingId,
            myUserId: myExternalUserId,
            myAttendeeId: localIds.attendeeId,
            externalUserId: externalUserId,
            remoteAttendeeId: attendeeId,
            timestamp: new Date().toISOString(),
          };
          
          console.log("[chimeHandler] Call data for timer flows", callData);
          
          // Dispatch shared:inCall state
          CallHandler.dipatchUI("shared:inCall", "none", callData);
          
          // Dispatch timer/payment flows event
          document.dispatchEvent(new CustomEvent("callTimerPaymentFlows", {
            detail: callData
          }));
          
          console.log("[chimeHandler] ✅ Dispatched shared:inCall and callTimerPaymentFlows", callData);
        }
      }

      // Send our mapping packet to the newly joined attendee
      if (myAttendeeId && myExternalUserId) {
        console.log(
          "[chimeHandler] Sending mapping packet to newly joined attendee"
        );
        setTimeout(() => {
          this._sendMappingPacket(myAttendeeId, myExternalUserId);
        }, 1000); // Wait 1 second for the new attendee to be ready
      }

      // Don't auto-tile - wait for mapping packet
    });

    window.addEventListener("coreChime:attendee-left", (e) => {
      const { attendeeId, externalUserId } = e.detail;
      console.log("[chimeHandler] Attendee left", {
        attendeeId,
        externalUserId,
      });

      // Show alert to all users
      DebugLogger.addLog(
        "connected",
        "NOTICE",
        "coreChime:attendee-left",
        `Attendee left: ${externalUserId}`
      );

      this._mappingCache.delete(attendeeId);
    });

    window.addEventListener("coreChime:tile-updated", (e) => {
      const {
        tileId,
        boundAttendeeId,
        isContent,
        isLocal,
        active,
        hasStream,
        paused,
      } = e.detail;
      console.log("[chimeHandler] Tile updated", e.detail);
      console.log(
        `[chimeHandler] isLocal: ${isLocal}, boundAttendeeId: ${boundAttendeeId}, hasStream: ${hasStream}, active: ${active}`
      );
      
      // Log to DebugLogger
      if (typeof DebugLogger !== "undefined") {
        DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler.tile-updated', `Tile Update: ${isLocal ? '📹 LOCAL' : '🎥 REMOTE'}`, {
          tileId,
          attendeeId: boundAttendeeId,
          hasStream,
          active,
          videoStatus: (hasStream && active) ? '✅ ON' : '❌ OFF'
        });
      }

      // Skip content share tiles
      if (isContent) {
        console.log("[chimeHandler] Skipping content share tile");
        return;
      }

      // Update VIDEO OFF indicator based on ACTUAL Chime tile state
      // Video is ON if there's a stream, regardless of active state
      // (active is about tile display, hasStream is about video feed)
      if (boundAttendeeId) {
        const videoIsActuallyOn = hasStream; // Stream = video ON, no stream = video OFF
        console.log(`[chimeHandler] Tile ${tileId} for ${boundAttendeeId}: hasStream=${hasStream}, active=${active} → Video ${videoIsActuallyOn ? 'ON' : 'OFF'}`);
        
        // Detect when user has actually joined with media (local tile with stream)
        if (isLocal && hasStream && !this._hasShownJoinedAlert) {
          console.log("[chimeHandler] 🎉 User has joined with media - dispatching joined state");
          this._hasShownJoinedAlert = true;
          
          // Dispatch joined state to UI
          if (typeof CallHandler !== 'undefined' && typeof CallHandler.dipatchUI === 'function') {
            // Determine if caller or callee based on current side tracked in CallHandler
            const side = CallHandler._currentSide;
            if (side === "caller") {
              CallHandler.dipatchUI("caller:connectedJoined", "none", {
                attendeeId: boundAttendeeId,
              });
            } else if (side === "callee") {
              CallHandler.dipatchUI("callee:joined", "none", {
                attendeeId: boundAttendeeId,
              });
            } else {
              // Fallback if side not set yet
              console.log("[chimeHandler] Unknown side, using callee as fallback");
              CallHandler.dipatchUI("callee:joined", "none", {
                attendeeId: boundAttendeeId,
              });
            }
          }
        }
        
        // Check if this matches a pending video toggle
        const pending = this._pendingVideoToggles[boundAttendeeId];
        if (pending && pending.expected === videoIsActuallyOn) {
          const duration = Date.now() - pending.timestamp;
          console.log(`[chimeHandler] ✅ Video toggle confirmed in ${duration}ms - hiding loading overlay`);
          
          // Clear the 200ms delay if spinner hasn't shown yet
          clearTimeout(pending.showSpinnerTimeout);
          
          // Hide the loading overlay
          this._hideLoadingOverlay(boundAttendeeId);
          
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler.tile-updated', `Video Toggle Complete: ${boundAttendeeId.substring(0,8)}...`, {
              state: videoIsActuallyOn ? 'ON' : 'OFF',
              duration: `${duration}ms`
            });
          }
        }
        
        this._updateVideoOffIndicator(boundAttendeeId, videoIsActuallyOn);
        this._updateDebugOverlay(boundAttendeeId, { videoEnabled: videoIsActuallyOn });
        this._updateStatusIcons(boundAttendeeId, { videoEnabled: videoIsActuallyOn }); // Update status icons
      }

      // Remove video if tile is truly being removed (no stream and not active)
      // BUT: Don't remove local tiles immediately - they need time to start
      if (!hasStream && !active && boundAttendeeId) {
        // For local tiles, give them more time to start
        if (isLocal) {
          console.log("[chimeHandler] Local tile not ready yet, giving it time:", tileId);
          return; // Don't remove local tiles that are starting up
        }
        
        console.log("[chimeHandler] Tile being removed:", tileId);
        const video = document.querySelector(`video[data-tile-id="${tileId}"]`);
        if (video) {
          coreChime.unbindVideoElement(tileId);
          video.remove();

          // Remove from tracking set
          this._attendeesWithVideos.delete(boundAttendeeId);

          // Mark container as available
          const container = video.closest(".border.rounded");
          if (container && container.parentElement) {
            container.parentElement.removeAttribute("data-occupied");
          }

          console.log(
            "[chimeHandler] ✅ Removed video for tile",
            tileId,
            "- untracked attendee",
            boundAttendeeId
          );
        }
        return;
      }

      // Handle tiles with video stream - bind video (even if active is false but has stream)
      // Also handle tiles that have stream but are not yet active (they might become active later)
      // For instant calls, we need to process inactive tiles that have streams
      if (boundAttendeeId && (hasStream || active)) {
        // Check role-based video visibility (role-based requirements)
        const shouldShow = this._shouldShowVideo(boundAttendeeId);
        console.log(
          `[chimeHandler] Should show video for ${boundAttendeeId}: ${shouldShow}`
        );

        if (!shouldShow) {
          // For inactive tiles with streams, check if this might be an instant call scenario
          // where the mapping hasn't arrived yet
          if (hasStream && !active) {
            console.log(
              `[chimeHandler] Inactive tile with stream for ${boundAttendeeId} - checking if this is instant call scenario`
            );

            // Check if this could be an instant call (host + attendee)
            const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
            const myRole = this._currentUserRole;
            const mapping = this._mappingCache.get(boundAttendeeId);

            // If we don't have mapping yet, this might be an instant call scenario
            if (
              !mapping &&
              (myRole === "host" || myRole === "attendee" || myRole === "guest")
            ) {
              console.log(
                `[chimeHandler] No mapping for ${boundAttendeeId} yet - this might be instant call, allowing video temporarily`
              );
              // Allow the video to show temporarily until mapping arrives
            } else {
              // Remove existing video if any
              const existingVideo = document.querySelector(
                `video[data-tile-id="${tileId}"]`
              );
              if (existingVideo) {
                coreChime.unbindVideoElement(tileId);
                existingVideo.remove();

                // Mark container as available
                const container = existingVideo.closest(".border.rounded");
                if (container && container.parentElement) {
                  container.parentElement.removeAttribute("data-occupied");
                }
              }
              return;
            }
          } else {
            // Remove existing video if any
            const existingVideo = document.querySelector(
              `video[data-tile-id="${tileId}"]`
            );
            if (existingVideo) {
              coreChime.unbindVideoElement(tileId);
              existingVideo.remove();

              // Mark container as available
              const container = existingVideo.closest(".border.rounded");
              if (container && container.parentElement) {
                container.parentElement.removeAttribute("data-occupied");
              }
            }
            return;
          }
        }

        // Check if video already exists for this tile
        let video = document.querySelector(`video[data-tile-id="${tileId}"]`);

        // Check if this attendee already has a video element
        const existingVideo = document.querySelector(
          `video[data-attendee-id="${boundAttendeeId}"]`
        );
        
        if (existingVideo && hasStream) {
          // Video element exists and we have a stream - REBIND it!
          console.log(
            `[chimeHandler] ✅ Video element exists for ${boundAttendeeId} with stream - REBINDING to tile ${tileId}`
          );
          
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler.rebindVideoElement', `Rebinding Video: ${boundAttendeeId.substring(0,8)}...`, {
              tileId,
              attendeeId: boundAttendeeId,
              reason: "Video toggled back ON - rebind to tile"
            });
          }
          
          // Update tile ID attribute (might have changed)
          existingVideo.setAttribute("data-tile-id", tileId);
          
          // REBIND to Chime tile
          coreChime.bindVideoElement(tileId, existingVideo);
          console.log(`[chimeHandler] ✅ Rebound video element to tile ${tileId}`);
          
          // Force video element to play (in case it was paused)
          if (existingVideo.paused) {
            existingVideo.play().catch(e => console.warn("[chimeHandler] Auto-play failed:", e));
          }
          
          // Diagnostic: Check if video element has a stream after short delay
          setTimeout(() => {
            const hasVideoTrack = existingVideo.srcObject && existingVideo.srcObject.getVideoTracks().length > 0;
            const isPlaying = !existingVideo.paused && existingVideo.currentTime > 0;
            console.log(`[chimeHandler] 🔍 Video diagnostic for tile ${tileId}:`, {
              hasVideoTrack,
              isPlaying,
              readyState: existingVideo.readyState,
              videoWidth: existingVideo.videoWidth,
              videoHeight: existingVideo.videoHeight
            });
            
            if (typeof DebugLogger !== "undefined") {
              DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._checkVideoStreamAfterDelay', `Video Stream Check: ${boundAttendeeId.substring(0,8)}...`, {
                hasVideoTrack,
                isPlaying,
                readyState: existingVideo.readyState,
                dimensions: `${existingVideo.videoWidth}x${existingVideo.videoHeight}`,
                warning: !hasVideoTrack ? "⚠️ NO VIDEO TRACK!" : (isPlaying ? "✅ Playing" : "⚠️ Not playing")
              });
            }
            
            // If no stream after 1 second, try forcing a re-bind
            if (!hasVideoTrack) {
              console.warn(`[chimeHandler] ⚠️ Video element has no stream after rebind - forcing re-bind...`);
              coreChime.bindVideoElement(tileId, existingVideo);
              
              // Check again after another second
              setTimeout(() => {
                const stillNoTrack = !existingVideo.srcObject || existingVideo.srcObject.getVideoTracks().length === 0;
                console.log(`[chimeHandler] 🔍 After force re-bind:`, {
                  hasVideoTrack: !stillNoTrack,
                  videoWidth: existingVideo.videoWidth,
                  videoHeight: existingVideo.videoHeight
                });
                
                if (typeof DebugLogger !== "undefined") {
                  DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._checkVideoStreamAfterDelay', `Force Re-bind Result: ${boundAttendeeId.substring(0,8)}...`, {
                    success: !stillNoTrack,
                    dimensions: `${existingVideo.videoWidth}x${existingVideo.videoHeight}`,
                    warning: stillNoTrack ? "❌ STILL NO STREAM - SDK ISSUE!" : "✅ Re-bind worked!"
                  });
                }
              }, 1000);
            }
          }, 1000);
          
          return;
        }
        
        if (existingVideo && !hasStream) {
          console.log(
            `[chimeHandler] Video element exists for ${boundAttendeeId} but no stream - keeping element`
          );
          return;
        }
        
        // Check if attendee is already tracked (but no video element found - shouldn't happen)
        if (this._attendeesWithVideos.has(boundAttendeeId)) {
          console.log(
            `[chimeHandler] ⚠️ Attendee ${boundAttendeeId} tracked but no video element found - will recreate`
          );
          this._attendeesWithVideos.delete(boundAttendeeId);
        }

        // If we reach here, no existing video element was found - need to create one
        console.log(`[chimeHandler] Creating new video element for ${boundAttendeeId} tile ${tileId}`);
        
        if (!video) {
          // First check if this attendee is already mapped to a container
          const existingMappedContainer = document.querySelector(
            `[data-attendee-id="${boundAttendeeId}"]`
          );

          let container = null;

          if (existingMappedContainer) {
            // Check if this container already has a video element
            const existingVideo =
              existingMappedContainer.querySelector("video");
            if (existingVideo) {
              console.log(
                `[chimeHandler] Container ${existingMappedContainer.id} already has video element, skipping duplicate creation`
              );
              return;
            }

            console.log(
              `[chimeHandler] Attendee ${boundAttendeeId} already mapped to ${existingMappedContainer.id}, using existing container`
            );
            container = existingMappedContainer;
          } else {
            // Find appropriate container using role-based system
            container = this._findAvailableTileContainer(boundAttendeeId);

            if (!container) {
              console.warn(
                "[chimeHandler] No appropriate container available for",
                boundAttendeeId
              );
              return;
            }

            console.log(
              `[chimeHandler] Found new container ${container.id} for ${boundAttendeeId}`
            );
          }

          // Create video element
          video = this._createVideoElement(tileId, boundAttendeeId);
          container.appendChild(video);

          // Track this attendee as having a video element
          this._attendeesWithVideos.add(boundAttendeeId);

          // Make container visible immediately when video is added
          container.classList.remove("hidden");
          container.classList.add("active");
          container.setAttribute("data-attendee-id", boundAttendeeId);
          
          // Ensure container has position: relative for overlay positioning (without breaking layout)
          const computedPos = window.getComputedStyle(container).position;
          if (computedPos === "static") {
            container.style.position = "relative";
          }
          
          // Create debug overlay (absolute positioned, won't affect video sizing)
          this._createDebugOverlay(container, tileId, boundAttendeeId);
          
          // Create VIDEO OFF indicator (hidden by default, shown when video disabled)
          this._createVideoOffIndicator(container, boundAttendeeId);
          
          // Create status icons (camera & mic indicators)
          this._createStatusIcons(container, boundAttendeeId);

          console.log(
            `[chimeHandler] Created and appended video to ${container.id} (container made visible) - tracked attendee ${boundAttendeeId}`
          );

          // For local videos, call UiMapTileToCard to properly map to container
          console.log(
            `[chimeHandler] About to check isLocal: isLocal=${isLocal}, boundAttendeeId=${boundAttendeeId}`
          );
          if (isLocal) {
            console.log(
              `[chimeHandler] Processing LOCAL video for ${boundAttendeeId}`
            );
            // Create mapping for local user immediately
            const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
            const myExternalUserId =
              coreChime.getLocalIdentifiers().externalUserId;

            console.log(
              `[chimeHandler] Local identifiers - attendeeId: ${myAttendeeId}, externalUserId: ${myExternalUserId}`
            );

            if (myAttendeeId && myExternalUserId) {
              // Get the current user's role from _currentUserRole (set from meetingInfo)
              const currentRole = chimeHandler._currentUserRole || "attendee";
              const uid = myExternalUserId || "";

              // Map role names to standardized format
              let role = currentRole;
              if (role === "guest") {
                role = "attendee";
              } else if (role === "collab") {
                role = "collaborator";
              }

              // Create mapping for local user
              const localMapping = {
                role: role,
                uid: uid,
                connectionId: myAttendeeId,
                displayName: `User ${uid}`,
                avatar: "",
                username: `user_${uid}`,
                externalUserId: myExternalUserId,
              };

              // Don't store current user's mapping in cache - we already know our role
              // The cache is only for OTHER participants
              console.log(
                `[chimeHandler] Created local mapping for ${myAttendeeId} (not stored in cache):`,
                localMapping
              );

              // Now call UiMapTileToCard
              console.log(
                `[chimeHandler] About to call UiMapTileToCard for local video: ${myAttendeeId}, role: ${role}`
              );
              this.UiMapTileToCard(myAttendeeId, role);
              console.log(
                `[chimeHandler] UiMapTileToCard call completed for local video`
              );
            }
          } else {
            // For remote videos, call UiMapTileToCard to properly map to container
            console.log(
              `[chimeHandler] Processing REMOTE video for ${boundAttendeeId}`
            );
            const mapping = this._mappingCache.get(boundAttendeeId);
            if (mapping) {
              console.log(
                `[chimeHandler] Calling UiMapTileToCard for remote video: ${boundAttendeeId}, role: ${mapping.role}`
              );
              this.UiMapTileToCard(boundAttendeeId, mapping.role);
            } else {
              console.warn(
                `[chimeHandler] No mapping found for remote video ${boundAttendeeId} - container will be updated when mapping arrives`
              );
              // Still show container even without mapping (will be updated when mapping arrives)
              container.classList.remove("hidden");
              container.classList.add("active");
              container.setAttribute("data-attendee-id", boundAttendeeId);
            }
          }
        }

        // Bind Chime stream to video element
        coreChime.bindVideoElement(tileId, video);

        // Clean up any inactive containers
        this._cleanupInactiveContainers();

        // Update layout using role-based system
        this.UiShiftTileLayout();
      }
    });

    // Handle tile removed - ONLY for disconnects, NOT for video toggle
    // Tiles should remain throughout the call, just show/hide video
    window.addEventListener("coreChime:tile-removed", (e) => {
      const { tileId } = e.detail;
      console.log("[chimeHandler] Tile removed event (disconnect/leave):", tileId);
      
      // Find the video element for this tile
      const video = document.querySelector(`video[data-tile-id="${tileId}"]`);
      if (video) {
        const attendeeId = video.getAttribute("data-attendee-id");
        console.log("[chimeHandler] Cleaning up video for disconnected attendee:", attendeeId);
        
        // Unbind from Chime
        try {
          coreChime.unbindVideoElement(tileId);
        } catch (e) {
          console.log("[chimeHandler] Unbind failed (already removed):", e.message);
        }
        
        // Remove from tracking
        if (attendeeId) {
          this._attendeesWithVideos.delete(attendeeId);
        }
        
        // Remove the video element
        video.remove();
        console.log("[chimeHandler] ✅ Cleaned up video for tile", tileId);
      }
    });
    
    // Listen for audio status changes (SDK volume indicator)
    window.addEventListener("coreChime:audio-status-changed", (e) => {
      const { attendeeId, muted, volume, signalStrength } = e.detail;
      console.log("[chimeHandler] Audio status changed", e.detail);
      
      // Update debug overlay and status icons with audio status
      if (attendeeId) {
        this._updateDebugOverlay(attendeeId, { 
          audioEnabled: !muted,
          connectionStrength: signalStrength > 0.5 ? 'Good' : signalStrength > 0.2 ? 'Fair' : 'Poor'
        });
        this._updateStatusIcons(attendeeId, { audioEnabled: !muted }); // Update mic icon
      }
    });

    window.addEventListener("coreChime:data-received", (e) => {
      const { flag, payload, from } = e.detail;
      this.handleDataReceive(flag, payload, from);
    });

    console.log("[chimeHandler] [_wireCoreChimeEvents] Complete");
  }

  /* ====================================================================
   * Wire CamMicPermissions Events
   * ==================================================================== */
  static _wireCamMicEvents() {
    console.log("[chimeHandler] [_wireCamMicEvents] Start - wiring chime:join:meeting event");

    // Listen to chime:join:meeting event from callFlowHandler
    document.addEventListener("chime:join:meeting", async (e) => {
      const {
        meetingId,
        meetingUrl,
        userId,
        role,
        meetingInfo,
        attendeeInfo,
        callType,
      } = e.detail;
      console.log("[chimeHandler] Received chime:join:meeting event", {
        meetingId,
        meetingUrl,
        userId,
        role,
        callType,
        meetingInfo,
        attendeeInfo,
      });

      // Check if we have the required Chime meeting data
      if (!meetingInfo && !attendeeInfo) {
        console.warn(
          "[chimeHandler] Missing meetingInfo or attendeeInfo - cannot join Chime meeting yet"
        );
        console.warn(
          "[chimeHandler] Meeting will be joined when Chime credentials are available"
        );
        return;
      }

      try {
        // Store the user's role for video container mapping
        this._currentUserRole = role || "attendee";
        console.log("[chimeHandler] User role set to:", this._currentUserRole);

        // Initialize coreChime with meeting info
        console.log("[chimeHandler] Initializing coreChime...");

        // Wrap meeting and attendee info in proper structure
        const meetingInfoWrapped = {
          Meeting: meetingInfo,
        };

        // Extract the actual Attendee object from the response structure
        // attendeeInfo might be in format: { MeetingId, Attendee: {...}, isHost, role }
        const actualAttendee = attendeeInfo?.Attendee || attendeeInfo;
        console.log(
          "[chimeHandler] Extracted actual attendee:",
          actualAttendee
        );
        console.log(
          "[chimeHandler] Attendee ExternalUserId:",
          actualAttendee?.ExternalUserId || "N/A"
        );

        const attendeeInfoWrapped = {
          Attendee: actualAttendee,
        };

        console.log("[chimeHandler] Wrapped meeting info:", meetingInfoWrapped);
        console.log(
          "[chimeHandler] Wrapped attendee info:",
          attendeeInfoWrapped
        );

        await coreChime.initialize({
          meetingInfo: meetingInfoWrapped,
          attendeeInfo: attendeeInfoWrapped,
        });

        // Join the meeting with BOTH audio and video OFF (user must manually turn ON)
        // Use mockCallData mediaType if available, fallback to callType
        const mediaType = window.mockCallData?.mediaType || callType;
        console.log(
          "[chimeHandler] Joining coreChime with media OFF - mediaType:",
          mediaType
        );
        
        // ALWAYS join with media OFF - user must manually turn ON
        await coreChime.join({
          enableAudio: false,
          enableVideo: false,
        });

        console.log("[chimeHandler] Successfully joined Chime meeting with media OFF");
        
        // Update UI state to reflect OFF
        if (window.vueState && window.vueState.meeting) {
          window.vueState.meeting.videoFeed = false;
          window.vueState.meeting.audioFeed = false;
        }
        if (window.settings) {
          window.settings.callCamStatus = false;
          window.settings.callMicStatus = false;
        }
        
        console.log("[chimeHandler] ✅ Joined with media OFF - user must manually turn ON video/audio");
      } catch (error) {
        console.error("[chimeHandler] Error joining Chime meeting:", error);
      }
    });

    console.log("[chimeHandler] [_wireCamMicEvents] Complete");
  }

  /* ====================================================================
   * Parse meetingInfo from URL parameter
   * ==================================================================== */
  static _parseMeetingInfo() {
    const params = new URLSearchParams(window.location.search);
    const meetingInfoB64 = params.get("meetingInfo");

    if (!meetingInfoB64) {
      console.warn("[chimeHandler] No meetingInfo parameter found in URL");
      this._updateStatus("No meeting info. Add ?meetingInfo=BASE64 to URL");
      return;
    }

    try {
      const meetingInfoJson = atob(meetingInfoB64);
      this._meetingMetadata = JSON.parse(meetingInfoJson);
      console.log("[chimeHandler] Meeting info parsed:", this._meetingMetadata);

      // Extract current user's role from meetingInfo
      this._currentUserRole = this._meetingMetadata.role || "attendee";

      // Map old role names to new ones if needed
      if (this._currentUserRole === "guest") {
        this._currentUserRole = "attendee";
      }

      console.log("[chimeHandler] Current user role:", this._currentUserRole);
      console.log(
        "[chimeHandler] Full meeting metadata:",
        this._meetingMetadata
      );
      console.log(
        "[chimeHandler] ExternalUserId:",
        this._meetingMetadata?.Attendee?.ExternalUserId
      );

      // Update UI with meeting metadata
      if (this._ui.labelMeetingId) {
        this._ui.labelMeetingId.textContent =
          this._meetingMetadata?.MeetingId || "-";
      }
      if (this._ui.labelMeetingType) {
        const roleToDisplay = this._meetingMetadata?.role || "-";
        console.log(
          "[chimeHandler] Setting UI role display to:",
          roleToDisplay
        );
        console.log(
          "[chimeHandler] UI element found:",
          this._ui.labelMeetingType
        );
        console.log(
          "[chimeHandler] Current UI element text:",
          this._ui.labelMeetingType.textContent
        );
        this._ui.labelMeetingType.textContent = roleToDisplay;
        console.log(
          "[chimeHandler] UI element text after update:",
          this._ui.labelMeetingType.textContent
        );
      } else {
        console.warn("[chimeHandler] labelMeetingType UI element not found!");
      }

      this._updateStatus('Meeting info loaded. Click "Join Meeting" to start.');
    } catch (error) {
      console.error("[chimeHandler] Error parsing meetingInfo:", error);
      this._updateStatus("Error parsing meeting info");
    }
  }

  /* ====================================================================
   * handleJoin(opts)
   * Prepares required permissions + policies before calling coreChime.join
   * ==================================================================== */
  static async handleJoin(opts) {
    console.log("[chimeHandler] [handleJoin]", opts);

    // Check if we have meetingInfo
    if (!this._meetingMetadata) {
      DebugLogger.addLog(
        "setuping up",
        "CRITICAL",
        "handleJoin",
        "No meeting info available. Please provide ?meetingInfo parameter in URL."
      );
      return;
    }

    // Check permissions
    const needCamera = opts.enableVideo !== false;
    const needMicrophone = opts.enableAudio !== false;

    const cameraOk = !needCamera || this._permissionState.camera === "granted";
    const microphoneOk =
      !needMicrophone || this._permissionState.microphone === "granted";

    if (!cameraOk || !microphoneOk) {
      console.log("[chimeHandler] Permissions not ready - requesting");
      this._pendingJoin = opts;

      // Reflect the required mode for the permission UI
      try {
        window.callMode = needCamera && needMicrophone
          ? "videoCall"
          : (!needCamera && needMicrophone ? "audioOnlyCall" : "videoOnlyCall");
      } catch (_) {}

      // ❌ DISABLED - CallHandler manages permission UI state, not chimeHandler
      // Tell Vue to show the permission screen
      // try {
      //   if (typeof CallHandler !== "undefined" && CallHandler.dipatchUI) {
      //     // Determine if caller or callee based on current side
      //     const side = CallHandler._currentSide;
      //     const permissionState = side === "caller" ? "caller:waitingForCamMicPermissions" : "callee:waitingForCamMicPermissions";
      //     CallHandler.dipatchUI(permissionState, "");
      //   } else {
      //     document.dispatchEvent(new CustomEvent("chime-ui::state", { detail: { state: "callee:waitingForCamMicPermissions", substate: "", ts: Date.now() } }));
      //   }
      // } catch (_) {}

      // Attempt to refresh permission prompts UI immediately
      try { window.__updatePermissionPrompts && window.__updatePermissionPrompts(); } catch (_) {}
      return;
    }

    // Permissions ready - proceed with join
    await this._executeJoin(opts);
  }

  /* ====================================================================
   * _executeJoin(opts)
   * Actually join the meeting via coreChime
   * ==================================================================== */
  static async _executeJoin(opts) {
    console.log("[chimeHandler] [_executeJoin]", opts);

    try {
      // Wait for Chime SDK to load
      await this._waitForChimeSDK();

      // Check if we have Meeting data (from call flow) or need to use URL-based structure
      console.log("[chimeHandler] Meeting data check:", {
        hasMeeting: !!this._meetingMetadata.Meeting,
        hasAttendee: !!this._meetingMetadata.Attendee,
        meetingId: this._meetingMetadata.MeetingId,
        meetingStructure: this._meetingMetadata.Meeting
          ? "from backend"
          : "fallback",
      });

      let meetingInfo, attendeeInfo;

      if (this._meetingMetadata.Meeting) {
        // Call flow: Use the Meeting data directly from backend
        console.log("[chimeHandler] Using Meeting data from call flow backend");
        meetingInfo = {
          Meeting: this._meetingMetadata.Meeting,
        };
        attendeeInfo = {
          Attendee: this._meetingMetadata.Attendee,
        };
      } else {
        // URL-based: Use the structure from URL parameter
        console.log("[chimeHandler] Using URL-based meeting structure");
        meetingInfo = {
          Meeting: {
            MeetingId: this._meetingMetadata.MeetingId,
            MediaPlacement: {
              AudioHostUrl: "127.0.0.1:3478", // Placeholder
              AudioFallbackUrl:
                "wss://wss.k.m2.as2.app.chime.aws:443/calls/" +
                this._meetingMetadata.MeetingId,
              SignalingUrl:
                "wss://signal.m2.as2.app.chime.aws/control/" +
                this._meetingMetadata.MeetingId,
              TurnControlUrl:
                "https://4804.cell.ap-northeast-1.meetings.chime.aws/v2/turn_sessions",
              EventIngestionUrl:
                "https://data.svc.an1.ingest.chime.aws/v1/client-events",
              ScreenDataUrl:
                "wss://bitpw.m2.as2.app.chime.aws:443/v2/screen/" +
                this._meetingMetadata.MeetingId,
              ScreenSharingUrl:
                "wss://bitpw.m2.as2.app.chime.aws:443/v2/screen/" +
                this._meetingMetadata.MeetingId,
              ScreenViewingUrl:
                "wss://bitpw.m2.as2.app.chime.aws/ws/connect?passcode=null&viewer_uuid=null&X-BitHub-Call-Id=" +
                this._meetingMetadata.MeetingId,
            },
            MediaRegion: "ap-southeast-2",
            MeetingArn: `arn:aws:chime:ap-northeast-1:701253760804:meeting/${this._meetingMetadata.MeetingId}`,
            ExternalMeetingId: "role-test",
            TenantIds: [],
          },
        };
        attendeeInfo = {
          Attendee: this._meetingMetadata.Attendee,
        };
      }

      console.log(
        "[chimeHandler] MeetingMetadata structure:",
        this._meetingMetadata
      );
      console.log(
        "[chimeHandler] Attendee from metadata:",
        this._meetingMetadata.Attendee
      );

      console.log("[chimeHandler] Transformed meetingInfo:", meetingInfo);
      console.log("[chimeHandler] Transformed attendeeInfo:", attendeeInfo);

      // Initialize coreChime
      await coreChime.initialize({
        meetingInfo: meetingInfo,
        attendeeInfo: attendeeInfo,
        mediaPolicy: {},
      });

      // Join
      await coreChime.join(opts);

      console.log("[chimeHandler] [_executeJoin] Complete");
    } catch (error) {
      console.error("[chimeHandler] [_executeJoin] Error:", error);
      DebugLogger.addLog(
        "terminated",
        "CRITICAL",
        "_executeJoin",
        `Failed to join meeting: ${error.message}`
      );
    }
  }

  /* ====================================================================
   * _waitForChimeSDK()
   * Wait for Chime SDK to load (max 10 seconds)
   * ==================================================================== */
  static async _waitForChimeSDK() {
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100; // Check every 100ms
    let elapsed = 0;

    return new Promise((resolve, reject) => {
      const check = () => {
        const SDK =
          window.ChimeSDK ||
          window.AmazonChimeSDK ||
          window.chimeSDK ||
          window.appChimeSDK;

        if (SDK) {
          console.log("[chimeHandler] Chime SDK detected");
          resolve();
        } else if (elapsed >= maxWait) {
          reject(new Error("Chime SDK failed to load within 10 seconds"));
        } else {
          elapsed += checkInterval;
          setTimeout(check, checkInterval);
        }
      };
      check();
    });
  }

  /* ====================================================================
   * Force Media Controls Off/On (for audio-only calls and grace period)
   * ==================================================================== */
  static async forceControlsOff() {
    console.log("[chimeHandler] [forceControlsOff] ⏸️ GRACE PERIOD - Forcing audio/video OFF");
    
    // Disable video at SDK level
    if (coreChime && coreChime.toggleVideo) {
      coreChime.toggleVideo(false);
      console.log("[chimeHandler] ✅ Video toggled OFF at SDK level");
    }
    
    // CRITICAL: Stop audio input stream completely (not just mute)
    if (coreChime && coreChime._audioVideo) {
      try {
        console.log("[chimeHandler] Stopping audio input stream for grace period...");
        
        // Stop the audio input device (this actually stops transmission)
        if (typeof coreChime._audioVideo.stopAudioInput === 'function') {
          await coreChime._audioVideo.stopAudioInput();
          console.log("[chimeHandler] ✅ Audio input stream STOPPED (transmission halted)");
        } else {
          // Fallback to mute if stopAudioInput doesn't exist
          coreChime._audioVideo.realtimeMuteLocalAudio();
          console.log("[chimeHandler] ⚠️ Fallback: Audio muted (stopAudioInput not available)");
        }
      } catch (error) {
        console.error("[chimeHandler] ❌ Error stopping audio input:", error);
      }
    }
    
    // Update Vue state to reflect OFF status
    if (window.vueState && window.vueState.meeting) {
      window.vueState.meeting.videoFeed = false;
      window.vueState.meeting.audioFeed = false;
      console.log("[chimeHandler] Vue state updated - video/audio OFF");
    }
    if (window.settings) {
      window.settings.callCamStatus = false;
      window.settings.callMicStatus = false;
      console.log("[chimeHandler] Settings state updated - cam/mic OFF");
    }
    
    // Update debug overlays
    const localIds = coreChime?.getLocalIdentifiers?.();
    if (localIds && localIds.attendeeId) {
      this._updateDebugOverlay(localIds.attendeeId, { 
        audioEnabled: false,
        videoEnabled: false 
      });
      
      // Update video off indicator to show GRACE PERIOD message
      this._updateVideoOffIndicatorForGrace(localIds.attendeeId, true);
    }
    
    console.log("[chimeHandler] ✅ Media controls forced OFF (Audio stream STOPPED + Video OFF)");
  }

  static async forceControlsOn() {
    console.log("[chimeHandler] [forceControlsOn] ▶️ RESUMING - Re-enabling audio");
    
    // CRITICAL: Restart audio input stream
    if (coreChime && coreChime._audioVideo) {
      try {
        console.log("[chimeHandler] Restarting audio input stream after grace period...");
        
        // List available audio devices
        const audioDevices = await coreChime._audioVideo.listAudioInputDevices();
        if (audioDevices && audioDevices.length > 0) {
          // Get preferred mic or use first available
          const preferredMic = localStorage.getItem("CamMicPreferred-microphone") || audioDevices[0].deviceId;
          
          // Restart audio input
          if (typeof coreChime._audioVideo.chooseAudioInputDevice === 'function') {
            await coreChime._audioVideo.chooseAudioInputDevice(preferredMic);
            console.log("[chimeHandler] ✅ Audio input restarted:", preferredMic);
          } else if (typeof coreChime._audioVideo.startAudioInput === 'function') {
            await coreChime._audioVideo.startAudioInput(preferredMic);
            console.log("[chimeHandler] ✅ Audio input restarted (old API):", preferredMic);
          }
          
          // Unmute after restarting
          coreChime._audioVideo.realtimeUnmuteLocalAudio();
          console.log("[chimeHandler] ✅ Audio unmuted");
        }
      } catch (error) {
        console.error("[chimeHandler] ❌ Error restarting audio input:", error);
      }
    }
    
    // Update Vue state to reflect audio ON
    if (window.vueState && window.vueState.meeting) {
      window.vueState.meeting.audioFeed = true;
      window.vueState.meeting.videoFeed = false; // Keep video OFF
      console.log("[chimeHandler] Vue state updated - audio ON, video OFF");
    }
    if (window.settings) {
      window.settings.callMicStatus = true;
      window.settings.callCamStatus = false; // Keep video OFF
      console.log("[chimeHandler] Settings state updated - mic ON, cam OFF");
    }
    
    // Update debug overlays
    const localIds = coreChime?.getLocalIdentifiers?.();
    if (localIds && localIds.attendeeId) {
      this._updateDebugOverlay(localIds.attendeeId, { 
        audioEnabled: true,
        videoEnabled: false // Keep video OFF, user can enable manually
      });
      
      // Update video off indicator to remove GRACE PERIOD message
      this._updateVideoOffIndicatorForGrace(localIds.attendeeId, false);
    }
    
    console.log("[chimeHandler] ✅ Audio re-enabled (Stream restarted + Unmuted)");
  }

  /* ====================================================================
   * handleVideoToggle(on: boolean)
   * ==================================================================== */
  static handleVideoToggle(on) {
    console.log("[chimeHandler] [handleVideoToggle] Called with:", on);
    
    // Check if in chime call and joined
    const isInChimeCall = coreChime && coreChime._meetingSession && coreChime._audioVideo;
    console.log("[chimeHandler] [handleVideoToggle] isInChimeCall:", isInChimeCall);
    
    if (!isInChimeCall) {
      // Not in chime call - use CamMic preview
      console.log("[chimeHandler] [handleVideoToggle] Not in chime - using CamMic preview");
      
      if (on) {
        // Start video preview
        console.log("[chimeHandler] [handleVideoToggle] Starting CamMic video preview");
        window.dispatchEvent(new CustomEvent('CamMic:Preview:Start'));
      } else {
        // Stop video preview (stop streams)
        console.log("[chimeHandler] [handleVideoToggle] Stopping CamMic streams");
        window.dispatchEvent(new CustomEvent('CamMic:Streams:Stop'));
      }
      
      // Update UI state
      if (window.vueState && window.vueState.meeting) {
        window.vueState.meeting.videoFeed = on;
      }
      if (window.settings) {
        window.settings.callCamStatus = on;
      }
      
      return;
    }
    
    // In chime call - use existing chime toggle logic
    console.log("[chimeHandler] [handleVideoToggle] In chime - using chime video toggle");

    // Check grace period first
    if (window.mockCallData?.isInGrace) {
      const btn = document.querySelector('[data-video-toggle]');
      if (btn) {
        btn.setAttribute('disabled-in-grace', 'true');
      }
      console.log("[chimeHandler] Video toggle blocked: grace period active");
      DebugLogger.addLog("connected", "NOTICE", "handleVideoToggle", 
        "Video toggle blocked during grace period");
      return;
    }

    // Check if audio-only call
    if (window.mockCallData?.mediaType === "audio") {
      console.log("[chimeHandler] Video toggle blocked: audio-only call");
      DebugLogger.addLog("connected", "NOTICE", "handleVideoToggle", 
        "Video toggle blocked during audio-only call");
      alert("❌ Video is not available in audio-only calls");
      return;
    }

    console.log(`[chimeHandler] [handleVideoToggle] Requesting video: ${on ? 'ON' : 'OFF'}`);
    
    // Get local attendee ID
    const localAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
    
    if (localAttendeeId) {
      // Show loading overlay with 200ms delay (prevents flicker for instant toggles)
      const showSpinner = setTimeout(() => {
        this._showLoadingOverlay(localAttendeeId, on ? "Turning video on..." : "Turning video off...");
      }, 200);
      
      // Track pending state
      this._pendingVideoToggles[localAttendeeId] = {
        expected: on,
        timestamp: Date.now(),
        showSpinnerTimeout: showSpinner,
        // Auto-hide after 5 seconds
        timeout: setTimeout(() => {
          console.warn(`[handleVideoToggle] ⏱️ Timeout - hiding overlay after 5s for ${localAttendeeId.substring(0,8)}...`);
          this._hideLoadingOverlay(localAttendeeId);
        }, 5000)
      };
    }
    
    // Toggle video in Chime SDK - DON'T update UI here!
    // The tile update event will fire with the ACTUAL state from Chime
    coreChime.toggleVideo(on);
    
    // Note: VIDEO OFF indicator will be updated by tile event (source of truth)
  }

  /* ====================================================================
   * handleAudioToggle(on: boolean)
   * ==================================================================== */
  static handleAudioToggle(on) {
    console.log("[chimeHandler] [handleAudioToggle] Called with:", on);
    
    // Check if in chime call and joined
    const isInChimeCall = coreChime && coreChime._meetingSession && coreChime._audioVideo;
    console.log("[chimeHandler] [handleAudioToggle] isInChimeCall:", isInChimeCall);
    
    if (!isInChimeCall) {
      // Not in chime call - CamMic handles audio automatically
      console.log("[chimeHandler] [handleAudioToggle] Not in chime - CamMic handles audio");
      
      // Update UI state only (CamMic utility manages actual audio)
      if (window.vueState && window.vueState.meeting) {
        window.vueState.meeting.audioFeed = on;
      }
      if (window.settings) {
        window.settings.callMicStatus = on;
      }
      
      return;
    }
    
    // In chime call - use existing chime toggle logic
    console.log("[chimeHandler] [handleAudioToggle] In chime - using chime audio toggle");

    // Check grace period first
    if (window.mockCallData?.isInGrace) {
      const btn = document.querySelector('[data-audio-toggle]');
      if (btn) {
        btn.setAttribute('disabled-in-grace', 'true');
      }
      console.log("[chimeHandler] Audio toggle blocked: grace period active");
      DebugLogger.addLog("connected", "NOTICE", "handleAudioToggle", 
        "Audio toggle blocked during grace period");
      return;
    }

    coreChime.toggleAudio(on);
    
    // Update debug overlay for local attendee
    const localIds = coreChime.getLocalIdentifiers();
    if (localIds && localIds.attendeeId) {
      this._updateDebugOverlay(localIds.attendeeId, { audioEnabled: on });
    }
  }

  /* ====================================================================
   * handleDataSend(flag, payload)
   * ==================================================================== */
  static handleDataSend(flag, payload) {
    console.log("[chimeHandler] [handleDataSend]", { flag, payload });

    // Send via Chime
    coreChime.sendData(flag, payload);

    // Show alert for each action type
    switch (flag) {
      case "chat":
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "handleDataSend",
          `Chat sent: ${payload.message || payload.text}`
        );
        break;
      case "gift":
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "handleDataSend",
          `Gift sent: ${payload.giftType || "gift"}`
        );
        break;
      case "reaction":
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "handleDataSend",
          `Reaction sent: ${payload.emoji || "👍"}`
        );
        break;
      case "tip":
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "handleDataSend",
          `Tip sent: $${payload.amount || "0"}`
        );
        break;
      case "chat_promo":
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "handleDataSend",
          `Promo chat sent: ${payload.text || "promo"}`
        );
        break;
      default:
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "handleDataSend",
          `${flag} sent`
        );
        break;
    }
  }

  /* ====================================================================
   * handleDataReceive(flag, payload, from)
   * ==================================================================== */
  static handleDataReceive(flag, payload, from) {
    // Check if message is for us (target filtering)
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
    const target = payload.target || "all";

    // Mapping messages always processed (no target check)
    if (flag !== "mapping") {
      if (target !== "all" && target !== myAttendeeId) {
        console.log(
          "[chimeHandler] Message not for us (target: " + target + "), ignoring"
        );
        return;
      }
    }

    switch (flag) {
      case "mapping":
        this.handleIncomingMapping(payload, from);
        break;
      case "video-toggle":
        this.handleIncomingVideoToggle(payload, from);
        break;
      case "audio-toggle":
        this.handleIncomingAudioToggle(payload, from);
        break;
      case "reaction":
        this.handleIncomingReaction(payload, from);
        break;
      case "gift":
        this.handleIncomingGift(payload, from);
        break;
      case "tip":
        this.handleIncomingTip(payload, from);
        break;
      case "chat":
        this.handleIncomingChat(payload, from);
        break;
      case "chatPromo":
        this.handleIncomingChatPromoBubble(payload, from);
        break;
      default:
        console.warn("[chimeHandler] Unknown data flag:", flag);
    }
  }

  /* ====================================================================
   * Incoming Data Handlers (use alerts for now - Vue will replace)
   * ==================================================================== */
  
  /* ====================================================================
   * handleIncomingVideoToggle - Remote User Toggled Video
   * ==================================================================== */
  static handleIncomingVideoToggle(payload, from) {
    const { videoEnabled, attendeeId } = payload;
    console.log("[chimeHandler] Remote video toggle received", { videoEnabled, attendeeId, from });
    
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler.handleRemoteVideoToggle', `Remote Video Toggle from ${attendeeId?.substring(0,8)}...`, {
        videoEnabled,
        attendeeId,
        from
      });
    }
    
    // Update the UI for this attendee
    if (attendeeId) {
      // Show loading overlay for remote toggle (with 200ms delay)
      const showSpinner = setTimeout(() => {
        this._showLoadingOverlay(attendeeId, ""); // Removed "Remote turning video on..." text
      }, 200);
      
      // Track pending state (will be cleared when tile update confirms)
      this._pendingVideoToggles[attendeeId] = {
        expected: videoEnabled,
        timestamp: Date.now(),
        showSpinnerTimeout: showSpinner,
        // Auto-hide after 5 seconds
        timeout: setTimeout(() => {
          console.warn(`[handleIncomingVideoToggle] ⏱️ Timeout - hiding overlay after 5s for ${attendeeId.substring(0,8)}...`);
          this._hideLoadingOverlay(attendeeId);
        }, 5000)
      };
      
      this._updateVideoOffIndicator(attendeeId, videoEnabled);
      this._updateDebugOverlay(attendeeId, { videoEnabled });
      this._updateStatusIcons(attendeeId, { videoEnabled }); // Update status icons
      console.log(`[chimeHandler] ✅ Updated remote video status: ${videoEnabled ? 'ON' : 'OFF'} for ${attendeeId}`);
    }
  }
  
  /* ====================================================================
   * handleIncomingAudioToggle - Remote User Toggled Audio
   * ==================================================================== */
  static handleIncomingAudioToggle(payload, from) {
    const { audioEnabled, attendeeId } = payload;
    console.log("[chimeHandler] Remote audio toggle received", { audioEnabled, attendeeId, from });
    
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler.handleRemoteAudioToggle', `Remote Audio Toggle from ${attendeeId?.substring(0,8)}...`, {
        audioEnabled,
        attendeeId,
        from
      });
    }
    
    // Update the debug overlay and status icons for this attendee
    if (attendeeId) {
      this._updateDebugOverlay(attendeeId, { audioEnabled });
      this._updateStatusIcons(attendeeId, { audioEnabled }); // Update status icons
      console.log(`[chimeHandler] ✅ Updated remote audio status: ${audioEnabled ? 'ON' : 'OFF'} for ${attendeeId}`);
    }
  }
  
  /* ====================================================================
   * handleIncomingMapping - ONE-ON-ONE Call Logic
   * 
   * 🔴 IMPORTANT: This handles ONE-ON-ONE instant calls only
   * 
   * For ONE-ON-ONE calls:
   * - Host sees Attendee
   * - Attendee sees Host
   * - Simple 1:1 mapping
   * 
   * TODO: GROUP CALL LOGIC GOES HERE
   * For group calls, will need:
   * - handleGroupMapping() for multi-participant logic
   * - Different visibility rules for host/collaborator/attendee
   * - Dynamic container allocation for 3+ participants
   * ==================================================================== */
  static handleIncomingMapping(payload, from) {
    // Get our own attendee ID
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;

    // Skip if this is our own mapping (we already know our own info)
    if (from.attendeeId === myAttendeeId) {
      console.log(
        "[chimeHandler] Skipping self-mapping (our own packet)",
        from.attendeeId
      );
      return;
    }

    // Store mapping for OTHER participants only
    this._mappingCache.set(from.attendeeId, {
      role: payload.role,
      uid: payload.uid,
      connectionId: payload.connectionId,
      displayName: payload.displayName,
      avatar: payload.avatar,
      username: payload.username,
      externalUserId: payload.externalUserId, // Use prefixed externalUserId from payload, not from Chime SDK
    });

    console.log(
      `[handleIncomingMapping] Stored mapping for ${from.attendeeId} (${payload.role}):`,
      {
        role: payload.role,
        uid: payload.uid,
        externalUserId: payload.externalUserId, // Show prefixed externalUserId from payload
        mappingCacheSize: this._mappingCache.size,
        mappingCacheKeys: Array.from(this._mappingCache.keys()),
      }
    );

    // Refresh video tiles to re-evaluate visibility with new mapping
    this._refreshVideoTilesForAttendee(from.attendeeId);

    // Clean up any inactive containers
    this._cleanupInactiveContainers();
  }

  static handleIncomingReaction(payload, from) {
    const emoji = payload.emoji || "❤️";
    const sender = from.externalUserId || "Unknown";
    
    DebugLogger.addLog(
      "connected",
      "NOTICE",
      "handleIncomingReaction",
      `Reaction from ${sender}: ${emoji}`
    );

    // Dispatch event for reactionsHandler to show on screen
    window.dispatchEvent(
      new CustomEvent("receiveReaction", {
        detail: {
          emoji: emoji,
          sender: sender,
          timestamp: Date.now()
        }
      })
    );
  }

  static handleIncomingGift(payload, from) {
    const giftId = payload.giftId || 1;
    const qty = payload.qty || 1;
    const sender = from.externalUserId || "Unknown";
    
    DebugLogger.addLog(
      "connected",
      "NOTICE",
      "handleIncomingGift",
      `Gift from ${sender}: ${giftId} (${qty})`
    );

    // Dispatch event for giftAnimationHandler to show animation
    window.dispatchEvent(
      new CustomEvent("receiveGift", {
        detail: {
          giftId: giftId,
          qty: qty,
          sender: sender,
          timestamp: Date.now()
        }
      })
    );
  }

  static handleIncomingTip(payload, from) {
    DebugLogger.addLog(
      "connected",
      "NOTICE",
      "handleIncomingTip",
      `Tip from ${from.externalUserId}: ${payload.amount} ${payload.currency}`
    );
  }

  static handleIncomingToast(payload, from) {
    DebugLogger.addLog(
      "connected",
      "NOTICE",
      "handleIncomingToast",
      `Toast from ${from.externalUserId}: ${payload.message}`
    );
  }

  static handleIncomingChat(payload, from) {
    console.log('[chimeHandler] 💬 Incoming chat message:', payload);
    
    DebugLogger.addLog(
      "connected",
      "NOTICE",
      "handleIncomingChat",
      `📩 Chat received from ${from.externalUserId}: ${payload.message || payload.text}`
    );

    // Dispatch event for chatHandler to render the message
    window.dispatchEvent(new CustomEvent('receiveChatMessage', {
      detail: {
        message: payload.message || payload.text,
        sender: from.externalUserId || 'Unknown',
        timestamp: payload.timestamp,
        from: from
      }
    }));
  }

  static handleIncomingChatPromoBubble(payload, from) {
    console.log('[chimeHandler] 🎁 Incoming chat promo:', payload);
    
    DebugLogger.addLog(
      "connected",
      "NOTICE",
      "handleIncomingChatPromoBubble",
      `Promo from ${from.externalUserId}: ${payload.cards ? payload.cards.length + ' cards' : 'promo'}`
    );

    // Dispatch ingest-cards event to render in chat
    if (payload.cards && Array.isArray(payload.cards)) {
      window.dispatchEvent(new CustomEvent('ingest-cards', {
        detail: payload.cards
      }));
      console.log('[chimeHandler] ✅ Chat promo cards dispatched for rendering');
    }
  }

  /* ====================================================================
   * handleEnd()
   * ==================================================================== */
  static handleEnd() {
    console.log("[chimeHandler] [handleEnd]");
    coreChime.leave("User ended call");
  }

  /* ====================================================================
   * handleEndForAll()
   * ==================================================================== */
  static handleEndForAll() {
    console.log("[chimeHandler] [handleEndForAll]");
    if (confirm("End call for all participants?")) {
      coreChime.endMeetingForAll();
    }
  }

  /* ====================================================================
   * setMaxAttendeesForScheduled(n)
   * ==================================================================== */
  static setMaxAttendeesForScheduled(n) {
    console.log("[chimeHandler] [setMaxAttendeesForScheduled]", n);
    coreChime.setMaxAttendees(n);
    if (this._ui.labelMaxParticipants) {
      this._ui.labelMaxParticipants.textContent = n.toString();
    }
  }

  /* ====================================================================
   * _sendMappingPacket(attendeeId, externalUserId)
   * Send mapping packet immediately after connecting
   * ==================================================================== */
  static _sendMappingPacket(attendeeId, externalUserId) {
    // Get the current user's role from _currentUserRole (set from meetingInfo)
    const currentRole = this._currentUserRole || "attendee";
    const uid = externalUserId || "";

    // Map role names to standardized format
    let role = currentRole;
    if (role === "guest") {
      role = "attendee";
    } else if (role === "collab") {
      role = "collaborator";
    }

    // Create prefixed externalUserId for proper role detection
    let prefixedExternalUserId = uid;
    if (role === "host") {
      prefixedExternalUserId = `host-${uid}`;
    } else if (role === "collaborator") {
      prefixedExternalUserId = `collab-${uid}`;
    } else if (role === "attendee") {
      prefixedExternalUserId = `attendee-${uid}`;
    }

    const mappingPayload = {
      uid,
      role,
      externalUserId: prefixedExternalUserId, // Add prefixed externalUserId for proper role detection
      connectionId: attendeeId,
      displayName: `User ${uid}`,
      avatar: "",
      username: `user_${uid}`,
    };

    console.log(
      `[_sendMappingPacket] Sending mapping: ${attendeeId} -> role: ${role}, uid: ${uid}, prefixedExternalUserId: ${prefixedExternalUserId}`
    );
    coreChime.sendData("mapping", mappingPayload);
  }

  /* ====================================================================
   * _createVideoElement(tileId, attendeeId) - Updated for Role-Based System
   * Creates a video element for fixed containers
   * ==================================================================== */
  static _createVideoElement(tileId, attendeeId) {
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    
    // CRITICAL: Check if this is a local tile
    const localIds = coreChime.getLocalIdentifiers();
    const isLocal = localIds && localIds.attendeeId === attendeeId;
    
    // Local video MUST be muted (you shouldn't hear yourself)
    // Remote video should NOT be muted (you need to hear others)
    video.muted = isLocal;
    
    video.style.width = "100%";
    video.style.height = "auto";
    video.style.borderRadius = "8px";
    video.style.backgroundColor = "#000";
    video.setAttribute("data-tile-id", tileId);
    video.setAttribute("data-attendee-id", attendeeId);
    
    console.log(`[_createVideoElement] Created ${isLocal ? 'LOCAL' : 'REMOTE'} video element, muted: ${video.muted}`);

    return video;
  }

  /* ====================================================================
   * _createVideoOffIndicator(container, attendeeId) - Video Off Overlay
   * Creates a "VIDEO OFF" indicator that shows when participant disables video
   * ==================================================================== */
  static _createVideoOffIndicator(container, attendeeId) {
    // Check if indicator already exists
    let indicator = container.querySelector('.video-off-indicator');
    if (indicator) {
      return indicator;
    }

    indicator = document.createElement("div");
    indicator.className = "video-off-indicator";
    indicator.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      display: none !important;
      visibility: hidden !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      background-color: rgba(0, 0, 0, 0.9) !important;
      color: #fff !important;
      font-size: 18px !important;
      font-weight: bold !important;
      z-index: 999 !important;
      border-radius: 8px !important;
      transition: none !important;
      animation: none !important;
    `;
    indicator.setAttribute("data-attendee-id", attendeeId);

    // Get user info if available
    let userData = null;
    if (window.CallHandler && window.CallHandler._invite) {
      const invite = window.CallHandler._invite;
      if (attendeeId.includes(invite.callerId)) {
        userData = invite.callerData;
      } else if (attendeeId.includes(invite.calleeId)) {
        userData = invite.calleeData;
      }
    }

    const displayName = userData?.displayName || userData?.username || "User";
    const initials = displayName.substring(0, 2).toUpperCase();

    indicator.innerHTML = `
      <div style="width: 80px; height: 80px; border-radius: 50%; background: #4a5568; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 12px;">
        ${initials}
      </div>
      <div style="font-size: 16px; margin-bottom: 8px;">${displayName}</div>
      <div class="video-off-message" style="font-size: 14px; color: #cbd5e0;">📹 VIDEO OFF</div>
      <div class="grace-period-message" style="font-size: 14px; color: #f39c12; font-weight: bold; margin-top: 8px; display: none;">⏸️ GRACE PERIOD</div>
    `;

    container.appendChild(indicator);
    console.log(`[_createVideoOffIndicator] ✅ Created indicator for ${attendeeId.substring(0, 8)}... (hidden by default)`);
    
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._createVideoOffIndicator', `Created Video OFF Indicator: ${attendeeId.substring(0,8)}...`, {
        attendeeId,
        displayName,
        initials,
        initialState: 'hidden (will be set by update function)'
      });
    }
    
    return indicator;
  }

  /* ====================================================================
   * _updateVideoOffIndicatorForGrace(attendeeId, inGrace) - Show/Hide Grace Message
   * Updates the indicator to show GRACE PERIOD message
   * ==================================================================== */
  static _updateVideoOffIndicatorForGrace(attendeeId, inGrace) {
    console.log(`[_updateVideoOffIndicatorForGrace] ${attendeeId.substring(0,8)}... inGrace=${inGrace}`);
    
    // Find all containers for this attendee
    const containers = Array.from(document.querySelectorAll(`[data-attendee-id="${attendeeId}"]`));
    
    containers.forEach(container => {
      const indicator = container.querySelector('.video-off-indicator');
      if (!indicator) return;
      
      const videoOffMsg = indicator.querySelector('.video-off-message');
      const graceMsg = indicator.querySelector('.grace-period-message');
      
      if (videoOffMsg && graceMsg) {
        if (inGrace) {
          // Show grace period message, hide video off message
          videoOffMsg.style.display = 'none';
          graceMsg.style.display = 'block';
          console.log(`[_updateVideoOffIndicatorForGrace] ✅ Showing GRACE PERIOD for ${attendeeId.substring(0,8)}...`);
        } else {
          // Show video off message, hide grace period message
          videoOffMsg.style.display = 'block';
          graceMsg.style.display = 'none';
          console.log(`[_updateVideoOffIndicatorForGrace] ✅ Showing VIDEO OFF for ${attendeeId.substring(0,8)}...`);
        }
      }
    });
  }

  /* ====================================================================
   * _updateVideoOffIndicator(attendeeId, videoEnabled) - Show/Hide Video Off
   * Updates the VIDEO OFF indicator based on video status
   * ==================================================================== */
  static _updateVideoOffIndicator(attendeeId, videoEnabled) {
    const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
    
    console.log(`[_updateVideoOffIndicator] ${timestamp} - CALLED for ${attendeeId.substring(0,8)}... videoEnabled=${videoEnabled}`);
    
    // Log to DebugLogger with timestamp
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `Video OFF Indicator: ${attendeeId.substring(0,8)}...`, {
        attendeeId,
        videoEnabled,
        action: videoEnabled ? 'HIDE indicator (video ON)' : 'SHOW indicator (video OFF)',
        timestamp
      });
    }
    
    // Find containers by data-attendee-id OR by video element
    let containers = document.querySelectorAll(`[data-attendee-id="${attendeeId}"]`);
    
    // If no containers found by attribute, try finding by video element
    if (containers.length === 0) {
      console.log(`[_updateVideoOffIndicator] No containers with data-attendee-id, searching by video element...`);
      if (typeof DebugLogger !== "undefined") {
        DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `Searching for container: ${attendeeId.substring(0,8)}...`, {
          method: 'By video element (no data-attendee-id on container)'
        });
      }
      const videoElements = document.querySelectorAll(`video[data-attendee-id="${attendeeId}"]`);
      if (videoElements.length > 0) {
        // Get the parent containers
        containers = Array.from(videoElements).map(v => v.closest('.tile, [data-container-type]')).filter(c => c);
        console.log(`[_updateVideoOffIndicator] Found ${containers.length} container(s) via video elements`);
        if (typeof DebugLogger !== "undefined") {
          DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `Found containers: ${attendeeId.substring(0,8)}...`, {
            count: containers.length,
            method: 'via video elements'
          });
        }
      }
    }
    
    if (containers.length === 0) {
      console.warn(`[_updateVideoOffIndicator] ❌ No containers found for ${attendeeId} (neither by attribute nor video element)`);
      if (typeof DebugLogger !== "undefined") {
        DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `❌ NO CONTAINERS FOUND: ${attendeeId.substring(0,8)}...`, {
          attendeeId,
          triedAttribute: true,
          triedVideoElement: true,
          videoElementsFound: document.querySelectorAll(`video[data-attendee-id="${attendeeId}"]`).length
        });
      }
      return;
    }
    
    console.log(`[_updateVideoOffIndicator] Found ${containers.length} container(s) for ${attendeeId.substring(0,8)}... (will skip containers without video)`);
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `Found ${containers.length} container(s): ${attendeeId.substring(0,8)}...`, {
        attendeeId,
        totalContainers: containers.length,
        note: 'Will only process containers with video elements'
      });
    }
    
    let processedCount = 0;
    containers.forEach((container, idx) => {
      let indicator = container.querySelector('.video-off-indicator');
      const video = container.querySelector('video');
      
      // CRITICAL: Skip containers without a video element (ghost/empty containers)
      if (!video) {
        console.log(`[_updateVideoOffIndicator] Container ${idx}: SKIPPING (no video element - ghost container)`);
        return; // Skip this container
      }
      
      processedCount++;
      console.log(`[_updateVideoOffIndicator] Container ${idx}: has indicator=${!!indicator}, has video=true (PROCESSING)`);
      
      if (typeof DebugLogger !== "undefined") {
        DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `Processing Container ${idx}: ${attendeeId.substring(0,8)}...`, {
          hasIndicator: !!indicator,
          hasVideo: true,
          containerClass: container.className,
          containerId: container.id
        });
      }
      
      // If indicator doesn't exist, create it now
      if (!indicator) {
        console.log(`[_updateVideoOffIndicator] Creating NEW indicator for ${attendeeId.substring(0,8)}...`);
        indicator = this._createVideoOffIndicator(container, attendeeId);
      }
      
      // Update indicator visibility with FORCE and !important
      if (indicator) {
        const oldDisplay = indicator.style.display;
        if (videoEnabled) {
          // VIDEO ON - HIDE indicator IMMEDIATELY
          indicator.style.setProperty('display', 'none', 'important');
          indicator.style.setProperty('visibility', 'hidden', 'important');
          console.log(`[_updateVideoOffIndicator] ✅ HIDING indicator (was: ${oldDisplay}, now: none)`);
          
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `✅ HIDING Video OFF: ${attendeeId.substring(0,8)}...`, {
              containerIndex: idx,
              oldDisplay,
              newDisplay: 'none'
            });
          }
        } else {
          // VIDEO OFF - SHOW indicator IMMEDIATELY
          indicator.style.setProperty('display', 'flex', 'important');
          indicator.style.setProperty('visibility', 'visible', 'important');
          indicator.style.setProperty('z-index', '999', 'important');
          console.log(`[_updateVideoOffIndicator] ✅ SHOWING indicator (was: ${oldDisplay}, now: flex)`);
          
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `✅ SHOWING Video OFF: ${attendeeId.substring(0,8)}...`, {
              containerIndex: idx,
              oldDisplay,
              newDisplay: 'flex',
              visibility: 'visible',
              zIndex: '999'
            });
          }
        }
      } else {
        console.error(`[_updateVideoOffIndicator] ❌ Indicator still null after creation attempt!`);
        if (typeof DebugLogger !== "undefined") {
          DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `❌ INDICATOR NULL: ${attendeeId.substring(0,8)}...`, {
            containerIndex: idx,
            error: 'Indicator is null after creation'
          });
        }
      }
      
      // Update video element visibility
      if (video) {
        if (videoEnabled) {
          video.style.display = 'block';
          video.style.visibility = 'visible';
          video.style.opacity = '1';
          console.log(`[_updateVideoOffIndicator] ✅ SHOWING video element`);
        } else {
          video.style.display = 'none';
          video.style.visibility = 'hidden';
          video.style.opacity = '0';
          console.log(`[_updateVideoOffIndicator] ✅ HIDING video element`);
        }
      }
    });
    
    console.log(`[_updateVideoOffIndicator] ✅ COMPLETE: Processed ${processedCount} of ${containers.length} containers (skipped ${containers.length - processedCount} ghost containers)`);
    
    // Clean up ghost containers (containers with attendee ID but no video)
    // ONLY remove the attribute, DON'T hide/remove the container itself
    if (containers.length - processedCount > 0) {
      console.warn(`[_updateVideoOffIndicator] 🧹 CLEANING UP ${containers.length - processedCount} ghost container attributes...`);
      containers.forEach((container, idx) => {
        const hasVideo = container.querySelector('video');
        if (!hasVideo && container.getAttribute('data-attendee-id') === attendeeId) {
          console.log(`[_updateVideoOffIndicator] 🗑️ Unlinking ghost container ${idx} (ID: ${container.id || 'none'}) - removing data-attendee-id only`);
          // ONLY remove the attendee ID attribute - container stays intact
          container.removeAttribute('data-attendee-id');
          // Remove any orphaned indicators/overlays that might be in ghost containers
          const indicator = container.querySelector('.video-off-indicator');
          if (indicator) {
            console.log(`[_updateVideoOffIndicator] 🗑️ Removing orphaned indicator from ghost container ${idx}`);
            indicator.remove();
          }
          // DON'T touch the container itself - it might be needed for layout
        }
      });
    }
    
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateVideoOffIndicator', `✅ Video OFF Update Complete: ${attendeeId.substring(0,8)}...`, {
        totalContainers: containers.length,
        processedContainers: processedCount,
        skippedGhosts: containers.length - processedCount,
        cleanedUp: containers.length - processedCount > 0,
        videoEnabled,
        action: videoEnabled ? 'HIDDEN' : 'SHOWN'
      });
    }
  }

  /* ====================================================================
   * _pendingVideoToggles - Track video toggle state transitions
   * ==================================================================== */
  static _pendingVideoToggles = {};
  
  /* ====================================================================
   * _showLoadingOverlay(attendeeId, message) - Show Loading Spinner
   * Full tile overlay with spinner for state transitions
   * ==================================================================== */
  static _showLoadingOverlay(attendeeId, message = "Processing...") {
    const containers = document.querySelectorAll(`[data-attendee-id="${attendeeId}"]`);
    
    containers.forEach(container => {
      const video = container.querySelector('video');
      if (!video) return; // Skip ghost containers
      
      // Remove existing overlay if any
      let overlay = container.querySelector('.loading-overlay');
      if (overlay) overlay.remove();
      
      // Create new overlay
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.7) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 200 !important;
        pointer-events: none !important;
      `;
      
      // Spinner
      const spinner = document.createElement('div');
      spinner.style.cssText = `
        width: 50px !important;
        height: 50px !important;
        border: 4px solid rgba(255, 255, 255, 0.3) !important;
        border-top-color: #fff !important;
        border-radius: 50% !important;
        animation: spin 1s linear infinite !important;
      `;
      
      // Message
      const text = document.createElement('div');
      text.style.cssText = `
        color: #fff !important;
        font-size: 14px !important;
        margin-top: 12px !important;
        font-weight: 500 !important;
      `;
      text.textContent = message;
      
      overlay.appendChild(spinner);
      overlay.appendChild(text);
      container.appendChild(overlay);
      
      // Add CSS animation if not already present
      if (!document.getElementById('loading-spinner-keyframes')) {
        const style = document.createElement('style');
        style.id = 'loading-spinner-keyframes';
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      console.log(`[_showLoadingOverlay] ✅ Showing loading overlay for ${attendeeId.substring(0,8)}... - "${message}"`);
    });
  }
  
  /* ====================================================================
   * _hideLoadingOverlay(attendeeId) - Hide Loading Spinner
   * ==================================================================== */
  static _hideLoadingOverlay(attendeeId) {
    const containers = document.querySelectorAll(`[data-attendee-id="${attendeeId}"]`);
    
    containers.forEach(container => {
      const overlay = container.querySelector('.loading-overlay');
      if (overlay) {
        overlay.remove();
        console.log(`[_hideLoadingOverlay] ✅ Removed loading overlay for ${attendeeId.substring(0,8)}...`);
      }
    });
    
    // Clean up pending state
    if (this._pendingVideoToggles[attendeeId]) {
      clearTimeout(this._pendingVideoToggles[attendeeId].timeout);
      delete this._pendingVideoToggles[attendeeId];
    }
  }

  /* ====================================================================
   * _createStatusIcons(container, attendeeId) - Camera & Mic Status Icons
   * Creates simple icons showing camera and mic status
   * ==================================================================== */
  static _createStatusIcons(container, attendeeId) {
    // Check if icons already exist
    if (container.querySelector('.status-icons')) {
      return;
    }

    const iconsContainer = document.createElement('div');
    iconsContainer.className = 'status-icons';
    iconsContainer.style.cssText = `
      position: absolute !important;
      bottom: 10px !important;
      left: 10px !important;
      display: flex !important;
      gap: 8px !important;
      z-index: 100 !important;
      pointer-events: none !important;
    `;
    iconsContainer.setAttribute('data-attendee-id', attendeeId);

    // Camera icon
    const cameraIcon = document.createElement('div');
    cameraIcon.className = 'camera-icon';
    cameraIcon.style.cssText = `
      width: 36px !important;
      height: 36px !important;
      border-radius: 50% !important;
      background: rgba(0, 0, 0, 0.7) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 18px !important;
      transition: none !important;
    `;
    cameraIcon.innerHTML = '📹'; // Default: camera on
    cameraIcon.setAttribute('data-status', 'on');

    // Mic icon
    const micIcon = document.createElement('div');
    micIcon.className = 'mic-icon';
    micIcon.style.cssText = `
      width: 36px !important;
      height: 36px !important;
      border-radius: 50% !important;
      background: rgba(0, 0, 0, 0.7) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 18px !important;
      transition: none !important;
    `;
    micIcon.innerHTML = '🎤'; // Default: mic on
    micIcon.setAttribute('data-status', 'on');

    iconsContainer.appendChild(cameraIcon);
    iconsContainer.appendChild(micIcon);
    container.appendChild(iconsContainer);

    console.log(`[_createStatusIcons] ✅ Created status icons for ${attendeeId.substring(0, 8)}...`);
  }

  /* ====================================================================
   * _updateStatusIcons(attendeeId, status) - Update Camera & Mic Icons
   * Updates the status icons based on audio/video state
   * ==================================================================== */
  static _updateStatusIcons(attendeeId, status) {
    const containers = document.querySelectorAll(`[data-attendee-id="${attendeeId}"]`);
    
    containers.forEach(container => {
      const video = container.querySelector('video');
      if (!video) return; // Skip ghost containers
      
      let iconsContainer = container.querySelector('.status-icons');
      
      // Create icons if they don't exist
      if (!iconsContainer) {
        this._createStatusIcons(container, attendeeId);
        iconsContainer = container.querySelector('.status-icons');
      }
      
      if (!iconsContainer) return;
      
      const cameraIcon = iconsContainer.querySelector('.camera-icon');
      const micIcon = iconsContainer.querySelector('.mic-icon');
      
      // Update camera icon
      if (status.videoEnabled !== undefined && cameraIcon) {
        if (status.videoEnabled) {
          cameraIcon.innerHTML = '📹';
          cameraIcon.style.background = 'rgba(34, 197, 94, 0.9)'; // Green
          cameraIcon.setAttribute('data-status', 'on');
        } else {
          cameraIcon.innerHTML = '📹';
          cameraIcon.style.background = 'rgba(239, 68, 68, 0.9)'; // Red
          cameraIcon.style.textDecoration = 'line-through';
          cameraIcon.setAttribute('data-status', 'off');
        }
      }
      
      // Update mic icon
      if (status.audioEnabled !== undefined && micIcon) {
        if (status.audioEnabled) {
          micIcon.innerHTML = '🎤';
          micIcon.style.background = 'rgba(34, 197, 94, 0.9)'; // Green
          micIcon.style.textDecoration = 'none';
          micIcon.setAttribute('data-status', 'on');
        } else {
          micIcon.innerHTML = '🎤';
          micIcon.style.background = 'rgba(239, 68, 68, 0.9)'; // Red
          micIcon.style.textDecoration = 'line-through';
          micIcon.setAttribute('data-status', 'off');
        }
      }
    });
  }

  /* ====================================================================
   * _createDebugOverlay(container, tileId, attendeeId) - Debug Info Overlay
   * Creates a debug overlay showing attendee info, connection strength, etc.
   * ==================================================================== */
  static _createDebugOverlay(container, tileId, attendeeId) {
    // Check if overlay already exists
    let overlay = container.querySelector('.debug-overlay');
    if (overlay) {
      return overlay; // Return existing overlay
    }

    overlay = document.createElement("div");
    overlay.className = "debug-overlay";
    overlay.style.position = "absolute";
    overlay.style.top = "5px";
    overlay.style.left = "5px";
    overlay.style.right = "auto"; // Don't stretch, let content determine width
    overlay.style.maxWidth = "calc(100% - 10px)"; // Prevent overflow
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.color = "#fff";
    overlay.style.padding = "6px 8px";
    overlay.style.fontSize = "10px";
    overlay.style.lineHeight = "1.3";
    overlay.style.fontFamily = "monospace";
    overlay.style.borderRadius = "4px";
    overlay.style.zIndex = "1000"; // High z-index to always be on top
    overlay.style.pointerEvents = "none"; // Don't interfere with clicks
    overlay.style.boxSizing = "border-box";
    overlay.setAttribute("data-tile-id", tileId);

    // Get user data and role - SIMPLE approach for one-on-one calls
    let userData = null;
    let userRole = null;
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
    const isLocalUser = (attendeeId === myAttendeeId);
    
    if (isLocalUser) {
      // LOCAL USER - We KNOW our role from when we joined!
      userRole = this._currentUserRole;
      
      // Get our user data from invite
      if (window.CallHandler && window.CallHandler._invite) {
        const invite = window.CallHandler._invite;
        const myUserId = coreChime.getLocalIdentifiers().externalUserId?.split('-')[1];
        if (myUserId === invite.callerId) {
          userData = invite.callerData;
        } else if (myUserId === invite.calleeId) {
          userData = invite.calleeData;
        }
      }
    } else {
      // REMOTE USER - In one-on-one, their role is opposite of ours
      const myRole = this._currentUserRole;
      if (myRole === "host") {
        userRole = "attendee"; // If I'm host, they're attendee
      } else if (myRole === "attendee") {
        userRole = "host"; // If I'm attendee, they're host
      } else {
        userRole = "collaborator"; // Fallback
      }
      
      // Get their user data from invite
      if (window.CallHandler && window.CallHandler._invite) {
        const invite = window.CallHandler._invite;
        const myUserId = coreChime.getLocalIdentifiers().externalUserId?.split('-')[1];
        // If I'm caller, they're callee, and vice versa
        if (myUserId === invite.callerId) {
          userData = invite.calleeData;
        } else {
          userData = invite.callerData;
        }
      }
    }
    
    // Map role names (guest -> attendee, collab -> collaborator)
    if (userRole === "guest") userRole = "attendee";
    if (userRole === "collab") userRole = "collaborator";

    const displayName = userData?.displayName || userData?.username || "Unknown";
    const userId = userData?.userId || attendeeId.substring(0, 8);
    const roleDisplay = userRole ? `${userRole.toUpperCase()}` : "UNKNOWN";

    overlay.innerHTML = `
      <div><strong>${displayName}</strong> [${roleDisplay}]</div>
      <div>ID: ${userId}</div>
      <div>Attendee: ${attendeeId.substring(0, 12)}...</div>
      <div>Tile: ${tileId}</div>
      <div class="debug-audio">🔊 Audio: <span class="audio-status">Initializing...</span></div>
      <div class="debug-video">📹 Video: <span class="video-status">Initializing...</span></div>
      <div class="debug-connection">📶 Connection: <span class="connection-status">Connecting...</span></div>
    `;

    container.appendChild(overlay);
    
    // Initialize with default ON status after 1 second (assume enabled unless told otherwise)
    setTimeout(() => {
      this._updateDebugOverlay(attendeeId, { 
        audioEnabled: true, 
        videoEnabled: true, 
        connectionStrength: 'Good' 
      });
    }, 1000);
    
    return overlay;
  }

  /* ====================================================================
   * _updateDebugOverlay(attendeeId, stats) - Update Debug Overlay
   * Updates debug overlay with real-time stats
   * ==================================================================== */
  static _updateDebugOverlay(attendeeId, stats) {
    // Log to DebugLogger
    if (typeof DebugLogger !== "undefined" && (stats.audioEnabled !== undefined || stats.videoEnabled !== undefined)) {
      DebugLogger.addLog('connected', 'NOTICE', 'chimeHandler._updateDebugOverlay', `Debug Overlay Update: ${attendeeId.substring(0,8)}...`, {
        attendeeId,
        audio: stats.audioEnabled !== undefined ? (stats.audioEnabled ? 'ON' : 'OFF') : 'unchanged',
        video: stats.videoEnabled !== undefined ? (stats.videoEnabled ? 'ON' : 'OFF') : 'unchanged',
        connection: stats.connectionStrength || 'unchanged'
      });
    }
    
    const containers = document.querySelectorAll(`[data-attendee-id="${attendeeId}"]`);
    containers.forEach(container => {
      const overlay = container.querySelector('.debug-overlay');
      if (overlay) {
        if (stats.audioEnabled !== undefined) {
          const audioStatus = overlay.querySelector('.audio-status');
          if (audioStatus) {
            audioStatus.textContent = stats.audioEnabled ? 'ON' : 'OFF';
            audioStatus.style.color = stats.audioEnabled ? '#4ade80' : '#ef4444';
          }
        }
        if (stats.videoEnabled !== undefined) {
          const videoStatus = overlay.querySelector('.video-status');
          if (videoStatus) {
            videoStatus.textContent = stats.videoEnabled ? 'ON' : 'OFF';
            videoStatus.style.color = stats.videoEnabled ? '#4ade80' : '#ef4444';
          }
        }
        if (stats.connectionStrength !== undefined) {
          const connStatus = overlay.querySelector('.connection-status');
          if (connStatus) {
            connStatus.textContent = stats.connectionStrength;
            // Color code: excellent=green, good=yellow, poor=red
            connStatus.style.color = 
              stats.connectionStrength === 'Excellent' ? '#4ade80' :
              stats.connectionStrength === 'Good' ? '#fbbf24' : '#ef4444';
          }
        }
      }
    });
  }

  /* ====================================================================
   * _findAvailableTileContainer() - Updated for Role-Based System with Dynamic Assignment
   * Finds appropriate container based on role mapping with dynamic collaborator assignment
   * ==================================================================== */
  static _findAvailableTileContainer(attendeeId) {
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
    const currentRole = this._currentUserRole;

    console.log(
      `[_findAvailableTileContainer] Looking for container for ${attendeeId}, myRole: ${currentRole}, isLocal: ${
        attendeeId === myAttendeeId
      }`
    );

    if (attendeeId === myAttendeeId) {
      // This is MY video - use MY container based on MY role
      // For local videos, if currentRole is null, try to infer from externalUserId
      let effectiveRole = currentRole;

      if (!effectiveRole) {
        const myExternalUserId = coreChime.getLocalIdentifiers().externalUserId;
        if (myExternalUserId) {
          if (myExternalUserId.startsWith("host-")) {
            effectiveRole = "host";
          } else if (myExternalUserId.startsWith("collab-")) {
            effectiveRole = "collaborator";
          } else if (
            myExternalUserId.startsWith("attendee-") ||
            myExternalUserId.startsWith("guest-")
          ) {
            effectiveRole = "attendee";
          }
          console.log(
            `[_findAvailableTileContainer] Inferred role from externalUserId: ${effectiveRole}`
          );
        }
      }

      if (effectiveRole === "host") {
        const container = document.getElementById("host-container");
        console.log(
          `[_findAvailableTileContainer] Found host container:`,
          container
        );
        return container;
      } else if (effectiveRole === "collaborator") {
        // Find next available collaborator container for myself using dynamic assignment
        const availableContainer =
          this._findNextAvailableCollaboratorContainer();
        if (availableContainer) {
          console.log(
            `[_findAvailableTileContainer] ✅ Found available ${availableContainer.id} for local collaborator`
          );
          return availableContainer;
        }
      } else if (effectiveRole === "attendee" || effectiveRole === "guest") {
        const container = document.getElementById("attendee-container");
        console.log(
          `[_findAvailableTileContainer] Found attendee container:`,
          container
        );
        return container;
      }
    } else {
      // This is someone else's video - use appropriate container based on THEIR role
      const mapping = this._mappingCache.get(attendeeId);
      if (!mapping) {
        console.warn(
          `[_findAvailableTileContainer] No mapping for ${attendeeId} - video tile arrived before mapping packet`
        );
        // For instant calls, we can make educated guesses about container placement
        // This is a fallback until the mapping packet arrives
        // Try to find a container based on the current user's role and make an educated guess
        const currentRole = this._currentUserRole;

        if (currentRole === "attendee" || currentRole === "guest") {
          // If we're an attendee/guest, the other person could be host OR collaborator
          // In a group call, we might have both host and collaborator
          // Try host container first, then collaborator containers
          const hostContainer = document.getElementById("host-container");
          if (
            hostContainer &&
            (!hostContainer.getAttribute("data-attendee-id") ||
              hostContainer.getAttribute("data-attendee-id") === "")
          ) {
            console.log(
              `[_findAvailableTileContainer] Educated guess: mapping ${attendeeId} to host-container (attendee perspective)`
            );
            return hostContainer;
          }

          // If host container is occupied, try collaborator containers
          const availableCollabContainer =
            this._findNextAvailableCollaboratorContainer();
          if (availableCollabContainer) {
            console.log(
              `[_findAvailableTileContainer] Educated guess: mapping ${attendeeId} to ${availableCollabContainer.id} (attendee perspective - likely collaborator)`
            );
            return availableCollabContainer;
          }
        } else if (currentRole === "host") {
          // If we're a host, the other person could be attendee OR collaborator
          // Try attendee container first, then collaborator containers
          const attendeeContainer =
            document.getElementById("attendee-container");
          if (
            attendeeContainer &&
            (!attendeeContainer.getAttribute("data-attendee-id") ||
              attendeeContainer.getAttribute("data-attendee-id") === "")
          ) {
            console.log(
              `[_findAvailableTileContainer] Educated guess: mapping ${attendeeId} to attendee-container (host perspective)`
            );
            return attendeeContainer;
          }

          // If attendee container is occupied, try collaborator containers
          const availableCollabContainer =
            this._findNextAvailableCollaboratorContainer();
          if (availableCollabContainer) {
            console.log(
              `[_findAvailableTileContainer] Educated guess: mapping ${attendeeId} to ${availableCollabContainer.id} (host perspective - likely collaborator)`
            );
            return availableCollabContainer;
          }
        } else if (currentRole === "collaborator") {
          // If we're a collaborator, the other person could be host OR attendee
          // Try host container first, then attendee container
          const hostContainer = document.getElementById("host-container");
          if (
            hostContainer &&
            (!hostContainer.getAttribute("data-attendee-id") ||
              hostContainer.getAttribute("data-attendee-id") === "")
          ) {
            console.log(
              `[_findAvailableTileContainer] Educated guess: mapping ${attendeeId} to host-container (collaborator perspective)`
            );
            return hostContainer;
          }

          const attendeeContainer =
            document.getElementById("attendee-container");
          if (
            attendeeContainer &&
            (!attendeeContainer.getAttribute("data-attendee-id") ||
              attendeeContainer.getAttribute("data-attendee-id") === "")
          ) {
            console.log(
              `[_findAvailableTileContainer] Educated guess: mapping ${attendeeId} to attendee-container (collaborator perspective)`
            );
            return attendeeContainer;
          }
        }

        return null;
      }

      // Determine role from externalUserId pattern, not mapping packet role
      const externalUserId = mapping.externalUserId || mapping.uid || "";
      let targetRole = "attendee"; // default

      if (externalUserId.startsWith("host-")) {
        targetRole = "host";
      } else if (externalUserId.startsWith("collab-")) {
        targetRole = "collaborator";
      } else if (
        externalUserId.startsWith("attendee-") ||
        externalUserId.startsWith("guest-")
      ) {
        targetRole = "attendee";
      }

      console.log(
        `[_findAvailableTileContainer] Target role: ${targetRole} (externalUserId: ${externalUserId})`
      );

      if (targetRole === "host") {
        const container = document.getElementById("host-container");
        console.log(
          `[_findAvailableTileContainer] Found host container for remote:`,
          container
        );
        return container;
      } else if (targetRole === "collaborator") {
        // Find next available collaborator container using dynamic assignment
        const availableContainer =
          this._findNextAvailableCollaboratorContainer();
        if (availableContainer) {
          console.log(
            `[_findAvailableTileContainer] ✅ Found available ${availableContainer.id} for remote collaborator`
          );
          return availableContainer;
        }
      } else if (targetRole === "attendee" || targetRole === "guest") {
        const container = document.getElementById("attendee-container");
        console.log(
          `[_findAvailableTileContainer] Found attendee container for remote:`,
          container
        );
        return container;
      }
    }

    console.log(
      `[_findAvailableTileContainer] No container found for ${attendeeId}`
    );
    return null;
  }

  /* ====================================================================
   * _findNextAvailableCollaboratorContainer() - Dynamic Collaborator Assignment
   * Finds the next available collaborator container (collab1, collab2, collab3)
   * Implements shifting logic: if collab1 leaves, collab2 moves to collab1, etc.
   * ==================================================================== */
  static _findNextAvailableCollaboratorContainer() {
    console.log(
      `[_findNextAvailableCollaboratorContainer] Starting search for available collaborator container`
    );

    // Clean up any containers that have incorrect state
    this._cleanupInactiveContainers();

    // Check each collaborator container in order (1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      const collabContainer = document.getElementById(`collab${i}-container`);
      if (!collabContainer) {
        console.log(
          `[_findNextAvailableCollaboratorContainer] collab${i}-container not found`
        );
        continue;
      }

      const currentAttendeeId =
        collabContainer.getAttribute("data-attendee-id");
      const hasVideo = collabContainer.querySelector("video");

      console.log(
        `[_findNextAvailableCollaboratorContainer] Checking collab${i}-container:`,
        {
          attendeeId: currentAttendeeId,
          hasVideo: !!hasVideo,
          classes: collabContainer.className,
        }
      );

      // Container is truly available if:
      // 1. No attendee ID assigned (empty or "")
      // 2. No video element present
      if ((!currentAttendeeId || currentAttendeeId === "") && !hasVideo) {
        console.log(
          `[_findNextAvailableCollaboratorContainer] ✅ Found truly empty collab${i}-container`
        );
        return collabContainer;
      } else {
        console.log(
          `[_findNextAvailableCollaboratorContainer] ❌ collab${i}-container is occupied by: ${currentAttendeeId} (hasVideo: ${!!hasVideo})`
        );
      }
    }

    console.warn(
      `[_findNextAvailableCollaboratorContainer] No available collaborator containers found!`
    );
    return null;
  }

  /* ====================================================================
   * UiMapTileToCard(attendeeId, role) - Role-Based UI Mapping Function
   * Maps video feed to correct container based on CURRENT USER'S role
   * ==================================================================== */
  static UiMapTileToCard(attendeeId, role) {
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
    const isLocal = attendeeId === myAttendeeId;
    console.log(
      `[UiMapTileToCard] Mapping ${attendeeId} with role ${role} (isLocal: ${isLocal})`
    );

    let mapping = this._mappingCache.get(attendeeId);

    // For local videos, create a temporary mapping since we don't store it in cache
    if (!mapping && isLocal) {
      const myExternalUserId = coreChime.getLocalIdentifiers().externalUserId;
      const parts = (myExternalUserId || "").split("-");
      let roleFromExternal = parts[0] || "attendee";
      const uid = parts[1] || "";

      // Map role names to standardized format
      if (roleFromExternal === "guest") {
        roleFromExternal = "attendee";
      } else if (roleFromExternal === "collab") {
        roleFromExternal = "collaborator";
      }

      mapping = {
        role: roleFromExternal,
        uid: uid,
        connectionId: attendeeId,
        displayName: `User ${uid}`,
        avatar: "",
        username: `user_${uid}`,
        externalUserId: myExternalUserId,
      };

      console.log(
        `[UiMapTileToCard] Created temporary mapping for local video:`,
        mapping
      );
    }

    if (!mapping) {
      console.warn(`[UiMapTileToCard] No mapping found for ${attendeeId}`);
      return;
    }

    // Check if this attendee is already mapped to a container (but not empty string)
    const existingContainer = document.querySelector(
      `[data-attendee-id="${attendeeId}"]`
    );
    console.log(`[UiMapTileToCard] Checking for existing mapping:`, {
      attendeeId,
      existingContainer: existingContainer?.id,
      "data-attendee-id": existingContainer?.getAttribute("data-attendee-id"),
    });

    // If this is a local video and it's already mapped, ensure it's visible
    if (
      isLocal &&
      existingContainer &&
      existingContainer.getAttribute("data-attendee-id") !== ""
    ) {
      console.log(
        `[UiMapTileToCard] ⚠️ Local video ${attendeeId} is already mapped to ${existingContainer.id}, ensuring visibility`
      );
      // Ensure the container is visible even if already mapped
      existingContainer.classList.remove("hidden");
      existingContainer.classList.add("active");
      console.log(
        `[UiMapTileToCard] ✅ Made existing local video container visible: ${existingContainer.id}`
      );
      return;
    }

    // If this is a remote video and it's already mapped to a DIFFERENT attendee, don't override it
    if (
      !isLocal &&
      existingContainer &&
      existingContainer.getAttribute("data-attendee-id") !== "" &&
      existingContainer.getAttribute("data-attendee-id") !== attendeeId
    ) {
      console.log(
        `[UiMapTileToCard] ⚠️ Remote video ${attendeeId} is already mapped to different container ${existingContainer.id}, skipping duplicate mapping`
      );
      return;
    }

    const currentRole = this._currentUserRole;

    let targetContainer = null;

    // ============================================================
    // ONE-ON-ONE CALL CONTAINER MAPPING
    // For one-on-one instant calls: host + attendee only
    // TODO: GROUP CALL LOGIC - Will need to handle:
    //   - Multiple collaborators (collab1, collab2, collab3)
    //   - Dynamic container allocation
    //   - Visibility rules based on participant count
    // ============================================================
    
    // Determine target container based on CURRENT USER'S role, not target's role
    if (attendeeId === myAttendeeId) {
      // This is MY video - map to MY container based on MY role
      console.log(`[UiMapTileToCard] Mapping LOCAL video for ${currentRole}`);
      if (currentRole === "host") {
        targetContainer = document.getElementById("host-container");
        console.log(
          `[UiMapTileToCard] Found host container for local:`,
          targetContainer
        );
      } else if (currentRole === "collaborator") {
        // Find next available collaborator container for myself
        for (let i = 1; i <= 3; i++) {
          const collabContainer = document.getElementById(
            `collab${i}-container`
          );
          const currentAttendeeId =
            collabContainer?.getAttribute("data-attendee-id");
          console.log(
            `[UiMapTileToCard] Checking collab${i}-container for local:`,
            currentAttendeeId
          );
          if (
            collabContainer &&
            (!currentAttendeeId ||
              currentAttendeeId === "" ||
              currentAttendeeId === attendeeId)
          ) {
            console.log(
              `[UiMapTileToCard] ✅ Found available collab${i}-container for local`
            );
            targetContainer = collabContainer;
            break;
          } else {
            console.log(
              `[UiMapTileToCard] ❌ collab${i}-container for local is occupied by: ${currentAttendeeId}`
            );
          }
        }
      } else if (currentRole === "attendee" || currentRole === "guest") {
        targetContainer = document.getElementById("attendee-container");
      }
    } else {
      // This is someone else's video - determine role from externalUserId pattern, not mapping packet role
      const externalUserId = mapping.externalUserId || mapping.uid || "";
      let targetRole = "attendee"; // default

      if (externalUserId.startsWith("host-")) {
        targetRole = "host";
      } else if (externalUserId.startsWith("collab-")) {
        targetRole = "collaborator";
      } else if (
        externalUserId.startsWith("attendee-") ||
        externalUserId.startsWith("guest-")
      ) {
        targetRole = "attendee";
      }

      console.log(
        `[UiMapTileToCard] Mapping REMOTE video for ${targetRole} (externalUserId: ${externalUserId})`
      );

      if (targetRole === "host") {
        targetContainer = document.getElementById("host-container");
        console.log(
          `[UiMapTileToCard] Found host container for remote:`,
          targetContainer
        );
      } else if (targetRole === "collaborator") {
        // Find next available collaborator container
        for (let i = 1; i <= 3; i++) {
          const collabContainer = document.getElementById(
            `collab${i}-container`
          );
          const currentAttendeeId =
            collabContainer?.getAttribute("data-attendee-id");
          console.log(
            `[UiMapTileToCard] Checking collab${i}-container for remote:`,
            currentAttendeeId
          );
          if (
            collabContainer &&
            (!currentAttendeeId ||
              currentAttendeeId === "" ||
              currentAttendeeId === attendeeId)
          ) {
            console.log(
              `[UiMapTileToCard] ✅ Found available collab${i}-container for remote`
            );
            targetContainer = collabContainer;
            break;
          } else {
            console.log(
              `[UiMapTileToCard] ❌ collab${i}-container for remote is occupied by: ${currentAttendeeId}`
            );
          }
        }
      } else if (targetRole === "attendee" || targetRole === "guest") {
        targetContainer = document.getElementById("attendee-container");
      }
    }

    if (!targetContainer) {
      console.warn(
        `[UiMapTileToCard] No available container for ${attendeeId}`
      );
      return;
    }

    // Check if this container is already occupied by someone else
    const currentOccupant = targetContainer.getAttribute("data-attendee-id");
    if (
      currentOccupant &&
      currentOccupant !== "" &&
      currentOccupant !== attendeeId
    ) {
      console.warn(
        `[UiMapTileToCard] Container ${targetContainer.id} is already occupied by ${currentOccupant}, cannot map ${attendeeId}`
      );
      return;
    }

    // Always update container visibility and metadata if a targetContainer is found
    targetContainer.setAttribute("data-attendee-id", attendeeId);
    targetContainer.classList.remove("hidden");
    targetContainer.classList.add("active");

    // Update display fields
    const uidSpan = targetContainer.querySelector('[data-field="uid"]');
    const statusSpan = targetContainer.querySelector('[data-field="status"]');
    if (uidSpan) uidSpan.textContent = mapping.uid;
    if (statusSpan) statusSpan.textContent = "active";

    console.log(
      `[UiMapTileToCard] ✅ Mapped ${attendeeId} to ${targetContainer.id} (container made visible)`
    );
    console.log(`[UiMapTileToCard] Container state after mapping:`, {
      id: targetContainer.id,
      "data-attendee-id": targetContainer.getAttribute("data-attendee-id"),
      classes: targetContainer.className,
    });

    // Find existing video element for this attendee and move it to target container
    const existingVideo = document.querySelector(
      `video[data-attendee-id="${attendeeId}"]`
    );
    if (existingVideo) {
      // Move video to target container
      targetContainer.appendChild(existingVideo);
      console.log(
        `[UiMapTileToCard] ✅ Moved existing video to ${targetContainer.id}`
      );
    }
  }

  /* ====================================================================
   * _cleanupInactiveContainers() - Clean up containers that shouldn't be active
   * ==================================================================== */
  static _cleanupInactiveContainers() {
    const allContainers = document.querySelectorAll(".video-card");

    // Get local attendee ID to protect local video containers
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;

    allContainers.forEach((container) => {
      const attendeeId = container.getAttribute("data-attendee-id");
      const hasVideo = container.querySelector("video");

      // Don't hide containers for the local user (they're not in _mappingCache)
      if (attendeeId === myAttendeeId) {
        console.log(
          `[_cleanupInactiveContainers] Skipping local video container ${container.id}`
        );
        return; // Skip cleanup for local video
      }

      // If container has an attendee ID but no mapping, hide it
      // BUT don't hide if it has a video element (might be local video or waiting for mapping)
      if (
        attendeeId &&
        attendeeId !== "" &&
        !this._mappingCache.has(attendeeId) &&
        !hasVideo
      ) {
        console.log(
          `[_cleanupInactiveContainers] Hiding container ${container.id} - no mapping for ${attendeeId} and no video`
        );
        container.classList.add("hidden");
        container.classList.remove("active");
        container.removeAttribute("data-attendee-id");

        // Update status
        const statusSpan = container.querySelector('[data-field="status"]');
        if (statusSpan) statusSpan.textContent = "hidden";
      } else if (
        attendeeId &&
        attendeeId !== "" &&
        !this._mappingCache.has(attendeeId) &&
        hasVideo
      ) {
        console.log(
          `[_cleanupInactiveContainers] Keeping container ${container.id} - has video element for ${attendeeId} (likely local video)`
        );
      }

      // If container has attendee ID but no video element, check if it's waiting for a video
      if (attendeeId && attendeeId !== "" && !hasVideo) {
        // Check if this attendee has a mapping (meaning it should have a video)
        const mapping = this._mappingCache.get(attendeeId);
        if (mapping) {
          console.log(
            `[_cleanupInactiveContainers] Container ${container.id} has attendee ID ${attendeeId} but no video - keeping container as it has valid mapping`
          );
          // Don't clean up - this container is waiting for a video element
        } else {
          console.log(
            `[_cleanupInactiveContainers] Cleaning up container ${container.id} - has attendee ID ${attendeeId} but no mapping`
          );
          container.classList.add("hidden");
          container.classList.remove("active");
          container.removeAttribute("data-attendee-id");

          // Update status
          const statusSpan = container.querySelector('[data-field="status"]');
          if (statusSpan) statusSpan.textContent = "hidden";
        }
      }
    });
  }

  /* ====================================================================
   * UiShiftTileLayout() - Role-Based Layout Function
   * Delegates to automatic layout system from callFlow.html
   * ==================================================================== */
  static UiShiftTileLayout() {
    const containersDiv = document.getElementById("video-containers");
    if (!containersDiv) return;

    // Count active containers
    const activeContainers = containersDiv.querySelectorAll(
      ".video-card:not(.hidden)"
    );
    const activeCount = activeContainers.length;

    console.log(
      `[UiShiftTileLayout] ${activeCount} active containers - delegating to automatic layout system`
    );

    // Trigger automatic layout detection if available
    if (
      window.autoLayout &&
      typeof window.autoLayout.autoDetectAndApplyLayout === "function"
    ) {
      window.autoLayout.autoDetectAndApplyLayout();
      console.log(`[UiShiftTileLayout] Called automatic layout system`);
    } else {
      console.warn(`[UiShiftTileLayout] Automatic layout system not available`);
    }
  }

  /* ====================================================================
   * _refreshVideoTilesForAttendee(attendeeId) - Updated for Role-Based System
   * ==================================================================== */
  static _refreshVideoTilesForAttendee(attendeeId) {
    const mapping = this._mappingCache.get(attendeeId);
    if (!mapping) {
      console.log(
        `[_refreshVideoTilesForAttendee] No mapping found for ${attendeeId}`
      );
      return;
    }

    // Determine role from externalUserId pattern for logging
    const externalUserId = mapping.externalUserId || mapping.uid || "";
    let roleForLogging = mapping.role;
    if (externalUserId.startsWith("host-")) {
      roleForLogging = "host";
    } else if (externalUserId.startsWith("collab-")) {
      roleForLogging = "collaborator";
    } else if (
      externalUserId.startsWith("attendee-") ||
      externalUserId.startsWith("guest-")
    ) {
      roleForLogging = "attendee";
    }

    const shouldShow = this._shouldShowVideo(attendeeId);
    console.log(
      `[_refreshVideoTilesForAttendee] ${attendeeId} (${roleForLogging}) shouldShow: ${shouldShow}`
    );

    if (!shouldShow) {
      // Hide the container
      const container = document.querySelector(
        `[data-attendee-id="${attendeeId}"]`
      );
      if (container) {
        console.log(
          `[_refreshVideoTilesForAttendee] Hiding container for ${attendeeId}`
        );
        container.classList.add("hidden");
        container.classList.remove("active");
        container.removeAttribute("data-attendee-id");

        // Update status
        const statusSpan = container.querySelector('[data-field="status"]');
        if (statusSpan) statusSpan.textContent = "hidden";

        // Unbind video if exists
        const video = container.querySelector("video");
        if (video) {
          const tileId = video.getAttribute("data-tile-id");
          try {
            coreChime.unbindVideoElement(tileId);
          } catch (error) {
            // Ignore errors during unbinding
          }
          video.remove();
        }
      }
    } else {
      // Show the container using role-based mapping system
      console.log(
        `[_refreshVideoTilesForAttendee] Showing container for ${attendeeId} (${roleForLogging})`
      );
      this.UiMapTileToCard(attendeeId, roleForLogging);
    }

    // Update layout
    this.UiShiftTileLayout();
  }

  /* ====================================================================
   * _updateStatus(message)
   * Update status display
   * ==================================================================== */
  static _updateStatus(message) {
    console.log("[chimeHandler] Status:", message);
    if (this._ui.uiStatus) {
      this._ui.uiStatus.innerHTML = `<strong>Status:</strong> ${message}`;
    }
  }

  /* ====================================================================
   * Role-Based Video Visibility Logic (Requirements)
   * ==================================================================== */

  /**
   * Check if current user should see a video based on role-based flow
   * @param {string} attendeeId - ID of the attendee whose video to check
   * @returns {boolean} - Whether to show the video
   */
  static _shouldShowVideo(attendeeId) {
    // Get current user's role
    const currentRole = this._currentUserRole;

    // Get our own attendee ID
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;

    // Handle local video (self) based on role
    if (attendeeId === myAttendeeId) {
      // Count participants to determine if this is an instant call
      // Use both mapping cache and attendees with videos to get accurate count
      // The mapping cache grows as people send mappings (only remote attendees)
      // The attendees with videos tracks who actually has video streams (includes self + remote)
      const mappingCount = Array.from(this._mappingCache.values()).length;
      const videoCount = this._attendeesWithVideos.size; // Already includes self + remote
      // Use the larger of the two counts to determine if this is one-on-one
      // videoCount already includes self, so only add +1 for mappingCount
      const totalParticipants = Math.max(mappingCount + 1, videoCount);
      const isOneOnOne = totalParticipants === 2;

      console.log(
        `[_shouldShowVideo] Self-view check: currentRole=${currentRole}, mappingCount=${mappingCount}, videoCount=${videoCount}, totalParticipants=${totalParticipants}, isOneOnOne=${isOneOnOne}`
      );

      // Always show self-view in instant calls (one-on-one)
      // Also show self-view if totalParticipants === 1 (waiting for other participant to join)
      // This ensures both parties see each other regardless of who initiates
      if (isOneOnOne || totalParticipants === 1) {
        console.log(
          `[_shouldShowVideo] One-on-one call - showing self-view for ${currentRole}`
        );
        return true;
      }

      // For group calls, role-based rules still apply
      if (currentRole === "host") {
        // Host always sees themselves
        return true;
      } else if (currentRole === "collaborator") {
        // Collaborator always sees themselves
        return true;
      } else if (currentRole === "attendee" || currentRole === "guest") {
        // In group calls, attendees don't see themselves
        console.log(
          `[_shouldShowVideo] Group call - blocking attendee self-view`
        );
        return false;
      } else {
        // Unknown role - default to showing
        return true;
      }
    }

    // Get target attendee's mapping from cache
    const targetMapping = this._mappingCache.get(attendeeId);
    if (!targetMapping) {
      console.log(
        `[_shouldShowVideo] No mapping for ${attendeeId} yet - allowing temporarily`
      );
      return true; // Allow temporarily until mapping arrives
    }

    // Determine target role from externalUserId pattern
    const externalUserId =
      targetMapping.externalUserId || targetMapping.uid || "";
    let targetRole = "attendee"; // default

    if (externalUserId.startsWith("host-")) {
      targetRole = "host";
    } else if (externalUserId.startsWith("collab-")) {
      targetRole = "collaborator";
    } else if (
      externalUserId.startsWith("attendee-") ||
      externalUserId.startsWith("guest-")
    ) {
      targetRole = "attendee";
    }

    // Count total participants using both mapping cache and video attendees
    const mappingCount = this._mappingCache.size; // Only remote attendees
    const videoCount = this._attendeesWithVideos.size; // Includes self + remote
    const totalParticipants = Math.max(mappingCount + 1, videoCount); // mappingCount needs +1 for self
    const isOneOnOne = totalParticipants === 2;

    console.log(`[_shouldShowVideo] Meeting detection:`, {
      currentRole,
      targetRole,
      mappingCount,
      videoCount,
      totalParticipants,
      isOneOnOne,
    });

    // Simple rules based on meeting type
    if (isOneOnOne) {
      // ONE-ON-ONE: Everyone sees everyone (already handled self-view above)
      return true;
    } else {
      // GROUP CALL: Different visibility rules
      if (currentRole === "host" || currentRole === "collaborator") {
        // Host and collaborators see each other
        return targetRole === "host" || targetRole === "collaborator";
      } else if (currentRole === "attendee" || currentRole === "guest") {
        // Attendees see host and collaborators, but NOT other attendees
        return targetRole === "host" || targetRole === "collaborator";
      }
    }

    // Default: show video if role is unknown
    return true;
  }

  /* ====================================================================
   * Lambda API Integration Functions
   * ==================================================================== */

  /**
   * Step 1: Create meeting in Scylla database
   * @param {string} eventId - Event identifier
   * @param {string} initiatorId - Initiator user ID
   * @returns {Promise<Object>} - { success, externalMeetingId }
   */
  static async createScyllaMeeting(eventId, initiatorId) {
    try {
      console.log("[chimeHandler] Step 1: Creating Scylla meeting", {
        eventId,
        initiatorId,
      });

      const response = await fetch(
        this._scyllaDatabaseEndpoint + "createInstantMeeting",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, initiatorId }),
          mode: "cors",
        }
      );

      console.log("[chimeHandler] Scylla response status:", response.status);

      const data = await response.json();

      if (data.success && data.data) {
        console.log("[chimeHandler] Scylla meeting created successfully", data);
        return {
          success: true,
          externalMeetingId: data.data,
        };
      } else {
        throw new Error(
          `Failed to create Scylla meeting: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("[chimeHandler] Error creating Scylla meeting:", error);
      throw error;
    }
  }

  /**
   * Step 2: Create Chime meeting with Scylla meeting ID
   * @param {string} externalMeetingId - Scylla meeting ID
   * @returns {Promise<Object>} - { success, meetingId, meetingData }
   */
  static async createChimeMeeting(externalMeetingId) {
    try {
      console.log("[chimeHandler] Step 2: Creating Chime meeting", {
        externalMeetingId,
      });

      const payload = {
        action: "createMeeting",
        externalMeetingId: externalMeetingId,
      };

      const response = await fetch(this._chimeMeetingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
      });

      console.log("[chimeHandler] Chime response status:", response.status);

      const data = await response.json();

      if (data.meetingId) {
        console.log("[chimeHandler] Chime meeting created successfully", data);
        return {
          success: true,
          meetingId: data.meetingId,
          meetingData: data.meeting,
        };
      } else {
        throw new Error(
          `Failed to create Chime meeting: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("[chimeHandler] Error creating Chime meeting:", error);
      throw error;
    }
  }

  /**
   * Create a scheduled meeting using Chime Meeting API
   * @param {string} eventId - Event identifier
   * @returns {Promise<Object>} - { success, meetingId }
   */
  static async createScheduledMeeting(eventId) {
    try {
      console.log("[chimeHandler] Creating scheduled meeting via Lambda API", {
        eventId,
      });

      const payload = {
        eventId: eventId,
      };

      const response = await fetch(
        this._lambdaEndpoint + "createScheduledMeeting",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log(
          "[chimeHandler] Scheduled meeting created successfully",
          data
        );
        return {
          success: true,
          meetingId: data.data,
        };
      } else {
        throw new Error(
          `Failed to create scheduled meeting: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("[chimeHandler] Error creating scheduled meeting:", error);
      throw error;
    }
  }

  /**
   * Step 3: Add attendee to existing meeting
   * @param {string} meetingId - Meeting ID
   * @param {string} userId - User identifier
   * @param {string} role - "host", "collaborator", or "attendee"
   * @returns {Promise<Object>} - { success, meetingInfo }
   */
  static async addAttendeeToMeeting(meetingId, userId, role = "attendee") {
    try {
      console.log("[chimeHandler] Step 3: Adding attendee to meeting", {
        meetingId,
        userId,
        role,
      });

      const payload = {
        action: "addAttendee",
        meetingId: meetingId,
        externalUserId: userId,
        role: role,
      };

      const response = await fetch(this._chimeMeetingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
      });

      console.log(
        "[chimeHandler] Add attendee response status:",
        response.status
      );

      const data = await response.json();

      if (data.meetingInfo) {
        console.log("[chimeHandler] Attendee added successfully", data);
        return {
          success: true,
          meetingId: meetingId,
          userId: userId,
          role: role,
          meetingInfo: data.meetingInfo,
        };
      } else {
        throw new Error(
          `Failed to add attendee: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("[chimeHandler] Error adding attendee:", error);
      throw error;
    }
  }

  /**
   * Generate a complete meeting with host credentials using Chime Meeting API
   * This is the main function requested
   * @param {string} eventId - Event identifier
   * @param {string} hostUserId - Host user identifier
   * @returns {Promise<Object>} - Complete meeting setup with host info
   */
  static async generateMeetingLink(
    eventId = "test_event_001",
    hostUserId = "test_host"
  ) {
    try {
      console.log("[chimeHandler] Generating meeting link", {
        eventId,
        hostUserId,
      });

      // Step 1: Create instant meeting
      const meetingResult = await this.createInstantMeeting(
        eventId,
        hostUserId
      );

      // Step 2: Join as host
      const hostResult = await this.joinMeeting(
        meetingResult.meetingId,
        hostUserId,
        "host"
      );

      // Create a simple join URL since the Chime Meeting API doesn't provide one
      const joinUrl = `http://localhost:8080/callFlow.html?meetingInfo=${btoa(
        JSON.stringify({
          MeetingId: meetingResult.meetingId,
          Attendee: {
            AttendeeId: "temp-attendee-id",
            ExternalUserId: hostUserId,
            JoinToken: "temp-join-token",
          },
          role: "host",
        })
      )}`;

      const result = {
        success: true,
        meetingId: meetingResult.meetingId,
        hostInfo: {
          userId: hostUserId,
          joinUrl: joinUrl,
          role: "host",
        },
      };

      console.log("[chimeHandler] Meeting link generated successfully", result);
      return result;
    } catch (error) {
      console.error("[chimeHandler] Error generating meeting link:", error);
      throw error;
    }
  }

  /**
   * Generate meeting link for a specific role (host, collaborator, or attendee)
   * @param {string} meetingId - Existing meeting ID
   * @param {string} userId - User identifier
   * @param {string} role - "host", "collaborator", or "attendee"
   * @returns {Promise<Object>} - Meeting info for the user
   */
  static async generateUserMeetingLink(meetingId, userId, role) {
    try {
      console.log("[chimeHandler] Generating user meeting link", {
        meetingId,
        userId,
        role,
      });

      const joinResult = await this.joinMeeting(meetingId, userId, role);

      // Create a simple join URL since the Chime Meeting API doesn't provide one
      const joinUrl = `http://localhost:8080/callFlow.html?meetingInfo=${btoa(
        JSON.stringify({
          MeetingId: meetingId,
          Attendee: {
            AttendeeId: "temp-attendee-id",
            ExternalUserId: userId,
            JoinToken: "temp-join-token",
          },
          role: role,
        })
      )}`;

      const result = {
        ...joinResult,
        joinUrl: joinUrl,
      };

      console.log(
        "[chimeHandler] User meeting link generated successfully",
        result
      );
      return result;
    } catch (error) {
      console.error(
        "[chimeHandler] Error generating user meeting link:",
        error
      );
      throw error;
    }
  }

  /**
   * Get meeting details using Chime Meeting API
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object>} - Meeting details
   */
  static async getMeeting(meetingId) {
    try {
      console.log("[chimeHandler] Getting meeting details", { meetingId });

      const response = await fetch(
        `${this._chimeMeetingEndpoint}getMeeting?meetingId=${meetingId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log(
          "[chimeHandler] Meeting details retrieved successfully",
          data
        );
        return data;
      } else {
        throw new Error(
          `Failed to get meeting: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("[chimeHandler] Error getting meeting:", error);
      throw error;
    }
  }

  /**
   * Validate if user is host using Chime Meeting API
   * @param {string} meetingId - Meeting ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Validation result
   */
  static async validateHost(meetingId, userId) {
    try {
      console.log("[chimeHandler] Validating host", { meetingId, userId });

      const response = await fetch(
        `${this._lambdaEndpoint}validateHost?meetingId=${meetingId}&userId=${userId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      console.log("[chimeHandler] Host validation result", data);
      return data;
    } catch (error) {
      console.error("[chimeHandler] Error validating host:", error);
      throw error;
    }
  }
}

/* ====================================================================
 * Boot on DOMContentLoaded
 * ==================================================================== */
window.addEventListener("DOMContentLoaded", () => {
  console.log("[chimeHandler] DOMContentLoaded - initializing");
  chimeHandler.init();

  // Expose clean API functions to browser console
  window.createScyllaMeeting =
    chimeHandler.createScyllaMeeting.bind(chimeHandler);
  window.createChimeMeeting =
    chimeHandler.createChimeMeeting.bind(chimeHandler);
  window.addAttendeeToMeeting =
    chimeHandler.addAttendeeToMeeting.bind(chimeHandler);
  window.generateMeetingLink =
    chimeHandler.generateMeetingLink.bind(chimeHandler);
  window.getMeeting = chimeHandler.getMeeting.bind(chimeHandler);
  window.validateHost = chimeHandler.validateHost.bind(chimeHandler);

  // New console function to generate role-based meeting with all participants
  // Simple function to generate meeting links (like curl script)
  window.generateMeetingLinks = async function () {
    console.log("🚀 Generating meeting links...");

    try {
      // Step 1: Create Scylla meeting
      console.log("📋 Step 1: Creating Scylla meeting...");
      const scyllaResponse = await chimeHandler.createScyllaMeeting(
        "meetingID_" + Date.now(),
        "test_host"
      );
      const externalMeetingId = scyllaResponse.externalMeetingId;
      console.log("✅ Step 1 complete: externalMeetingId =", externalMeetingId);

      // Step 2: Create Chime meeting
      console.log("🏗️ Step 2: Creating Chime meeting...");
      const chimeResponse = await chimeHandler.createChimeMeeting(
        externalMeetingId
      );
      const meetingId = chimeResponse.meetingId;
      const meetingData = chimeResponse.meetingData;
      console.log("✅ Step 2 complete: Chime Meeting ID =", meetingId);

      // Step 3: Add Host
      console.log("👑 Step 3: Adding host...");
      const hostResponse = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "host-001",
        "host"
      );
      console.log("✅ Host added successfully");

      // Step 4: Add Collaborator 1
      console.log("🤝 Step 4: Adding collaborator 1...");
      const collab1Response = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "collab-001",
        "collaborator"
      );
      console.log("✅ Collaborator 1 added successfully");

      // Step 5: Add Collaborator 2
      console.log("🤝 Step 5: Adding collaborator 2...");
      const collab2Response = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "collab-002",
        "collaborator"
      );
      console.log("✅ Collaborator 2 added successfully");

      // Step 6: Add Collaborator 3
      console.log("🤝 Step 6: Adding collaborator 3...");
      const collab3Response = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "collab-003",
        "collaborator"
      );
      console.log("✅ Collaborator 3 added successfully");

      // Step 7: Add Attendee
      console.log("👤 Step 7: Adding attendee...");
      const attendeeResponse = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "attendee-004",
        "guest"
      );
      console.log("✅ Attendee added successfully");

      // Generate URLs
      console.log("");
      console.log("🎯 Meeting URLs for testing:");
      console.log("==================================");
      console.log("Scylla Database externalMeetingId:", externalMeetingId);
      console.log("Chime Meeting Service meetingId:", meetingId);
      console.log("");

      // Decode meetingInfo and combine with meeting data
      const hostMeetingInfo = JSON.parse(atob(hostResponse.meetingInfo));
      const collab1MeetingInfo = JSON.parse(atob(collab1Response.meetingInfo));
      const collab2MeetingInfo = JSON.parse(atob(collab2Response.meetingInfo));
      const collab3MeetingInfo = JSON.parse(atob(collab3Response.meetingInfo));
      const attendeeMeetingInfo = JSON.parse(
        atob(attendeeResponse.meetingInfo)
      );

      // Combine with full meeting data
      const hostCombined = { ...hostMeetingInfo, Meeting: meetingData };
      const collab1Combined = { ...collab1MeetingInfo, Meeting: meetingData };
      const collab2Combined = { ...collab2MeetingInfo, Meeting: meetingData };
      const collab3Combined = { ...collab3MeetingInfo, Meeting: meetingData };
      const attendeeCombined = { ...attendeeMeetingInfo, Meeting: meetingData };

      // Encode combined info
      const hostB64 = btoa(JSON.stringify(hostCombined));
      const collab1B64 = btoa(JSON.stringify(collab1Combined));
      const collab2B64 = btoa(JSON.stringify(collab2Combined));
      const collab3B64 = btoa(JSON.stringify(collab3Combined));
      const attendeeB64 = btoa(JSON.stringify(attendeeCombined));

      // Generate URLs
      const baseUrl = "http://localhost:8080/callFlow.html";
      const hostUrl = `${baseUrl}?meetingInfo=${hostB64}`;
      const collab1Url = `${baseUrl}?meetingInfo=${collab1B64}`;
      const collab2Url = `${baseUrl}?meetingInfo=${collab2B64}`;
      const collab3Url = `${baseUrl}?meetingInfo=${collab3B64}`;
      const attendeeUrl = `${baseUrl}?meetingInfo=${attendeeB64}`;

      console.log("Tab 1 (Host):");
      console.log(hostUrl);
      console.log("");
      console.log("Tab 2 (Collaborator 1):");
      console.log(collab1Url);
      console.log("");
      console.log("Tab 3 (Collaborator 2):");
      console.log(collab2Url);
      console.log("");
      console.log("Tab 4 (Collaborator 3):");
      console.log(collab3Url);
      console.log("");
      console.log("Tab 5 (Attendee):");
      console.log(attendeeUrl);
      console.log("");
      console.log("📋 Expected behavior (Group Setting - 5 participants):");
      console.log(
        "- Host: Can see all participants in 2x2 grid + mini overlay"
      );
      console.log(
        "- Collaborators: Can see all participants in 2x2 grid + mini overlay"
      );
      console.log(
        "- Attendee: Can see host + collaborators (2x2 grid) + mini overlay"
      );
      console.log("");
      console.log("📋 Layout will auto-apply based on active participants");

      return {
        success: true,
        externalMeetingId,
        meetingId,
        urls: {
          host: hostUrl,
          collab1: collab1Url,
          collab2: collab2Url,
          collab3: collab3Url,
          attendee: attendeeUrl,
        },
      };
    } catch (error) {
      console.error("❌ Error generating meeting:", error);
      throw error;
    }
  };

  window.generateRoleBasedMeeting = async function () {
    console.log("🚀 Generating role-based meeting...");

    try {
      // Step 1: Create Scylla meeting
      console.log("📋 Step 1: Creating Scylla meeting...");
      const scyllaResponse = await chimeHandler.createScyllaMeeting(
        "console-test-" + Date.now(),
        "console-host"
      );
      const externalMeetingId = scyllaResponse.externalMeetingId;
      console.log("✅ Scylla meeting created:", externalMeetingId);

      // Step 2: Create Chime meeting
      console.log("🏗️ Step 2: Creating Chime meeting...");
      const chimeResponse = await chimeHandler.createChimeMeeting(
        externalMeetingId
      );
      const meetingId = chimeResponse.meetingId;
      const meetingData = chimeResponse.meetingData;
      console.log("✅ Chime meeting created:", meetingId);

      // Step 3: Add Host
      console.log("👑 Step 3: Adding host...");
      const hostResponse = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "host-001",
        "host"
      );
      console.log("✅ Host added successfully");

      // Step 4: Add Collaborator
      console.log("🤝 Step 4: Adding collaborator...");
      const collabResponse = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "collab-002",
        "collaborator"
      );
      console.log("✅ Collaborator added successfully");

      // Step 5: Add Guest
      console.log("👤 Step 5: Adding guest...");
      const guestResponse = await chimeHandler.addAttendeeToMeeting(
        meetingId,
        "guest-003",
        "guest"
      );
      console.log("✅ Guest added successfully");

      // Decode and combine meetingInfo with full meeting data (like curl script)
      const hostMeetingInfoDecoded = atob(hostResponse.meetingInfo);
      const collabMeetingInfoDecoded = atob(collabResponse.meetingInfo);
      const guestMeetingInfoDecoded = atob(guestResponse.meetingInfo);

      // Combine with full meeting data
      const hostCombinedInfo = JSON.parse(hostMeetingInfoDecoded);
      hostCombinedInfo.Meeting = meetingData;

      const collabCombinedInfo = JSON.parse(collabMeetingInfoDecoded);
      collabCombinedInfo.Meeting = meetingData;

      const guestCombinedInfo = JSON.parse(guestMeetingInfoDecoded);
      guestCombinedInfo.Meeting = meetingData;

      // Generate URLs
      const baseUrl = window.location.origin + window.location.pathname;

      const hostUrl =
        baseUrl +
        "?meetingInfo=" +
        encodeURIComponent(btoa(JSON.stringify(hostCombinedInfo)));
      const collabUrl =
        baseUrl +
        "?meetingInfo=" +
        encodeURIComponent(btoa(JSON.stringify(collabCombinedInfo)));
      const guestUrl =
        baseUrl +
        "?meetingInfo=" +
        encodeURIComponent(btoa(JSON.stringify(guestCombinedInfo)));

      console.log("\n🎯 Meeting URLs for testing:");
      console.log("==================================");
      console.log("Meeting ID:", meetingId);
      console.log("\nTab 1 (Host):");
      console.log(hostUrl);
      console.log("\nTab 2 (Collaborator):");
      console.log(collabUrl);
      console.log("\nTab 3 (Guest):");
      console.log(guestUrl);

      console.log("\n📋 Expected behavior (Group Setting - 3 participants):");
      console.log("- Host: Can see hosts and collaborators, NOT attendees");
      console.log(
        "- Collaborator: Can see hosts and collaborators, NOT attendees"
      );
      console.log(
        "- Attendee: Can see hosts and collaborators, NOT other attendees"
      );

      return {
        meetingId,
        hostUrl,
        collabUrl,
        guestUrl,
        hostResponse: hostCombinedInfo,
        collabResponse: collabCombinedInfo,
        guestResponse: guestCombinedInfo,
      };
    } catch (error) {
      console.error("❌ Error generating meeting:", error);
      throw error;
    }
  };

  console.log("[chimeHandler] Clean API functions available in console:");
  console.log(
    "- createScyllaMeeting(eventId, initiatorId) // Step 1: Database API"
  );
  console.log("- createChimeMeeting(externalMeetingId) // Step 2: Meeting API");
  console.log(
    "- addAttendeeToMeeting(meetingId, userId, role) // Step 3: Meeting API"
  );
  console.log("- generateMeetingLink(eventId, hostUserId) // Complete process");
  console.log("- getMeeting(meetingId)");
  console.log("- validateHost(meetingId, userId)");
  console.log(
    "- generateMeetingLinks() // 🚀 Simple function to generate all 3 meeting links"
  );
  console.log(
    "- generateRoleBasedMeeting() // 🚀 Creates meeting with host, collaborator, and guest"
  );

  // Clean CORS test functions
  window.testScyllaDatabaseCORS = async function () {
    console.log("🧪 Testing Scylla Database API CORS...");
    try {
      const result = await chimeHandler.createScyllaMeeting(
        "cors-test-" + Date.now(),
        "test_host"
      );
      console.log("✅ Scylla Database API CORS WORKING!", result);
      return result;
    } catch (error) {
      console.log("❌ Scylla Database API CORS BLOCKED:", error.message);
      return null;
    }
  };

  window.testChimeMeetingCORS = async function () {
    console.log("🧪 Testing Chime Meeting API CORS...");
    try {
      const result = await chimeHandler.createChimeMeeting(
        "cors-test-" + Date.now()
      );
      console.log("✅ Chime Meeting API CORS WORKING!", result);
      return result;
    } catch (error) {
      console.log("❌ Chime Meeting API CORS BLOCKED:", error.message);
      return null;
    }
  };

  window.testAllAPIsCORS = async function () {
    console.log("🧪 Testing ALL APIs CORS...");
    const scyllaAPI = await window.testScyllaDatabaseCORS();
    const chimeAPI = await window.testChimeMeetingCORS();

    console.log("📊 CORS Results:");
    console.log(
      "- Scylla Database API:",
      scyllaAPI ? "✅ WORKING" : "❌ BLOCKED"
    );
    console.log("- Chime Meeting API:", chimeAPI ? "✅ WORKING" : "❌ BLOCKED");

    return { scyllaAPI: !!scyllaAPI, chimeAPI: !!chimeAPI };
  };

  console.log("- testScyllaDatabaseCORS() // 🧪 Test Scylla Database API CORS");
  console.log("- testChimeMeetingCORS() // 🧪 Test Chime Meeting API CORS");
  console.log("- testAllAPIsCORS() // 🧪 Test ALL APIs CORS");
  console.log("- debugMapping() // 🔍 Debug mapping cache and visibility");
  console.log("- sendMappingPacket() // 📤 Manually send mapping packet");
  console.log(
    "- checkVideoTiles() // 🎥 Check all video tiles and their status"
  );

  // Debug function to check mapping cache and visibility
  window.debugMapping = function () {
    console.log("🔍 Debug Mapping Cache:");
    console.log("Current user role:", chimeHandler._currentUserRole);
    console.log("Mapping cache size:", chimeHandler._mappingCache.size);
    console.log("Mapping cache contents:");
    for (const [attendeeId, mapping] of chimeHandler._mappingCache.entries()) {
      console.log(
        `  ${attendeeId}: ${mapping.role} (${mapping.externalUserId})`
      );
    }

    console.log("\n🎥 Video Tiles Status:");
    const allContainers = document.querySelectorAll(".video-card");
    allContainers.forEach((container) => {
      const attendeeId = container.getAttribute("data-attendee-id");
      const hasVideo = container.querySelector("video");
      const isHidden = container.classList.contains("hidden");
      console.log(
        `  ${
          container.id
        }: attendeeId=${attendeeId}, hasVideo=${!!hasVideo}, hidden=${isHidden}`
      );
    });

    console.log("\n👥 Visibility Check:");
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
    for (const [attendeeId, mapping] of chimeHandler._mappingCache.entries()) {
      const shouldShow = chimeHandler._shouldShowVideo(attendeeId);
      console.log(
        `  ${attendeeId} (${mapping.role}): shouldShow=${shouldShow}`
      );
    }
  };

  // Function to manually send mapping packet
  window.sendMappingPacket = function () {
    const myAttendeeId = coreChime.getLocalIdentifiers().attendeeId;
    const myExternalUserId = coreChime.getLocalIdentifiers().externalUserId;
    if (myAttendeeId && myExternalUserId) {
      chimeHandler._sendMappingPacket(myAttendeeId, myExternalUserId);
      console.log("📤 Mapping packet sent manually");
    } else {
      console.log("❌ Cannot send mapping packet - not connected");
    }
  };

  // Function to check video tiles
  window.checkVideoTiles = function () {
    console.log("🎥 Video Tiles Check:");
    const tiles = coreChime.getVideoTiles();
    console.log("Total tiles:", tiles.length);
    tiles.forEach((tile) => {
      console.log(
        `  Tile ${tile.tileId}: attendeeId=${tile.boundAttendeeId}, active=${
          tile.active
        }, hasStream=${!!tile.boundVideoStream}`
      );
    });
  };
});

// Expose globally for status updates
window.chimeHandler = chimeHandler;

console.log("[chimeHandler] Class loaded");
