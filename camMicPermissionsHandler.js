/* ========================================================================
 * camMicPermissionsHandle Final.js
 * UPDATE (per your asks):
 * - ONE UI handler method INSIDE CamMicPermissionsHandler: ui(ev)
 * - Start-video-preview button: dispatches + starts preview for selected camera
 * - Remember selected devices in localStorage (persist across reloads)
 * - On permission denied: Utility ONLY emits; Handler shows banner, then alerts, then reloads (with a short delay so UI paints)
 * - Console logs/emits retained. No removals.
 * ======================================================================== */

/* ==============================
 * CamMicPermissionsUtility
 * ============================== */
class CamMicPermissionsUtility {
  static _activeStreams = new Set();

  static emit(eventName, detail = {}, target = window) {
    console.log(
      `[CamMicPermissionsUtility] [emit] [Start] ${JSON.stringify({
        eventName,
        hasDetail: !!detail,
      })}`
    );
    if (!eventName || !target?.dispatchEvent) return false;
    try {
      target.dispatchEvent(
        new CustomEvent(eventName, {
          detail,
          bubbles: false,
          cancelable: false,
        })
      );
      console.log(
        `[CamMicPermissionsUtility] [emit] [End] ${JSON.stringify({
          eventName,
        })}`
      );
      return true;
    } catch (error) {
      console.error(
        `[CamMicPermissionsUtility] [emit] [Error] ${JSON.stringify({
          message: error?.message || error,
        })}`
      );
      return false;
    }
  }

  // ---- PREFERENCES (localStorage) ----
  static setPreferredDevice(kind, deviceId) {
    console.log(
      `[CamMicPermissionsUtility] [setPreferredDevice] ${JSON.stringify({
        kind,
        deviceId,
      })}`
    );
    try {
      localStorage.setItem(`CamMicPreferred-${kind}`, deviceId || "");
    } catch {}
    CamMicPermissionsUtility.emit("CamMic:Preferred:Set", { kind, deviceId });
  }

  static getPreferredDevice(kind) {
    let id = null;
    try {
      id = localStorage.getItem(`CamMicPreferred-${kind}`) || null;
    } catch {}
    console.log(
      `[CamMicPermissionsUtility] [getPreferredDevice] ${JSON.stringify({
        kind,
        id,
      })}`
    );
    return id;
  }

  // ---- PERMISSIONS ----
  static async getPermission(deviceKind) {
    console.log(
      `[CamMicPermissionsUtility] [getPermission] [Start] ${JSON.stringify({
        deviceKind,
      })}`
    );
    if (!navigator.permissions) return "unsupported";
    try {
      const status = await navigator.permissions.query({ name: deviceKind });
      return status.state; // granted | denied | prompt
    } catch {
      return "error";
    }
  }

  static async checkPermissions() {
    console.log("[CamMicPermissionsUtility] [checkPermissions] [Start] {}");
    CamMicPermissionsUtility.emit("CamMic:Permissions:BeforeCheck");
    const camera = await this.getPermission("camera");
    const microphone = await this.getPermission("microphone");
    const result = { camera, microphone };
    CamMicPermissionsUtility.emit("CamMic:Permissions:Checked", result);
    console.log(
      `[CamMicPermissionsUtility] [checkPermissions] [End] ${JSON.stringify(
        result
      )}`
    );
    return result;
  }

  static async watchPermissionChanges(callback) {
    console.log(
      "[CamMicPermissionsUtility] [watchPermissionChanges] [Start] {}"
    );
    if (!navigator.permissions) return () => {};
    const kinds = ["camera", "microphone"];
    const unbinders = [];
    for (const type of kinds) {
      try {
        const status = await navigator.permissions.query({ name: type });
        const onchange = () => {
          CamMicPermissionsUtility.emit("CamMic:Permissions:Changed", {
            type,
            state: status.state,
          });
          if (typeof callback === "function") callback(type, status.state);
        };
        status.onchange = onchange;
        unbinders.push(() => {
          try {
            status.onchange = null;
          } catch {}
        });
      } catch {}
    }
    console.log("[CamMicPermissionsUtility] [watchPermissionChanges] [End] {}");
    return () => unbinders.forEach((u) => u());
  }

