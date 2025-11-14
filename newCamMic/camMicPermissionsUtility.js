/**
 * Class CamMicPermissionsUtility
 *
 * Handles camera and microphone permission requests, device enumeration, and stream management.
 *
 * @link https://docs.example.com/CamMicPermissionsUtility
 */
class CamMicPermissionsUtility {
  // Define set to track active media streams
  static _activeStreams = new Set();
  // Define flag to track if permissions are currently being checked
  static _isCheckingPermissions = false;
  // Define weak map to track listeners for cleanup
  static _streamListeners = new WeakMap();
  // Define weak map to track timeout fallbacks for stream cleanup
  static _streamTimeouts = new WeakMap();

  /**
   * Emit a custom event to the specified target.
   *
   * Dispatches a custom event with the provided event name and detail data to the target window or element.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#emit #TODO
   *
   * @param {string} eventName - The name of the event to dispatch
   * @param {Object} [detail={}] - The event detail data object
   * @param {Window|EventTarget} [target=window] - The target element or window to dispatch the event to
   * @returns {boolean} True if event was dispatched successfully, false otherwise
   */
  static emit(eventName, detail = {}, target = window) {
    // Log the start of event emission with event name and detail flag
    console.log(
      `[CamMicPermissionsUtility] [emit] [Start] ${JSON.stringify({
        eventName,
        hasDetail: !!detail && Object.keys(detail).length > 0,
      })}`
    );
    // Check if eventName is missing or not a string
    if (!eventName || typeof eventName !== 'string') {
      // Throw error if eventName validation fails
      throw new Error('eventName is required and must be a string');
    }
    // Check if target is missing or does not have dispatchEvent method
    if (!target || typeof target.dispatchEvent !== 'function') {
      // Throw error if target validation fails
      throw new Error('target is required and must have dispatchEvent method');
    }
    // Wrap dispatch logic in try-catch for error handling
    try {
      // Log the event data before dispatching
      console.log(
        `[CamMicPermissionsUtility] [emit] [Data] ${JSON.stringify({
          eventName,
          detail,
        })}`
      );
      // Dispatch the custom event to the target
      target.dispatchEvent(
        // Create a new CustomEvent with event name and options
        new CustomEvent(eventName, {
          detail,
          bubbles: false,
          cancelable: false,
        })
      );
      // Log successful event emission
      console.log(
        `[CamMicPermissionsUtility] [emit] [End] ${JSON.stringify({
          eventName,
        })}`
      );
      // Return true to indicate successful dispatch
      return true;
    } catch (error) {
      // Log error if event dispatch fails
      console.error(
        `[CamMicPermissionsUtility] [emit] [Error] ${JSON.stringify({
          eventName,
          message: error?.message || error,
        })}`
      );
      // Return false to indicate dispatch failure
      return false;
    }
  }

  /**
   * Set the preferred device for a given device kind in localStorage.
   *
   * Saves the preferred device ID to localStorage and emits a preference set event.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#setPreferredDevice #TODO
   *
   * @param {string} deviceKind - The kind of device (e.g., "camera" or "microphone")
   * @param {string|null|undefined} deviceId - The device ID to save, or null/undefined to clear
   * @returns {void}
   */
  static setPreferredDevice(deviceKind, deviceId) {
    // Log the start of setting preferred device
    console.log(
      `[CamMicPermissionsUtility] [setPreferredDevice] [Start] ${JSON.stringify({
        deviceKind,
        deviceId,
      })}`
    );
    // Check if deviceKind is missing or not a string
    if (!deviceKind || typeof deviceKind !== 'string') {
      // Throw error if deviceKind validation fails
      throw new Error('deviceKind is required and must be a string');
    }
    // Check if deviceId is not null, undefined, or string
    if (deviceId !== null && deviceId !== undefined && typeof deviceId !== 'string') {
      // Throw error if deviceId validation fails
      throw new Error('deviceId must be a string, null, or undefined');
    }
    // Wrap localStorage operations in try-catch
    try {
      // Save the device ID to localStorage
      localStorage.setItem(`CamMicPreferred-${deviceKind}`, deviceId || "");
      // Log successful save
      console.log(
        `[CamMicPermissionsUtility] [setPreferredDevice] [Data] ${JSON.stringify({
          deviceKind,
          deviceId,
          status: "saved",
        })}`
      );
      // Emit preference set event
      CamMicPermissionsUtility.emit("CamMic:Preferred:Set", { kind: deviceKind, deviceId });
      // Log completion
      console.log(`[CamMicPermissionsUtility] [setPreferredDevice] [End] {}`);
    } catch (error) {
      // Log error if localStorage operation fails
      console.error(
        `[CamMicPermissionsUtility] [setPreferredDevice] [Error] ${JSON.stringify({
          deviceKind,
          deviceId,
          message: error?.message || error,
        })}`
      );
    }
  }

