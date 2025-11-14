/**
 * Class CamMicPermissionsHandler
 *
 * Handles UI updates, event orchestration, and device selection synchronization for camera and microphone permissions.
 *
 * @link https://docs.example.com/CamMicPermissionsHandler
 */
class CamMicPermissionsHandler {
  static _ui = {};
  static _unbindPermissionWatch = null;
  static _isWatching = false;
  static _isInitialized = false;
  static _reloadRequested = false;
  static _mutationObserver = null;
  static _eventHandlers = []; // Store all event handler references for cleanup
  static _bootInitHandler = null; // Store boot init handler for cleanup

  /**
   * Query selector wrapper for DOM element selection.
   *
   * Returns the first element matching the provided selector.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_querySelector #TODO
   *
   * @param {string} selector - The CSS selector to query
   * @returns {Element|null} The matching element or null if not found
   */
  static _querySelector(selector) {
    // Return the first matching element from document
    return document.querySelector(selector);
  }
  /**
   * Show an element by setting hidden to false.
   *
   * Makes the element visible by removing the hidden attribute.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_showElement #TODO
   *
   * @param {HTMLElement} element - The element to show
   * @returns {void}
   */
  static _showElement(element) {
    // Check if element exists
    if (element) {
      // Set hidden property to false
      element.hidden = false;
    }
  }
  /**
   * Hide an element by setting hidden to true.
   *
   * Makes the element invisible by setting the hidden attribute.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_hideElement #TODO
   *
   * @param {HTMLElement} element - The element to hide
   * @returns {void}
   */
  static _hideElement(element) {
    // Check if element exists
    if (element) {
      // Set hidden property to true
      element.hidden = true;
    }
  }

  /**
   * Dispatch substate event for external UI handlers.
   *
   * Emits a custom event with the current substate for external UI components.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_dispatchSubstate #TODO
   *
   * @param {string} substate - The substate to dispatch
   * @returns {void}
   */
  static _dispatchSubstate(substate) {
    // ❌ DISABLED - CamMicPermissionsHandler should NOT dispatch UI state changes
    // CallHandler is responsible for UI state management
    // This handler should only emit custom events (CamMic:*) for coordination
    console.log(`[CamMicPermissionsHandler] [_dispatchSubstate] ⏭️ SKIPPED (disabled) - substate: ${substate}`);
    return;
    
    /* ORIGINAL CODE DISABLED:
    // Wrap dispatch logic in try-catch
    try {
      // Create detail object with state and substate
      const detail = {
        state: "waitingForCamMicPermissions",
        substate: substate || "",
        ts: Date.now(),
      };
      // Dispatch custom event with detail
      document.dispatchEvent(new CustomEvent("chime-ui::state", { detail }));
      } catch (error) {
        // Log warning if dispatch fails
        console.warn(
          `[CamMicPermissionsHandler] [_dispatchSubstate] [Error] ${JSON.stringify({
            substate,
            message: error?.message || error,
          })}`
        );
      }
    */
  }


  /**
   * Cache UI elements by querying the DOM.
   *
   * Queries and stores references to required and optional UI elements for later use.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_cacheUI #TODO
   *
   * @returns {void}
   */
  static _cacheUI() {
    // Log the start of UI caching
    console.log(`[CamMicPermissionsHandler] [_cacheUI] [Start] {}`);
    
    // Define object with required element selectors
    const requiredElements = {
      videoSelect: '[data-cam-mic-element="video-select"]',
      audioSelect: '[data-cam-mic-element="audio-select"]',
      statusWrap: '[data-cam-mic-element="status"]',
      statusItemCamera: '[data-cam-mic-element="status-item"][data-kind="camera"]',
      statusItemMicrophone: '[data-cam-mic-element="status-item"][data-kind="microphone"]',
    };
    
    // Define object with optional element selectors
    const optionalElements = {
      loader: '[data-cam-mic-element="loader"]',
      permissionIcons: '[data-cam-mic-element="permission-icons"]',
      needCamera: '[data-cam-mic-element="need-camera"]',
      needMicrophone: '[data-cam-mic-element="need-microphone"]',
      deviceSelect: '[data-cam-mic-element="device-select"]',
      selectedCameraLabel: '[data-cam-mic-element="selected-camera-label"]',
      selectedMicrophoneLabel: '[data-cam-mic-element="selected-microphone-label"]',
      videoPreview: '[data-cam-mic-element="video-preview"]',
      waiting: '[data-cam-mic-element="waiting"]',
      statusCamera: '[data-cam-mic-element="status-camera"]',
      statusMicrophone: '[data-cam-mic-element="status-microphone"]',
      reloadRequired: '[data-cam-mic-element="reload-required"]',
    };
    
    // Iterate through required elements
    Object.entries(requiredElements).forEach(([key, selector]) => {
      // Query for element using selector
      const element = this._querySelector(selector);
      // Check if element is missing
      if (!element) {
        // Throw error if required element not found
        throw new Error(`Missing required element: ${key} (${selector})`);
      }
      // Store element in UI cache
      this._ui[key] = element;
    });
    
    // Iterate through optional elements
    Object.entries(optionalElements).forEach(([key, selector]) => {
      // Query for element using selector
      const element = this._querySelector(selector);
      // Store element in UI cache or null if not found
      this._ui[key] = element || null;
    });
    // Log completion with element counts
    console.log(
      `[CamMicPermissionsHandler] [_cacheUI] [End] ${JSON.stringify({
        requiredKeys: Object.keys(requiredElements).length,
        optionalKeys: Object.keys(optionalElements).length,
      })}`
    );
  }