  // ---- DENIED HANDLING (emit only; Handler will show UI + alert + reload) ----
  static _isPermissionDeniedError(err) {
    const msg = (err?.message || `${err || ""}`).toLowerCase();
    const name = (err?.name || "").toLowerCase();
    return (
      msg.includes("denied") ||
      name === "notallowederror" ||
      name === "securityerror"
    );
  }

  static _handlePermissionDenied(context) {
    console.warn(
      `[CamMicPermissionsUtility] [_handlePermissionDenied] ${JSON.stringify({
        context,
      })}`
    );
    CamMicPermissionsUtility.emit("CamMic:Page:ReloadRequired", {
      context,
      message: "Permission denied",
    });
    // DO NOT alert or reload here — let the Handler.ui paint the banner first,
    // then alert + reload with a short delay (so the UI is visible before blocking alert).
  }

  // ---- REQUESTS ----
  static async requestCamera() {
    console.log("[CamMicPermissionsUtility] [requestCamera] [Start] {}");
    CamMicPermissionsUtility.emit("CamMic:Request:Camera:Start");
    if (!navigator.mediaDevices?.getUserMedia) {
      CamMicPermissionsUtility.emit("CamMic:Request:Camera:Error", {
        message: "getUserMedia unsupported",
      });
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this._registerStream(stream);
      CamMicPermissionsUtility.emit("CamMic:Request:Camera:Success", {
        tracks: stream.getVideoTracks().length,
      });
      return stream;
    } catch (error) {
      CamMicPermissionsUtility.emit("CamMic:Request:Camera:Error", {
        message: error?.message || error,
      });
      console.error(
        `[CamMicPermissionsUtility] [requestCamera] [Error] ${JSON.stringify({
          message: error?.message || error,
        })}`
      );
      if (this._isPermissionDeniedError(error))
        this._handlePermissionDenied("camera");
      return null;
    }
  }

  static async requestMicrophone() {
    console.log("[CamMicPermissionsUtility] [requestMicrophone] [Start] {}");
    CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Start");
    if (!navigator.mediaDevices?.getUserMedia) {
      CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Error", {
        message: "getUserMedia unsupported",
      });
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._registerStream(stream);
      CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Success", {
        tracks: stream.getAudioTracks().length,
      });
      return stream;
    } catch (error) {
      CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Error", {
        message: error?.message || error,
      });
      console.error(
        `[CamMicPermissionsUtility] [requestMicrophone] [Error] ${JSON.stringify(
          { message: error?.message || error }
        )}`
      );
      if (this._isPermissionDeniedError(error))
        this._handlePermissionDenied("microphone");
      return null;
    }
  }

  static async requestCameraMicrophone() {
    console.log(
      "[CamMicPermissionsUtility] [requestCameraMicrophone] [Start] {}"
    );
    CamMicPermissionsUtility.emit("CamMic:Request:Both:Start");
    if (!navigator.mediaDevices?.getUserMedia) {
      CamMicPermissionsUtility.emit("CamMic:Request:Both:Error", {
        message: "getUserMedia unsupported",
      });
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this._registerStream(stream);
      CamMicPermissionsUtility.emit("CamMic:Request:Both:Success", {
        v: stream.getVideoTracks().length,
        a: stream.getAudioTracks().length,
      });
      return stream;
    } catch (error) {
      CamMicPermissionsUtility.emit("CamMic:Request:Both:Error", {
        message: error?.message || error,
      });
      console.error(
        `[CamMicPermissionsUtility] [requestCameraMicrophone] [Error] ${JSON.stringify(
          { message: error?.message || error }
        )}`
      );
      if (this._isPermissionDeniedError(error))
        this._handlePermissionDenied("both");
      return null;
    }
  }

  // ---- DEVICES / STREAMS ----
  static async getAvailableDevices() {
    console.log("[CamMicPermissionsUtility] [getAvailableDevices] [Start] {}");
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      CamMicPermissionsUtility.emit("CamMic:Devices:Listed", {
        count: devices.length,
      });
      return devices;
    } catch {
      CamMicPermissionsUtility.emit("CamMic:Devices:Error");
      return [];
    }
  }

  static _registerStream(stream) {
    CamMicPermissionsUtility._activeStreams.add(stream);
    const onEnd = () => CamMicPermissionsUtility._activeStreams.delete(stream);
    stream
      .getTracks()
      .forEach((t) => t.addEventListener("ended", onEnd, { once: true }));
  }

  static stopStreams() {
    console.log(
      `[CamMicPermissionsUtility] [stopStreams] [Start] ${JSON.stringify({
        active: CamMicPermissionsUtility._activeStreams.size,
      })}`
    );
    if (this._activeStreams.size === 0) return;
    this._activeStreams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    this._activeStreams.clear();
    CamMicPermissionsUtility.emit("CamMic:Streams:Stopped");
    console.log(
      '[CamMicPermissionsUtility] [stopStreams] [End] { result: "stopped_all" }'
    );
  }

  static async startCameraPreview(deviceId) {
    console.log(
      `[CamMicPermissionsUtility] [startCameraPreview] ${JSON.stringify({
        deviceId,
      })}`
    );
    const videoEl = document.querySelector(
      '[data-cam-mic-element="video-preview"]'
    );
    if (!videoEl || !navigator.mediaDevices?.getUserMedia || !deviceId)
      return false;
    try {
      const prev = videoEl.srcObject;
      if (prev?.getTracks) prev.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
      videoEl.srcObject = stream;
      this._registerStream(stream);
      await videoEl.play().catch(() => {});
      CamMicPermissionsUtility.emit("CamMic:Preview:Started", { deviceId });
      return true;
    } catch (e) {
      CamMicPermissionsUtility.emit("CamMic:Preview:Error", {
        deviceId,
        message: e?.message || e,
      });
      return false;
    }
  }
}