  /**
   * Get the preferred device ID for a given device kind from localStorage.
   *
   * Retrieves the saved preferred device ID from localStorage for the specified device kind.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#getPreferredDevice #TODO
   *
   * @param {string} deviceKind - The kind of device (e.g., "camera" or "microphone")
   * @returns {string|null} The preferred device ID or null if not found
   */
  static getPreferredDevice(deviceKind) {
    // Log the start of getting preferred device
    console.log(
      `[CamMicPermissionsUtility] [getPreferredDevice] [Start] ${JSON.stringify({
        deviceKind,
      })}`
    );
    // Check if deviceKind is missing or not a string
    if (!deviceKind || typeof deviceKind !== 'string') {
      // Throw error if deviceKind validation fails
      throw new Error('deviceKind is required and must be a string');
    }
    // Initialize preferred device ID variable
    let preferredDeviceId = null;
    // Wrap localStorage operations in try-catch
    try {
      // Retrieve the device ID from localStorage
      preferredDeviceId = localStorage.getItem(`CamMicPreferred-${deviceKind}`) || null;
      // Log the retrieved device ID
      console.log(
        `[CamMicPermissionsUtility] [getPreferredDevice] [Data] ${JSON.stringify({
          deviceKind,
          preferredDeviceId,
        })}`
      );
    } catch (error) {
      // Log error if localStorage operation fails
      console.error(
        `[CamMicPermissionsUtility] [getPreferredDevice] [Error] ${JSON.stringify({
          deviceKind,
          message: error?.message || error,
        })}`
      );
    }
    // Log completion
    console.log(`[CamMicPermissionsUtility] [getPreferredDevice] [End] {}`);
    // Return the preferred device ID
    return preferredDeviceId;
  }

  /**
   * Get the permission state for a specific device kind.
   *
   * Queries the browser permissions API to check the current state of camera or microphone permissions.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#getPermission #TODO
   *
   * @param {string} deviceKind - The kind of device permission to check (e.g., "camera" or "microphone")
   * @returns {Promise<string>} The permission state: "granted", "denied", "prompt", "unsupported", or "error"
   */
  static async getPermission(deviceKind) {
    // Log the start of permission check
    console.log(
      `[CamMicPermissionsUtility] [getPermission] [Start] ${JSON.stringify({
        deviceKind,
      })}`
    );
    // Check if deviceKind is missing or not a string
    if (!deviceKind || typeof deviceKind !== 'string') {
      // Throw error if deviceKind validation fails
      throw new Error('deviceKind is required and must be a string');
    }
    // Check if permissions API is not available
    if (!navigator.permissions) {
      // Log unsupported state
      console.log(
        `[CamMicPermissionsUtility] [getPermission] [Data] ${JSON.stringify({
          deviceKind,
          state: "unsupported",
        })}`
      );
      // Log completion
      console.log(`[CamMicPermissionsUtility] [getPermission] [End] {}`);
      // Return unsupported state
      return "unsupported";
    }
    // Wrap permission query in try-catch
    try {
      // Query the permission status from the browser
      const status = await navigator.permissions.query({ name: deviceKind });
      // Extract the permission state from status object
      const permissionState = status.state;
      // Log the permission state
      console.log(
        `[CamMicPermissionsUtility] [getPermission] [Data] ${JSON.stringify({
          deviceKind,
          state: permissionState,
        })}`
      );
      // Log completion
      console.log(`[CamMicPermissionsUtility] [getPermission] [End] {}`);
      // Return the permission state
      return permissionState;
    } catch (error) {
      // Log error if permission query fails
      console.error(
        `[CamMicPermissionsUtility] [getPermission] [Error] ${JSON.stringify({
          deviceKind,
          message: error?.message || error,
        })}`
      );
      // Log completion
      console.log(`[CamMicPermissionsUtility] [getPermission] [End] {}`);
      // Return error state
      return "error";
    }
  }