  /**
   * Handle UI events for camera and microphone permissions.
   *
   * Central event handler that processes various permission-related events and updates the UI accordingly.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#handleUIEvent #TODO
   *
   * @param {CustomEvent} event - The custom event object containing event type and detail
   * @returns {void}
   */
  static handleUIEvent(event) {
    // Log the start of UI event handling
    console.log(
      `[CamMicPermissionsHandler] [handleUIEvent] [Start] ${JSON.stringify({
        eventType: event.type,
      })}`
    );
    // Get cached UI elements
    const uiElements = this._ui;
    // Define helper function to set status on elements
    const setStatus = (item, text, state) => {
      // Set data-state attribute on item if item exists
      item && item.setAttribute("data-state", state || "");
      // Set text content on text element if text exists
      text && (text.textContent = state || "");
    };

    // Switch on event type to handle different permission events
    switch (event.type) {
      // Handle before check event
      case "CamMic:Permissions:BeforeCheck":
        // Log before check action
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            action: "showing_loader_hiding_icons",
          })}`
        );
        // Show waiting element
        this._showElement(uiElements.waiting);
        // Show status wrap element
        this._showElement(uiElements.statusWrap);
        // Hide permission icons element
        this._hideElement(uiElements.permissionIcons);
        // Hide need camera element
        this._hideElement(uiElements.needCamera);
        // Hide need microphone element
        this._hideElement(uiElements.needMicrophone);
        // Show loader element
        this._showElement(uiElements.loader);
        // Dispatch checking permissions substate
        this._dispatchSubstate("checkingPermissions");
        // Break from switch statement
        break;

      // Handle permissions checked event
      case "CamMic:Permissions:Checked": {
        // Extract camera permission state from event detail
        const camera = event.detail?.camera ?? "error";
        // Extract microphone permission state from event detail
        const microphone = event.detail?.microphone ?? "error";
        // Log critical permission checked data
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [CRITICAL] [Data] ${JSON.stringify({
            camera,
            microphone,
          })}`
        );

        // Hide loader element
        this._hideElement(uiElements.loader);
        // Hide waiting element
        this._hideElement(uiElements.waiting);
        // Dispatch empty substate
        this._dispatchSubstate("");
        // Show status wrap element
        this._showElement(uiElements.statusWrap);

        // Check if camera status elements exist
        if (!uiElements.statusItemCamera || !uiElements.statusCamera) {
          // Throw error if camera status elements missing
          throw new Error('Missing required status elements for camera');
        }
        // Check if microphone status elements exist
        if (!uiElements.statusItemMicrophone || !uiElements.statusMicrophone) {
          // Throw error if microphone status elements missing
          throw new Error('Missing required status elements for microphone');
        }
        // Set camera status on UI elements
        setStatus(uiElements.statusItemCamera, uiElements.statusCamera, camera);
        // Set microphone status on UI elements
        setStatus(uiElements.statusItemMicrophone, uiElements.statusMicrophone, microphone);
        // Log status update action
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            action: "status_updated",
            camera,
            microphone,
          })}`
        );

        // Check if camera permission is needed
        const needCamera = camera !== "granted";
        // Check if microphone permission is needed
        const needMicrophone = microphone !== "granted";
        // Log need camera and microphone flags
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            needCamera,
            needMicrophone,
          })}`
        );

        // Check if permission icons element exists
        if (uiElements.permissionIcons) {
          // Set hidden state based on need for permissions
          uiElements.permissionIcons.hidden = !(needCamera || needMicrophone);
        }
        // Check if need camera element exists
        if (uiElements.needCamera) {
          // Set hidden state based on need for camera
          uiElements.needCamera.hidden = !needCamera;
        }
        // Check if need microphone element exists
        if (uiElements.needMicrophone) {
          // Set hidden state based on need for microphone
          uiElements.needMicrophone.hidden = !needMicrophone;
        }

        // Determine mode based on permission needs
        const mode =
          !needCamera && !needMicrophone
            ? "both"
            : !needCamera
            ? "camera"
            : !needMicrophone
            ? "microphone"
            : null;
        // Log mode determination
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            mode,
            willPopulateSelects: !!mode,
          })}`
        );
        // Check if mode is set
        if (mode) {
          // Populate device selects with determined mode
          this._populateDeviceSelects(mode);
        }

        // Wrap Vue state bridge logic in try-catch
        try {
          // Check if camera is required based on call mode
          const requiresCamera = (window.callMode !== "audioOnlyCall");
          // Set microphone requirement to always true
          const requiresMicrophone = true;
          // Check if required camera is missing
          const missingNeededCamera = requiresCamera && needCamera;
          // Check if required microphone is missing
          const missingNeededMicrophone = requiresMicrophone && needMicrophone;
          // Determine if permission screen should be shown
          const shouldShow = missingNeededCamera || missingNeededMicrophone;
          // Check if permission screen should be shown
          if (shouldShow) {
            // Create detail object for Vue state event
            const detail = { state: "waitingForCamMicPermissions", substate: "", ts: Date.now() };
            // Dispatch Vue state event
            document.dispatchEvent(new CustomEvent("chime-ui::state", { detail }));
          }
        } catch (_) {
          // Silently ignore errors in Vue state bridge
        }
        // Break from switch statement
        break;
      }

      // Handle permissions changed event
      case "CamMic:Permissions:Changed":
        // Log permissions changed data
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            detail: event.detail || {},
          })}`
        );
        // Show waiting element
        this._showElement(uiElements.waiting);
        // Dispatch permissions changed substate
        this._dispatchSubstate("permissionsChanged");
        
        // **NEW**: Check if both permissions are now granted
        const changedType = event.detail?.type;
        const changedState = event.detail?.state;
        
        if (changedState === 'granted') {
          console.log(`[CamMicPermissionsHandler] [handleUIEvent] [PermissionsChanged] ${changedType} granted - checking if both ready`);
          
          // Check current state of both permissions
          CamMicPermissionsUtility.getPermission('camera').then(cameraState => {
            CamMicPermissionsUtility.getPermission('microphone').then(microphoneState => {
              console.log(`[CamMicPermissionsHandler] [handleUIEvent] [PermissionsChanged] States:`, { cameraState, microphoneState });
              
              if (cameraState === 'granted' && microphoneState === 'granted') {
                console.log(`[CamMicPermissionsHandler] [handleUIEvent] [PermissionsChanged] BOTH GRANTED - dispatching UI:PermissionsResolved`);
                window.dispatchEvent(new CustomEvent('CamMic:UI:PermissionsResolved', {
                  detail: {
                    camera: 'granted',
                    microphone: 'granted',
                    success: true,
                    mode: 'both'
                  }
                }));
              }
            });
          });
        }
        
        // Break from switch statement
        break;

      // Handle request start events
      case "CamMic:Request:Camera:Start":
      case "CamMic:Request:Microphone:Start":
      case "CamMic:Request:Both:Start":
        // Determine request type from event type
        const requestType = event.type.includes("Camera") ? "requestingCamera" :
                           event.type.includes("Microphone") ? "requestingMicrophone" :
                           "requestingBoth";
        // Log request start action
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            requestType,
            action: "showing_loader_requesting",
          })}`
        );
        // Show waiting element
        this._showElement(uiElements.waiting);
        // Show status wrap element
        this._showElement(uiElements.statusWrap);
        // Show loader element
        this._showElement(uiElements.loader);
        // Dispatch request type substate
        this._dispatchSubstate(requestType);
        // Hide permission icons element
        this._hideElement(uiElements.permissionIcons);
        // Hide need camera element
        this._hideElement(uiElements.needCamera);
        // Hide need microphone element
        this._hideElement(uiElements.needMicrophone);
        // Break from switch statement
        break;

      // Handle request success and error events
      case "CamMic:Request:Camera:Success":
      case "CamMic:Request:Microphone:Success":
      case "CamMic:Request:Both:Success":
      case "CamMic:Request:Camera:Error":
      case "CamMic:Request:Microphone:Error":
      case "CamMic:Request:Both:Error":
        // Log request complete action
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            action: "request_complete_rechecking",
            detail: event.detail || {},
          })}`
        );
        // Hide loader element
        this._hideElement(uiElements.loader);
        // Dispatch request complete substate
        this._dispatchSubstate("requestComplete");
        // Emit permissions check event
        CamMicPermissionsUtility.emit("CamMic:Permissions:Check");
        // Break from switch statement
        break;

      // Handle reload required event
      case "CamMic:Page:ReloadRequired":
        // Check if reload already requested
        if (this._reloadRequested) {
          // Return early to prevent multiple alerts
          return;
        }
        
        // Set reload requested flag to true
        this._reloadRequested = true;
        // Log reload required warning
        console.warn(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            action: "reload_required",
            context: event.detail?.context,
          })}`
        );
        // Hide loader element
        this._hideElement(uiElements.loader);
        // Hide waiting element
        this._hideElement(uiElements.waiting);
        // Show reload required element
        this._showElement(uiElements.reloadRequired);
        
        // Schedule first animation frame
        requestAnimationFrame(() => {
          // Schedule second animation frame for paint completion
          requestAnimationFrame(() => {
            // Show alert to user
            alert("Please reset your cam / mic permissions and reload your page");
          });
        });
        // Break from switch statement
        break;

      // Handle all granted event
      case "CamMic:All:Granted":
        // Extract event detail or use empty object
        const eventDetail = event.detail || {};
        // Log critical all granted data
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [CRITICAL] [Data] ${JSON.stringify({
            camera: eventDetail.camera,
            microphone: eventDetail.microphone,
            autoPreview: eventDetail.autoPreview,
          })}`
        );
        // Check if video select element exists
        if (!uiElements.videoSelect) {
          // Throw error if video select missing
          throw new Error('Missing required video select element');
        }
        // Get camera ID from video select value
        const cameraId = uiElements.videoSelect.value || null;
        // Determine if preview should be enabled
        const shouldPreview = eventDetail.autoPreview !== false;
        // Check if camera permission is granted
        const cameraGranted = eventDetail.camera === "granted";
        // Log preview decision data
        console.log(
          `[CamMicPermissionsHandler] [handleUIEvent] [Data] ${JSON.stringify({
            eventType: event.type,
            cameraId,
            shouldPreview,
            cameraGranted,
            willStartPreview: !!(cameraId && cameraGranted && shouldPreview),
          })}`
        );
        
        // Check if should start preview
        if (cameraId && cameraGranted && shouldPreview) {
          // Emit preview start event
          CamMicPermissionsUtility.emit("CamMic:Preview:Start", {
            cameraId: cameraId,
          });
          // Start camera preview with selected device
          CamMicPermissionsUtility.startCameraPreview(cameraId);
        }
        // Log completion
        console.log(`[CamMicPermissionsHandler] [handleUIEvent] [End] {}`);
        // Break from switch statement
        break;
    }
  }

  /**
   * Populate device select dropdowns with available devices and restore preferences.
   *
   * Fetches available devices, populates select elements based on mode, and restores saved preferences.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_populateDeviceSelects #TODO
   *
   * @param {string} mode - The mode to populate: "camera", "microphone", or "both"
   * @returns {Promise<void>}
   */
  static async _populateDeviceSelects(mode) {
    // Log the start of populating device selects
    console.log(
      `[CamMicPermissionsHandler] [_populateDeviceSelects] [Start] ${JSON.stringify({
        mode,
      })}`
    );
    // Get cached UI elements
    const uiElements = this._ui;
    // Log getting devices action
    console.log(
      `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
        mode,
        action: "getting_devices",
      })}`
    );
    // Get available devices from utility
    const devices = await CamMicPermissionsUtility.getAvailableDevices();
    // Log device count
    console.log(
      `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
        mode,
        deviceCount: devices.length,
      })}`
    );
    // Check if device select element exists
    if (uiElements.deviceSelect) {
      // Show device select element
      this._showElement(uiElements.deviceSelect);
    }

    // Check if mode includes camera
    if (mode === "camera" || mode === "both") {
      // Check if video select element exists
      if (!uiElements.videoSelect) {
        // Throw error if video select missing
        throw new Error('Missing required video select element for camera mode');
      }
      // Log getting preferred camera action
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          action: "getting_preferred_camera",
        })}`
      );
      // Get preferred camera device ID from utility
      const preferredCameraId = CamMicPermissionsUtility.getPreferredDevice("camera");
      // Log preferred camera ID
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          preferredCameraId,
        })}`
      );
      // Clear existing options in video select
      uiElements.videoSelect.innerHTML = "";
      // Filter devices to get only video input devices
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      // Log video device count
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          videoDeviceCount: videoDevices.length,
          preferredCameraId,
        })}`
      );
      // Iterate through each video device
      videoDevices.forEach((device) => {
        // Create option element for device
        const optionElement = document.createElement("option");
        // Set option value to device ID
        optionElement.value = device.deviceId;
        // Set option text to device label or default
        optionElement.text = device.label || "Unnamed Camera";
        // Check if device matches preferred camera ID
        if (preferredCameraId && device.deviceId === preferredCameraId) {
          // Mark option as selected if preferred
          optionElement.selected = true;
        }
        // Append option to video select
        uiElements.videoSelect.appendChild(optionElement);
      });
      // Get current camera ID from select or first device
      const currentCameraId = uiElements.videoSelect.value || videoDevices[0]?.deviceId || "";
      // Get current camera label from device or default
      const currentCameraLabel =
        videoDevices.find((videoDevice) => videoDevice.deviceId === currentCameraId)?.label ||
        videoDevices[0]?.label ||
        "Unnamed Camera";
      // Log current camera ID and label
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          currentCameraId,
          currentCameraLabel,
        })}`
      );
      // Check if selected camera label element exists
      if (uiElements.selectedCameraLabel) {
        // Set selected camera label text content
        uiElements.selectedCameraLabel.textContent = currentCameraLabel;
      }
      // Set up change handler for video select
      uiElements.videoSelect.onchange = () => {
        // Get selected device ID from video select
        const deviceId = uiElements.videoSelect.value;
        // Save preferred camera device to utility
        CamMicPermissionsUtility.setPreferredDevice("camera", deviceId);
        // Find device label from device list
        const label = videoDevices.find((videoDevice) => videoDevice.deviceId === deviceId)?.label || "Unnamed Camera";
        // Check if selected camera label element exists
        if (uiElements.selectedCameraLabel) {
          // Update selected camera label text
          uiElements.selectedCameraLabel.textContent = label;
        }
        // Check if device ID is set
        if (deviceId) {
          // Start camera preview with selected device
          CamMicPermissionsUtility.startCameraPreview(deviceId);
        }
      };
    }

    // Check if mode includes microphone
    if (mode === "microphone" || mode === "both") {
      // Check if audio select element exists
      if (!uiElements.audioSelect) {
        // Throw error if audio select missing
        throw new Error('Missing required audio select element for microphone mode');
      }
      // Log getting preferred microphone action
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          action: "getting_preferred_microphone",
        })}`
      );
      // Get preferred microphone device ID from utility
      const preferredMicrophoneId = CamMicPermissionsUtility.getPreferredDevice("microphone");
      // Log preferred microphone ID
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          preferredMicrophoneId,
        })}`
      );
      // Clear existing options in audio select
      uiElements.audioSelect.innerHTML = "";
      // Filter devices to get only audio input devices
      const microphoneDevices = devices.filter((device) => device.kind === "audioinput");
      // Log microphone device count
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          microphoneDeviceCount: microphoneDevices.length,
          preferredMicrophoneId,
        })}`
      );
      // Iterate through each microphone device
      microphoneDevices.forEach((device) => {
        // Create option element for device
        const optionElement = document.createElement("option");
        // Set option value to device ID
        optionElement.value = device.deviceId;
        // Set option text to device label or default
        optionElement.text = device.label || "Unnamed Microphone";
        // Check if device matches preferred microphone ID
        if (preferredMicrophoneId && device.deviceId === preferredMicrophoneId) {
          // Mark option as selected if preferred
          optionElement.selected = true;
        }
        // Append option to audio select
        uiElements.audioSelect.appendChild(optionElement);
      });
      // Get current microphone ID from select or first device
      const currentMicrophoneId = uiElements.audioSelect.value || microphoneDevices[0]?.deviceId || "";
      // Get current microphone label from device or default
      const currentMicrophoneLabel =
        microphoneDevices.find((microphoneDevice) => microphoneDevice.deviceId === currentMicrophoneId)?.label ||
        microphoneDevices[0]?.label ||
        "Unnamed Microphone";
      // Log current microphone ID and label
      console.log(
        `[CamMicPermissionsHandler] [_populateDeviceSelects] [Data] ${JSON.stringify({
          mode,
          currentMicrophoneId,
          currentMicrophoneLabel,
        })}`
      );
      // Check if selected microphone label element exists
      if (uiElements.selectedMicrophoneLabel) {
        // Set selected microphone label text content
        uiElements.selectedMicrophoneLabel.textContent = currentMicrophoneLabel;
      }
      // Set up change handler for audio select
      uiElements.audioSelect.onchange = () => {
        // Get selected device ID from audio select
        const deviceId = uiElements.audioSelect.value;
        // Save preferred microphone device to utility
        CamMicPermissionsUtility.setPreferredDevice("microphone", deviceId);
        // Find device label from device list
        const label =
          microphoneDevices.find((microphoneDevice) => microphoneDevice.deviceId === deviceId)?.label || "Unnamed Microphone";
        // Check if selected microphone label element exists
        if (uiElements.selectedMicrophoneLabel) {
          // Update selected microphone label text
          uiElements.selectedMicrophoneLabel.textContent = label;
        }
      };
    }
    // Log completion
    console.log(
      `[CamMicPermissionsHandler] [_populateDeviceSelects] [End] ${JSON.stringify({
        mode,
      })}`
    );
  }

  /**
   * Get the text of the selected option from a select element.
   *
   * Uses modern selectedOptions API with fallback for older browsers.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_getSelectedOptionText #TODO
   *
   * @param {HTMLSelectElement|null} select - The select element to get selected option text from
   * @returns {string|null} The text of the selected option or null if not found
   */
  static _getSelectedOptionText(select) {
    // Check if select element is falsy
    if (!select) {
      // Log missing select element
      console.log(
        `[CamMicPermissionsHandler] [_getSelectedOptionText] [Data] ${JSON.stringify({
          hasSelect: false,
        })}`
      );
      // Return null if select is missing
      return null;
    }
    // Check if selectedOptions API is available and has selections
    if (select.selectedOptions && select.selectedOptions.length > 0) {
      // Get text from first selected option
      const text = select.selectedOptions[0].text;
      // Log selectedOptions method result
      console.log(
        `[CamMicPermissionsHandler] [_getSelectedOptionText] [Data] ${JSON.stringify({
          method: "selectedOptions",
          text,
        })}`
      );
      // Return selected option text
      return text;
    }
    // Check if selectedIndex is valid and options array exists
    if (select.selectedIndex >= 0 && select.options && select.options[select.selectedIndex]) {
      // Get text from selected index option
      const text = select.options[select.selectedIndex].text;
      // Log selectedIndex method result
      console.log(
        `[CamMicPermissionsHandler] [_getSelectedOptionText] [Data] ${JSON.stringify({
          method: "selectedIndex",
          text,
        })}`
      );
      // Return selected option text
      return text;
    }
    // Log fallback method result
    console.log(
      `[CamMicPermissionsHandler] [_getSelectedOptionText] [Data] ${JSON.stringify({
        method: "fallback",
        result: null,
      })}`
    );
    // Return null if no option found
    return null;
  }

  /**
   * Get the list of selected devices from the UI.
   *
   * Retrieves the currently selected camera and microphone devices from the UI select elements.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#getDeviceList #TODO
   *
   * @returns {Object} Object containing camera and microphone device information
   */
  static getDeviceList() {
    // Log the start of getting device list
    console.log(`[CamMicPermissionsHandler] [getDeviceList] [Start] {}`);
    // Get cached UI elements
    const uiElements = this._ui;
    
    // Check if video select element exists
    if (!uiElements.videoSelect) {
      // Throw error if video select missing
      throw new Error('Missing required video select element');
    }
    // Check if audio select element exists
    if (!uiElements.audioSelect) {
      // Throw error if audio select missing
      throw new Error('Missing required audio select element');
    }
    
    // Create device list object with camera and microphone info
    const deviceList = {
      camera: {
        deviceId: uiElements.videoSelect.value || null,
        label: this._getSelectedOptionText(uiElements.videoSelect),
      },
      microphone: {
        deviceId: uiElements.audioSelect.value || null,
        label: this._getSelectedOptionText(uiElements.audioSelect),
      },
    };
    // Log critical device list data
    console.log(
      `[CamMicPermissionsHandler] [getDeviceList] [CRITICAL] [Data] ${JSON.stringify(deviceList)}`
    );
    // Emit device list checked event
    CamMicPermissionsUtility.emit("CamMic:DeviceList:Checked", deviceList);
    // Log completion
    console.log(`[CamMicPermissionsHandler] [getDeviceList] [End] {}`);
    // Return device list object
    return deviceList;
  }

  /**
   * Ensure footer select elements exist and are hidden.
   *
   * Creates footer element and camera/microphone select elements if they don't exist, then hides them.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_ensureFooterSelects #TODO
   *
   * @returns {void}
   */
  static _ensureFooterSelects() {
    console.log(`[CamMicPermissionsHandler] [_ensureFooterSelects] [Start] {}`);
    // Check if footer exists
    let footer = document.querySelector('footer');
    if (!footer) {
      console.log(
        `[CamMicPermissionsHandler] [_ensureFooterSelects] [Data] ${JSON.stringify({
          action: "creating_footer",
        })}`
      );
      // Check if document body exists
      if (!document.body) {
        // Throw error if document body missing
        throw new Error('Cannot create footer: document.body is missing');
      }
      // Create new footer element
      footer = document.createElement('footer');
      // Set footer styles to hide it
      footer.style.cssText = 'margin-top: 40px; padding: 20px; border-top: 1px solid #ccc; display: none;';
      // Append footer to document body
      document.body.appendChild(footer);
    }
    
    // Check if camera select exists
    let cameraSelect = footer.querySelector('[data-camera-select]');
    if (!cameraSelect) {
      console.log(
        `[CamMicPermissionsHandler] [_ensureFooterSelects] [Data] ${JSON.stringify({
          action: "creating_camera_select",
        })}`
      );
      // Create label element for camera select
      const label = document.createElement('label');
      // Set label innerHTML with camera select
      label.innerHTML = 'Camera: <select data-camera-select></select>';
      // Append label to footer
      footer.appendChild(label);
      // Query camera select from footer
      cameraSelect = footer.querySelector('[data-camera-select]');
      // Check if camera select creation failed
      if (!cameraSelect) {
        // Throw error if camera select not found
        throw new Error('Failed to create camera select element in footer');
      }
    }
    
    // Check if microphone select exists
    let microphoneSelect = footer.querySelector('[data-microphone-select]');
    if (!microphoneSelect) {
      console.log(
        `[CamMicPermissionsHandler] [_ensureFooterSelects] [Data] ${JSON.stringify({
          action: "creating_microphone_select",
        })}`
      );
      // Create label element for microphone select
      const label = document.createElement('label');
      // Set label innerHTML with microphone select
      label.innerHTML = 'Microphone: <select data-microphone-select></select>';
      // Append label to footer
      footer.appendChild(label);
      // Query microphone select from footer
      microphoneSelect = footer.querySelector('[data-microphone-select]');
      // Check if microphone select creation failed
      if (!microphoneSelect) {
        // Throw error if microphone select not found
        throw new Error('Failed to create microphone select element in footer');
      }
    }
    
    // Check if footer or selects are missing
    if (!footer || !cameraSelect || !microphoneSelect) {
      // Throw error if footer selects not ensured
      throw new Error('Failed to ensure footer selects exist');
    }
    // Hide footer element
    footer.hidden = true;
    // Hide camera select element
    cameraSelect.hidden = true;
    // Hide microphone select element
    microphoneSelect.hidden = true;
    // Log completion with element existence status
    console.log(
      `[CamMicPermissionsHandler] [_ensureFooterSelects] [End] ${JSON.stringify({
        footerExists: !!footer,
        cameraSelectExists: !!cameraSelect,
        microphoneSelectExists: !!microphoneSelect,
      })}`
    );
  }

  /**
   * Orchestrate both camera and microphone permission requests.
   *
   * Handles the complete workflow for requesting both camera and microphone permissions.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_orchestrateBoth #TODO
   *
   * @param {boolean} [enablePreview=true] - Whether to enable camera preview after permissions granted
   * @returns {Promise<void>}
   */
  static async _orchestrateBoth(enablePreview = true) {
    // Log the start of orchestrating both permissions
    console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [Start] ${JSON.stringify({ enablePreview })}`);
    
    // **STEP 1**: Check permissions FIRST at START
    console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 1: CHECK] Checking current permission states`);
    let cameraState = 'prompt';
    let microphoneState = 'prompt';
    
    try {
      cameraState = await CamMicPermissionsUtility.getPermission('camera');
      microphoneState = await CamMicPermissionsUtility.getPermission('microphone');
      console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 1: CHECK] States:`, { cameraState, microphoneState });
    } catch (err) {
      console.warn(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 1: CHECK] Failed:`, err);
    }
    
    // **STEP 2**: If need prompt, show UI BEFORE requesting
    const needsPrompt = (cameraState === 'prompt' || microphoneState === 'prompt');
    if (needsPrompt) {
      console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SHOW UI] Dispatching UI:ShowWaiting`);
      window.dispatchEvent(new CustomEvent('CamMic:UI:ShowWaiting', {
        detail: { 
          needCamera: cameraState === 'prompt', 
          needMicrophone: microphoneState === 'prompt',
          mode: 'both'
        }
      }));
      
      // **SANITY CHECK**: Poll DOM until VISIBLE element appears (not just text in script tags)
      console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SANITY CHECK] Waiting for DOM to show waiting text...`);
      const waitingText = "Waiting for camera or microphone permissions";
      const appRoot = document.getElementById('app');
      if (!appRoot) {
        console.warn("[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SANITY CHECK] #app root not found in DOM");
      }
      let found = false;
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds max (100ms * 30)
      
      while (!found && attempts < maxAttempts) {
        // Find ALL elements that contain the text
        const scope = appRoot || document;
        const allElements = Array.from(scope.querySelectorAll('*')).filter(el => {
          return el.textContent.includes(waitingText) && 
                 el.offsetParent !== null && // Element is visible
                 (el.textContent.trim().startsWith('[Callee]') || el.textContent.trim().startsWith('[Caller]')); // It's a state message
        });
        
        if (allElements.length > 0) {
          console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SANITY CHECK] ✅ VISIBLE element found in DOM after ${attempts * 100}ms`);
          console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SANITY CHECK] Element text:`, allElements[0].textContent.substring(0, 100));
          found = true;
        } else {
          console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SANITY CHECK] ⏳ VISIBLE element not found yet, waiting 100ms... (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      
      if (!found) {
        console.error(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SANITY CHECK] ❌ VISIBLE element NEVER appeared in DOM after ${maxAttempts * 100}ms!`);
        alert(`⚠️ UI failed to update! Visible element with waiting text never appeared. This is a critical bug.\n\nVue state was set, but DOM did not render.`);
      } else {
        // Extra 200ms to ensure user can actually see it
        console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SANITY CHECK] Waiting extra 200ms for user to see it...`);
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SHOW UI] ✅ Ready to proceed with request`);
      }
    } else {
      console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 2: SKIP] Already granted - no UI needed`);
    }
    
    // **STEP 3**: Start watching permission changes
    console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [STEP 3: WATCH] Starting permission watcher`);
    if (!this._isWatching) {
      await this.startWatchingPermissions();
    }
    
    // Log step 1 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
        step: 1,
        action: "requesting_both_permissions",
      })}`
    );
    // Emit request both start event
    CamMicPermissionsUtility.emit("CamMic:Request:Both:Start");
    // Request both camera and microphone permissions
    await CamMicPermissionsUtility.requestCameraMicrophone();
    
    // Log step 2 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
        step: 2,
        action: "getting_device_list",
      })}`
    );
    // Get device list from UI
    this.getDeviceList();
    
    // Log step 3 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
        step: 3,
        action: "checking_permissions",
      })}`
    );
    // Check browser permissions
    const permissions = await CamMicPermissionsUtility.checkPermissions();
    // Log step 3 permissions result
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
        step: 3,
        permissions,
      })}`
    );
    
    // Check if camera permission is not granted
    if (!permissions || permissions.camera !== "granted") {
      // Log step 4 retry camera action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
          step: 4,
          action: "retrying_camera_request",
        })}`
      );
      // Emit camera request start event
      CamMicPermissionsUtility.emit("CamMic:Request:Camera:Start");
      // Request camera permission
      await CamMicPermissionsUtility.requestCamera();
    }
    // Check if microphone permission is not granted
    if (!permissions || permissions.microphone !== "granted") {
      // Log step 4 retry microphone action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
          step: 4,
          action: "retrying_microphone_request",
        })}`
      );
      // Emit microphone request start event
      CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Start");
      // Request microphone permission
      await CamMicPermissionsUtility.requestMicrophone();
    }
    
    // Log step 5 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
        step: 5,
        action: "rechecking_permissions",
      })}`
    );
    // Re-check permissions after requests
    const finalPermissions = await CamMicPermissionsUtility.checkPermissions() || { camera: "error", microphone: "error" };
    // Log step 5 final permissions
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
        step: 5,
        finalPermissions,
      })}`
    );
    
    // Check if at least one permission is granted
    if (finalPermissions && (finalPermissions.camera === "granted" || finalPermissions.microphone === "granted")) {
      // Determine mode based on granted permissions
      const mode = 
        finalPermissions.camera === "granted" && finalPermissions.microphone === "granted" ? "both" :
        finalPermissions.camera === "granted" ? "camera" : "microphone";
      // Log step 6 action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
          step: 6,
          action: "populating_device_selects",
          mode,
        })}`
      );
      // Populate device selects with determined mode
      await this._populateDeviceSelects(mode);
    }
    
    // Check if both permissions are granted
    if (finalPermissions && finalPermissions.camera === "granted" && finalPermissions.microphone === "granted") {
      // Log step 7 action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateBoth] [Data] ${JSON.stringify({
          step: 7,
          action: "emitting_all_granted",
          autoPreview: enablePreview,
        })}`
      );
      // Emit all granted event with preview setting
      CamMicPermissionsUtility.emit("CamMic:All:Granted", {
        camera: finalPermissions.camera,
        microphone: finalPermissions.microphone,
        autoPreview: enablePreview,
      });
    }
    
    // Check if all permissions are granted
    const allGranted = finalPermissions && finalPermissions.camera === "granted" && finalPermissions.microphone === "granted";
    // Log critical final result
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateBoth] [CRITICAL] [Data] ${JSON.stringify({
        allGranted,
        permissions: finalPermissions,
        previewEnabled: enablePreview,
      })}`
    );
    // Emit orchestrate complete event
    CamMicPermissionsUtility.emit("CamMic:Orchestrate:Complete", {
      mode: "both",
      success: allGranted,
      permissions: finalPermissions,
      previewEnabled: enablePreview,
    });
    // Log completion
    console.log(`[CamMicPermissionsHandler] [_orchestrateBoth] [End] {}`);
  }

  /**
   * Orchestrate microphone permission request.
   *
   * Handles the complete workflow for requesting microphone permissions only.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_orchestrateMicrophone #TODO
   *
   * @returns {Promise<void>}
   */
  static async _orchestrateMicrophone() {
    // Log the start of orchestrating microphone permission
    console.log(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [Start] {}`);
    
    // **STEP 1**: Check permissions FIRST at START
    console.log(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [STEP 1: CHECK] Checking current microphone permission state`);
    let microphoneState = 'prompt';
    
    try {
      microphoneState = await CamMicPermissionsUtility.getPermission('microphone');
      console.log(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [STEP 1: CHECK] State:`, { microphoneState });
    } catch (err) {
      console.warn(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [STEP 1: CHECK] Failed:`, err);
    }
    
    // **STEP 2**: If need prompt, show UI BEFORE requesting
    const needsPrompt = (microphoneState === 'prompt');
    if (needsPrompt) {
      console.log(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [STEP 2: SHOW UI] Dispatching UI:ShowWaiting`);
      window.dispatchEvent(new CustomEvent('CamMic:UI:ShowWaiting', {
        detail: { 
          needCamera: false, 
          needMicrophone: true,
          mode: 'microphone'
        }
      }));
    } else {
      console.log(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [STEP 2: SKIP] Already granted - no UI needed`);
    }
    
    // **STEP 3**: Start watching permission changes
    console.log(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [STEP 3: WATCH] Starting permission watcher`);
    if (!this._isWatching) {
      // Start watching permissions
      await this.startWatchingPermissions();
    }
    
    // Log step 1 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
        step: 1,
        action: "requesting_microphone_permission",
      })}`
    );
    // Emit microphone request start event
    CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Start");
    // Request microphone permission
    await CamMicPermissionsUtility.requestMicrophone();
    
    // Log step 2 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
        step: 2,
        action: "getting_device_list",
      })}`
    );
    // Get device list from UI
    this.getDeviceList();
    
    // Log step 3 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
        step: 3,
        action: "checking_permissions",
      })}`
    );
    // Check browser permissions
    const permissions = await CamMicPermissionsUtility.checkPermissions();
    // Log step 3 permissions result
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
        step: 3,
        permissions,
      })}`
    );
    
    // Check if microphone permission is not granted
    if (!permissions || permissions.microphone !== "granted") {
      // Log step 4 retry microphone action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
          step: 4,
          action: "retrying_microphone_request",
        })}`
      );
      // Emit microphone request start event
      CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Start");
      // Request microphone permission again
      await CamMicPermissionsUtility.requestMicrophone();
    }
    
    // Log step 5 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
        step: 5,
        action: "rechecking_permissions",
      })}`
    );
    // Re-check permissions after request
    const finalPermissions = await CamMicPermissionsUtility.checkPermissions() || { camera: "error", microphone: "error" };
    // Log step 5 final permissions
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
        step: 5,
        finalPermissions,
      })}`
    );
    
    // Check if microphone permission is granted
    if (finalPermissions && finalPermissions.microphone === "granted") {
      // Log step 6 action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateMicrophone] [Data] ${JSON.stringify({
          step: 6,
          action: "populating_device_selects",
        })}`
      );
      // Populate device selects with microphone mode
      await this._populateDeviceSelects("microphone");
    }
    
    // Check if microphone permission is granted
    if (finalPermissions && finalPermissions.microphone === "granted") {
      // Mic-only mode does not emit all granted event to prevent video preview
    }
    
    // Check if microphone permission is granted
    const micGranted = finalPermissions && finalPermissions.microphone === "granted";
    // Log critical final result
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateMicrophone] [CRITICAL] [Data] ${JSON.stringify({
        micGranted,
        permissions: finalPermissions,
      })}`
    );
    // Emit orchestrate complete event
    CamMicPermissionsUtility.emit("CamMic:Orchestrate:Complete", {
      mode: "microphone",
      success: micGranted,
      permissions: finalPermissions,
    });
    // Log completion
    console.log(`[CamMicPermissionsHandler] [_orchestrateMicrophone] [End] {}`);
  }

  /**
   * Orchestrate camera permission request.
   *
   * Handles the complete workflow for requesting camera permissions only.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_orchestrateCamera #TODO
   *
   * @param {boolean} [enablePreview=true] - Whether to enable camera preview after permission granted
   * @returns {Promise<void>}
   */
  static async _orchestrateCamera(enablePreview = true) {
    // Log the start of orchestrating camera permission
    console.log(`[CamMicPermissionsHandler] [_orchestrateCamera] [Start] ${JSON.stringify({ enablePreview })}`);
    
    // Check if not already watching permissions
    if (!this._isWatching) {
      // Start watching permissions
      await this.startWatchingPermissions();
    }
    
    // Log step 1 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
        step: 1,
        action: "requesting_camera_permission",
      })}`
    );
    // Emit camera request start event
    CamMicPermissionsUtility.emit("CamMic:Request:Camera:Start");
    // Request camera permission
    await CamMicPermissionsUtility.requestCamera();
    
    // Log step 2 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
        step: 2,
        action: "getting_device_list",
      })}`
    );
    // Get device list from UI
    this.getDeviceList();
    
    // Log step 3 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
        step: 3,
        action: "checking_permissions",
      })}`
    );
    // Check browser permissions
    const permissions = await CamMicPermissionsUtility.checkPermissions() || { camera: "error", microphone: "error" };
    // Log step 3 permissions result
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
        step: 3,
        permissions,
      })}`
    );
    
    // Check if camera permission is not granted
    if (!permissions || permissions.camera !== "granted") {
      // Log step 4 retry camera action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
          step: 4,
          action: "retrying_camera_request",
        })}`
      );
      // Emit camera request start event
      CamMicPermissionsUtility.emit("CamMic:Request:Camera:Start");
      // Request camera permission again
      await CamMicPermissionsUtility.requestCamera();
    }
    
    // Log step 5 action
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
        step: 5,
        action: "rechecking_permissions",
      })}`
    );
    // Re-check permissions after request
    const finalPermissions = await CamMicPermissionsUtility.checkPermissions() || { camera: "error", microphone: "error" };
    // Log step 5 final permissions
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
        step: 5,
        finalPermissions,
      })}`
    );
    
    // Check if camera permission is granted
    if (finalPermissions && finalPermissions.camera === "granted") {
      // Log step 6 action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
          step: 6,
          action: "populating_device_selects",
        })}`
      );
      // Populate device selects with camera mode
      await this._populateDeviceSelects("camera");
    }
    
    // Check if camera permission is granted
    if (finalPermissions && finalPermissions.camera === "granted") {
      // Log step 7 action
      console.log(
        `[CamMicPermissionsHandler] [_orchestrateCamera] [Data] ${JSON.stringify({
          step: 7,
          action: "emitting_all_granted",
          autoPreview: enablePreview,
        })}`
      );
      // Emit all granted event with preview setting
      CamMicPermissionsUtility.emit("CamMic:All:Granted", {
        camera: finalPermissions.camera,
        microphone: "notRequested",
        autoPreview: enablePreview,
      });
    }
    
    // Check if camera permission is granted
    const camGranted = finalPermissions && finalPermissions.camera === "granted";
    // Log critical final result
    console.log(
      `[CamMicPermissionsHandler] [_orchestrateCamera] [CRITICAL] [Data] ${JSON.stringify({
        camGranted,
        permissions: finalPermissions,
        previewEnabled: enablePreview,
      })}`
    );
    // Emit orchestrate complete event
    CamMicPermissionsUtility.emit("CamMic:Orchestrate:Complete", {
      mode: "camera",
      success: camGranted,
      permissions: finalPermissions,
      previewEnabled: enablePreview,
    });
    // Log completion
    console.log(`[CamMicPermissionsHandler] [_orchestrateCamera] [End] {}`);
  }

  /**
   * Initialize the permissions handler.
   *
   * Sets up UI caching, event wiring, and synchronization for camera and microphone permissions.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#init #TODO
   *
   * @returns {void}
   */
  static init() {
    // Log the start of initialization
    console.log(`[CamMicPermissionsHandler] [init] [Start] {}`);
    
    // Check if already initialized
    if (this._isInitialized) {
      // Return early if already initialized
      return;
    }
    
    // Cache UI elements
    this._cacheUI();
    
    // Wire up delegated click handlers
    this._wireDelegatedClicks();
    // Wire up event handlers
    this._wireEvents();
    // Sync multiple select elements
    this._syncMultipleSelects();
    // Ensure footer select elements exist
    this._ensureFooterSelects();
    
    // Set initialized flag to true
    this._isInitialized = true;
    // Log completion
    console.log(`[CamMicPermissionsHandler] [init] [End] {}`);
  }

  /**
   * Get the action from an element by finding the closest action attribute.
   *
   * Traverses up the DOM tree to find the closest element with a data-cam-mic-action attribute.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_getActionFromElement #TODO
   *
   * @param {Element} element - The element to start searching from
   * @returns {string|null} The action string or null if not found
   */
  static _getActionFromElement(element) {
    // Return action from closest element with data-cam-mic-action attribute
    return (
      element
        ?.closest?.("[data-cam-mic-action]")
        ?.getAttribute("data-cam-mic-action") || null
    );
  }

  /**
   * Wire up delegated click event handlers.
   *
   * Sets up a single click event listener on document to handle all action-based clicks.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_wireDelegatedClicks #TODO
   *
   * @returns {void}
   */
  static _wireDelegatedClicks() {
    // Log the start of wiring delegated clicks
    console.log(`[CamMicPermissionsHandler] [_wireDelegatedClicks] [Start] {}`);
    // Add click event listener to document
    document.addEventListener("click", (clickEvent) => {
      // Get action from clicked element
      const action = this._getActionFromElement(clickEvent.target);
      // Check if action is missing
      if (!action) {
        // Return early if no action found
        return;
      }

      // Switch on action to handle different click actions
      switch (action) {
        // Handle check permissions action
        case "check-permissions":
          // Emit before check event
          CamMicPermissionsUtility.emit("CamMic:Permissions:BeforeCheck");
          // Emit check permissions event
          CamMicPermissionsUtility.emit("CamMic:Permissions:Check");
          // Break from switch statement
          break;

        // Handle watch permissions action
        case "watch-permissions":
          // Start watching permissions
          this.startWatchingPermissions();
          // Break from switch statement
          break;
        // Handle stop watching permissions action
        case "watch-permissions-stop":
          // Stop watching permissions
          this.stopWatchingPermissions();
          // Break from switch statement
          break;

        // Handle request camera action
        case "request-camera":
          // Emit camera request start event
          CamMicPermissionsUtility.emit("CamMic:Request:Camera:Start");
          // Emit camera request event
          CamMicPermissionsUtility.emit("CamMic:Request:Camera");
          // Break from switch statement
          break;

        // Handle request microphone action
        case "request-microphone":
          // Emit microphone request start event
          CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Start");
          // Emit microphone request event
          CamMicPermissionsUtility.emit("CamMic:Request:Microphone");
          // Break from switch statement
          break;

        // Handle request both action
        case "request-camera-microphone":
          // Emit both request start event
          CamMicPermissionsUtility.emit("CamMic:Request:Both:Start");
          // Emit both request event
          CamMicPermissionsUtility.emit("CamMic:Request:Both");
          // Break from switch statement
          break;

        // Handle list devices action
        case "list-devices":
          // Populate device selects with both mode
          this._populateDeviceSelects("both");
          // Break from switch statement
          break;

        // Handle stop streams action
        case "stop-streams":
          // Emit streams stop event
          CamMicPermissionsUtility.emit("CamMic:Streams:Stop");
          // Stop all streams
          CamMicPermissionsUtility.stopStreams();
          // Break from switch statement
          break;

        // Handle start video preview action
        case "start-video-preview": {
          // Get camera ID from video select value
          const cameraId = this._ui.videoSelect?.value || null;
          // Emit preview start event
          CamMicPermissionsUtility.emit("CamMic:Preview:Start", {
            cameraId: cameraId,
          });
          // Check if camera ID is set
          if (cameraId) {
            // Start camera preview with selected device
            CamMicPermissionsUtility.startCameraPreview(cameraId);
          }
          // Break from switch statement
          break;
        }
      }
    });
    // Log completion
    console.log(`[CamMicPermissionsHandler] [_wireDelegatedClicks] [End] {}`);
  }


  /**
   * Wire up event handlers for permission-related events.
   *
   * Sets up event listeners for all camera and microphone permission events and stores references for cleanup.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_wireEvents #TODO
   *
   * @returns {void}
   */
  static _wireEvents() {
    // Log the start of wiring events
    console.log(`[CamMicPermissionsHandler] [_wireEvents] [Start] {}`);

    // Define UI event handler function
    const uiHandler = (event) => CamMicPermissionsHandler.handleUIEvent(event);
    // Define array of UI event names
    [
      "CamMic:Permissions:BeforeCheck",
      "CamMic:Permissions:Checked",
      "CamMic:Permissions:Changed",
      "CamMic:Request:Camera:Start",
      "CamMic:Request:Camera:Success",
      "CamMic:Request:Camera:Error",
      "CamMic:Request:Microphone:Start",
      "CamMic:Request:Microphone:Success",
      "CamMic:Request:Microphone:Error",
      "CamMic:Request:Both:Start",
      "CamMic:Request:Both:Success",
      "CamMic:Request:Both:Error",
      "CamMic:Page:ReloadRequired",
      "CamMic:All:Granted",
    ].forEach((eventName) => {
      // Add event listener to window for each event name
      window.addEventListener(eventName, uiHandler);
      // Store event handler reference for cleanup
      this._eventHandlers.push({ event: eventName, handler: uiHandler, target: window });
    });

    // Define permissions check handler function
    const permissionsCheckHandler = () => CamMicPermissionsUtility.checkPermissions();
    // Add event listener for permissions check event
    window.addEventListener("CamMic:Permissions:Check", permissionsCheckHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Permissions:Check", handler: permissionsCheckHandler, target: window });

    // Define request camera handler function
    const requestCameraHandler = () => CamMicPermissionsUtility.requestCamera();
    // Add event listener for camera request event
    window.addEventListener("CamMic:Request:Camera", requestCameraHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Request:Camera", handler: requestCameraHandler, target: window });

    // Define request microphone handler function
    const requestMicrophoneHandler = () => CamMicPermissionsUtility.requestMicrophone();
    // Add event listener for microphone request event
    window.addEventListener("CamMic:Request:Microphone", requestMicrophoneHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Request:Microphone", handler: requestMicrophoneHandler, target: window });

    // Define request both handler function
    const requestBothHandler = () => CamMicPermissionsUtility.requestCameraMicrophone();
    // Add event listener for both request event
    window.addEventListener("CamMic:Request:Both", requestBothHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Request:Both", handler: requestBothHandler, target: window });

    // Define stop streams handler function
    const stopStreamsHandler = () => CamMicPermissionsUtility.stopStreams();
    // Add event listener for streams stop event
    window.addEventListener("CamMic:Streams:Stop", stopStreamsHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Streams:Stop", handler: stopStreamsHandler, target: window });

    // Define watch start handler function
    const watchStartHandler = () => this.startWatchingPermissions();
    // Add event listener for watch start event
    window.addEventListener("CamMic:Permissions:WatchStart", watchStartHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Permissions:WatchStart", handler: watchStartHandler, target: window });

    // Define watch stop handler function
    const watchStopHandler = () => this.stopWatchingPermissions();
    // Add event listener for watch stop event
    window.addEventListener("CamMic:Permissions:WatchStop", watchStopHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Permissions:WatchStop", handler: watchStopHandler, target: window });

    // Define orchestrate both handler function
    const orchestrateBothHandler = (ev) => this._orchestrateBoth(ev.detail?.enablePreview !== false);
    // Add event listener for orchestrate both event
    window.addEventListener("CamMic:Orchestrate:Both", orchestrateBothHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Orchestrate:Both", handler: orchestrateBothHandler, target: window });

    // Define orchestrate both no preview handler function
    const orchestrateBothNoPreviewHandler = () => this._orchestrateBoth(false);
    // Add event listener for orchestrate both no preview event
    window.addEventListener("CamMic:Orchestrate:Both:NoPreview", orchestrateBothNoPreviewHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Orchestrate:Both:NoPreview", handler: orchestrateBothNoPreviewHandler, target: window });

    // Define orchestrate microphone handler function
    const orchestrateMicrophoneHandler = () => this._orchestrateMicrophone();
    // Add event listener for orchestrate microphone event
    window.addEventListener("CamMic:Orchestrate:Microphone", orchestrateMicrophoneHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Orchestrate:Microphone", handler: orchestrateMicrophoneHandler, target: window });

    // Define orchestrate camera handler function
    const orchestrateCameraHandler = (ev) => this._orchestrateCamera(ev.detail?.enablePreview !== false);
    // Add event listener for orchestrate camera event
    window.addEventListener("CamMic:Orchestrate:Camera", orchestrateCameraHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Orchestrate:Camera", handler: orchestrateCameraHandler, target: window });

    // Define orchestrate camera no preview handler function
    const orchestrateCameraNoPreviewHandler = () => this._orchestrateCamera(false);
    // Add event listener for orchestrate camera no preview event
    window.addEventListener("CamMic:Orchestrate:Camera:NoPreview", orchestrateCameraNoPreviewHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Orchestrate:Camera:NoPreview", handler: orchestrateCameraNoPreviewHandler, target: window });

    // Define device list check handler function
    const deviceListCheckHandler = () => this.getDeviceList();
    // Add event listener for device list check event
    window.addEventListener("CamMic:DeviceList:Check", deviceListCheckHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:DeviceList:Check", handler: deviceListCheckHandler, target: window });
    
    // Define UI state check handler function for legacy support
    const uiStateCheckHandler = () => this.getDeviceList();
    // Add event listener for UI state check event
    window.addEventListener("CamMic:UI:State:Check", uiStateCheckHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:UI:State:Check", handler: uiStateCheckHandler, target: window });

    // Define devices list handler function
    const devicesListHandler = () => CamMicPermissionsUtility.getAvailableDevices();
    // Add event listener for devices list event
    window.addEventListener("CamMic:Devices:List", devicesListHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Devices:List", handler: devicesListHandler, target: window });

    // Define preview start handler function
    const previewStartHandler = (ev) => {
      // Get camera ID from event detail or video select value
      const cameraId = ev.detail?.cameraId || this._ui.videoSelect?.value || null;
      // Check if camera ID is set
      if (cameraId) {
        // Start camera preview with specified device
        CamMicPermissionsUtility.startCameraPreview(cameraId);
      }
    };
    // Add event listener for preview start event
    window.addEventListener("CamMic:Preview:Start", previewStartHandler);
    // Store event handler reference for cleanup
    this._eventHandlers.push({ event: "CamMic:Preview:Start", handler: previewStartHandler, target: window });

    console.log(`[CamMicPermissionsHandler] [_wireEvents] [End] {}`);
  }

  /**
   * Unbind all event handlers and clean up resources.
   *
   * Removes all event listeners, stops permission watching, disconnects observers, and resets state.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#unbindAll #TODO
   *
   * @returns {void}
   */
  static unbindAll() {
    // Log the start of unbinding all handlers
    console.log(`[CamMicPermissionsHandler] [unbindAll] [Start] {}`);
    
    // Iterate through all stored event handlers
    this._eventHandlers.forEach(({ event, handler, target }) => {
      // Wrap listener removal in try-catch
      try {
        // Remove event listener from target
        target.removeEventListener(event, handler);
      } catch (error) {
        // Log warning if listener removal fails
        console.warn(
          `[CamMicPermissionsHandler] [unbindAll] [Error] Failed to remove listener: ${JSON.stringify({
            event,
            message: error?.message || error,
          })}`
        );
      }
    });

    // Check if boot init handler exists
    if (this._bootInitHandler) {
      // Wrap boot handler removal in try-catch
      try {
        // Remove boot init event listener
        this._bootInitHandler.target.removeEventListener(
          this._bootInitHandler.event,
          this._bootInitHandler.handler
        );
      } catch (error) {
        // Log warning if boot handler removal fails
        console.warn(
          `[CamMicPermissionsHandler] [unbindAll] [Error] Failed to remove boot handler: ${JSON.stringify({
            message: error?.message || error,
          })}`
        );
      }
      // Clear boot init handler reference
      this._bootInitHandler = null;
    }
    
    // Clear the event handlers array
    this._eventHandlers = [];
    
    // Check if permission watching is active
    if (this._isWatching) {
      // Stop watching permissions
      this.stopWatchingPermissions();
    }
    
    // Check if mutation observer exists
    if (this._mutationObserver) {
      // Wrap observer disconnect in try-catch
      try {
        // Disconnect mutation observer
        this._mutationObserver.disconnect();
      } catch {
        // Silently ignore disconnect errors
      }
      // Clear mutation observer reference
      this._mutationObserver = null;
    }
    
    // Stop all active streams
    CamMicPermissionsUtility.stopStreams();
    
    // Reset initialized flag to false
    this._isInitialized = false;
    
    // Log completion
    console.log(`[CamMicPermissionsHandler] [unbindAll] [End] {}`);
  }

  /**
   * Start watching for permission changes.
   *
   * Sets up permission change monitoring and stores the unbind function for cleanup.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#startWatchingPermissions #TODO
   *
   * @returns {Promise<void>}
   */
  static async startWatchingPermissions() {
    // Check if already watching permissions
    if (this._isWatching) {
      // Return early if already watching
      return;
    }
    // Log the start of watching permissions
    console.log(`[CamMicPermissionsHandler] [startWatchingPermissions] [Start] {}`);
    // Set watching flag to true
    this._isWatching = true;
    // Get unbind function from watch permission changes
    this._unbindPermissionWatch =
      await CamMicPermissionsUtility.watchPermissionChanges(async () => {
        // Emit permissions check event when permission changes
        CamMicPermissionsUtility.emit("CamMic:Permissions:Check");
      });
    // Emit watch started event
    CamMicPermissionsUtility.emit("CamMic:Permissions:WatchStarted");
    // Log completion
    console.log(`[CamMicPermissionsHandler] [startWatchingPermissions] [End] {}`);
  }

  /**
   * Stop watching for permission changes.
   *
   * Unbinds permission change listeners and resets watching state.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#stopWatchingPermissions #TODO
   *
   * @returns {void}
   */
  static stopWatchingPermissions() {
    // Log the start of stopping permission watching
    console.log(`[CamMicPermissionsHandler] [stopWatchingPermissions] [Start] {}`);
    // Check if unbind function exists
    if (typeof this._unbindPermissionWatch === "function") {
      // Wrap unbind call in try-catch
      try {
        // Call unbind function to stop watching
        this._unbindPermissionWatch();
      } catch {
        // Silently ignore unbind errors
      }
    }
    // Clear unbind permission watch reference
    this._unbindPermissionWatch = null;
    // Set watching flag to false
    this._isWatching = false;
    // Emit watch stopped event
    CamMicPermissionsUtility.emit("CamMic:Permissions:WatchStopped");
    // Log completion
    console.log(`[CamMicPermissionsHandler] [stopWatchingPermissions] [End] {}`);
  }


  /* Add this inside class CamMicPermissionsHandler */

  /**
   * Synchronize multiple select elements across the page.
   *
   * Keeps primary and mirror select elements in sync for camera and microphone device selection.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsHandler#_syncMultipleSelects #TODO
   *
   * @returns {void}
   */
  static _syncMultipleSelects() {
    // Log the start of syncing multiple selects
    console.log(`[CamMicPermissionsHandler] [_syncMultipleSelects] [Start] {}`);
    // Get primary camera select from UI cache or query document
    const primaryCameraSelect = this._ui?.videoSelect || document.querySelector('[data-cam-mic-element="video-select"]');
    // Get primary microphone select from UI cache or query document
    const primaryMicrophoneSelect = this._ui?.audioSelect || document.querySelector('[data-cam-mic-element="audio-select"]');
    
    // Check if primary camera select is missing
    if (!primaryCameraSelect) {
      // Throw error if camera select missing
      throw new Error('Missing required camera select element: [data-cam-mic-element="video-select"]');
    }
    // Check if primary microphone select is missing
    if (!primaryMicrophoneSelect) {
      // Throw error if microphone select missing
      throw new Error('Missing required microphone select element: [data-cam-mic-element="audio-select"]');
    }

    // Define sync function to sync primary to mirrors
    const sync = (deviceKind) => {
      // Get primary select based on device kind
      const primarySelect = deviceKind === "cam" ? primaryCameraSelect : primaryMicrophoneSelect;
      // Check if primary select is missing
      if (!primarySelect) {
        // Return early if primary select missing
        return;
      }

      // Log sync action with device kind and value
      console.log(
        `[CamMicPermissionsHandler] [_syncMultipleSelects] [Data] ${JSON.stringify({
          action: "sync",
          deviceKind,
          primaryValue: primarySelect.value,
        })}`
      );

      // Check if mutation observer exists
      if (this._mutationObserver) {
        // Disconnect mutation observer to prevent feedback loop
        this._mutationObserver.disconnect();
      }

      // Find all mirror selects for device kind
      const mirrorSelects = document.querySelectorAll(
        deviceKind === "cam" ? "[data-camera-select]" : "[data-microphone-select]"
      );
      // Log syncing to mirrors with count
      console.log(
        `[CamMicPermissionsHandler] [_syncMultipleSelects] [Data] ${JSON.stringify({
          action: "syncing_to_mirrors",
          deviceKind,
          mirrorCount: mirrorSelects.length,
        })}`
      );
      // Iterate through each mirror select
      mirrorSelects.forEach((mirrorSelect) => {
        // Check if mirror select is HTML select element
        if (!(mirrorSelect instanceof HTMLSelectElement)) {
          // Return early if not HTML select element
          return;
        }
        // Copy innerHTML from primary to mirror
        mirrorSelect.innerHTML = primarySelect.innerHTML;
        // Copy value from primary to mirror
        mirrorSelect.value = primarySelect.value;
      });

      // Check if mutation observer and primary selects exist
      if (this._mutationObserver && primaryCameraSelect && primaryMicrophoneSelect) {
        // Observe primary camera select for mutations
        this._mutationObserver.observe(primaryCameraSelect, { childList: true, subtree: true, attributes: true });
        // Observe primary microphone select for mutations
        this._mutationObserver.observe(primaryMicrophoneSelect, { childList: true, subtree: true, attributes: true });
      }
    };

    // Define reflect function to reflect mirror changes to primary
    const reflect = (deviceKind, selectedValue) => {
      // Get primary select based on device kind
      const primarySelect = deviceKind === "cam" ? primaryCameraSelect : primaryMicrophoneSelect;
      // Check if primary select is missing
      if (!primarySelect) {
        // Return early if primary select missing
        return;
      }

      // Log reflect action with device kind and value
      console.log(
        `[CamMicPermissionsHandler] [_syncMultipleSelects] [Data] ${JSON.stringify({
          action: "reflect",
          deviceKind,
          selectedValue,
        })}`
      );

      // Check if mutation observer exists
      if (this._mutationObserver) {
        // Disconnect mutation observer to prevent feedback loop
        this._mutationObserver.disconnect();
      }

      // Set primary select value to selected value or empty string
      primarySelect.value = selectedValue || "";
      // Dispatch change event to keep prefs and labels in sync
      primarySelect.dispatchEvent(new Event("change", { bubbles: true }));

      // Check if camera changed and preview utility available
      if (deviceKind === "cam" && selectedValue && window.CamMicPermissionsUtility?.startCameraPreview) {
        // Log starting preview from reflect action
        console.log(
          `[CamMicPermissionsHandler] [_syncMultipleSelects] [Data] ${JSON.stringify({
            action: "starting_preview_from_reflect",
            deviceId: selectedValue,
          })}`
        );
        // Start camera preview with selected device
        window.CamMicPermissionsUtility.startCameraPreview(selectedValue).catch((error) => {
          // Log error if preview start fails
          console.error(
            `[CamMicPermissionsHandler] [_syncMultipleSelects] [Error] ${JSON.stringify({
              deviceId: selectedValue,
              message: error?.message || error,
            })}`
          );
        });
      }

      // Sync back to all mirrors and reconnect observer
      sync(deviceKind);
    };

    // Add change listener to primary camera select to sync mirrors
    primaryCameraSelect.addEventListener("change", () => sync("cam"));
    // Add change listener to primary microphone select to sync mirrors
    primaryMicrophoneSelect.addEventListener("change", () => sync("mic"));

    // Define mutation debounce timer variable
    let mutationDebounceTimer = null;
    // Define debounced sync function to batch rapid DOM updates
    const debouncedSync = () => {
      // Check if debounce timer exists
      if (mutationDebounceTimer) {
        // Clear existing debounce timer
        clearTimeout(mutationDebounceTimer);
      }
      // Set new debounce timer
      mutationDebounceTimer = setTimeout(() => {
        // Sync camera selects
        sync("cam");
        // Sync microphone selects
        sync("mic");
        // Clear debounce timer
        mutationDebounceTimer = null;
      }, 100);
    };
    
    // Create new mutation observer with debounced sync
    this._mutationObserver = new MutationObserver(debouncedSync);
    // Observe primary camera select for mutations
    this._mutationObserver.observe(primaryCameraSelect, { childList: true, subtree: true, attributes: true });
    // Observe primary microphone select for mutations
    this._mutationObserver.observe(primaryMicrophoneSelect, { childList: true, subtree: true, attributes: true });

    // Add delegated change listener to document for mirror selects
    document.addEventListener("change", (changeEvent) => {
      // Get target element from change event
      const targetElement = changeEvent.target;
      // Check if target is HTML select element
      if (!(targetElement instanceof HTMLSelectElement)) {
        // Return early if not HTML select element
        return;
      }
      // Check if target matches camera select
      if (targetElement.matches("[data-camera-select]")) {
        // Reflect camera change to primary
        return reflect("cam", targetElement.value);
      }
      // Check if target matches microphone select
      if (targetElement.matches("[data-microphone-select]")) {
        // Reflect microphone change to primary
        return reflect("mic", targetElement.value);
      }
    }, { capture: true });

    // Log initial sync action
    console.log(
      `[CamMicPermissionsHandler] [_syncMultipleSelects] [Data] ${JSON.stringify({
        action: "initial_sync",
      })}`
    );
    // Check if mutation observer exists
    if (this._mutationObserver) {
      // Disconnect observer during initial sync
      this._mutationObserver.disconnect();
    }
    // Sync camera selects initially
    sync("cam");
    // Sync microphone selects initially
    sync("mic");
    // Log completion
    console.log(`[CamMicPermissionsHandler] [_syncMultipleSelects] [End] {}`);
  }
}
// Iinitialization system for CamMicPermissionsHandler

// Validate that required classes are available before booting
if (
  typeof CamMicPermissionsUtility === "function" &&
  typeof CamMicPermissionsHandler === "function"
) {
  // Create initialization handler function. This handler will be called when the "CamMic:Init" custom event is dispatched
  const initHandler = () => {
    // Log initialization start
    console.log(`[Boot] [CamMic:Init] [Start] {}`);
    // Call the static init() method on CamMicPermissionsHandler
    CamMicPermissionsHandler.init();
    // Log initialization completion
    console.log(`[Boot] [CamMic:Init] [End] {}`);
  };
  
  // Register the init handler as a listener for the "CamMic:Init" custom event
  window.addEventListener("CamMic:Init", initHandler);
  
  // Store boot handler reference for cleanup via unbindAll()
  CamMicPermissionsHandler._bootInitHandler = { event: "CamMic:Init", handler: initHandler, target: window };
} else {
  // log if required dependencies are missing
  console.error(
    `[Boot] [Error] ${JSON.stringify({
      message: "CamMicPermissionsUtility or CamMicPermissionsHandler not found",
    })}`
  );
}