/* =====================================
 * CamMicPermissionsHandler
 * ===================================== */
class CamMicPermissionsHandler {
  static _ui = {};
  static _unbindPermissionWatch = null;
  static _isWatching = false;

  static _qs(sel) {
    return document.querySelector(sel);
  }
  static _show(el) {
    if (el) el.hidden = false;
  }
  static _hide(el) {
    if (el) el.hidden = true;
  }

  static _cacheUI() {
    console.log(`[CamMicPermissionsHandler] [_cacheUI] [Start] {}`);
    const map = {
      loader: '[data-cam-mic-element="loader"]',
      permissionIcons: '[data-cam-mic-element="permission-icons"]',
      needCamera: '[data-cam-mic-element="need-camera"]',
      needMicrophone: '[data-cam-mic-element="need-microphone"]',
      deviceSelect: '[data-cam-mic-element="device-select"]',
      videoSelect: '[data-cam-mic-element="video-select"]',
      audioSelect: '[data-cam-mic-element="audio-select"]',
      selectedCameraLabel: '[data-cam-mic-element="selected-camera-label"]',
      selectedMicrophoneLabel:
        '[data-cam-mic-element="selected-microphone-label"]',
      videoPreview: '[data-cam-mic-element="video-preview"]',
      waiting: '[data-cam-mic-element="waiting"]',
      statusWrap: '[data-cam-mic-element="status"]',
      statusCamera: '[data-cam-mic-element="status-camera"]',
      statusMicrophone: '[data-cam-mic-element="status-microphone"]',
      statusItemCamera:
        '[data-cam-mic-element="status-item"][data-kind="camera"]',
      statusItemMicrophone:
        '[data-cam-mic-element="status-item"][data-kind="microphone"]',
      reloadRequired: '[data-cam-mic-element="reload-required"]',
    };
    Object.entries(map).forEach(
      ([k, sel]) => (this._ui[k] = this._qs(sel) || null)
    );
    console.log(
      `[CamMicPermissionsHandler] [_cacheUI] [End] ${JSON.stringify({
        keys: Object.keys(map).length,
      })}`
    );
  }