  /**
   * Check camera and microphone permissions.
   *
   * Queries the browser permissions API for both camera and microphone permissions and returns their states.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#checkPermissions #TODO
   *
   * @returns {Promise<Object>} An object with camera and microphone permission states
   */
  static async checkPermissions() {
    // Check if permissions are already being checked
    if (this._isCheckingPermissions) {
      // Define maximum wait time in milliseconds
      const maxWait = 5000;
      // Record the start time for timeout calculation
      const startTime = Date.now();
      // Poll while checking is in progress and timeout has not been reached
      while (this._isCheckingPermissions && (Date.now() - startTime) < maxWait) {
        // Wait 100 milliseconds before next poll
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Check if still checking after timeout
      if (this._isCheckingPermissions) {
        // Log timeout warning
        console.warn("[CamMicPermissionsUtility] [checkPermissions] [Error] Timeout - check taking too long");
        // Return error state for both permissions
        return { camera: "error", microphone: "error" };
      }
      // Log recheck action
      console.log(
        `[CamMicPermissionsUtility] [checkPermissions] [Data] ${JSON.stringify({
          action: "previous_check_completed_rechecking",
        })}`
      );
      // Recursively call checkPermissions after previous check completed
      return this.checkPermissions();
    }
    
    // Set checking flag to true
    this._isCheckingPermissions = true;
    // Log the start of permission check
    console.log("[CamMicPermissionsUtility] [checkPermissions] [Start] {}");
    // Wrap permission checks in try-finally
    try {
      // Emit before check event
      CamMicPermissionsUtility.emit("CamMic:Permissions:BeforeCheck");
      // Get camera permission state
      const camera = await this.getPermission("camera");
      // Get microphone permission state
      const microphone = await this.getPermission("microphone");
      // Create result object with both permission states
      const result = { camera, microphone };
      // Log critical permission data
      console.log(
        `[CamMicPermissionsUtility] [checkPermissions] [CRITICAL] [Data] ${JSON.stringify(result)}`
      );
      // Emit checked event with permission results
      CamMicPermissionsUtility.emit("CamMic:Permissions:Checked", result);
      // Log completion
      console.log("[CamMicPermissionsUtility] [checkPermissions] [End] {}");
      // Return permission results
      return result;
    } finally {
      // Reset checking flag in finally block
      this._isCheckingPermissions = false;
    }
  }

  /**
   * Watch for permission state changes for camera and microphone.
   *
   * Sets up listeners to monitor permission state changes and provides an unbind function to clean up.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#watchPermissionChanges #TODO
   *
   * @param {Function} [callback] - Optional callback function to execute when permission changes
   * @returns {Function} Unbind function to remove all permission change listeners
   */
  static async watchPermissionChanges(callback) {
    // Log the start of watching permission changes
    console.log("[CamMicPermissionsUtility] [watchPermissionChanges] [Start] {}");
    // Check if permissions API is not available
    if (!navigator.permissions) {
      // Return empty unbind function if permissions API unavailable
      return () => {};
    }
    // Define array of permission kinds to watch
    const kinds = ["camera", "microphone"];
    // Initialize array to store unbind functions
    const unbinders = [];
    // Iterate through each permission kind
    for (const type of kinds) {
      // Wrap permission watching in try-catch
      try {
        // Query the permission status for the current type
        const status = await navigator.permissions.query({ name: type });
        // Define onchange handler function
        const onchange = () => {
          // Get current permission state
          const state = status.state;
          // Log permission change data
          console.log(
            `[CamMicPermissionsUtility] [watchPermissionChanges] [Data] ${JSON.stringify({
              type,
              state,
            })}`
          );
          // Emit permission changed event
          CamMicPermissionsUtility.emit("CamMic:Permissions:Changed", {
            type,
            state,
          });
          // Call callback if provided and is a function
          if (typeof callback === "function") callback(type, state);
        };
        // Assign onchange handler to status object
        status.onchange = onchange;
        // Add unbind function to unbinders array
        unbinders.push(() => {
          // Wrap cleanup in try-catch
          try {
            // Clear the onchange handler
            status.onchange = null;
          } catch (error) {
            // Log warning if cleanup fails
            console.warn(
              `[CamMicPermissionsUtility] [watchPermissionChanges] [Error] ${JSON.stringify({
                type,
                message: error?.message || error,
              })}`
            );
          }
        });
      } catch (error) {
        // Log error if permission watching fails
        console.error(
          `[CamMicPermissionsUtility] [watchPermissionChanges] [Error] ${JSON.stringify({
            type,
            message: error?.message || error,
          })}`
        );
      }
    }
    // Log completion
    console.log("[CamMicPermissionsUtility] [watchPermissionChanges] [End] {}");
    // Return unbind function that calls all unbinders
    return () => unbinders.forEach((unbinder) => unbinder());
  }

  /**
   * Check if an error indicates permission was denied.
   *
   * Analyzes error message and name to determine if the error is related to permission denial.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#_isPermissionDeniedError #TODO
   *
   * @param {Error|Object} error - The error object to check
   * @returns {boolean} True if error indicates permission denial, false otherwise
   */
  static _isPermissionDeniedError(error) {
    // Convert error message to lowercase string
    const errorMessage = (error?.message || `${error || ""}`).toLowerCase();
    // Convert error name to lowercase string
    const errorName = (error?.name || "").toLowerCase();
    // Check if error indicates permission denial
    const isDenied = (
      errorMessage.includes("denied") ||
      errorName === "notallowederror" ||
      errorName === "securityerror"
    );
    // Log critical permission denial check data
    console.log(
      `[CamMicPermissionsUtility] [_isPermissionDeniedError] [CRITICAL] [Data] ${JSON.stringify({
        isDenied,
        errorName,
        errorMessagePreview: errorMessage.substring(0, 100),
      })}`
    );
    // Return denial status
    return isDenied;
  }

  /**
   * Handle permission denied scenario by emitting reload required event.
   *
   * Emits an event to notify that page reload is required due to permission denial.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#_handlePermissionDenied #TODO
   *
   * @param {string} context - The context where permission was denied
   * @returns {void}
   */
  static _handlePermissionDenied(context) {
    // Log permission denied warning
    console.warn(
      `[CamMicPermissionsUtility] [_handlePermissionDenied] [Data] ${JSON.stringify({
        context,
      })}`
    );
    // Emit page reload required event
    CamMicPermissionsUtility.emit("CamMic:Page:ReloadRequired", {
      context,
      message: "Permission denied",
    });
  }

  /**
   * Request camera access from the user.
   *
   * Attempts to get camera access with retry logic and error handling.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#requestCamera #TODO
   *
   * @returns {Promise<MediaStream|null>} The camera stream or null if request failed
   */
  static async requestCamera() {
    // Log the start of camera request
    console.log("[CamMicPermissionsUtility] [requestCamera] [Start] {}");
    // Emit camera request start event
    CamMicPermissionsUtility.emit("CamMic:Request:Camera:Start");
    // Check if getUserMedia is not supported
    if (!navigator.mediaDevices?.getUserMedia) {
      // Define error message for unsupported browser
      const errorMessage = 'getUserMedia is not supported in this browser';
      // Emit camera request error event
      CamMicPermissionsUtility.emit("CamMic:Request:Camera:Error", {
        message: errorMessage,
      });
      // Throw error for unsupported browser
      throw new Error(errorMessage);
    }
    
    // Loop for retry attempts with maximum of 2 attempts
    for (let attempt = 0; attempt < 2; attempt++) {
      // Wrap getUserMedia call in try-catch
      try {
        // Request camera stream from media devices
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Get count of video tracks in stream
        const trackCount = stream.getVideoTracks().length;
        // Log critical camera stream data
        console.log(
          `[CamMicPermissionsUtility] [requestCamera] [CRITICAL] [Data] ${JSON.stringify({
            trackCount,
            attempt: attempt + 1,
          })}`
        );
        // Register the stream for tracking
        this._registerStream(stream);
        // Emit camera request success event
        CamMicPermissionsUtility.emit("CamMic:Request:Camera:Success", {
          tracks: trackCount,
        });
        // Log completion
        console.log("[CamMicPermissionsUtility] [requestCamera] [End] {}");
        // Return the camera stream
        return stream;
      } catch (error) {
        // Check if error is permission denied
        const isPermissionDenied = this._isPermissionDeniedError(error);
        
        // Check if should not retry due to permission denial or last attempt
        if (isPermissionDenied || attempt === 1) {
          // Emit camera request error event
          CamMicPermissionsUtility.emit("CamMic:Request:Camera:Error", {
            message: error?.message || error,
            retried: attempt > 0,
          });
          // Log camera request error
          console.error(
            `[CamMicPermissionsUtility] [requestCamera] [Error] ${JSON.stringify({
              attempt: attempt + 1,
              retried: attempt > 0,
              isPermissionDenied,
              message: error?.message || error,
            })}`
          );
          // Check if permission was denied
          if (isPermissionDenied) {
            // Handle permission denied scenario
            this._handlePermissionDenied("camera");
          }
          // Log completion
          console.log("[CamMicPermissionsUtility] [requestCamera] [End] {}");
          // Return null to indicate failure
          return null;
        }
        
        // Wait 500 milliseconds before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Return null if all attempts failed
    return null;
  }

  /**
   * Request microphone access from the user.
   *
   * Attempts to get microphone access with retry logic and error handling.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#requestMicrophone #TODO
   *
   * @returns {Promise<MediaStream|null>} The microphone stream or null if request failed
   */
  static async requestMicrophone() {
    // Log the start of microphone request
    console.log("[CamMicPermissionsUtility] [requestMicrophone] [Start] {}");
    // Emit microphone request start event
    CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Start");
    // Check if getUserMedia is not supported
    if (!navigator.mediaDevices?.getUserMedia) {
      // Define error message for unsupported browser
      const errorMessage = 'getUserMedia is not supported in this browser';
      // Emit microphone request error event
      CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Error", {
        message: errorMessage,
      });
      // Throw error for unsupported browser
      throw new Error(errorMessage);
    }
    
    // Loop for retry attempts with maximum of 2 attempts
    for (let attempt = 0; attempt < 2; attempt++) {
      // Wrap getUserMedia call in try-catch
      try {
        // Request microphone stream from media devices
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Get count of audio tracks in stream
        const trackCount = stream.getAudioTracks().length;
        // Log critical microphone stream data
        console.log(
          `[CamMicPermissionsUtility] [requestMicrophone] [CRITICAL] [Data] ${JSON.stringify({
            trackCount,
            attempt: attempt + 1,
          })}`
        );
        // Register the stream for tracking
        this._registerStream(stream);
        // Emit microphone request success event
        CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Success", {
          tracks: trackCount,
        });
        // Log completion
        console.log("[CamMicPermissionsUtility] [requestMicrophone] [End] {}");
        // Return the microphone stream
        return stream;
      } catch (error) {
        // Check if error is permission denied
        const isPermissionDenied = this._isPermissionDeniedError(error);
        
        // Check if should not retry due to permission denial or last attempt
        if (isPermissionDenied || attempt === 1) {
          // Emit microphone request error event
          CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Error", {
            message: error?.message || error,
            retried: attempt > 0,
          });
          // Log microphone request error
          console.error(
            `[CamMicPermissionsUtility] [requestMicrophone] [Error] ${JSON.stringify({
              attempt: attempt + 1,
              retried: attempt > 0,
              isPermissionDenied,
              message: error?.message || error,
            })}`
          );
          // Check if permission was denied
          if (isPermissionDenied) {
            // Handle permission denied scenario
            this._handlePermissionDenied("microphone");
          }
          // Log completion
          console.log("[CamMicPermissionsUtility] [requestMicrophone] [End] {}");
          // Return null to indicate failure
          return null;
        }
        
