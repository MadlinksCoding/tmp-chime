/* ========================================================================
 * coreChime.js
 * Single responsibility: talk to Amazon Chime SDK and nothing else
 * - Never touches DOM
 * - Emits events for everything
 * - Promise-based API
 * ======================================================================== */

class coreChime {
  // Internal state
  static _meetingSession = null;
  static _audioVideo = null;
  static _meetingInfo = null;
  static _attendeeInfo = null;
  static _connectionState = { status: "ready", reason: null };
  static _localIdentifiers = {
    attendeeId: null,
    externalUserId: null,
    connectionId: null,
  };

  // Video state tracking
  static _videoEnabled = false;
  static _localVideoTileStarted = false;
  static _currentVideoDevice = null;
  
  // Video processing (blur/background)
  static _videoProcessor = null;
  static _videoTransformDevice = null;

  /* ====================================================================
   * HELPER: Emit custom events
   * ==================================================================== */
  static _emit(eventName, detail = {}) {
    console.log(`[coreChime] [emit] ${eventName}`, detail);
    try {
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail,
          bubbles: false,
          cancelable: false,
        })
      );
      return true;
    } catch (error) {
      console.error(`[coreChime] [emit] Error emitting ${eventName}:`, error);
      return false;
    }
  }

  /* ====================================================================
   * initialize({ meetingInfo, attendeeInfo, mediaPolicy })
   * Sets up Chime client, observers, and data channel
   * Does NOT auto-join
   * ==================================================================== */
  static async initialize({ meetingInfo, attendeeInfo, mediaPolicy = {} }) {
    console.log("[coreChime] [initialize] Start", {
      meetingInfo,
      attendeeInfo,
      mediaPolicy,
    });

    // Validate inputs
    if (!meetingInfo || !meetingInfo.Meeting) {
      throw new Error("[coreChime] meetingInfo.Meeting is required");
    }
    if (!attendeeInfo || !attendeeInfo.Attendee) {
      throw new Error("[coreChime] attendeeInfo.Attendee is required");
    }

    // Check if Chime SDK is loaded (check multiple possible global names)
    let SDK =
      window.ChimeSDK ||
      window.AmazonChimeSDK ||
      window.chimeSDK ||
      window.appChimeSDK;

    if (!SDK) {
      throw new Error(
        "[coreChime] ChimeSDK not found. Load chime SDK script first."
      );
    }

    // The SDK might be wrapped in a .default property (ES6 module export)
    SDK = SDK.default || SDK;

    console.log("[coreChime] Using SDK:", SDK);

    // Destructure SDK classes (correct way to use the SDK)
    const {
      ConsoleLogger,
      DefaultDeviceController,
      MeetingSessionConfiguration,
      DefaultMeetingSession,
      LogLevel,
    } = SDK;

    this._meetingInfo = meetingInfo;
    this._attendeeInfo = attendeeInfo;

    // Store identifiers
    this._localIdentifiers.attendeeId = attendeeInfo.Attendee.AttendeeId;
    this._localIdentifiers.externalUserId =
      attendeeInfo.Attendee.ExternalUserId || null;

    // Create meeting session configuration
    const configuration = new MeetingSessionConfiguration(
      meetingInfo.Meeting,
      attendeeInfo.Attendee
    );

    // Create logger
    const logger = new ConsoleLogger(
      "ChimeMeeting",
      LogLevel ? LogLevel.WARN : 2
    );

    // Create device controller
    const deviceController = new DefaultDeviceController(logger);

    // Create meeting session
    this._meetingSession = new DefaultMeetingSession(
      configuration,
      logger,
      deviceController
    );
    this._audioVideo = this._meetingSession.audioVideo;

    // Set up observers
    this._setupObservers();

    // Set up presence (for mapping attendeeId <-> externalUserId)
    this._setupPresence();

    // Set up data channel
    this._setupDataChannel();

    console.log("[coreChime] [initialize] Complete");
    this._connectionState.status = "ready";
  }

  /* ====================================================================
   * Setup Observers (lifecycle events)
   * ==================================================================== */
  static _setupObservers() {
    const observer = {
      audioVideoDidStart: () => {
        console.log("[coreChime] audioVideoDidStart");
        this._connectionState.status = "connected";
        this._emit("coreChime:connected", {
          attendeeId: this._localIdentifiers.attendeeId,
          externalUserId: this._localIdentifiers.externalUserId,
          connectionId:
            this._meetingSession?.configuration?.credentials?.sessionToken ||
            null,
        });
      },

      audioVideoDidStop: (sessionStatus) => {
        console.log("[coreChime] audioVideoDidStop", sessionStatus);
        const reason = sessionStatus?.statusCode()
          ? `Code: ${sessionStatus.statusCode()}`
          : "Unknown";
        this._connectionState = { status: "disconnected", reason };
        this._emit("coreChime:disconnected", { reason });
      },

      videoTileDidUpdate: (tileState) => {
        const hasStream = !!tileState.boundVideoStream;
        const isLocal = tileState.localTile || false;
        
        console.log("[coreChime] videoTileDidUpdate", tileState);
        console.log(`[coreChime] Tile ${tileState.tileId}: ${isLocal ? 'LOCAL' : 'REMOTE'}, hasStream=${hasStream}, active=${tileState.active}`);
        
        if (typeof DebugLogger !== "undefined") {
          DebugLogger.addLog('connected', 'NOTICE', 'coreChime.videoTileDidUpdate', `SDK Tile Update: ${isLocal ? '📹 LOCAL' : '🎥 REMOTE'}`, {
            tileId: tileState.tileId,
            attendeeId: tileState.boundAttendeeId,
            hasStream,
            active: tileState.active,
            videoState: hasStream ? '✅ HAS STREAM' : '❌ NO STREAM',
            paused: tileState.paused || false
          });
        }
        
        this._emit("coreChime:tile-updated", {
          tileId: tileState.tileId,
          boundAttendeeId: tileState.boundAttendeeId,
          isContent: tileState.isContent || false,
          isLocal: isLocal,
          active: tileState.active,
          hasStream: hasStream,
          paused: tileState.paused || false,
        });
      },

      videoTileWasRemoved: (tileId) => {
        console.log("[coreChime] videoTileWasRemoved", tileId);
        this._emit("coreChime:tile-removed", { tileId });
      },
    };

    this._audioVideo.addObserver(observer);
  }

  /* ====================================================================
   * Setup Presence (attendee join/leave tracking)
   * ==================================================================== */
  static _setupPresence() {
    this._audioVideo.realtimeSubscribeToAttendeeIdPresence(
      (attendeeId, present, externalUserId) => {
        console.log("[coreChime] Presence update", {
          attendeeId,
          present,
          externalUserId,
        });
        
        if (typeof DebugLogger !== "undefined") {
          DebugLogger.addLog(present ? 'joined' : 'terminated', 'NOTICE', 'coreChime.realtimeSubscribe', `Attendee ${present ? 'Joined' : 'Left'}`, {
            attendeeId,
            externalUserId,
            present
          });
        }

        if (present) {
          this._emit("coreChime:attendee-joined", {
            attendeeId,
            externalUserId,
          });
        } else {
          this._emit("coreChime:attendee-left", { attendeeId, externalUserId });
        }
      }
    );
    
    // Subscribe to volume indicators (detects audio mute/unmute)
    this._audioVideo.realtimeSubscribeToVolumeIndicator(
      (attendeeId, volume, muted, signalStrength) => {
        console.log("[coreChime] Volume indicator", {
          attendeeId,
          volume,
          muted,
          signalStrength
        });
        
        if (typeof DebugLogger !== "undefined") {
          DebugLogger.addLog('connected', 'NOTICE', 'coreChime.audioVideoObserver', `Audio Status: ${attendeeId.substring(0,8)}...`, {
            attendeeId,
            muted,
            volume,
            signal: signalStrength
          });
        }
        
        // Emit for chimeHandler to update UI
        this._emit("coreChime:audio-status-changed", {
          attendeeId,
          muted,
          volume,
          signalStrength
        });
      }
    );
  }

  /* ====================================================================
   * Setup Data Channel (for app-level messages)
   * ==================================================================== */
  static _setupDataChannel() {
    this._audioVideo.realtimeSubscribeToReceiveDataMessage(
      "app-data",
      (dataMessage) => {
        try {
          const payload = JSON.parse(dataMessage.text());
          const senderAttendeeId = dataMessage.senderAttendeeId;
          const senderExternalUserId = dataMessage.senderExternalUserId || null;

          console.log("[coreChime] Data received", {
            payload,
            from: senderAttendeeId,
          });

          this._emit("coreChime:data-received", {
            flag: payload.flag || "unknown",
            payload: payload.payload || {},
            from: {
              attendeeId: senderAttendeeId,
              externalUserId: senderExternalUserId,
            },
          });
        } catch (error) {
          console.error("[coreChime] Error parsing data message:", error);
        }
      }
    );
  }

  /* ====================================================================
   * join({ enableAudio, enableVideo, blurLevel?, backgroundImageUrl? })
   * Starts the session and negotiates local tracks
   * ==================================================================== */
  static async join({
    enableAudio = true,
    enableVideo = true,
    blurLevel = "off",
    backgroundImageUrl = null,
  }) {
    console.log("[coreChime] [join] Start", {
      enableAudio,
      enableVideo,
      blurLevel,
      backgroundImageUrl,
    });

    if (!this._audioVideo) {
      throw new Error("[coreChime] Not initialized. Call initialize() first.");
    }

    this._connectionState.status = "connecting";
    this._emit("coreChime:connecting", {});

    try {
      // Choose devices
      const audioInputDevices = await this._audioVideo.listAudioInputDevices();
      const videoInputDevices = await this._audioVideo.listVideoInputDevices();
      const audioOutputDevices =
        await this._audioVideo.listAudioOutputDevices();

      // STEP 1: Choose devices BEFORE starting connection
      console.log("[coreChime] Step 1: Choosing devices...");
      
      // Select audio input (try both old and new SDK APIs)
      if (enableAudio && audioInputDevices.length > 0) {
        // Use CamMic utility to get preferred device (has its own memory)
        const preferredMic = (typeof CamMicPermissionsUtility !== 'undefined' && CamMicPermissionsUtility.getPreferredDevice)
          ? CamMicPermissionsUtility.getPreferredDevice("microphone")
          : null;
        
        const selectedMic = preferredMic || audioInputDevices[0].deviceId;

        try {
          // Try new API first
          if (typeof this._audioVideo.chooseAudioInputDevice === "function") {
            await this._audioVideo.chooseAudioInputDevice(selectedMic);
            console.log("[coreChime] ✓ Audio input chosen (new API):", selectedMic);
          }
          // Fall back to old API
          else if (typeof this._audioVideo.startAudioInput === "function") {
            await this._audioVideo.startAudioInput(selectedMic);
            console.log("[coreChime] ✓ Audio input started (old API):", selectedMic);
          }
          else {
            console.warn("[coreChime] No audio input method available");
          }
        } catch (e) {
          console.warn("[coreChime] Audio input setup failed:", e);
        }
      }

      // Select audio output (try both old and new SDK APIs)
      if (audioOutputDevices.length > 0) {
        try {
          if (typeof this._audioVideo.chooseAudioOutputDevice === "function") {
            await this._audioVideo.chooseAudioOutputDevice(
              audioOutputDevices[0].deviceId
            );
            console.log("[coreChime] ✓ Audio output chosen");
          }
          else {
            console.warn("[coreChime] chooseAudioOutputDevice not available");
          }
        } catch (e) {
          console.warn("[coreChime] Audio output setup failed:", e);
        }
      }

      // Select video input (try both old and new SDK APIs)
      if (enableVideo && videoInputDevices.length > 0) {
        // Use CamMic utility to get preferred device (has its own memory)
        const preferredCam = (typeof CamMicPermissionsUtility !== 'undefined' && CamMicPermissionsUtility.getPreferredDevice)
          ? CamMicPermissionsUtility.getPreferredDevice("camera")
          : null;
        
        const selectedCam = preferredCam || videoInputDevices[0].deviceId;

        try {
          // Store current video device
          this._currentVideoDevice = selectedCam;
          
          // Try new API first
          if (typeof this._audioVideo.chooseVideoInputDevice === "function") {
            await this._audioVideo.chooseVideoInputDevice(selectedCam);
            console.log("[coreChime] ✓ Video input chosen (new API):", selectedCam);
          }
          // Fall back to old API
          else if (typeof this._audioVideo.startVideoInput === "function") {
            await this._audioVideo.startVideoInput(selectedCam);
            console.log("[coreChime] ✓ Video input started (old API):", selectedCam);
          }
          else {
            console.warn("[coreChime] No video input method available");
          }
        } catch (e) {
          console.warn("[coreChime] Video input setup failed:", e);
        }
      }

      // STEP 2: Bind audio element BEFORE starting
      console.log("[coreChime] Step 2: Binding audio element...");
      try {
        const audioElement = document.getElementById("meeting-audio") || 
                            document.createElement("audio");
        
        if (!audioElement.id) {
          audioElement.id = "meeting-audio";
          audioElement.autoplay = true;
          audioElement.style.display = "none";
          document.body.appendChild(audioElement);
        }
        
        await this._audioVideo.bindAudioElement(audioElement);
        console.log("[coreChime] ✓ Audio element bound");
      } catch (e) {
        console.error("[coreChime] Failed to bind audio element:", e);
      }

      // STEP 3: Start the session (establishes signaling connection)
      console.log("[coreChime] Step 3: Starting audio/video session...");
      this._audioVideo.start();
      console.log("[coreChime] ✓ Session started");

      // STEP 4: Start local video tile AFTER session starts
      if (enableVideo) {
        console.log("[coreChime] Step 4: Starting local video tile...");
        this._audioVideo.startLocalVideoTile();
        this._videoEnabled = true;
        console.log("[coreChime] ✓ Local video tile started");
        
        // DIAGNOSTIC: Check if video is actually streaming
        setTimeout(async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (stream) {
              console.log("[coreChime] ✅ Camera stream is ACTIVE:", {
                videoTracks: stream.getVideoTracks().length,
                trackEnabled: stream.getVideoTracks()[0]?.enabled,
                trackReadyState: stream.getVideoTracks()[0]?.readyState,
              });
              stream.getTracks().forEach(t => t.stop()); // Stop test stream
            }
          } catch (e) {
            console.error("[coreChime] ❌ Camera NOT available:", e);
          }
        }, 2000);
      }

      console.log("[coreChime] [join] Complete");
    } catch (error) {
      console.error("[coreChime] [join] Error:", error);
      this._connectionState = { status: "disconnected", reason: error.message };
      this._emit("coreChime:disconnected", { reason: error.message });
      throw error;
    }
  }

  /* ====================================================================
   * leave(reason?)
   * Stops local media and leaves the session
   * ==================================================================== */
  static async leave(reason = "User left") {
    console.log("[coreChime] [leave]", reason);

    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot leave - not initialized");
      return;
    }

    try {
      // Cleanup video processors
      if (this._videoProcessor) {
        try {
          if (typeof this._videoProcessor.destroy === 'function') {
            await this._videoProcessor.destroy();
            console.log("[coreChime] ✓ Video processor destroyed");
          }
        } catch (e) {
          console.warn("[coreChime] Processor cleanup error:", e);
        }
        this._videoProcessor = null;
      }
      
      if (this._videoTransformDevice) {
        try {
          if (typeof this._videoTransformDevice.stop === 'function') {
            await this._videoTransformDevice.stop();
            console.log("[coreChime] ✓ Transform device stopped");
          }
        } catch (e) {
          console.warn("[coreChime] Transform device cleanup error:", e);
        }
        this._videoTransformDevice = null;
      }
      
      // Stop local video tile (OK to remove when leaving the meeting entirely)
      this._audioVideo.stopLocalVideoTile();
      this._localVideoTileStarted = false; // Reset for next meeting
      this._videoEnabled = false; // Reset video state
      console.log("[coreChime] ✓ Stopped local video tile");

      // Stop video input stream (camera)
      if (typeof this._audioVideo.stopVideoInput === "function") {
        await this._audioVideo.stopVideoInput();
        console.log("[coreChime] ✓ Stopped video input stream");
      }

      // Stop audio input stream (microphone)
      if (typeof this._audioVideo.stopAudioInput === "function") {
        await this._audioVideo.stopAudioInput();
        console.log("[coreChime] ✓ Stopped audio input stream");
      }

      // Stop the audio/video session
      this._audioVideo.stop();
      console.log("[coreChime] ✓ Stopped audio/video session");

      this._connectionState = { status: "disconnected", reason };
      this._videoEnabled = false; // Reset video state
      this._emit("coreChime:disconnected", { reason });

      console.log("[coreChime] [leave] Complete - All streams stopped");
    } catch (error) {
      console.error("[coreChime] [leave] Error:", error);
    }
  }

  /* ====================================================================
   * endMeetingForAll()
   * Host-only: terminates meeting for all participants
   * (Server-verified in real implementation)
   * ==================================================================== */
  static async endMeetingForAll() {
    console.log("[coreChime] [endMeetingForAll]");

    // TODO: In production, this should call your backend to delete the meeting
    // For now, just leave locally
    await this.leave("Meeting ended by host");
  }

  /* ====================================================================
   * toggleVideo(on: boolean)
   * Starts/stops local video track
   * ==================================================================== */
  static _videoEnabled = false; // Track video state
  static _localVideoTileStarted = false; // Track if tile was ever started
  
  static async toggleVideo(on) {
    console.log("[coreChime] [toggleVideo] REQUESTED:", on, "current state:", this._videoEnabled);
    
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'coreChime.toggleVideo', `Video Toggle Request: ${on ? 'ON' : 'OFF'}`, {
        requested: on,
        currentState: this._videoEnabled,
        mismatch: on === this._videoEnabled
      });
    }

    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot toggle video - not initialized");
      return;
    }

    try {
      if (on) {
        console.log("[coreChime] 🎥 Turning ON video...");
        
        // If state says already ON but user is clicking ON again, it means stream is broken
        // Force a restart by stopping first
        if (this._videoEnabled) {
          console.log("[coreChime] ⚠️ State says ON but user clicking ON - forcing restart!");
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'coreChime.toggleVideo', "Force Restart: Video", {
              reason: "State ON but stream appears broken",
              action: "Stop then restart video input"
            });
          }
          
          // Stop current video input
          if (typeof this._audioVideo.stopVideoInput === "function") {
            await this._audioVideo.stopVideoInput();
            console.log("[coreChime] ✓ Stopped broken video stream");
          }
          
          // Wait for cleanup
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // DON'T stop the tile - it should remain throughout the call
        // Just restart the video input if needed
        
        const videoDevices = await this._audioVideo.listVideoInputDevices();
        console.log("[coreChime] Available video devices:", videoDevices.length);
        
        if (videoDevices.length > 0) {
          // Use CamMic utility to get preferred device (has its own memory)
          const preferredCam = (typeof CamMicPermissionsUtility !== 'undefined' && CamMicPermissionsUtility.getPreferredDevice)
            ? CamMicPermissionsUtility.getPreferredDevice("camera")
            : null;
          
          const selectedCam = preferredCam || videoDevices[0].deviceId;
          console.log("[coreChime] Preferred camera from CamMic:", preferredCam);
          console.log("[coreChime] Using camera:", selectedCam);

          // Set video input device (try both API versions)
          console.log("[coreChime] 1/3 Setting video input device...");
          try {
          if (typeof this._audioVideo.chooseVideoInputDevice === "function") {
            await this._audioVideo.chooseVideoInputDevice(selectedCam);
              console.log("[coreChime] ✓ Video input chosen (new API)");
            } else if (typeof this._audioVideo.startVideoInput === "function") {
              await this._audioVideo.startVideoInput(selectedCam);
              console.log("[coreChime] ✓ Video input started (old API)");
            }
          } catch (e) {
            console.error("[coreChime] Failed to set video input:", e);
            throw e;
          }

          // Longer delay to ensure device is ready and stream starts
          console.log("[coreChime] 2/3 Waiting for camera to acquire stream...");
          await new Promise(resolve => setTimeout(resolve, 500));

          // ALWAYS start the local video tile when turning video ON
          // This ensures the SDK properly binds the new stream to the video element
          console.log("[coreChime] 3/3 Starting/restarting local video tile...");
          this._audioVideo.startLocalVideoTile();
          if (!this._localVideoTileStarted) {
            this._localVideoTileStarted = true;
            console.log("[coreChime] ✅ Local video tile started (FIRST TIME)");
          } else {
            console.log("[coreChime] ✅ Local video tile restarted (ensures stream binding)");
          }
          
          // Wait a bit more for stream to be bound to tile
          console.log("[coreChime] 4/4 Waiting for stream to bind to tile...");
          await new Promise(resolve => setTimeout(resolve, 500));
          
          this._videoEnabled = true;
          console.log("[coreChime] 5/5 Video ON complete - state updated to:", this._videoEnabled);
          
          // Manually emit tile update for local tile (SDK doesn't always fire this)
          const localAttendeeId = this._localIdentifiers.attendeeId;
          if (localAttendeeId) {
            console.log("[coreChime] 📤 Manually emitting tile update: video ON");
            this._emit("coreChime:tile-updated", {
              tileId: 1, // Local tile is always 1
              boundAttendeeId: localAttendeeId,
              isContent: false,
              isLocal: true,
              active: true,
              hasStream: true, // Video is ON
              paused: false,
            });
            
            // Notify remote users via data channel
            console.log("[coreChime] 📤 Notifying remote users: video ON");
            this.sendData("video-toggle", { videoEnabled: true, attendeeId: localAttendeeId });
          }
        } else {
          console.warn("[coreChime] ❌ No video devices available");
        }
      } else {
        console.log("[coreChime] 🎥 Turning OFF video...");

        // DON'T stop the tile - tiles should NEVER be removed
        // Just stop the video input stream - tile will remain with hasStream=false

        this._videoEnabled = false;
        console.log("[coreChime] ✓ Video state updated to:", this._videoEnabled);

        // Stop the video input stream (camera)
        if (typeof this._audioVideo.stopVideoInput === "function") {
          await this._audioVideo.stopVideoInput();
          console.log("[coreChime] ✓ Stopped video input");
        } else {
          console.warn("[coreChime] stopVideoInput not available");
        }

        console.log("[coreChime] ✅ Video OFF complete - camera light should turn off");
        console.log("[coreChime] ✅ Tile remains active, just no video stream");
        
        // Manually emit tile update for local tile (SDK doesn't fire this on stopVideoInput)
        const localAttendeeId = this._localIdentifiers.attendeeId;
        if (localAttendeeId) {
          console.log("[coreChime] 📤 Manually emitting tile update: video OFF");
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'coreChime.toggleVideo', "Manual Tile Update: video OFF", {
              attendeeId: localAttendeeId,
              hasStream: false,
              reason: "stopVideoInput() doesn't trigger SDK observer"
            });
          }
          this._emit("coreChime:tile-updated", {
            tileId: 1, // Local tile is always 1
            boundAttendeeId: localAttendeeId,
            isContent: false,
            isLocal: true,
            active: true, // Tile is still active
            hasStream: false, // But no video stream
            paused: false,
          });
          
          // Notify remote users via data channel
          console.log("[coreChime] 📤 Notifying remote users: video OFF");
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'coreChime.toggleVideo', "Sending video toggle to remote", {
              videoEnabled: false,
              attendeeId: localAttendeeId
            });
          }
          this.sendData("video-toggle", { videoEnabled: false, attendeeId: localAttendeeId });
        }
      }

      console.log("[coreChime] [toggleVideo] Complete - Final state:", this._videoEnabled);
    } catch (error) {
      console.error("[coreChime] [toggleVideo] Error:", error);
      // Reset state on error
      this._videoEnabled = false;
    }
  }

  /* ====================================================================
   * changeAudioInputDevice(deviceId: string)
   * Changes the microphone during active call
   * ==================================================================== */
  static async changeAudioInputDevice(deviceId) {
    console.log("[coreChime] [changeAudioInputDevice]", deviceId);
    
    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot change audio device - not initialized");
      return;
    }
    
    try {
      await this._audioVideo.chooseAudioInputDevice(deviceId);
      localStorage.setItem("CamMicPreferred-microphone", deviceId);
      console.log("[coreChime] ✅ Microphone changed to:", deviceId);
      this._emit("coreChime:audio-device-changed", { deviceId });
    } catch (error) {
      console.error("[coreChime] Failed to change audio device:", error);
      throw error;
    }
  }

  /* ====================================================================
   * changeVideoInputDevice(deviceId: string)
   * Changes the camera during active call
   * ==================================================================== */
  static async changeVideoInputDevice(deviceId) {
    console.log("[coreChime] [changeVideoInputDevice]", deviceId);
    
    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot change video device - not initialized");
      return;
    }
    
    try {
      // Store current video device
      this._currentVideoDevice = deviceId;
      
      await this._audioVideo.chooseVideoInputDevice(deviceId);
      localStorage.setItem("CamMicPreferred-camera", deviceId);
      console.log("[coreChime] ✅ Camera changed to:", deviceId);
      this._emit("coreChime:video-device-changed", { deviceId });
    } catch (error) {
      console.error("[coreChime] Failed to change video device:", error);
      throw error;
    }
  }

  /* ====================================================================
   * changeAudioOutputDevice(deviceId: string)
   * Changes the speaker during active call
   * ==================================================================== */
  static async changeAudioOutputDevice(deviceId) {
    console.log("[coreChime] [changeAudioOutputDevice]", deviceId);
    
    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot change audio output device - not initialized");
      return;
    }
    
    try {
      await this._audioVideo.chooseAudioOutputDevice(deviceId);
      localStorage.setItem("CamMicPreferred-speaker", deviceId);
      console.log("[coreChime] ✅ Speaker changed to:", deviceId);
      this._emit("coreChime:audio-output-changed", { deviceId });
    } catch (error) {
      console.error("[coreChime] Failed to change audio output device:", error);
      throw error;
    }
  }

  /* ====================================================================
   * setVideoBlur(level: 'off' | 'low' | 'medium' | 'high')
   * Sets background blur level for video - Using v2 SDK approach
   * ==================================================================== */
  static async setVideoBlur(level) {
    console.log("[coreChime] [setVideoBlur]", level);
    
    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot set blur - not initialized");
      DebugLogger.addLog(
        "connected",
        "CRITICAL",
        "setVideoBlur",
        "Cannot set blur: Meeting not initialized. Please join a meeting first."
      );
      return;
    }
    
    try {
      // Get SDK root
      const SDK = window.ChimeSDK || window.AmazonChimeSDK || window;
      const root = SDK.default || SDK;
      
      // Get current video device using CamMic utility (has its own memory)
      const preferredCam = (typeof CamMicPermissionsUtility !== 'undefined' && CamMicPermissionsUtility.getPreferredDevice)
        ? CamMicPermissionsUtility.getPreferredDevice("camera")
        : null;
      const videoDevice = preferredCam || this._currentVideoDevice || 'default';
      
      if (level === 'off') {
        // Just use the raw video device (original approach)
        if (videoDevice) {
          await this._audioVideo.startVideoInput(videoDevice);
        }
        this._videoProcessor = null;
        this._videoTransformDevice = null;
        console.log("[coreChime] ✅ Blur disabled");
        DebugLogger.addLog("connected", "NOTICE", "setVideoBlur", "Blur disabled");
      } else {
        // Check if BackgroundBlurStrength enum exists
        console.log("[coreChime] BackgroundBlurStrength enum:", root.BackgroundBlurStrength);
        
        // Map blur levels - use numeric values if enum not available
        let blurStrength;
        if (root.BackgroundBlurStrength) {
          const strengthMap = {
            low: root.BackgroundBlurStrength.LOW,
            medium: root.BackgroundBlurStrength.MEDIUM,
            high: root.BackgroundBlurStrength.HIGH
          };
          blurStrength = strengthMap[level] || root.BackgroundBlurStrength.MEDIUM;
          console.log(`[coreChime] Using enum blur: ${level} = ${blurStrength}`);
        } else {
          // Fallback to numeric values
          const strengthMap = {
            low: 5,
            medium: 15,
            high: 25
          };
          blurStrength = strengthMap[level] || 15;
          console.log(`[coreChime] Using numeric blur: ${level} = ${blurStrength}`);
        }
        
        if (!root.BackgroundBlurVideoFrameProcessor) {
          throw new Error("BackgroundBlurVideoFrameProcessor not available in SDK");
        }
        
        if (!root.DefaultVideoTransformDevice) {
          throw new Error("DefaultVideoTransformDevice not available in SDK");
        }
        
        // Create blur processor
        const processor = await root.BackgroundBlurVideoFrameProcessor.create({
          blurStrength: blurStrength
        });
        
        console.log("[coreChime] ✓ Processor created with actual blur strength:", blurStrength);
        
        console.log("[coreChime] ✓ Blur processor created");
        
        // Create logger
        const logger = new root.ConsoleLogger('VideoFilter', root.LogLevel.INFO);
        
        // Create transform device
        const transformDevice = new root.DefaultVideoTransformDevice(
          logger,
          videoDevice,
          [processor]
        );
        
        console.log("[coreChime] Applying transform device...");
        
        // Apply the transform device (SDK handles cleanup automatically)
        await this._audioVideo.startVideoInput(transformDevice);
        
        // Update state
        this._videoProcessor = processor;
        this._videoTransformDevice = transformDevice;
        
        console.log("[coreChime] ✅ Blur applied:", level);
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "setVideoBlur",
          `Background blur set to ${level}`
        );
      }
      
      localStorage.setItem("CamMicPreferred-blur", level);
      this._emit("coreChime:blur-changed", { level });
    } catch (error) {
      console.error("[coreChime] Failed to set blur:", error);
      DebugLogger.addLog(
        "connected",
        "CRITICAL",
        "setVideoBlur",
        `Failed to set blur: ${error.message}`
      );
    }
  }

  /* ====================================================================
   * setBackgroundImage(imageUrl: string | null)
   * Sets a virtual background image - Using v2 SDK approach
   * ==================================================================== */
  static async setBackgroundImage(imageUrl) {
    console.log("[coreChime] [setBackgroundImage]", imageUrl);
    
    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot set background - not initialized");
      DebugLogger.addLog(
        "connected",
        "CRITICAL",
        "setBackgroundImage",
        "Cannot set background: Meeting not initialized. Please join a meeting first."
      );
      return;
    }
    
    try {
      // Get SDK root
      const SDK = window.ChimeSDK || window.AmazonChimeSDK || window;
      const root = SDK.default || SDK;
      
      // Get current video device using CamMic utility (has its own memory)
      const preferredCam = (typeof CamMicPermissionsUtility !== 'undefined' && CamMicPermissionsUtility.getPreferredDevice)
        ? CamMicPermissionsUtility.getPreferredDevice("camera")
        : null;
      const videoDevice = preferredCam || this._currentVideoDevice || 'default';
      
      if (!imageUrl) {
        // Just use the raw video device (original approach)
        if (videoDevice) {
          await this._audioVideo.startVideoInput(videoDevice);
        }
        this._videoProcessor = null;
        this._videoTransformDevice = null;
        console.log("[coreChime] ✅ Background removed");
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "setBackgroundImage",
          "Background removed"
        );
      } else {
        // Apply background
        console.log("[coreChime] Loading background image:", imageUrl);
        
        if (!root.BackgroundReplacementVideoFrameProcessor) {
          throw new Error("BackgroundReplacementVideoFrameProcessor not available in SDK");
        }
        
        if (!root.DefaultVideoTransformDevice) {
          throw new Error("DefaultVideoTransformDevice not available in SDK");
        }
        
        // Load image and convert to blob (v2 SDK approach)
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        const imageBlob = await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log("[coreChime] ✓ Image loaded:", img.width, "x", img.height);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob) {
                console.log("[coreChime] ✓ Blob created:", blob.size, "bytes");
                resolve(blob);
              } else {
                reject(new Error("Failed to create blob from image"));
              }
            }, 'image/jpeg', 0.8);
          };
          
          img.onerror = () => reject(new Error("Failed to load background image"));
          img.src = imageUrl;
        });
        
        console.log("[coreChime] Creating background replacement processor...");
        
        // Create replacement processor with imageBlob (v2 SDK API)
        const processor = await root.BackgroundReplacementVideoFrameProcessor.create(null, {
          imageBlob: imageBlob
        });
        
        console.log("[coreChime] ✓ Processor created");
        
        // Create logger
        const logger = new root.ConsoleLogger('VideoFilter', root.LogLevel.INFO);
        
        // Create transform device
        const transformDevice = new root.DefaultVideoTransformDevice(
          logger,
          videoDevice,
          [processor]
        );
        
        console.log("[coreChime] Applying transform device...");
        
        // Apply the transform device (SDK handles cleanup automatically)
        await this._audioVideo.startVideoInput(transformDevice);
        
        // Update state
        this._videoProcessor = processor;
        this._videoTransformDevice = transformDevice;
        
        console.log("[coreChime] ✅ Virtual background applied");
        DebugLogger.addLog(
          "connected",
          "NOTICE",
          "setBackgroundImage",
          "Virtual background applied"
        );
      }
      
      localStorage.setItem("CamMicPreferred-background", imageUrl || "");
      this._emit("coreChime:background-changed", { imageUrl });
    } catch (error) {
      console.error("[coreChime] Failed to set background:", error);
      DebugLogger.addLog(
        "connected",
        "CRITICAL",
        "setBackgroundImage",
        `Failed to set background: ${error.message}`
      );
    }
  }

  /* ====================================================================
   * toggleAudio(on: boolean)
   * Starts/stops local audio track (mirrors toggleVideo logic)
   * ==================================================================== */
  static _audioEnabled = false; // Track audio state
  
  static async toggleAudio(on) {
    console.log("[coreChime] [toggleAudio] REQUESTED:", on, "current state:", this._audioEnabled);
    
    if (typeof DebugLogger !== "undefined") {
      DebugLogger.addLog('connected', 'NOTICE', 'coreChime.toggleAudio', `Audio Toggle Request: ${on ? 'ON' : 'OFF'}`, {
        requested: on,
        currentState: this._audioEnabled,
        mismatch: on === this._audioEnabled
      });
    }

    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot toggle audio - not initialized");
      return;
    }

    try {
      if (on) {
        console.log("[coreChime] 🎤 Turning ON audio...");
        
        // If state says already ON but user is clicking ON again, it means stream is broken
        // Force a restart by stopping first
        if (this._audioEnabled) {
          console.log("[coreChime] ⚠️ State says ON but user clicking ON - forcing restart!");
          if (typeof DebugLogger !== "undefined") {
            DebugLogger.addLog('connected', 'NOTICE', 'coreChime.toggleAudio', "Force Restart: Audio", {
              reason: "State ON but stream appears broken",
              action: "Stop then restart audio input"
            });
          }
          
          // Stop current audio input
          if (typeof this._audioVideo.stopAudioInput === "function") {
            await this._audioVideo.stopAudioInput();
            console.log("[coreChime] ✓ Stopped broken audio stream");
          }
          
          // Wait for cleanup
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const audioDevices = await this._audioVideo.listAudioInputDevices();
        console.log("[coreChime] Available audio devices:", audioDevices.length);
        
        if (audioDevices.length > 0) {
          // Use CamMic utility to get preferred device (has its own memory)
          const preferredMic = (typeof CamMicPermissionsUtility !== 'undefined' && CamMicPermissionsUtility.getPreferredDevice)
            ? CamMicPermissionsUtility.getPreferredDevice("microphone")
            : null;
          
          const selectedMic = preferredMic || audioDevices[0].deviceId;
          console.log("[coreChime] Preferred mic from CamMic:", preferredMic);
          console.log("[coreChime] Using microphone:", selectedMic);

          // Set audio input device
          console.log("[coreChime] 1/3 Setting audio input device...");
          try {
            if (typeof this._audioVideo.chooseAudioInputDevice === "function") {
              await this._audioVideo.chooseAudioInputDevice(selectedMic);
              console.log("[coreChime] ✓ Audio input chosen (new API)");
            } else if (typeof this._audioVideo.startAudioInput === "function") {
              await this._audioVideo.startAudioInput(selectedMic);
              console.log("[coreChime] ✓ Audio input started (old API)");
            }
          } catch (e) {
            console.error("[coreChime] Failed to set audio input:", e);
            throw e;
          }

          // Wait for microphone to acquire stream
          console.log("[coreChime] 2/3 Waiting for microphone to acquire stream...");
          await new Promise(resolve => setTimeout(resolve, 300));

          // Unmute to enable audio transmission
          console.log("[coreChime] 3/3 Unmuting audio...");
          this._audioVideo.realtimeUnmuteLocalAudio();
          
          this._audioEnabled = true;
          console.log("[coreChime] 4/4 Audio ON complete - state updated to:", this._audioEnabled);
          
          // Notify remote users via data channel
          const localAttendeeId = this._localIdentifiers.attendeeId;
          if (localAttendeeId) {
            console.log("[coreChime] 📤 Notifying remote users: audio ON");
            this.sendData("audio-toggle", { audioEnabled: true, attendeeId: localAttendeeId });
          }
        } else {
          console.warn("[coreChime] ❌ No audio devices available");
        }
      } else {
        console.log("[coreChime] 🎤 Turning OFF audio...");

        this._audioEnabled = false;
        console.log("[coreChime] ✓ Audio state updated to:", this._audioEnabled);

        // Mute audio transmission
        this._audioVideo.realtimeMuteLocalAudio();
        console.log("[coreChime] ✓ Audio muted");

        console.log("[coreChime] ✅ Audio OFF complete - microphone muted");
        
        // Notify remote users via data channel
        const localAttendeeId = this._localIdentifiers.attendeeId;
        if (localAttendeeId) {
          console.log("[coreChime] 📤 Notifying remote users: audio OFF");
          this.sendData("audio-toggle", { audioEnabled: false, attendeeId: localAttendeeId });
        }
      }

      // Check actual mute state for verification
      const isMuted = this._audioVideo.realtimeIsLocalAudioMuted();
      console.log(
        "[coreChime] ✅ Verified mute state:",
        isMuted ? "MUTED (audio OFF)" : "UNMUTED (audio ON)"
      );

      console.log("[coreChime] [toggleAudio] Complete");
    } catch (error) {
      console.error("[coreChime] [toggleAudio] Error:", error);
    }
  }

  /* ====================================================================
   * sendData(flag: string, payload: object)
   * Sends app-level message over data channel
   * ==================================================================== */
  static async sendData(flag, payload) {
    console.log("[coreChime] [sendData]", { flag, payload });

    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot send data - not initialized");
      return;
    }

    try {
      const message = JSON.stringify({ flag, payload });
      await this._audioVideo.realtimeSendDataMessage("app-data", message, 1000); // 1000ms lifetime

      console.log("[coreChime] [sendData] Complete");
    } catch (error) {
      console.error("[coreChime] [sendData] Error:", error);
    }
  }

  /* ====================================================================
   * setMaxAttendees(n: number)
   * For scheduled meetings only
   * ==================================================================== */
  static setMaxAttendees(n) {
    console.log("[coreChime] [setMaxAttendees]", n);
    // TODO: Implement policy enforcement
    // This should emit an event or call backend API
    this._emit("coreChime:max-attendees-set", { max: n });
  }

  /* ====================================================================
   * getConnectionState()
   * Returns current connection state
   * ==================================================================== */
  static getConnectionState() {
    return { ...this._connectionState };
  }

  /* ====================================================================
   * getLocalIdentifiers()
   * Returns local attendee identifiers
   * ==================================================================== */
  static getLocalIdentifiers() {
    return { ...this._localIdentifiers };
  }

  /* ====================================================================
   * getMeetingInfo()
   * Returns meeting information
   * ==================================================================== */
  static getMeetingInfo() {
    return this._meetingInfo;
  }

  /* ====================================================================
   * getAttendeeInfo()
   * Returns attendee information
   * ==================================================================== */
  static getAttendeeInfo() {
    return this._attendeeInfo;
  }

  /* ====================================================================
   * getCurrentQuality()
   * Returns current stats snapshot
   * ==================================================================== */
  static getCurrentQuality() {
    // TODO: Implement quality metrics
    return {
      audio: null,
      video: null,
      network: null,
    };
  }

  /* ====================================================================
   * bindVideoElement(tileId, videoElement)
   * Helper to bind video tile to DOM element
   * ==================================================================== */
  static bindVideoElement(tileId, videoElement) {
    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot bind video - not initialized");
      return;
    }

    try {
      this._audioVideo.bindVideoElement(tileId, videoElement);
      console.log("[coreChime] Bound video tile", tileId, "to element");
    } catch (error) {
      console.error("[coreChime] Error binding video element:", error);
    }
  }

  /* ====================================================================
   * unbindVideoElement(tileId)
   * Helper to unbind video tile
   * ==================================================================== */
  static unbindVideoElement(tileId) {
    if (!this._audioVideo) {
      console.warn("[coreChime] Cannot unbind video - not initialized");
      return;
    }

    try {
      this._audioVideo.unbindVideoElement(tileId);
      console.log("[coreChime] Unbound video tile", tileId);
    } catch (error) {
      console.error("[coreChime] Error unbinding video element:", error);
    }
  }
}

console.log("[coreChime] Class loaded");