  // ---- ONE UI HANDLER METHOD ----
  static ui(ev) {
    const u = this._ui;
    const setStatus = (item, text, state) => {
      item && item.setAttribute("data-state", state || "");
      text && (text.textContent = state || "");
    };

    switch (ev.type) {
      case "CamMic:Permissions:BeforeCheck":
        console.log(`[CamMicPermissionsHandler] [ui] BeforeCheck {}`);
        this._show(u.waiting);
        this._show(u.statusWrap);
        this._hide(u.permissionIcons);
        this._hide(u.needCamera);
        this._hide(u.needMicrophone);
        this._show(u.loader);
        break;

      case "CamMic:Permissions:Checked": {
        const camera = ev.detail?.camera ?? "error";
        const microphone = ev.detail?.microphone ?? "error";
        console.log(
          `[CamMicPermissionsHandler] [ui] Checked ${JSON.stringify({
            camera,
            microphone,
          })}`
        );

        this._hide(u.loader);
        this._hide(u.waiting);
        this._show(u.statusWrap);

        setStatus(u.statusItemCamera, u.statusCamera, camera);
        setStatus(u.statusItemMicrophone, u.statusMicrophone, microphone);

        const needCam = camera !== "granted";
        const needMic = microphone !== "granted";

        if (u.permissionIcons) u.permissionIcons.hidden = !(needCam || needMic);
        if (u.needCamera) u.needCamera.hidden = !needCam;
        if (u.needMicrophone) u.needMicrophone.hidden = !needMic;

        // Populate device selects when at least one granted (no auto preview)
        const mode =
          !needCam && !needMic
            ? "both"
            : !needCam
            ? "camera"
            : !needMic
            ? "microphone"
            : null;
        if (mode) this._populateDeviceSelects(mode);

        // === Bridge to Vue state: show/hide permission screen ===
        try {
          const requiresCamera = (window.callMode !== "audioOnlyCall");
          const requiresMic = true; // mic always needed for calls
          const missingNeededCam = requiresCamera && needCam;
          const missingNeededMic = requiresMic && needMic;
          const shouldShow = missingNeededCam || missingNeededMic;
          if (shouldShow) {
            const detail = { state: "waitingForCamMicPermissions", substate: "", ts: Date.now() };
            document.dispatchEvent(new CustomEvent("chime-ui::state", { detail }));
          }
        } catch (_) {}
        break;
      }

      case "CamMic:Permissions:Changed":
        console.log(
          `[CamMicPermissionsHandler] [ui] Changed ${JSON.stringify(
            ev.detail || {}
          )}`
        );
        this._show(u.waiting);
        break;

      // Request lifecycle: waiting; on finish -> re-check to finalize via :Checked
      case "CamMic:Request:Camera:Start":
      case "CamMic:Request:Microphone:Start":
      case "CamMic:Request:Both:Start":
        console.log(`[CamMicPermissionsHandler] [ui] RequestStart ${ev.type}`);
        this._show(u.waiting);
        this._show(u.statusWrap);
        this._show(u.loader);
        this._hide(u.permissionIcons);
        this._hide(u.needCamera);
        this._hide(u.needMicrophone);
        break;

      case "CamMic:Request:Camera:Success":
      case "CamMic:Request:Microphone:Success":
      case "CamMic:Request:Both:Success":
      case "CamMic:Request:Camera:Error":
      case "CamMic:Request:Microphone:Error":
      case "CamMic:Request:Both:Error":
        console.log(
          `[CamMicPermissionsHandler] [ui] RequestDone ${ev.type} -> re-check`
        );
        this._hide(u.loader);
        CamMicPermissionsUtility.emit("CamMic:Permissions:Check");
        break;

      // ---- Show reload banner, then alert + reload (allow paint first) ----
      case "CamMic:Page:ReloadRequired":
        console.log(
          `[CamMicPermissionsHandler] [ui] ReloadRequired ${JSON.stringify(
            ev.detail || {}
          )}`
        );
        this._hide(u.loader);
        this._hide(u.waiting);
        this._show(u.reloadRequired);
        // Let the banner paint, then block with alert, then reload.
        requestAnimationFrame(() => {
          setTimeout(() => {
            DebugLogger.addLog(
              "terminated",
              "CRITICAL",
              "ui:ReloadRequired",
              "Camera/Microphone permissions were denied. The page will reload. Please allow permissions on reload."
            );
            try {
              window.location.reload();
            } catch {}
          }, 80);
        });
        break;
    }
  }