        // Wait 500 milliseconds before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Return null if all attempts failed
    return null;
  }

  /**
   * Request both camera and microphone access from the user.
   *
   * Attempts to get both camera and microphone access with retry logic and error handling.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#requestCameraMicrophone #TODO
   *
   * @returns {Promise<MediaStream|null>} The media stream with both video and audio tracks or null if request failed
   */
  static async requestCameraMicrophone() {
    // Log the start of camera and microphone request
    console.log("[CamMicPermissionsUtility] [requestCameraMicrophone] [Start] {}");
    // Emit both request start event
    CamMicPermissionsUtility.emit("CamMic:Request:Both:Start");
    // Check if getUserMedia is not supported
    if (!navigator.mediaDevices?.getUserMedia) {
      // Define error message for unsupported browser
      const errorMessage = 'getUserMedia is not supported in this browser';
      // Emit both request error event
      CamMicPermissionsUtility.emit("CamMic:Request:Both:Error", {
        message: errorMessage,
      });
      // Throw error for unsupported browser
      throw new Error(errorMessage);
    }
    
    // Loop for retry attempts with maximum of 2 attempts
    for (let attempt = 0; attempt < 2; attempt++) {
      // Wrap getUserMedia call in try-catch
      try {
        // Request both camera and microphone stream from media devices
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        // Get count of video tracks in stream
        const videoTracks = stream.getVideoTracks().length;
        // Get count of audio tracks in stream
        const audioTracks = stream.getAudioTracks().length;
        // Log critical stream data
        console.log(
          `[CamMicPermissionsUtility] [requestCameraMicrophone] [CRITICAL] [Data] ${JSON.stringify({
            videoTracks,
            audioTracks,
            attempt: attempt + 1,
          })}`
        );
        // Register the stream for tracking
        this._registerStream(stream);
        // Emit both request success event
        CamMicPermissionsUtility.emit("CamMic:Request:Both:Success", {
          v: videoTracks,
          a: audioTracks,
        });
        // Log completion
        console.log("[CamMicPermissionsUtility] [requestCameraMicrophone] [End] {}");
        // Return the media stream
        return stream;
      } catch (error) {
        // Check if error is permission denied
        const isPermissionDenied = this._isPermissionDeniedError(error);
        
        // Check if should not retry due to permission denial or last attempt
        if (isPermissionDenied || attempt === 1) {
          // Emit both request error event
          CamMicPermissionsUtility.emit("CamMic:Request:Both:Error", {
            message: error?.message || error,
            retried: attempt > 0,
          });
          // Log request error
          console.error(
            `[CamMicPermissionsUtility] [requestCameraMicrophone] [Error] ${JSON.stringify({
              attempt: attempt + 1,
              retried: attempt > 0,
              isPermissionDenied,
              message: error?.message || error,
            })}`
          );
          // Check if permission was denied
          if (isPermissionDenied) {
            // Handle permission denied scenario
            this._handlePermissionDenied("both");
          }
          // Log completion
          console.log("[CamMicPermissionsUtility] [requestCameraMicrophone] [End] {}");
          // Return null to indicate failure
          return null;
        }
        
        // Wait 500 milliseconds before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Return null if all attempts failed
    return null;
  }

  /**
   * Get all available media devices from the system.
   *
   * Enumerates all available camera and microphone devices and returns them as an array.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#getAvailableDevices #TODO
   *
   * @returns {Promise<Array<MediaDeviceInfo>>} Array of available media devices
   */
  static async getAvailableDevices() {
    // Log the start of getting available devices
    console.log("[CamMicPermissionsUtility] [getAvailableDevices] [Start] {}");
    // Check if enumerateDevices is not supported
    if (!navigator.mediaDevices?.enumerateDevices) {
      // Define error message for unsupported browser
      const errorMessage = "enumerateDevices is not supported in this browser";
      // Log error for unsupported browser
      console.error(
        `[CamMicPermissionsUtility] [getAvailableDevices] [Error] ${JSON.stringify({
          message: errorMessage,
        })}`
      );
      // Emit devices error event
      CamMicPermissionsUtility.emit("CamMic:Devices:Error", {
        message: errorMessage,
        reason: "unsupported",
      });
      // Throw error for unsupported browser
      throw new Error(errorMessage);
    }
    // Wrap device enumeration in try-catch
    try {
      // Enumerate all available media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      // Get total count of devices
      const deviceCount = devices.length;
      // Get count of video input devices
      const videoCount = devices.filter(d => d.kind === "videoinput").length;
      // Get count of audio input devices
      const audioCount = devices.filter(d => d.kind === "audioinput").length;
      // Log critical device enumeration data
      console.log(
        `[CamMicPermissionsUtility] [getAvailableDevices] [CRITICAL] [Data] ${JSON.stringify({
          total: deviceCount,
          video: videoCount,
          audio: audioCount,
        })}`
      );
      // Emit devices listed event
      CamMicPermissionsUtility.emit("CamMic:Devices:Listed", {
        count: deviceCount,
      });
      // Log completion
      console.log("[CamMicPermissionsUtility] [getAvailableDevices] [End] {}");
      // Return the array of devices
      return devices;
    } catch (error) {
      // Extract error message or use default
      const errorMessage = error?.message || error || "enumerateDevices failed";
      // Log enumeration error
      console.error(
        `[CamMicPermissionsUtility] [getAvailableDevices] [Error] ${JSON.stringify({
          message: errorMessage,
        })}`
      );
      // Emit devices error event
      CamMicPermissionsUtility.emit("CamMic:Devices:Error", {
        message: errorMessage,
        reason: "enumerateDevices_failed",
      });
      // Throw error for enumeration failure
      throw new Error(errorMessage);
    }
  }

  /**
   * Register a media stream for tracking and cleanup.
   *
   * Adds the stream to active streams set, sets up track listeners, and schedules cleanup timeout.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#_registerStream #TODO
   *
   * @param {MediaStream} stream - The media stream to register
   * @returns {void}
   */
  static _registerStream(stream) {
    // Get total count of tracks in stream
    const trackCount = stream.getTracks().length;
    // Get count of video tracks in stream
    const videoTracks = stream.getVideoTracks().length;
    // Get count of audio tracks in stream
    const audioTracks = stream.getAudioTracks().length;
    // Log stream registration data
    console.log(
      `[CamMicPermissionsUtility] [_registerStream] [Data] ${JSON.stringify({
        trackCount,
        videoTracks,
        audioTracks,
        activeStreamsBefore: CamMicPermissionsUtility._activeStreams.size,
      })}`
    );
    // Add stream to active streams set
    CamMicPermissionsUtility._activeStreams.add(stream);
    // Define onEnd handler function for track ended events
    const onEnd = () => {
      // Remove stream from active streams set
      CamMicPermissionsUtility._activeStreams.delete(stream);
      // Get timeout ID from stream timeouts map
      const timeoutId = CamMicPermissionsUtility._streamTimeouts.get(stream);
      // Check if timeout ID exists
      if (timeoutId) {
        // Clear the timeout
        clearTimeout(timeoutId);
        // Remove timeout ID from stream timeouts map
        CamMicPermissionsUtility._streamTimeouts.delete(stream);
      }
    };
    // Initialize array to store track listeners
    const trackListeners = [];
    // Iterate through all tracks in stream
    stream.getTracks().forEach((track) => {
      // Add ended event listener to track
      track.addEventListener("ended", onEnd, { once: true });
      // Store track and handler in listeners array
      trackListeners.push({ track: track, handler: onEnd });
    });
    // Store track listeners in stream listeners map for cleanup
    CamMicPermissionsUtility._streamListeners.set(stream, trackListeners);
    
    // Define function to schedule cleanup check with timeout
    const scheduleCleanupCheck = () => {
      // Set timeout for cleanup check after 5 minutes
      const timeoutId = setTimeout(() => {
        // Check if tab is currently active
        const isTabActive = !document.hidden && document.visibilityState === 'visible';
        // Log cleanup check data
        console.log(
          `[CamMicPermissionsUtility] [_registerStream] [Data] ${JSON.stringify({
            action: "cleanup_check",
            isTabActive,
            activeStreams: CamMicPermissionsUtility._activeStreams.size,
          })}`
        );
        
        // Check if tab is not active
        if (!isTabActive) {
          // Log tab inactive deferral
          console.log(
            `[CamMicPermissionsUtility] [_registerStream] [Data] ${JSON.stringify({
              action: "tab_inactive_deferring_cleanup",
            })}`
          );
          // Define visibility change handler function
          const onVisibilityChange = () => {
            // Check if tab became visible
            if (!document.hidden && document.visibilityState === 'visible') {
              // Log tab became active
              console.log(
                `[CamMicPermissionsUtility] [_registerStream] [Data] ${JSON.stringify({
                  action: "tab_became_active",
                })}`
              );
              // Remove visibility change listener
              document.removeEventListener('visibilitychange', onVisibilityChange);
              // Check if stream is still in active streams
              if (CamMicPermissionsUtility._activeStreams.has(stream)) {
                // Reschedule cleanup check for active stream
                scheduleCleanupCheck();
              }
            }
          };
          // Add visibility change listener
          document.addEventListener('visibilitychange', onVisibilityChange);
          // Exit early to defer cleanup
          return;
        }
        
        // Check if stream is still in active streams
        if (CamMicPermissionsUtility._activeStreams.has(stream)) {
          // Log stream cleanup timeout warning
          console.warn(
            `[CamMicPermissionsUtility] [_registerStream] [Error] Stream cleanup timeout - forcing cleanup`
          );
          // Unregister the stream
          CamMicPermissionsUtility._unregisterStream(stream);
          // Check if stream has getTracks method
          if (stream.getTracks) {
            // Stop all tracks in stream
            stream.getTracks().forEach((track) => track.stop());
          }
        }
      }, 5 * 60 * 1000);
      // Store timeout ID in stream timeouts map
      CamMicPermissionsUtility._streamTimeouts.set(stream, timeoutId);
    };
    
    // Schedule initial cleanup check
    scheduleCleanupCheck();
  }

  /**
   * Unregister a media stream and clean up associated resources.
   *
   * Removes the stream from active streams, clears timeouts, and removes track listeners.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#_unregisterStream #TODO
   *
   * @param {MediaStream} stream - The media stream to unregister
   * @returns {void}
   */
  static _unregisterStream(stream) {
    // Check if stream is falsy
    if (!stream) {
      // Return early if stream is invalid
      return;
    }
    
    // Log unregister stream data
    console.log(
      `[CamMicPermissionsUtility] [_unregisterStream] [Data] ${JSON.stringify({
        activeStreamsBefore: CamMicPermissionsUtility._activeStreams.size,
      })}`
    );
    // Remove stream from active streams set
    CamMicPermissionsUtility._activeStreams.delete(stream);
    
    // Get timeout ID from stream timeouts map
    const timeoutId = CamMicPermissionsUtility._streamTimeouts.get(stream);
    // Check if timeout ID exists
    if (timeoutId) {
      // Clear the timeout
      clearTimeout(timeoutId);
      // Remove timeout ID from stream timeouts map
      CamMicPermissionsUtility._streamTimeouts.delete(stream);
    }
    
    // Get track listeners from stream listeners map
    const trackListeners = CamMicPermissionsUtility._streamListeners.get(stream);
    // Check if track listeners exist
    if (trackListeners) {
      // Iterate through each track listener
      trackListeners.forEach(({ track, handler }) => {
        // Wrap listener removal in try-catch
        try {
          // Remove ended event listener from track
          track.removeEventListener("ended", handler);
        } catch (error) {
          // Log warning if listener removal fails
          console.warn(
            `[CamMicPermissionsUtility] [_unregisterStream] [Error] ${JSON.stringify({
              message: error?.message || error,
            })}`
          );
        }
      });
      // Remove stream from stream listeners map
      CamMicPermissionsUtility._streamListeners.delete(stream);
    }
  }

  /**
   * Stop all active media streams.
   *
   * Unregisters and stops all active media streams, cleaning up resources and listeners.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#stopStreams #TODO
   *
   * @returns {void}
   */
  static stopStreams() {
    // Get count of active streams
    const activeCount = CamMicPermissionsUtility._activeStreams.size;
    // Log the start of stopping streams
    console.log(
      `[CamMicPermissionsUtility] [stopStreams] [Start] ${JSON.stringify({
        activeCount,
      })}`
    );
    // Check if there are no active streams
    if (activeCount === 0) {
      // Log completion
      console.log("[CamMicPermissionsUtility] [stopStreams] [End] {}");
      // Return early if no streams to stop
      return;
    }
    
    // Convert active streams set to array
    const streams = Array.from(this._activeStreams);
    // Iterate through each stream
    streams.forEach((stream) => {
      // Unregister the stream
      this._unregisterStream(stream);
      // Check if stream has getTracks method
      if (stream.getTracks) {
        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      }
    });
    
    // Clear all streams from active streams set
    this._activeStreams.clear();
    // Emit streams stopped event
    CamMicPermissionsUtility.emit("CamMic:Streams:Stopped");
    // Log completion
    console.log("[CamMicPermissionsUtility] [stopStreams] [End] {}");
  }

  /**
   * Start camera preview on the video element with the specified device ID.
   *
   * Validates the device, requests camera stream, and displays it on the preview video element.
   *
   * @author Linden May
   * @version 1.0.0
   * @since -
   * @updated -
   * @link https://docs.example.com/CamMicPermissionsUtility#startCameraPreview #TODO
   *
   * @param {string} deviceId - The device ID of the camera to use for preview
   * @returns {Promise<boolean>} True if preview started successfully
   */
  static async startCameraPreview(deviceId) {
    // Log the start of camera preview
    console.log(
      `[CamMicPermissionsUtility] [startCameraPreview] [Start] ${JSON.stringify({
        deviceId,
      })}`
    );
    // Query for video preview element
    const videoElement = document.querySelector(
      '[data-cam-mic-element="video-preview"]'
    );
    // Check if video element is missing
    if (!videoElement) {
      // Throw error if video element not found
      throw new Error('Missing required video preview element: [data-cam-mic-element="video-preview"]');
    }
    // Check if getUserMedia is not supported
    if (!navigator.mediaDevices?.getUserMedia) {
      // Throw error if getUserMedia not supported
      throw new Error('getUserMedia is not supported in this browser');
    }
    // Check if device ID is missing
    if (!deviceId) {
      // Throw error if device ID not provided
      throw new Error('Device ID is required for camera preview');
    }
    
    // Check if video element is connected to DOM
    if (!videoElement.isConnected) {
      // Throw error if element not connected
      throw new Error('Video preview element is not connected to DOM');
    }
    
    // Log device validation start
    console.log(
      `[CamMicPermissionsUtility] [startCameraPreview] [Data] ${JSON.stringify({
        deviceId,
        action: "validating_device",
      })}`
    );
    // Wrap device validation in try-catch
    try {
      // Enumerate all available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      // Filter devices to get only video input devices
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      // Check if device ID exists in available devices
      const deviceExists = videoDevices.some((device) => device.deviceId === deviceId);
      // Log device validation results
      console.log(
        `[CamMicPermissionsUtility] [startCameraPreview] [Data] ${JSON.stringify({
          deviceId,
          deviceExists,
          availableVideoDevices: videoDevices.length,
        })}`
      );
      
      // Check if device does not exist
      if (!deviceExists) {
        // Define error message for invalid device
        const errorMessage = `Device ID no longer valid - device may have been disconnected: ${deviceId}`;
        // Log device validation error
        console.error(
          `[CamMicPermissionsUtility] [startCameraPreview] [Error] ${JSON.stringify({
            deviceId,
            availableDevices: videoDevices.length,
            message: errorMessage,
          })}`
        );
        // Emit preview error event
        CamMicPermissionsUtility.emit("CamMic:Preview:Error", {
          deviceId,
          message: errorMessage,
        });
        // Throw error for invalid device
        throw new Error(errorMessage);
      }
    } catch (enumError) {
      // Log enumeration error but continue
      console.error(
        `[CamMicPermissionsUtility] [startCameraPreview] [Error] ${JSON.stringify({
          deviceId,
          message: enumError?.message || enumError,
        })}`
      );
    }
    
    // Wrap preview logic in try-catch
    try {
      // Get previous stream from video element
      const previousStream = videoElement.srcObject;
      // Log previous stream status
      console.log(
        `[CamMicPermissionsUtility] [startCameraPreview] [Data] ${JSON.stringify({
          deviceId,
          hasPreviousStream: !!previousStream,
        })}`
      );
      // Check if previous stream exists
      if (previousStream && previousStream.getTracks) {
        // Unregister previous stream
        this._unregisterStream(previousStream);
        // Stop all tracks in previous stream
        previousStream.getTracks().forEach((track) => track.stop());
      }
      // Log stream request start
      console.log(
        `[CamMicPermissionsUtility] [startCameraPreview] [Data] ${JSON.stringify({
          deviceId,
          action: "requesting_stream",
        })}`
      );
      // Request camera stream with exact device ID
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
      // Log stream track count
      console.log(
        `[CamMicPermissionsUtility] [startCameraPreview] [Data] ${JSON.stringify({
          deviceId,
          trackCount: stream.getVideoTracks().length,
        })}`
      );
      // Pause video element to cancel any pending play() calls
      videoElement.pause();
      // Wait briefly to ensure pending operations are cancelled
      await new Promise(resolve => setTimeout(resolve, 50));
      // Set stream as source object for video element
      videoElement.srcObject = stream;
      // Register the stream for tracking
      this._registerStream(stream);
      // Check if video element is still connected
      if (!videoElement.isConnected) {
        // Define error message for disconnected element
        const errorMessage = 'Video element disconnected before playback';
        // Log disconnected element error
        console.error(
          `[CamMicPermissionsUtility] [startCameraPreview] [Error] ${JSON.stringify({
            deviceId,
            message: errorMessage,
          })}`
        );
        // Stop all tracks in stream
        stream.getTracks().forEach((track) => track.stop());
        // Throw error for disconnected element
        throw new Error(errorMessage);
      }
      // Wait for video element to load stream data
      await new Promise((resolve, reject) => {
        let timeoutId;
        // Cleanup function to remove listeners and timeout
        const cleanup = () => {
          videoElement.removeEventListener('loadeddata', onLoadedData);
          videoElement.removeEventListener('error', onError);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        };
        // Handler for loadeddata event
        const onLoadedData = () => {
          cleanup();
          resolve();
        };
        // Handler for error event
        const onError = () => {
          cleanup();
          reject(new Error('Video element failed to load stream'));
        };
        // Register event listeners
        videoElement.addEventListener('loadeddata', onLoadedData, { once: true });
        videoElement.addEventListener('error', onError, { once: true });
        // Check if already has data loaded
        if (videoElement.readyState >= 2) {
          cleanup();
          resolve();
          return;
        }
        // Set timeout to prevent hanging
        timeoutId = setTimeout(() => {
          cleanup();
          resolve();
        }, 2000);
      });
      // Attempt to play video element
      await videoElement.play().catch((playError) => {
        // Log play error but ignore interruption errors
        if (playError?.message && !playError.message.includes('interrupted')) {
          console.error(
            `[CamMicPermissionsUtility] [startCameraPreview] [Error] ${JSON.stringify({
              deviceId,
              message: playError?.message || playError,
            })}`
          );
        }
      });
      
      // Log critical preview started status
      console.log(
        `[CamMicPermissionsUtility] [startCameraPreview] [CRITICAL] [Data] ${JSON.stringify({
          deviceId,
          status: "preview_started",
        })}`
      );
      // Emit preview started event
      CamMicPermissionsUtility.emit("CamMic:Preview:Started", { deviceId });
      // Log completion
      console.log("[CamMicPermissionsUtility] [startCameraPreview] [End] {}");
      // Return true to indicate success
      return true;
    } catch (previewError) {
      // Extract error message or use default
      const errorMessage = previewError?.message || previewError || 'Unknown error during camera preview';
      // Log preview error
      console.error(
        `[CamMicPermissionsUtility] [startCameraPreview] [Error] ${JSON.stringify({
          deviceId,
          message: errorMessage,
        })}`
      );
      // Emit preview error event
      CamMicPermissionsUtility.emit("CamMic:Preview:Error", {
        deviceId,
        message: errorMessage,
      });
      // Re-throw the error
      throw previewError;
    }
  }
}
