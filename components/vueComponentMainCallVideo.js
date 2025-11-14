// vueComponentMainCallVideo.js
(function (global) {
  function register(app) {
    app.component("main-call-video", {
      template: `
        <div data-attribute="tile_feed" class="w-full h-screen">
          <video class="w-full h-full rounded-2 fit-cover" autoplay playsinline></video>
        </div>
      `
    });
  }

  global.registerMainCallVideo = register;
})(window);
