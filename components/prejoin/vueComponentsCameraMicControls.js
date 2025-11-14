(function (global) {
  function register(app) {
    app.component('camera-mic-controls', {
      props: {
        toggleCamera: { type: Function, required: false },
        toggleMicrophone: { type: Function, required: false },
        chimeCallSettings: { type: Object, required: false },
      },
      template: `
      <camera-button :enabled="chimeCallSettings.callCamStatus" @toggle="toggleCamera" />
      <settings-trigger @toggle="onToggleSettings"></settings-trigger>
      <microphone-button
        :enabled="chimeCallSettings.callMicStatus"
        @toggle="toggleMicrophone"
      />
  `
    });
  }
  global.registerCameraMicControls = register;
})(window);
