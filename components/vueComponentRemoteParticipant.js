// vueComponentRemoteParticipant.js
(function (global) {
  function register(app) {
    app.component("remote-participant", {
      template: `
        <div
          class="absolute flex right-[8px] lg:bottom-[100px] sm:bottom-20 bottom-[100px] border border-solid border-whit rounded-card-sm lg:h-[156px] h-[120px] lg:w-[277px] w-[69px] flex justify-center items-center">
          <video
            data-main-video
            autoplay
            playsinline
            class="absolute w-full h-full object-cover rounded-md">
          </video>
        </div>
      `
    });
  }

  // Expose as global installer
  global.registerRemoteParticipant = register;
})(window);
