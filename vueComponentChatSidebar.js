// Chat Sidebar Component - Chat, Gift, Media, Merch, Subscription Panels

(function() {
const { defineComponent } = Vue;

const ChatSidebar = defineComponent({
  name: "ChatSidebar",
  components: {
    MediaCardsPanel: window.VueComponents?.MediaCardsPanel,
    MerchCardsPanel: window.VueComponents?.MerchCardsPanel,
    SubscriptionCardsPanel: window.VueComponents?.SubscriptionCardsPanel,
  },
  template: `
    <div class="chat-sidebar-wrapper">
      <!-- Chat Panel - Always Visible -->
      <aside data-sidebar-pannel id="chatPanel" class="lg:w-40 h-full sm:h-screen lg:h-full md:h-screen relative overflow-y-auto g-2 bg-black/50 shadow-control w-full backdrop-blur-md flex flex-col">
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

      <!-- Media Cards Panel -->
      <MediaCardsPanel v-show="meeting.activePanel === 'mediaCards'" />

      <!-- Merch Cards Panel -->
      <MerchCardsPanel v-show="meeting.activePanel === 'merchCards'" />

      <!-- Subscription Cards Panel -->
      <SubscriptionCardsPanel v-show="meeting.activePanel === 'subscriptionCards'" />
    </div>
  `,
  setup() {
    return { 
      meeting: window.vueState.meeting,
      setActivePanel: window.vueState.setActivePanel,
      toggleActivePanel: window.vueState.toggleActivePanel,
    };
  },
});

// Export to global
if (!window.VueComponents) window.VueComponents = {};
window.VueComponents.ChatSidebar = ChatSidebar;
})();

