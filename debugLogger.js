/* ========================================================================
 * debugLogger.js
 * Centralized debug logging system that replaces alerts
 * Shows all socket communication and events in a scrollable UI
 * ======================================================================== */

class DebugLogger {
  static _logContainer = null;
  static _maxLogs = 100;
  static _logs = [];
  static _currentState = "unknown";

  /* ====================================================================
   * Initialize the debug logger UI
   * ==================================================================== */
  static init() {
    console.log("[DebugLogger] Initializing...");
    const logContainer = document.getElementById("debug-log-output");

    if (!logContainer) {
      console.warn(
        "[DebugLogger] #debug-log-output not found. Deferring init."
      );
      document.addEventListener("DOMContentLoaded", () => this.init());
      return;
    }

    this._logContainer = logContainer;

    // Log initialization
    this.addLog("initialize", "NOTICE", "DebugLogger.init", "Logger Initialized");

    console.log("[DebugLogger] ✅ Initialized");
  }

  /* ====================================================================
   * Add a log entry
   * ==================================================================== */
  static addLog(flow, severity, method, message, data = null) {
    if (!this._logContainer) {
      // Buffer logs if container isn't ready yet
      setTimeout(() => this.addLog(flow, severity, method, message, data), 100);
      return;
    }

    const timestamp = new Date()
      .toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      })
      .replace("24:", "00:"); // Fix for midnight bug in some browsers

    // Main log element
    const logEl = document.createElement("div");
    logEl.style.color = this._getFlowColor(flow);
    logEl.style.marginBottom = "5px";
    logEl.style.borderLeft = `3px solid ${this._getFlowColor(flow)}`;
    logEl.style.paddingLeft = "5px";

    // Content of the log
    let content = `[${timestamp}] [${flow.toUpperCase()}]`;

    if (severity === "CRITICAL") {
      content += ` <strong style="color: #ff0000;">[${severity}]</strong>`;
    } else {
      content += ` [${severity}]`;
    }

    content += ` [${method}] → ${message}`;
    logEl.innerHTML = content;

    // Optional data element
    if (data) {
      const dataEl = document.createElement("pre");
      dataEl.style.cssText = `
        margin: 4px 0 0 15px;
        padding: 4px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
        font-size: 11px;
        color: #0ff;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;
      dataEl.textContent = this._formatData(data);
      logEl.appendChild(dataEl);
    }

    this._logContainer.appendChild(logEl);
    this._logContainer.scrollTop = this._logContainer.scrollHeight; // Auto-scroll

    // Also log to console
    console.log(
      `[${flow.toUpperCase()}][${severity}][${method}]`,
      message,
      data || ""
    );
  }

  /* ====================================================================
   * Helper: Get color for log type
   * ==================================================================== */
  static _getFlowColor(flow) {
    const colors = {
      ready: "#aaa",
      initialize: "#00aaff",
      calling: "#ffa500",
      "receiving call": "#ff00ff",
      rejected: "#ff4444",
      declined: "#ff8888",
      terminated: "#ff0000",
      "accepted call": "#aaffaa",
      setuping: "#ffff00",
      connecting: "#00ffff",
      connected: "#00ff00",
      joined: "#aaffff",
      default: "#ffffff",
    };
    return colors[flow] || colors.default;
  }

  /* ====================================================================
   * Helper: Format data for display
   * ==================================================================== */
  static _formatData(data) {
    if (typeof data === "string") return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  }

  /* ====================================================================
   * Replace window.alert with debug logger
   * ==================================================================== */
  static hijackAlerts() {
    window.alert = (message) => {
      this.addLog("-", "CRITICAL", "window.alert", String(message));
    };
    console.log("[DebugLogger] ✅ alert() hijacked");
  }
}

console.log("[debugLogger.js] Class loaded");

