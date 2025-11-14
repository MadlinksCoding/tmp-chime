// vueComponentBottomCenterControls.js
(function (global) {
  function register(app) {
    app.component('bottom-center-controls', {
      props: {
        toggleCamera: { type: Function, required: false },
        toggleMicrophone: { type: Function, required: false },
        chimeCallSettings: { type: Object, required: false },
      },
      template: `
      <camera-button :enabled="chimeCallSettings.callCamStatus" @toggle="toggleCamera" />
      <microphone-button
        :enabled="chimeCallSettings.callMicStatus"
        @toggle="toggleMicrophone"
      />
      <toggle-screensize @toggle="handleToggleFullscreen"></toggle-screensize>

      `
    });
  }
  global.registerBottomCenterControls = register;
})(window);
