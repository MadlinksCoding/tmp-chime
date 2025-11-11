// vueComponentCamMicPermissions.js
(function() {
  const { defineComponent } = Vue;

  const TemplateCamMicPermissions = defineComponent({
    name: "TemplateCamMicPermissions",
    template: `
      <div class="w-full h-screen relative bg-cover bg-center bg-no-repeat bg-black/50 backdrop-blur-sm background-image">XXXXX
        <!-- top note (what you had before) -->
        <div class="flex items-center justify-center h-12 text-white">
          <span class="text-base">Waiting for camera/microphone permissions…</span>
        </div>

        <!-- root container (same as current inline) -->
        <div data-grant-root class="p-0">
          <!-- Spinner while checking -->
          <div id="cm-loader" hidden>
            <div class="absolute rounded-md h-full w-full connecting-overlay backdrop-blur bg-black/50 flex justify-center items-center">
              <div role="status" class="flex justify-center items-center flex-col">
                <svg aria-hidden="true" class="lg:w-[150px] sm:w-[100px] w-[80px] lg:h-[150px] sm:h-[100px] h-[80px] text-gray-200 animate-spin dark:text-gray-600 fill-[#07F468]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"></path>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"></path>
                </svg>
                <span class="text-white mt-4 text-lg font-medium">Checking Permissions...</span>
              </div>
            </div>
          </div>

          <!-- icons to re-request (keep ids for CamMicPermissionsUtility) -->
          <div
            id="cm-permission-icons"
            hidden
            class="mt-2 space-y-2"
            style="cursor:pointer"
          >
            <div id="cm-need-camera" hidden>Camera permission required</div>
            <div id="cm-need-microphone" hidden>Microphone permission required</div>
          </div>

          <!-- main panel -->
          <div class="absolute rounded-md font-poppins text-base h-full w-full z-10 backdrop-blur-md bg-black/50 flex justify-center items-center">
            <div class="lg:max-w=[616px] w-4/5 max-w-[375px] mx-auto absolute top-52 p-4 lg:w-auto bg-slate-950/90 backdrop-blur-sm rounded-lg shadow-xl">
              <div class="flex">
                <div class="content flex w-full flex-col">
                  <div class="text-center text-[24px] text-white font-bold">Please allow below permissions to start call:</div>
                  <div class="flex gap-4 mt-6 items-center justify-center">
                    <div class="flex items-center flex-col w-[132px] lg:w-[165px]">
                      <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/camera-01.png" class="w-[48px] h-[48px] lg:w-[96px] lg:h-[96px]" alt="">
                      <p class="text-brand-primary text-sm font-medium">Camera</p>
                    </div>
                    <div class="flex items-center flex-col w-[132px] lg:w-[165px]">
                      <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/microphone-01.png" class="w-[48px] h-[48px] lg:w-[96px] lg:h-[96px]" alt="">
                      <span class="text-brand-primary text-sm font-medium">Microphone</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- /main panel -->
        </div>
      </div>
    `,
  });

  // register globally in the same bucket
  window.VueComponents = window.VueComponents || {};
  window.VueComponents.TemplateCamMicPermissions = TemplateCamMicPermissions;
})();