  // ---- Populate selects with preference restore + save on change (NO auto preview) ----
  static async _populateDeviceSelects(mode) {
    const u = this._ui;
    const devices = await CamMicPermissionsUtility.getAvailableDevices();
    if (u.deviceSelect) this._show(u.deviceSelect);

    // Camera
    if (u.videoSelect && (mode === "camera" || mode === "both")) {
      const prefCam = CamMicPermissionsUtility.getPreferredDevice("camera");
      u.videoSelect.innerHTML = "";
      const vids = devices.filter((d) => d.kind === "videoinput");
      vids.forEach((d) => {
        const o = document.createElement("option");
        o.value = d.deviceId;
        o.text = d.label || "Unnamed camera";
        if (prefCam && d.deviceId === prefCam) o.selected = true;
        u.videoSelect.appendChild(o);
      });
      // Apply label
      const currentCamId = u.videoSelect.value || vids[0]?.deviceId || "";
      const currentCamLabel =
        vids.find((v) => v.deviceId === currentCamId)?.label ||
        vids[0]?.label ||
        "(camera)";
      if (u.selectedCameraLabel)
        u.selectedCameraLabel.textContent = currentCamLabel;
      // Persist on change
      u.videoSelect.onchange = () => {
        const id = u.videoSelect.value;
        CamMicPermissionsUtility.setPreferredDevice("camera", id);
        const label = vids.find((v) => v.deviceId === id)?.label || "(camera)";
        if (u.selectedCameraLabel) u.selectedCameraLabel.textContent = label;
      };
    }

    // Microphone
    if (u.audioSelect && (mode === "microphone" || mode === "both")) {
      const prefMic = CamMicPermissionsUtility.getPreferredDevice("microphone");
      u.audioSelect.innerHTML = "";
      const mics = devices.filter((d) => d.kind === "audioinput");
      mics.forEach((d) => {
        const o = document.createElement("option");
        o.value = d.deviceId;
        o.text = d.label || "Unnamed mic";
        if (prefMic && d.deviceId === prefMic) o.selected = true;
        u.audioSelect.appendChild(o);
      });
      // Apply label
      const currentMicId = u.audioSelect.value || mics[0]?.deviceId || "";
      const currentMicLabel =
        mics.find((m) => m.deviceId === currentMicId)?.label ||
        mics[0]?.label ||
        "(microphone)";
      if (u.selectedMicrophoneLabel)
        u.selectedMicrophoneLabel.textContent = currentMicLabel;
      // Persist on change
      u.audioSelect.onchange = () => {
        const id = u.audioSelect.value;
        CamMicPermissionsUtility.setPreferredDevice("microphone", id);
        const label =
          mics.find((m) => m.deviceId === id)?.label || "(microphone)";
        if (u.selectedMicrophoneLabel)
          u.selectedMicrophoneLabel.textContent = label;
      };
    }
  }

  // ---- Init, events, delegated clicks ----
  static init() {
    console.log(`[CamMicPermissionsHandler] [init] [Start] {}`);
    this._cacheUI();
    this._wireDelegatedClicks();
    this._wireEvents();
    console.log(`[CamMicPermissionsHandler] [init] [End] {}`);
  }

  static _getAction(el) {
    return (
      el
        ?.closest?.("[data-cam-mic-action]")
        ?.getAttribute("data-cam-mic-action") || null
    );
  }

