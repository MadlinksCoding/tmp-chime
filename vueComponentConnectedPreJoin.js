// ConnectedPreJoin Component - Pre-join waiting screen for callee
// This shows the video preview and settings before joining the call

(function() {
const { defineComponent } = Vue;

const ConnectedPreJoin = defineComponent({
  name: "ConnectedPreJoin",
  template: `
    <div>
      <div class="w-full h-dvh max-h-dvh xl:h-screen relative bg-cover bg-center bg-no-repeat bg-black/50 backdrop-blur-sm">
        <div class="w-full h-dvh lg:h-full max-h-dvh xl:max-h-full inset-0 bg-black/50 backdrop-blur-lg lg:p-2 flex items-center gap-2 mx-auto">
          <section class="flex-1 flex flex-col gap-2 relative h-dvh xl:h-full max-h-dvh xl:max-h-full">
            <div class="flex-1 relative rounded-card-xs bg-cover bg-center">
              <div class="lg:h-[88.5vh] w-full h-screen">
                <!-- Local Video (if not main) -->
                <div class="person" id="local-video-sidebar" hidden="">
                  <p><span class="handle">@local</span> — <span class="name">Local User</span></p>
                  <div class="feed absolute w-full h-full object-cover rounded-md">
                    <video autoplay="" playsinline="" data-local="" style="width: 100%; background: rgb(0, 0, 0);"></video>
                    <div class="statusline" id="status-self"></div>
                  </div>
                </div>
                <!-- Show self feed here  -->
                <video id="cm-video-preview" data-cam-mic-element="video-preview" autoplay playsinline muted style="width: 100%; height: 100%; max-width: 100%; background: rgb(0, 0, 0); border-radius: 8px; object-fit: cover;"></video>
              </div>
            </div>
            
            <!-- Mobile header for connecting state -->
            <div class="flex w-full top-2 absolute z-30 lg:hidden flex-col">
              <span class="text-white text-center text-sm font-medium block lg:hidden" data-call-type-text=""> [[mode_text]] [[userName]] </span>
              <div class="flex justify-center gap-2">
                <span class="text-white text-xs font-medium" data-meeting-time="">November 5, 2025</span>
                <div class=" p-1 font-medium text-gray-700 hidden" style="display: none;">Timer: <span data-timer="">00:00</span></div>
                <div class="flex items-center gap-1 px-[8px] justify-center rounded-pill bg-[#5549FF] h-[18px]" data-status-indicator="">
                  <div class="w-2 h-2 rounded-full bg-white" data-status-dot=""></div>
                  <span class="text-white text-xs font-medium" data-status-text="">in 5 min</span>
                </div>
              </div>
            </div>
            
            <!-- Back button -->
            <div data-back-to-fansocial-button="" class="sm:w-[178px] lg:flex hidden justify-center w-10 w-10 sm:h-12 absolute top-6 sm:left-6 left-4 flex items-center gap-2 sm:pr-4 py-2 sm:pl-2 rounded-pill bg-black/50 backdrop-blur-sm" aria-label="Back to fansocial cursor-pointer">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/arrow-left.svg" class="w-6 h-6 drop-shadow-icon" alt="Back arrow">
              <span class="text-white text-sm font-normal sm:block hidden">Back to fansocial</span>
            </div>
            
            <!-- Back button mobile -->
            <div data-back-to-fansocial-button="" class="lg:hidden flex justify-center w-10 w-10 sm:h-12 absolute top-2 sm:left-6 left-4 flex items-center cursor-pointer" aria-label="Back to fansocial">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/chevron-left.svg" class="w-6 h-6 drop-shadow-icon" alt="Back arrow">
            </div>
            
            <!-- Bottom controls for connecting state -->
            <div class="flex flex-col lg:flex-row z-10 gap-2 justify-between left-0 right-0 lg:rounded-none rounded-full items-center lg:relative absolute bottom-4 lg:bottom-0 lg:w-full w-full lg:mx-0 lg:px-0 px-4 py-0">
              <div class="lg:flex hidden items-center gap-4 w-1/3">
                <div class="w-16 h-16 flex-shrink-0">
                  <!-- Fallback Initial -->
                  <div data-user-initial="" class="w-full h-full bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold avatar--shape--1" style="display: flex;"> UN </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-1">
                    <span class="text-white text-sm font-medium truncate" data-call-type-text="">[[mode_text]] [[userName]]</span>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0">
                      <path d="M12 16V12M12 8H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" stroke-width="2"></path>
                    </svg>
                  </div>
                  <div class="flex xl:flex-row flex-col xl:items-center items-start gap-2 mt-1">
                    <span class="text-white text-base font-medium" data-meeting-time="">November 5, 2025</span>
                    <div class=" p-1 font-medium text-gray-700 hidden" style="display: none;">Timer: <span data-timer="">00:00</span></div>
                    <div class="flex items-center gap-1 px-1.5 justify-center rounded-pill bg-[#5549FF] w-[75px] h-[18px]" data-status-indicator="">
                      <div class="w-2 h-2 rounded-full bg-white" data-status-dot=""></div>
                      <span class="text-white text-xs font-medium" data-status-text="">in 5 min</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Main control buttons -->
              <div class="flex items-center sm:gap-4 gap-3 flex-1 sm:justify-center lg:relative relative pb-[0rem] left-0 right-0 lg:mx-0 mx-auto lg:w-1/3 md:w-[calc(100%-424px)] sm:w-full">
                <div data-top-toggle-camera="" class="xl:w-17 xl:h-17 w-12 h-12 min-w-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer" aria-label="Toggle camera">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/camera-icon.svg" class="w-8 h-8 top-camera-enabled-icon" alt="Video camera">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/disableCamera.svg" class="w-8 h-8 top-camera-disabled-icon hidden" alt="Video camera disabled">
                </div>
                <div data-top-toggle-microphone="" class="xl:w-17 xl:h-17 w-12 h-12 min-w-12 rounded-full bg-white/10 flex items-center justify-center cursor-pointer active" aria-label="Toggle microphone">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/mic.svg" class="w-8 h-8 top-microphone-enabled-icon" alt="Microphone">
                  <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/mute-microphone.svg" class="w-8 h-8 top-microphone-disabled-icon hidden" alt="Microphone disabled">
                </div>
              </div>
              
              <div class="w-1/3"></div>
              
              <div data-join-call-button class="w-full lg:hidden bg-[#07F468] font-semibold text-lg py-[10px] px-4 text-center rounded-full leading-7 cursor-pointer"> Join Call </div>
            </div>
          </section>
          
          <!-- Settings Sidebar for Connecting State -->
          <aside data-sidebar-pannel="" data-call-settings-panel="" class="z-[99999] flex-col lg:w-40 py-4 h-full sm:h-screen lg:h-full md:h-screen absolute lg:relative overflow-y-auto g-2 bg-black/50 shadow-control lg:flex w-full backdrop-blur-md flex-col hidden lg:flex">
            <!-- Settings Header & Content -->
            <div class="text-white cursor-pointer lg:hidden flex items-end justify-end pr-3 absolute top-[0.25rem] right-[0]">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/x-close.png" class="w-6 h-6 object-cover">
            </div>
            <div>
              <!-- Audio Video Accordion Header -->
              <header id="audioVideoAccordionHeader" class="p-4 hidden _flex justify-between items-center py-2 cursor-pointer hover:bg-white/5 transition-colors duration-200">
                <div class="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
                    <path d="M9.39504 19.3711L9.97949 20.6856C10.1532 21.0768 10.4368 21.4093 10.7957 21.6426C11.1547 21.8759 11.5736 22.0001 12.0017 22C12.4298 22.0001 12.8488 21.8759 13.2077 21.6426C13.5667 21.4093 13.8502 21.0768 14.0239 20.6856L14.6084 19.3711C14.8164 18.9047 15.1664 18.5159 15.6084 18.26C16.0532 18.0034 16.5677 17.8941 17.0784 17.9478L18.5084 18.1C18.934 18.145 19.3636 18.0656 19.7451 17.8713C20.1265 17.6771 20.4434 17.3763 20.6573 17.0056C20.8714 16.635 20.9735 16.2103 20.951 15.7829C20.9285 15.3555 20.7825 14.9438 20.5306 14.5978L19.6839 13.4344C19.3825 13.0171 19.2214 12.5148 19.2239 12C19.2238 11.4866 19.3864 10.9864 19.6884 10.5711L20.535 9.40778C20.7869 9.06175 20.933 8.65007 20.9554 8.22267C20.9779 7.79528 20.8759 7.37054 20.6617 7C20.4478 6.62923 20.1309 6.32849 19.7495 6.13423C19.3681 5.93997 18.9385 5.86053 18.5128 5.90556L17.0828 6.05778C16.5722 6.11141 16.0576 6.00212 15.6128 5.74556C15.1699 5.48825 14.8199 5.09736 14.6128 4.62889L14.0239 3.31444C13.8502 2.92317 13.5667 2.59072 13.2077 2.3574C12.8488 2.12408 12.4298 1.99993 12.0017 2C11.5736 1.99993 11.1547 2.12408 10.7957 2.3574C10.4368 2.59072 10.1532 2.92317 9.97949 3.31444L9.39504 4.62889C9.18797 5.09736 8.83792 5.48825 8.39504 5.74556C7.95026 6.00212 7.43571 6.11141 6.92504 6.05778L5.4906 5.90556C5.06493 5.86053 4.63534 5.93997 4.25391 6.13423C3.87249 6.32849 3.55561 6.62923 3.34171 7C3.12753 7.37054 3.02549 7.79528 3.04798 8.22267C3.07046 8.65007 3.2165 9.06175 3.46838 9.40778L4.31504 10.5711C4.61698 10.9864 4.77958 11.4866 4.77949 12C4.77958 12.5134 4.61698 13.0137 4.31504 13.4289L3.46838 14.5922C3.2165 14.9382 3.07046 15.3499 3.04798 15.7773C3.02549 16.2047 3.12753 16.6295 3.34171 17C3.55582 17.3706 3.87274 17.6712 4.25411 17.8654C4.63548 18.0596 5.06496 18.1392 5.4906 18.0944L6.9206 17.9422C7.43127 17.8886 7.94581 17.9979 8.3906 18.2544C8.83513 18.511 9.18681 18.902 9.39504 19.3711Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M11.9999 15C13.6568 15 14.9999 13.6569 14.9999 12C14.9999 10.3431 13.6568 9 11.9999 9C10.3431 9 8.99992 10.3431 8.99992 12C8.99992 13.6569 10.3431 15 11.9999 15Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                  <h2 class="text-white lg:text-base text-sm font-medium"> Audio &amp; Video Setting </h2>
                </div>
                <svg id="audioVideoAccordionIcon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 drop-shadow-icon transition-transform duration-300 ease-in-out">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </header>
              
              <!-- Audio Video Accordion Content -->
              <div id="audioVideoAccordionContent" class="hidden _flex px-4 flex-col gap-4 transition-all duration-300 ease-in-out overflow-hidden">
                <div class="flex flex-col gap-2">
                  <div class="h-6 flex items-center">
                    <h3 class="text-gray-50 text-sm font-semibold">CAMERA</h3>
                  </div>
                  <div class="relative">
                    <div id="cameraDropdownTrigger" class="py-2 px-3 flex items-center border border-[#EAECF080] rounded-[6px] bg-black/50 justify-between cursor-pointer hover:bg-black/70 transition-colors">
                      <div class="flex items-center gap-2 lg:flex-1 lg:w-auto w-[87%]">
                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5">
                          <path d="M18.3334 7.44289C18.3334 6.93804 18.3334 6.68562 18.2336 6.56873C18.147 6.46731 18.017 6.41349 17.8841 6.42395C17.7308 6.43602 17.5523 6.61451 17.1953 6.97149L14.1667 10.0001L17.1953 13.0287C17.5523 13.3857 17.7308 13.5641 17.8841 13.5762C18.017 13.5867 18.147 13.5329 18.2336 13.4314C18.3334 13.3145 18.3334 13.0621 18.3334 12.5573V7.44289Z" stroke="#F9FAFB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          <path d="M1.66675 8.16675C1.66675 6.76662 1.66675 6.06655 1.93923 5.53177C2.17892 5.06137 2.56137 4.67892 3.03177 4.43923C3.56655 4.16675 4.26662 4.16675 5.66675 4.16675H10.1667C11.5669 4.16675 12.2669 4.16675 12.8017 4.43923C13.2721 4.67892 13.6546 5.06137 13.8943 5.53177C14.1667 6.06655 14.1667 6.76662 14.1667 8.16675V11.8334C14.1667 13.2335 14.1667 13.9336 13.8943 14.4684C13.6546 14.9388 13.2721 15.3212 12.8017 15.5609C12.2669 15.8334 11.5669 15.8334 10.1667 15.8334H5.66675C4.26662 15.8334 3.56655 15.8334 3.03177 15.5609C2.56137 15.3212 2.17892 14.9388 1.93923 14.4684C1.66675 13.9336 1.66675 13.2335 1.66675 11.8334V8.16675Z" stroke="#F9FAFB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <span class="text-gray-200 lg:text-base text-sm font-medium truncate" data-camera-device="">FaceTime HD Camera</span>
                      </div>
                      <svg id="cameraDropdownIcon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200">
                        <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#EAECF0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </div>
                    <!-- Camera Dropdown Menu -->
                    <div id="cameraDropdownMenu" class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 hidden max-h-64 overflow-y-auto">
                      <div class="py-1">
                        <!-- Options will be populated dynamically -->
                      </div>
                      <div class="border-t border-gray-600 p-2">
                        <button id="refreshCameraDevices" class="w-full px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg> Refresh Devices 
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="flex flex-col gap-2">
                  <div class="h-6 flex items-center">
                    <h3 class="text-gray-50 text-sm font-semibold"> MICROPHONE </h3>
                  </div>
                  <div class="relative">
                    <div id="microphoneDropdownTrigger" class="py-2 px-3 flex items-center border border-[#EAECF080] rounded-[6px] bg-black/50 justify-between cursor-pointer hover:bg-black/70 transition-colors">
                      <div class="flex items-center gap-2 lg:flex-1 lg:w-auto w-[87%]">
                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5">
                          <path d="M15.8332 8.33342V10.0001C15.8332 13.2217 13.2215 15.8334 9.99984 15.8334M4.1665 8.33342V10.0001C4.1665 13.2217 6.77818 15.8334 9.99984 15.8334M9.99984 15.8334V18.3334M6.6665 18.3334H13.3332M9.99984 12.5001C8.61913 12.5001 7.49984 11.3808 7.49984 10.0001V4.16675C7.49984 2.78604 8.61913 1.66675 9.99984 1.66675C11.3805 1.66675 12.4998 2.78604 12.4998 4.16675V10.0001C12.4998 11.3808 11.3805 12.5001 9.99984 12.5001Z" stroke="#F9FAFB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <span class="text-gray-200 lg:text-base text-sm font-medium truncate" data-microphone-device="">MacBook Pro Microphone <span class="lg:inline hidden"> (Built-in)</span></span>
                      </div>
                      <svg id="microphoneDropdownIcon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200">
                        <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#EAECF0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </div>
                    <!-- Microphone Dropdown Menu -->
                    <div id="microphoneDropdownMenu" class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 hidden max-h-64 overflow-y-auto">
                      <div class="py-1">
                        <!-- Options will be populated dynamically -->
                      </div>
                      <div class="border-t border-gray-600 p-2">
                        <button id="refreshMicrophoneDevices" class="w-full px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg> Refresh Devices 
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="flex flex-col gap-2">
                  <div class="h-6 flex items-center">
                    <h3 class="text-gray-50 text-sm font-semibold">SPEAKER</h3>
                  </div>
                  <div class="relative">
                    <div id="speakerDropdownTrigger" class="py-2 px-3 flex items-center border border-[#EAECF080] rounded-[6px] bg-black/50 justify-between cursor-pointer hover:bg-black/70 transition-colors">
                      <div class="flex items-center gap-2 lg:flex-1 lg:w-auto w-[87%]">
                        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5">
                          <path d="M16.4567 4.16669C17.6378 5.80855 18.3334 7.82305 18.3334 10C18.3334 12.177 17.6378 14.1915 16.4567 15.8334M13.1212 6.66669C13.7802 7.61155 14.1667 8.76065 14.1667 10C14.1667 11.2394 13.7802 12.3885 13.1212 13.3334M8.02868 4.47142L5.39061 7.1095C5.24648 7.25362 5.17442 7.32569 5.09032 7.37722C5.01576 7.42291 4.93447 7.45658 4.84944 7.477C4.75354 7.50002 4.65162 7.50002 4.4478 7.50002H3.00008C2.53337 7.50002 2.30002 7.50002 2.12176 7.59085C1.96495 7.67074 1.83747 7.79823 1.75758 7.95503C1.66675 8.13329 1.66675 8.36664 1.66675 8.83335V11.1667C1.66675 11.6334 1.66675 11.8668 1.75758 12.045C1.83747 12.2018 1.96495 12.3293 2.12176 12.4092C2.30002 12.5 2.53337 12.5 3.00008 12.5H4.4478C4.65162 12.5 4.75354 12.5 4.84944 12.523C4.93447 12.5435 5.01576 12.5771 5.09032 12.6228C5.17442 12.6744 5.24648 12.7464 5.39061 12.8905L8.02868 15.5286C8.38566 15.8856 8.56415 16.0641 8.71739 16.0761C8.85036 16.0866 8.9803 16.0328 9.06692 15.9314C9.16675 15.8145 9.16675 15.5621 9.16675 15.0572V4.94283C9.16675 4.43798 9.16675 4.18556 9.06692 4.06867C8.9803 3.96725 8.85036 3.91343 8.71739 3.92389C8.56415 3.93595 8.38566 4.11444 8.02868 4.47142Z" stroke="#F9FAFB" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <span class="text-gray-200 lg:text-base text-sm font-medium truncate" data-speaker-device="">MacBook Pro Speakers <span class="lg:inline hidden"> (Built-in)</span></span>
                      </div>
                      <svg id="speakerDropdownIcon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform duration-200">
                        <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#EAECF0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                      </svg>
                    </div>
                    <!-- Speaker Dropdown Menu -->
                    <div id="speakerDropdownMenu" class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 hidden max-h-64 overflow-y-auto">
                      <div class="py-1">
                        <!-- Options will be populated dynamically -->
                      </div>
                      <div class="border-t border-gray-600 p-2">
                        <button id="refreshSpeakerDevices" class="w-full px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg> Refresh Devices 
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="">
                <header id="backgroundsAccordionHeader" class="cursor-pointer hover:bg-white/5 flex justify-between items-center py-2 px-4 w-full text-left" aria-expanded="false">
                  <div class="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
                      <path d="M3.5 9.35198V7.65973L8.04425 3.11548H9.7365L3.5 9.35198ZM3.5 4.86548V3.40398L3.7885 3.11548H5.25L3.5 4.86548ZM15.598 6.31923C15.457 6.18073 15.3067 6.04481 15.147 5.91148C14.9875 5.77815 14.8269 5.6609 14.6652 5.55973L17.1095 3.11548H18.8018L15.598 6.31923ZM5.0385 15.1865L7.55975 12.6652C7.65708 12.8294 7.75383 12.9769 7.85 13.1077C7.94617 13.2384 8.05325 13.3608 8.17125 13.475L7.45 14.1962C7.06017 14.3001 6.655 14.4379 6.2345 14.6097C5.814 14.7814 5.41533 14.9736 5.0385 15.1865ZM17.0673 9.35773V9.32673C17.0544 9.0999 17.0214 8.86856 16.9682 8.63273C16.9151 8.39673 16.8449 8.17556 16.7578 7.96923L20.5 4.22698V5.92498L17.0673 9.35773ZM10.727 4.96548L12.5922 3.11548H14.2845L12.5308 4.86923C12.4179 4.84873 12.3103 4.83331 12.2078 4.82298C12.1051 4.81281 11.9973 4.80773 11.8845 4.80773C11.7012 4.81406 11.5083 4.83198 11.3058 4.86148C11.1033 4.89098 10.9103 4.92565 10.727 4.96548ZM3.5 13.8845V12.1922L6.9655 8.72698C6.91933 8.92315 6.88308 9.11764 6.85675 9.31048C6.83042 9.50348 6.81725 9.69165 6.81725 9.87498C6.81725 9.98781 6.82242 10.0955 6.83275 10.198C6.84292 10.3006 6.85825 10.4032 6.87875 10.5057L3.5 13.8845ZM19.5807 15.873C19.4537 15.7306 19.3156 15.5951 19.1663 15.4662C19.0169 15.3374 18.8551 15.214 18.6807 15.096L20.5 13.2767V14.969L19.5807 15.873ZM17.1328 13.8037C17.0929 13.7217 17.0483 13.6438 16.999 13.57C16.9497 13.4963 16.8987 13.4236 16.8462 13.3517C16.7796 13.2634 16.709 13.175 16.6345 13.0865C16.5602 12.998 16.4833 12.9178 16.4038 12.846L20.5 8.73448V10.4517L17.1328 13.8037ZM12 13.5C11.0347 13.5 10.21 13.158 9.526 12.474C8.842 11.79 8.5 10.9653 8.5 9.99998C8.5 9.03465 8.842 8.20998 9.526 7.52598C10.21 6.84198 11.0347 6.49998 12 6.49998C12.9653 6.49998 13.79 6.84198 14.474 7.52598C15.158 8.20998 15.5 9.03465 15.5 9.99998C15.5 10.9653 15.158 11.79 14.474 12.474C13.79 13.158 12.9653 13.5 12 13.5ZM12 12C12.55 12 13.0208 11.8041 13.4125 11.4125C13.8042 11.0208 14 10.55 14 9.99998C14 9.44998 13.8042 8.97915 13.4125 8.58748C13.0208 8.19581 12.55 7.99998 12 7.99998C11.45 7.99998 10.9792 8.19581 10.5875 8.58748C10.1958 8.97915 10 9.44998 10 9.99998C10 10.55 10.1958 11.0208 10.5875 11.4125C10.9792 11.8041 11.45 12 12 12ZM4.5 19.596V18.9077C4.5 18.3922 4.63367 17.9297 4.901 17.5202C5.16833 17.1106 5.52317 16.7936 5.9655 16.5692C6.79617 16.1551 7.72017 15.8092 8.7375 15.5317C9.75483 15.2542 10.8423 15.1155 12 15.1155C13.1577 15.1155 14.2452 15.2542 15.2625 15.5317C16.2798 15.8092 17.2038 16.1551 18.0345 16.5692C18.4705 16.7872 18.8238 17.1042 19.0943 17.5202C19.3648 17.9362 19.5 18.3987 19.5 18.9077V19.596C19.5 19.8538 19.4138 20.0689 19.2413 20.2412C19.0689 20.4137 18.8538 20.5 18.596 20.5H5.404C5.14617 20.5 4.93108 20.4137 4.75875 20.2412C4.58625 20.0689 4.5 19.8538 4.5 19.596ZM6.0155 19H17.9845C17.964 18.709 17.9057 18.4805 17.8095 18.3145C17.7135 18.1483 17.5539 18.0127 17.3307 17.9077C16.7179 17.6077 15.9634 17.3173 15.0673 17.0365C14.1711 16.7556 13.1487 16.6152 12 16.6152C10.8513 16.6152 9.82892 16.7556 8.93275 17.0365C8.03658 17.3173 7.28208 17.6077 6.66925 17.9077C6.45258 18.0127 6.29458 18.1508 6.19525 18.322C6.09592 18.4931 6.036 18.7191 6.0155 19Z" fill="white"></path>
                    </svg>
                    <span class="text-white text-base font-medium">BACKGROUNDS &amp; EFFECTS</span>
                  </div>
                  <svg id="backgroundsAccordionIcon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 drop-shadow-icon">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </header>
                
                <div id="backgroundsAccordionContent" class="px-4">
                  <div class="my-4">
                    <p class="text-white font-medium text-base"> Blur Background </p>
                    <div class="mt-[10px] grid grid-cols-4 gap-2">
                      <div class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer active" data-apply-background-filter-blur="none"> No Blur </div>
                      <div class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer" data-apply-background-filter-blur="low"> Low </div>
                      <div class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer" data-apply-background-filter-blur="medium"> Medium </div>
                      <div class="w-full text-sm font-medium border border-white/50 border-solid p-[10px] text-white rounded-md flex justify-center items-center cursor-pointer" data-apply-background-filter-blur="high"> High </div>
                    </div>
                  </div>
                  
                  <div class="my-4">
                    <p class="text-white font-medium text-base"> Virtual Background </p>
                    <div class="mt-[10px] grid grid-cols-4 gap-2">
                      <div class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg1">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg1.jpg" class="h-full w-full object-cover">
                      </div>
                      <div class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2r cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg2">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg2.jpg" class="h-full w-full object-cover">
                      </div>
                      <div class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg3">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg3.jpg" class="h-full w-full object-cover">
                      </div>
                      <div class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg4">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg4.jpg" class="h-full w-full object-cover">
                      </div>
                      <div class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg5">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg5.jpg" class="h-full w-full object-cover">
                      </div>
                      <div class="w-full text-sm font-medium border border-[#FFFFFF80] border-solid h-[72px] w-[86px] text-white rounded-xl flex justify-center items-center flex-col gap-2 cursor-pointer overflow-hidden" data-apply-background-filter-predefined="bg6">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/backgrounds/bg6.jpg" class="h-full w-full object-cover">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Chat Setting Section -->
              <div class="p-4 absolute bottom-0 w-full">
                <div data-join-call-button="" class="w-full px-4 py-[10px] rounded-pill bg-green-500 shadow-button flex items-center justify-center cursor-pointer">
                  <span class="text-gray-950 text-base font-semibold">JOIN CALL</span>
                </div>
              </div>
              <div class="py-3 block sm:hidden"></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `,
  setup() {
    console.log('[ConnectedPreJoin] Component setup()');
    return {};
  },
});

// Export to global
if (!window.VueComponents) window.VueComponents = {};
window.VueComponents.ConnectedPreJoin = ConnectedPreJoin;

console.log('[ConnectedPreJoin] ✅ Component registered');
})();

