// WaitingConnected Component - Main In-Call Interface
// This is the largest component with video tiles, chat, gifts, settings

(function() {
const { defineComponent } = Vue;

const WaitingConnected = defineComponent({
  name: "WaitingConnected",
  components: {
    CallSettings: window.VueComponents?.CallSettings,
    MediaCardsPanel: window.VueComponents?.MediaCardsPanel,
    MerchCardsPanel: window.VueComponents?.MerchCardsPanel,
    SubscriptionCardsPanel: window.VueComponents?.SubscriptionCardsPanel,
  },
  template: `
    <div data-state="in-call" class="w-full h-screen relative bg-cover bg-center bg-no-repeat bg-black/50 backdrop-blur-sm background-image">
      <div class="w-full h-full flex">
        <div class="_w-full flex-1 h-full inset-0 bg-black/50 backdrop-blur-lg lg:p-0 flex items-center gap-2 mx-auto">
          <section class="flex-1 flex flex-col gap-2 h-full relative">
            <div class="flex-1 relative rounded-card-xs bg-cover bg-center bg-black backdrop-blur-sm">
              <!-- Main Video Area -->
              <div data-attribute="tile_feed" class="w-full h-full lg:h-[88vh] xl:h-[88.5vh]">
                <div data-remotes class="w-full h-full h-[84vh] short-video-container"></div>
              </div> 

              <video id="cm-video-preview"
                autoplay
                playsinline
                muted
                style="width: 100px;
                max-width:100%;
                background:#000;
                border-radius:8px;
                aspect-ratio:16/9;
                object-fit:cover;">
              </video>

              <div class="text-white text-sm font-normal mt-2 sm:block hidden" data-waiting-text="">
                [[waitingText]]
              </div>
            </div>

            <!-- Participant Video (Top Right) -->
            <video data-participant-video="" autoplay="" playsinline="" muted="" class="absolute hidden lg:flex right-1 lg:bottom-[120px] sm:bottom-20 bottom-[130px] rounded-card-sm sm:h-[156px] h-[260px] sm:w-[277px] w-[170px] z-10 object-cover hidden" style="background: #000"></video>

            <!-- Remote Participant Video (Top Right) -->
            <video data-remote-video="" autoplay="" playsinline="" muted="" class="absolute right-1 lg:bottom-[120px] sm:bottom-20 bottom-[130px] rounded-card-sm sm:h-[156px] h-[260px] sm:w-[277px] w-[170px] z-10 object-cover hidden" style="background: #000; display: none"></video>

            <!-- Waiting for Participant (Top Right) -->
            <div class="custom-preview-left-side absolute flex right-[8px] lg:bottom-[120px] sm:bottom-20 bottom-[95px] rounded-card-sm lg:h-[156px] h-[120px] lg:w-[277px] w-[69px] z-[1000] flex justify-center items-center">
              <video data-main-video autoplay="" playsinline="" muted="" class="absolute w-full h-full object-cover rounded-md hidden" style="background: #000"></video>
            </div>

            <!-- Back button (Desktop) -->
            <div @click="disconnectChimeCall()" data-back-to-fansocial-button class="sm:w-[178px] hidden justify-center w-10 w-10 sm:h-12 absolute top-6 sm:left-6 left-4 flex items-center gap-2 sm:pr-4 py-2 sm:pl-2 rounded-pill bg-black/50 backdrop-blur-sm cursor-pointer" aria-label="Back to fansocial">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/arrow-left.svg" class="w-6 h-6 drop-shadow-icon" alt="Back arrow">
              <span class="text-white text-sm font-normal sm:block hidden">Back to fansocial</span>
            </div>

            <!-- Back button (Mobile) -->
            <div @click="disconnectChimeCall()" data-back-to-fansocial-button class="justify-center hidden sm:h-12 absolute top-6 left-[70px] sm:hidden flex items-center gap-2 px-3 py-2 rounded-pill bg-black/50 backdrop-blur-sm cursor-pointer" aria-label="Back to fansocial">
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/user.png" class="w-6 h-6 drop-shadow-icon" alt="Back arrow">
              <span class="text-white text-sm font-normal block sm:hidden">[[userName]]</span>
            </div>

            <!-- Mobile header -->
            <div class="justify-center flex-col w-full sm:h-12 absolute top-0 sm:top-20 lg:hidden flex items-center gap-2 px-3 py-2 rounded-pill" aria-label="Back to fansocial">
              <div class="flex lg:hidden flex-col">
                <span class="text-white text-sm font-medium block text-center lg:hidden" data-call-type-text="">[[mode_text]] [[userName]]</span>
                <div class="flex items-center gap-2">
                  <span class="text-[#FFFFFFB2] text-xs font-medium" data-meeting-time="">9:00pm-9:15pm</span>
                  <div class="flex items-center gap-1 px-2 justify-center rounded-pill bg-[#5549FF]  h-[18px]" data-status-indicator="">
                    <div class="w-2 h-2 rounded-full bg-white" data-status-dot=""></div>
                    <span class="text-white text-xs font-medium" data-status-text="">in 5 min</span>
                  </div>
                </div>
              </div>
              <div class="flex justify-center items-center flex-col">
                <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/user.png" class="w-[78px] h-[80px] mt-4 drop-shadow-icon bg-white call-mobile-avatar avatar--shape--1" alt="Back arrow">
                <span class="text-sm mt-4 text-white hidden">[[waitingText]]</span>
              </div>
            </div>

            <!-- Bottom controls -->
            <div class="w-full lg:bg-transparent lg:bottom-gradient-dark justify-between lg:p-4 flex md:gap-0 gap-4 justify-between left-0 right-0 md:rounded-none rounded-full items-center absolute bottom-0 md:bottom-0 sm:w-full w-[95%] sm:mx-0 absolute mx-auto md:px-0 px-4 py-2" style="z-index: 1000">
              <div class="lg:flex items-center gap-4 w-full">
                <div class="lg:flex hidden w-16 h-16 flex-shrink-0 avatar--shape--1">
                  <!-- Fallback Initial -->
                  <div data-user-initial="" class="w-full h-full bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold avatar--shape--1" style="display: flex">
                    UN
                  </div>
                </div>
                <div class="flex-1">
                  <div class="lg:flex hidden items-center gap-1">
                    <span class="text-white text-sm font-medium truncate" data-call-type-text="">[[mode_text]] [[userName]]</span>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0">
                      <path d="M12 16V12M12 8H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                      <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" stroke-width="2"></path>
                    </svg>
                  </div>
                  <div class="flex xl:flex-row items-center gap-2 h-[30px]">
                    <span class="lg:flex hidden text-white text-base font-medium" data-meeting-time="">9:00pm-9:15pm</span>
                    <div class="lg:flex hidden items-center gap-1 px-2 justify-center rounded-pill bg-[#5549FF]  h-[18px]p" data-status-indicator="">
                      <div class="lg:flex hidden w-2 h-2 rounded-full bg-white" data-status-dot=""></div>
                      <span class="text-white text-xs font-medium" data-status-text="">in 5 min</span>
                    </div>

                    <!-- Main control buttons -->
                    <div class="main-control-buttons flex items-center md:gap-4 gap-3 md:max-h-[104px] flex-1 md:justify-center lg:relative sm:absolute relative md:bottom-2 left-0 right-0 sm:bottom-[120px] md:mx-0 mx-auto md:w-auto md:w-[calc(100%-424px)] sm:w-full select-none">
                      <div class="main-control-center-buttons flex justify-center items-center gap-4 flex-1">
                        <div @click="toggleVideoFeed(true)" data-toggle-camera="" class="h-[68px] w-[68px] rounded-full bg-white/10 flex items-center justify-center cursor-pointer" aria-label="Toggle camera" :class="{ active: meeting.videoFeed === true }">
                          <img v-if="meeting.videoFeed === true" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/camera-icon.svg" class="w-8 h-8 camera-enabled-icon" alt="Video camera">
                          <img v-if="meeting.videoFeed === false" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/disableCamera.svg" class="w-8 h-8 camera-disabled-icon" alt="Video camera disabled">
                        </div>
                        <div @click="toggleAudioFeed(true)" data-toggle-microphone="" class="h-[68px] w-[68px] rounded-full bg-white/10 flex items-center justify-center cursor-pointer" aria-label="Toggle microphone" :class="{ active: meeting.audioFeed === true }">
                          <img v-if="meeting.audioFeed === true" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/mic.svg" class="w-8 h-8 microphone-enabled-icon" alt="Microphone">
                          <img v-if="meeting.audioFeed === false" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/mute-microphone.svg" class="w-8 h-8 microphone-disabled-icon" alt="Microphone disabled">
                        </div>
                      </div>
                      <div class="main-control-side-buttons flex justify-center items-center gap-4 pl-[168px]">
                        <div @click="toggleActivePanel('chat')" id="chatToggleBtn" class="h-[68px] w-[68px] rounded-full bg-white/10 flex items-center justify-center cursor-pointer" aria-label="Toggle chat" :class="{ active: meeting.activePanel === 'chat' }">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/chat-icon.svg" class="w-8 h-8" alt="Chat">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/message-dots-circle-black.svg" class="w-8 h-8 black-chat-icon" alt="Chat">
                        </div>
                        <div @click="toggleActivePanel('callSettings')" data-toggle-call-settings-panel class="h-[68px] w-[48px] rounded-full bg-white/10 flex items-center justify-center cursor-pointer" aria-label="Toggle call settings" :class="{ active: meeting.activePanel === 'callSettings' }">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/three-dots.svg" class="w-8 h-8" alt="Call Settings">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Media Cards Panel for Connected State -->
          <MediaCardsPanel v-if="meeting.status === 'connected'" v-show="meeting.activePanel === 'mediaCards'" />

          <!-- Merch Cards Panel for Connected State -->
          <MerchCardsPanel v-if="meeting.status === 'connected'" v-show="meeting.activePanel === 'merchCards'" />

          <!-- Subscription Cards Panel for Connected State -->
          <SubscriptionCardsPanel v-if="meeting.status === 'connected'" v-show="meeting.activePanel === 'subscriptionCards'" />
          
          <!-- Settings Sidebar for Connected State -->
          <CallSettings v-if="meeting.status === 'connected'" v-show="meeting.activePanel === 'callSettings'" :show-only-mobile="false" />

          <!-- Chat Panel -->
          <aside data-sidebar-pannel id="chatPanel" class="lg:w-40 h-full sm:h-screen lg:h-full md:h-screen absolute lg:relative overflow-y-auto  g-2 bg-black/50 shadow-control w-full backdrop-blur-md flex-col" aria-hidden="true" v-show="meeting.activePanel === 'chat'">
            <div id="chat-section">
              <div class="p-4 flex flex-col gap-4 flex-1">
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col">
                    <div class="chat-panel-header flex justify-start" >
                      <div class="gap-1 flex items-center">
                        <div class="h-[20px] w-[20px] p-[0.156rem]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="17" viewBox="0 0 18 17" fill="none">
                            <path d="M5.25 8.5H5.25833M9 8.5H9.00833M12.75 8.5H12.7583M9 16C13.1421 16 16.5 12.6421 16.5 8.5C16.5 4.35786 13.1421 1 9 1C4.85786 1 1.5 4.35786 1.5 8.5C1.5 9.49762 1.69478 10.4497 2.04839 11.3204C2.11606 11.4871 2.1499 11.5704 2.165 11.6377C2.17976 11.7036 2.18516 11.7524 2.18517 11.8199C2.18518 11.8889 2.17265 11.9641 2.14759 12.1145L1.65344 15.0794C1.60169 15.3898 1.57582 15.5451 1.62397 15.6573C1.66611 15.7556 1.7444 15.8339 1.84265 15.876C1.95491 15.9242 2.11015 15.8983 2.42063 15.8466L5.38554 15.3524C5.53591 15.3273 5.61109 15.3148 5.68011 15.3148C5.74763 15.3148 5.79638 15.3202 5.86227 15.335C5.92962 15.3501 6.01294 15.3839 6.17958 15.4516C7.05025 15.8052 8.00238 16 9 16ZM5.66667 8.5C5.66667 8.73012 5.48012 8.91667 5.25 8.91667C5.01988 8.91667 4.83333 8.73012 4.83333 8.5C4.83333 8.26988 5.01988 8.08333 5.25 8.08333C5.48012 8.08333 5.66667 8.26988 5.66667 8.5ZM9.41667 8.5C9.41667 8.73012 9.23012 8.91667 9 8.91667C8.76988 8.91667 8.58333 8.73012 8.58333 8.5C8.58333 8.26988 8.76988 8.08333 9 8.08333C9.23012 8.08333 9.41667 8.26988 9.41667 8.5ZM13.1667 8.5C13.1667 8.73012 12.9801 8.91667 12.75 8.91667C12.5199 8.91667 12.3333 8.73012 12.3333 8.5C12.3333 8.26988 12.5199 8.08333 12.75 8.08333C12.9801 8.08333 13.1667 8.26988 13.1667 8.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                        <h3 class="text-white font-medium text-[16px]">CHAT</h3>
                      </div>
                      <img @click="setActivePanel(null);" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/x-close.png" class="w-6 h-6 object-cover lg:hidden flex cursor-pointer">
                    </div>
                    <!-- Chat Messages -->
                    <div id="chat-messages" class="mt-4 max-h-[83.6vh] overflow-y-auto no-scrollbar" data-chat-messages-global="">
                      <!-- Messages will be populated here -->
                    </div>
                  </div>
                </div>
              </div>
              <!-- Chat Setting Section -->
              <div id="chatSettingSection" class=" border-t bottom-0 absolute w-full border-[#FFFFFF40]">
                <div class="flex justify-between items-center py-2 w-full h-[64px] text-left px-4" aria-expanded="false">
                  <div class="flex items-center gap-2">
                    <input data-chat-input type="text" placeholder="Message..." class="placeholder:text-white text-white text-base font-normal font-poppins px-4 py-2 w-full bg-transparent outline-none" data-chat-input-global-text="">
                  </div>
                  <div class="flex items-center gap-4 flex-none"> 
                    <div>
                      <button data-chat-send class="bg-[#F06] py-[0.375rem] px-[0.5rem]  w-[60px] lg:hidden flex justify-center">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/send-03.svg" class="invert"/>
                      </button>
                    </div>
                    <div @click="setActivePanel('gift')">
                      <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/gift-02.svg" id="giftToggleBtn" class="w-[24px] h-[24px] cursor-pointer" aria-label="Open gift menu">
                    </div>

                    <div class="relative">
                      <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/smile-emoji.svg" class="w-[24px] h-[24px] cursor-pointer" id="emojiToggleBtn" aria-label="Open emoji picker">
                      <div id="emojiPicker" class="hidden h-[400px] absolute bottom-10 right-0 z-50 w-[300px] overflow-y-auto rounded-lg shadow-lg bg-[#1f1f1f] border border-white/10 p-2">
                        <div class="grid grid-cols-8 gap-2 text-xl select-none" data-emoji-grid="">
                          <!-- emojis will be populated by JS -->
                        </div>
                      </div>
                    </div>
                    <div>
                      <div id="plusMenuToggle" class="bg-brand-primary rounded-full h-[24px] w-[24px] flex items-center justify-center cursor-pointer">
                        <img class="w-[24px] h-[24px]" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/plus.svg" alt="">
                      </div>

                      <div id="plusMenuPopup" class="hidden absolute lg:right-2 lg:bottom-[50px] lg:w-[294px] rounded-t-[10px] lg:rounded-none flex flex-col  bottom-12 lg:rounded-10 left-0 lg:left-auto bg-[#00000040] w-full overflow-hidden lg:bg-black/80 backdrop-blur-md">
                        <div @click="setActivePanel('mediaCards')" class="flex items-center gap-2 px-4 py-[10px] cursor-pointer" data-toggle-media-cards-panel id="attachMediaBtn">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/image-plus.svg" class="object-cover" alt="Plus icon">
                          <p class="text-white font-medium text-base">Attach media...</p>
                        </div>
                        <div @click="setActivePanel('merchCards')" class="flex items-center gap-2 px-4 py-[10px]">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/package-plus.svg" class="object-cover" alt="Plus icon">
                          <p class="text-white font-medium text-base">
                            Attach product...
                          </p>
                        </div>
                        <div @click="setActivePanel('subscriptionCards')" class="flex items-center gap-2 px-4 py-[10px]">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/logo_bg.svg" class="object-cover" alt="Plus icon">
                          <p class="text-white font-medium text-base">
                            Attach Subscription plan...
                          </p>
                        </div>
                        <div @click="setActivePanel('callSettings')" class="flex border-t border-t-[#FFFFFF40] items-center gap-2 px-4 py-[10px]">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/settings-02.svg" class="object-cover" alt="Plus icon">
                          <p class="text-white font-medium text-base">Chat setting</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <!-- Gift Panel -->
          <aside data-sidebar-pannel id="giftPanel" class="backdrop-blur-[25px] backdrop-blur-lg lg:h-full h-auto lg:relative absolute bottom-0 left-0 w-full lg:w-[400px] bg-black/50 lg:rounded-card shadow-control flex-col justify-center items-center" v-show="meeting.activePanel === 'gift'">
            <div class="flex flex-col justify-between h-full">
              <!-- Settings Header & Content -->
              <div class="p-4 flex lg:bg-transparent flex-col gap-4 flex-1 w-full">
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col">
                    <div class=" flex items-center justify-between w-full">
                      <div class="flex items-center gap-1">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/gift-02-grey.svg" class="w-[16px] h-[16px] object-cover"/>
                        <h3 class="text-gray-400 text-center font-medium text-[12px]">
                          Send gifts
                        </h3>
                      </div>
                      <div @click="setActivePanel('chat')" class="flex">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/x-close-grey.svg" class="w-6 h-6 object-cover cursor-pointer" id="giftCloseBtn">
                      </div>
                    </div>

                    <div class="mt-4 grid md:grid-cols-8 lg:grid-cols-3 grid-cols-4 gap-4 lg:gap-2">
                      <div class="cursor-pointer h-[120px] p-2 flex flex-col justify-center items-center">
                        <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/gift-icon-1.png" class="w-[76px] h-[76px] object-cover">
                        <div class="flex items-center mt-2 gap-2">
                          <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/pngs/currency-icon.svg" class="w-5 h-5 object-cover">
                          <p class="text-white text-sm font-medium ">380</p>
                        </div>
                      </div>
                      <!-- More gift items would go here -->
                    </div>
                  </div>
                </div>
              </div>
              <!-- Default Footer: Add Custom Gift -->
              <div id="giftFooterDefault" class="px-4 py-2 w-full">
                <div class="btn w-full">
                  <button class="flex px-4 py-[10px] flex justify-center items-center rounded-full w-full bg-brand-primary">
                    <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/plus.svg" alt="">
                    <p class="font-semibold text-gray-950  text-base">Add Custom Gift </p>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `,
  setup() {
    function triggerStart() {
      document.querySelector("[data-start]")?.click();
      window.dispatchEvent(
        new CustomEvent("enableState", { detail: "connectingSubstate" })
      );
    }

    return { 
      meeting: window.vueState.meeting, 
      triggerStart, 
      setActivePanel: window.vueState.setActivePanel, 
      toggleActivePanel: window.vueState.toggleActivePanel, 
      toggleVideoFeed: window.vueState.toggleVideoFeed, 
      toggleAudioFeed: window.vueState.toggleAudioFeed, 
      disconnectChimeCall: window.vueState.disconnectChimeCall 
    };
  },
});

// Export to global
if (!window.VueComponents) window.VueComponents = {};
window.VueComponents.WaitingConnected = WaitingConnected;
})();