  static _wireDelegatedClicks() {
    console.log(`[CamMicPermissionsHandler] [_wireDelegatedClicks] [Start] {}`);
    document.addEventListener("click", (e) => {
      const action = this._getAction(e.target);
      if (!action) return;
      console.log(
        `[CamMicPermissionsHandler] [DelegatedClick] ${JSON.stringify({
          action,
        })}`
      );

      switch (action) {
        case "check-permissions":
          CamMicPermissionsUtility.emit("CamMic:Permissions:BeforeCheck");
          CamMicPermissionsUtility.emit("CamMic:Permissions:Check");
          break;

        case "watch-permissions":
          this.startWatchingPermissions();
          break;
        case "watch-permissions-stop":
          this.stopWatchingPermissions();
          break;

        case "request-camera":
          CamMicPermissionsUtility.emit("CamMic:Request:Camera:Start");
          CamMicPermissionsUtility.emit("CamMic:Request:Camera");
          break;

        case "request-microphone":
          CamMicPermissionsUtility.emit("CamMic:Request:Microphone:Start");
          CamMicPermissionsUtility.emit("CamMic:Request:Microphone");
          break;

        case "request-camera-microphone":
          CamMicPermissionsUtility.emit("CamMic:Request:Both:Start");
          CamMicPermissionsUtility.emit("CamMic:Request:Both");
          break;

        case "list-devices":
          this._populateDeviceSelects("both");
          break;

        case "stop-streams":
          CamMicPermissionsUtility.emit("CamMic:Streams:Stop");
          CamMicPermissionsUtility.stopStreams();
          break;

        case "start-video-preview": {
          const id = this._ui.videoSelect?.value || null;
          CamMicPermissionsUtility.emit("CamMic:Preview:Start", {
            cameraId: id,
          });
          if (id) CamMicPermissionsUtility.startCameraPreview(id);
          break;
        }
      }
    });
    console.log(`[CamMicPermissionsHandler] [_wireDelegatedClicks] [End] {}`);
  }

  static _wireEvents() {
    console.log(`[CamMicPermissionsHandler] [_wireEvents] [Start] {}`);

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
    ].forEach((evt) =>
      window.addEventListener(evt, (ev) => CamMicPermissionsHandler.ui(ev))
    );

    // Fallback core actions (if external core doesn’t handle these)
    window.addEventListener("CamMic:Permissions:Check", () =>
      CamMicPermissionsUtility.checkPermissions()
    );
    window.addEventListener("CamMic:Request:Camera", () =>
      CamMicPermissionsUtility.requestCamera()
    );
    window.addEventListener("CamMic:Request:Microphone", () =>
      CamMicPermissionsUtility.requestMicrophone()
    );
    window.addEventListener("CamMic:Request:Both", () =>
      CamMicPermissionsUtility.requestCameraMicrophone()
    );
    window.addEventListener("CamMic:Streams:Stop", () =>
      CamMicPermissionsUtility.stopStreams()
    );

    // Watch toggles
    window.addEventListener("CamMic:Permissions:WatchStart", () =>
      this.startWatchingPermissions()
    );
    window.addEventListener("CamMic:Permissions:WatchStop", () =>
      this.stopWatchingPermissions()
    );

    console.log(`[CamMicPermissionsHandler] [_wireEvents] [End] {}`);
  }

  static async startWatchingPermissions() {
    if (this._isWatching) return;
    this._isWatching = true;
    this._unbindPermissionWatch =
      await CamMicPermissionsUtility.watchPermissionChanges(async () => {
        CamMicPermissionsUtility.emit("CamMic:Permissions:Check");
      });
    CamMicPermissionsUtility.emit("CamMic:Permissions:WatchStarted");
  }

  static stopWatchingPermissions() {
    if (typeof this._unbindPermissionWatch === "function") {
      try {
        this._unbindPermissionWatch();
      } catch {}
    }
    this._unbindPermissionWatch = null;
    this._isWatching = false;
    CamMicPermissionsUtility.emit("CamMic:Permissions:WatchStopped");
  }
}

/* ==============================
 * Boot
 * ============================== */
if (
  typeof CamMicPermissionsUtility === "function" &&
  typeof CamMicPermissionsHandler === "function"
) {
  window.addEventListener("DOMContentLoaded", () => {
    console.log(`[Boot] [DOMContentLoaded] {}`);
    CamMicPermissionsHandler.init();
  });
} else {
  console.error(
    `[Boot] [Error] ${JSON.stringify({
      message: "CamMicPermissionsUtility or CamMicPermissionsHandler not found",
    })}`
  );
}
