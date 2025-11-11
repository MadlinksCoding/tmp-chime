// Merch and Subscription Components - EXTRACTED FROM ORIGINAL WORKING CODE

(function() {
const { defineComponent, ref, onMounted } = Vue;

const MerchCardsPanel = defineComponent({
  name: "MerchCardsPanel",
  setup() {
    // Card selection data
    const merch = ref([]);

    // Selection state
    const selected = ref({
      merch: [],
    });

    // Fetch merch from API
    async function fetchMerch() {
      try {
        const res = await fetch("https://new-stage.fansocial.app/wp-json/api/products/list?creator_id=1&count=100&mock=1");
        if (!res.ok) throw new Error("Failed to fetch merch");
        const data = await res.json();
        
        if (data.status === "success" && Array.isArray(data.results)) {
          merch.value = data.results.filter((item) => !item.is_out_of_stock && (!item.is_coming_soon || item.can_preorder)).map((item) => {
            return {
              ...item,
              background_image: (Array.isArray(item.gallery) && item.gallery.length > 0) ? item.gallery[0] : "https://picsum.photos/seed/m2/900/600",
              title: item.name || 'No title',
              regular_price: item.regular_price || 0,
              sale_price: item.sale_price || 0,
              price: item.price || 0,
            };
          });
        } else {
          merch.value = [];
          console.warn("No merch results found");
        }
      } catch (err) {
        console.error("Error fetching merch:", err);
      }
    }

    // Lifecycle hook
    onMounted(() => {
      fetchMerch();
    });

    // Helper functions
    function isSelected(scope, id) {
      return selected.value[scope].some((item) => item.id === id);
    }

    function toggle(scope, item) {
      const index = selected.value[scope].findIndex(
        (selectedItem) => selectedItem.id === item.id
      );
      if (index > -1) {
        selected.value[scope].splice(index, 1);
      } else {
        selected.value[scope].push(item);
      }
    }

    function accessLabel(item) {
      if (item.canBuy && item.canSubscribe) {
        return "Subscribe or Buy";
      } else if (item.canBuy) {
        return "Buy";
      } else if (item.canSubscribe) {
        return "Subscribe";
      }
      return "View";
    }

    function pct(value) {
      return Math.round(value);
    }

    // Prevent duplicate calls with message tracking
    let sentMessages = new Set();
    let isSendingCards = false;

    function pushToChat(scope, singleItem = null) {
      const now = Date.now();

      // Prevent duplicate calls
      if (isSendingCards) {
        console.log(
          `[pushToChat] Already sending cards, ignoring duplicate call`
        );
        return;
      }

      const itemsToSend = singleItem
        ? [singleItem]
        : selected.value[scope];

      if (itemsToSend.length === 0) {
        console.log(`No ${scope} items selected`);
        return;
      }

      isSendingCards = true;

      // Create payload for each item with unique message ID
      const messageId = `${scope}_${now}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const payload = itemsToSend.map((item) => ({
        scope: scope,
        item: {
          id: item.id,
          discount_percentage: item.discount_percentage,
          creator: item.creator,
          gallery: item.gallery,
          title: item.title || 'No title',
          can_subscribe: item.can_subscribe,
          subscribe_data: item.can_subscribe ? {
            price: item.subscribe_data?.price || 0,
          } : null,
          can_buy: item.can_buy,
          price: item.price || 0,
          tier_id: item.tier_id || null,
        },
        messageId: messageId,
      }));

      // Track this message to prevent duplicates
      sentMessages.add(messageId);

      console.log(`[pushToChat] Sending ${scope} cards:`, payload);

      // Dispatch ingest-cards event (this will be caught by our listener for local rendering)
      window.dispatchEvent(
        new CustomEvent("ingest-cards", { detail: payload })
      );

      // Send through Chime socket to all participants
      try {
        // Dispatch event to send chat promotion via socket
        window.dispatchEvent(
          new CustomEvent("sendChatPromotion", {
            detail: { payload },
          })
        );
        console.log(
          `[pushToChat] Card promotion event dispatched for socket sending`
        );
      } catch (error) {
        console.error(
          "[pushToChat] Failed to send cards via socket:",
          error
        );
      }

      // Clear selection after sending
      if (!singleItem) {
        selected.value[scope] = [];
      }

      // Reset flag after sending and clean up old message IDs
      setTimeout(() => {
        isSendingCards = false;
        // Clean up old message IDs (keep only last 10)
        if (sentMessages.size > 10) {
          const messageArray = Array.from(sentMessages);
          sentMessages.clear();
          messageArray.slice(-10).forEach((id) => sentMessages.add(id));
        }
      }, 1000);

      window.vueState.setActivePanel('chat');
    }

    return {
      meeting: window.vueState.meeting,
      merch,
      selected,
      isSelected,
      toggle,
      accessLabel,
      pct,
      pushToChat,
      setActivePanel: window.vueState.setActivePanel,
    };
  },
  template: `
    <aside data-media-cards-panel class="z-[99999] flex flex-col justify-between lg:w-40 h-screen sm:h-full lg:h-full md:h-[730px] absolute lg:relative overflow-y-auto g-2 lg:rounded-card bg-black/50 shadow-control lg:flex w-full backdrop-blur-md flex-col">
      <!-- Card Selection System -->
      <div class="p-4 bg-black/50 rounded-lg flex-1 h-full">
        <div class="flex justify-between">
          <span @click="setActivePanel('chat');" class="text-white cursor-pointer">
            Cancel
          </span>
          <h2 class="text-[#EAECF0] font-bold mb-4">Attach Product</h2>
          <span class="w-[51px]"> </span>
        </div>

        <!-- MERCH — selection cards -->
        <section class="mb-6 h-full overflow-y-auto">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-white">Merch</h3>
            <div class="absolute left-0 bottom-0 p-4 w-full z-10">
              <!-- selected media length-->
              <button @click="pushToChat('merch')" class="px-4 py-[10px] bg-[#07F468] text-black text-sm rounded-full w-full">
                Send to chat
              </button>
            </div>
          </div>
          <div class="flex flex-wrap items-start justify-start">
            <div
              v-for="p in merch"
              :key="p.id"
              @click="toggle('merch', p)"
              tabindex="0"
              role="button"
              :aria-pressed="isSelected('merch', p.id)"
              class="merch-media-wrapper w-[18rem] aspect-square p-1 inline-flex justify-start items-center gap-2.5 cursor-pointer select-none"
            >
              <div
                class="MerchThumb flex-1 h-full relative rounded-lg overflow-hidden"
                :class="isSelected('merch', p.id) ? 'ring-2 ring-[#07F468] rounded-lg' : ''"
                :style="{backgroundImage:'url('+p.background_image+')', backgroundSize:'cover', backgroundPosition:'center'}"
              >
                <span v-if="p.discount_percentage > 0" class="ml-auto text-black text-xs font-bold bg-yellow-400 pl-[0.875rem] pr-2 py-0.5 absolute right-0 clip-path-1">
                  {{ p.discount_percentage }}% OFF
                </span>
                <div class="merch-media-content p-4 w-full h-[7.125rem] left-0 bottom-0 absolute bg-black/10 backdrop-blur-[3px] inline-flex flex-col justify-start items-start gap-1"
                  :class="p.regular_price && p.price < p.regular_price ? 'bg-yellow1' : ''">
                  <div class="self-stretch shadow-[0px_0px_16px_-34px_rgba(0,0,0,0.50)] h-full flex flex-col justify-between items-start gap-2">
                    <div class="PostContent self-stretch text-white text-xs font-normal leading-[1.125rem] tracking-[0.025rem]">
                      {{ p.title }}
                    </div>
                    <div class="self-stretch inline-flex justify-start items-end gap-1">
                      <div class="PostContent text-white text-xs font-normal leading-tight">USD</div>
                      <span v-if="p.regular_price && p.price < p.regular_price" class="text-white/60 line-through text-white text-[0.625rem] font-medium leading-tight">
                        \${{ p.regular_price.toFixed(2) }}
                      </span>
                      <div class="PostContent text-white text-base font-medium leading-tight">
                        \${{ p.price.toFixed(2) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  `
});

const SubscriptionCardsPanel = defineComponent({
  name: "SubscriptionCardsPanel",
  setup() {
    // Card selection data
    const subs = ref([]);

    // Selection state
    const selected = ref({
      subs: [],
    });

    // Fetch subscriptions from API
    async function fetchSubscriptions() {
      try {
        const res = await fetch("https://new-stage.fansocial.app/wp-json/api/subscriptions/plans/list?creator_id=1061&count=100&mock=1");
        if (!res.ok) throw new Error("Failed to fetch subscriptions");
        const data = await res.json();
        
        if (data.status === "success" && Array.isArray(data.results)) {
          subs.value = data.results.filter((item) => item.status === 'publish').map((item) => {
            return {
              ...item,
              background_image: item.background_image || "https://picsum.photos/seed/s1/900/600",
              title: item.title || "No title",
              price: item.price || 0,
              regular_price: item.regular_price || item.price,
            };
          });
        } else {
          subs.value = [];
          console.warn("No subscription results found");
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
      }
    }

    // Lifecycle hook
    onMounted(() => {
      fetchSubscriptions();
    });

    // Helper functions
    function isSelected(scope, id) {
      return selected.value[scope].some((item) => item.id === id);
    }

    function toggle(scope, item) {
      const index = selected.value[scope].findIndex(
        (selectedItem) => selectedItem.id === item.id
      );
      if (index > -1) {
        selected.value[scope].splice(index, 1);
      } else {
        selected.value[scope].push(item);
      }
    }

    function accessLabel(item) {
      if (item.canBuy && item.canSubscribe) {
        return "Subscribe or Buy";
      } else if (item.canBuy) {
        return "Buy";
      } else if (item.canSubscribe) {
        return "Subscribe";
      }
      return "View";
    }

    function pct(value) {
      return Math.round(value);
    }

    // Prevent duplicate calls with message tracking
    let sentMessages = new Set();
    let isSendingCards = false;

    function pushToChat(scope, singleItem = null) {
      const now = Date.now();

      // Prevent duplicate calls
      if (isSendingCards) {
        console.log(
          `[pushToChat] Already sending cards, ignoring duplicate call`
        );
        return;
      }

      const itemsToSend = singleItem
        ? [singleItem]
        : selected.value[scope];

      if (itemsToSend.length === 0) {
        console.log(`No ${scope} items selected`);
        return;
      }

      isSendingCards = true;

      // Create payload for each item with unique message ID
      const messageId = `${scope}_${now}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const payload = itemsToSend.map((item) => ({
        scope: scope,
        item: {
          id: item.id,
          creator: item.creator,
          background_image: item.background_image,
          title: item.title,
          price: item.price || 0,
        },
        messageId: messageId,
      }));

      // Track this message to prevent duplicates
      sentMessages.add(messageId);

      console.log(`[pushToChat] Sending ${scope} cards:`, payload);

      // Dispatch ingest-cards event (this will be caught by our listener for local rendering)
      window.dispatchEvent(
        new CustomEvent("ingest-cards", { detail: payload })
      );

      // Send through Chime socket to all participants
      try {
        // Dispatch event to send chat promotion via socket
        window.dispatchEvent(
          new CustomEvent("sendChatPromotion", {
            detail: { payload },
          })
        );
        console.log(
          `[pushToChat] Card promotion event dispatched for socket sending`
        );
      } catch (error) {
        console.error(
          "[pushToChat] Failed to send cards via socket:",
          error
        );
      }

      // Clear selection after sending
      if (!singleItem) {
        selected.value[scope] = [];
      }

      // Reset flag after sending and clean up old message IDs
      setTimeout(() => {
        isSendingCards = false;
        // Clean up old message IDs (keep only last 10)
        if (sentMessages.size > 10) {
          const messageArray = Array.from(sentMessages);
          sentMessages.clear();
          messageArray.slice(-10).forEach((id) => sentMessages.add(id));
        }
      }, 1000);

      window.vueState.setActivePanel('chat');
    }

    return {
      meeting: window.vueState.meeting,
      subs,
      selected,
      isSelected,
      toggle,
      accessLabel,
      pct,
      pushToChat,
      setActivePanel: window.vueState.setActivePanel,
    };
  },
  template: `
    <aside data-media-cards-panel class="z-[99999] flex flex-col justify-between lg:w-40 h-screen sm:h-full lg:h-full md:h-[730px] absolute lg:relative overflow-y-auto g-2 lg:rounded-card bg-black/50 shadow-control lg:flex w-full backdrop-blur-md flex-col">
      <!-- Card Selection System -->
      <div class="p-4 bg-black/50 rounded-lg flex-1 h-full">
        <div class="flex justify-between">
          <span @click="setActivePanel('chat');" class="text-white cursor-pointer">
            Cancel
          </span>
          <h2 class="text-[#EAECF0] font-bold mb-4">Attach Subscription</h2>
          <span class="w-[51px]"> </span>
        </div>

        <!-- SUBS — selection cards -->
        <section class="mb-6 h-full overflow-y-auto">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-white">Subscriptions</h3>
            <div class="absolute left-0 bottom-0 p-4 w-full z-10">
              <!-- selected media length-->
              <button @click="pushToChat('subs')" class="px-4 py-[10px] bg-[#07F468] text-black text-sm rounded-full w-full">
                Send to chat
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            <div v-for="s in subs" :key="s.id" @click="toggle('subs', s)" tabindex="0" role="button"
              :aria-pressed="isSelected('subs', s.id)"
              class="attach-subs-card relative w-[344px] max-h-[188px] overflow-hidden cursor-pointer border border-white/10"
              :class="isSelected('subs', s.id) ? ' selected-green' : ''">
              <img :src="s.background_image" alt="Subscription background" class="w-full h-full opacity-50 object-cover" />
              <div style="background: linear-gradient(90deg, rgba(255, 0, 102, 0.1875) 0%, rgba(255, 0, 102, 0.125) 50%, rgba(255, 0, 102, 0) 100%);"
                class="absolute inset-x-0 top-0 border-l-2 border-[#FF0066] h-full text-white p-3">
                <div class="flex items-center justify-between">
                  <div class="flex flex-col w-full">
                    <div class="flex items-center gap-1">
                      <h2 class="font-semibold text-2xl text-white">{{ s.title }}</h2>
                    </div>
                    <div class="flex items-center mt-2 gap-3">
                      <div class="flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.33333 5.97689C6.33333 5.6587 6.33333 5.4996 6.39983 5.41078C6.45778 5.33338 6.54648 5.28496 6.64292 5.27807C6.75359 5.27016 6.88742 5.3562 7.15507 5.52826L10.3021 7.55137C10.5344 7.70068 10.6505 7.77533 10.6906 7.87026C10.7257 7.9532 10.7257 8.0468 10.6906 8.12974C10.6505 8.22467 10.5344 8.29932 10.3021 8.44863L7.15507 10.4717C6.88742 10.6438 6.75359 10.7298 6.64292 10.7219C6.54648 10.715 6.45778 10.6666 6.39983 10.5892C6.33333 10.5004 6.33333 10.3413 6.33333 10.0231V5.97689Z" stroke="#EAECF0" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
                          <path d="M2 5.2C2 4.0799 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2H10.8C11.9201 2 12.4802 2 12.908 2.21799C13.2843 2.40973 13.5903 2.71569 13.782 3.09202C14 3.51984 14 4.0799 14 5.2V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.0799 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V5.2Z" stroke="#EAECF0" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="text-gray-200 text-xs">{{ s.stats.media.image }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.84798 13.8186L7.24567 9.42091C7.50968 9.1569 7.64169 9.0249 7.79391 8.97544C7.9278 8.93193 8.07203 8.93193 8.20593 8.97544C8.35815 9.0249 8.49016 9.15691 8.75417 9.42091L13.1225 13.7893M9.33325 10L11.2457 8.08758C11.5097 7.82357 11.6417 7.69156 11.7939 7.6421C11.9278 7.5986 12.072 7.5986 12.2059 7.6421C12.3581 7.69156 12.4902 7.82357 12.7542 8.08758L14.6666 10M6.66659 6C6.66659 6.73638 6.06963 7.33333 5.33325 7.33333C4.59687 7.33333 3.99992 6.73638 3.99992 6C3.99992 5.26362 4.59687 4.66667 5.33325 4.66667C6.06963 4.66667 6.66659 5.26362 6.66659 6ZM4.53325 14H11.4666C12.5867 14 13.1467 14 13.5746 13.782C13.9509 13.5903 14.2569 13.2843 14.4486 12.908C14.6666 12.4802 14.6666 11.9201 14.6666 10.8V5.2C14.6666 4.0799 14.6666 3.51984 14.4486 3.09202C14.2569 2.71569 13.9509 2.40973 13.5746 2.21799C13.1467 2 12.5867 2 11.4666 2H4.53325C3.41315 2 2.85309 2 2.42527 2.21799C2.04895 2.40973 1.74299 2.71569 1.55124 3.09202C1.33325 3.51984 1.33325 4.0799 1.33325 5.2V10.8C1.33325 11.9201 1.33325 12.4802 1.55124 12.908C1.74299 13.2843 2.04895 13.5903 2.42527 13.782C2.85309 14 3.41315 14 4.53325 14Z" stroke="#EAECF0" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="text-gray-200 text-xs">{{ s.stats.media.video }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2 6.66667L2 9.33333M5 7.33333V8.66667M8 4V12M11 2V14M14 6.66667V9.33333" stroke="#EAECF0" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="text-gray-200 text-xs">{{ s.stats.media.audio }}</span>
                      </div>
                    </div>
                    <div class="flex gap-2 mt-2 items-end">
                      <div class="flex items-baseline">
                        <p class="text-sm font-semibold text-[#FFED29]">USD$</p>
                        <p class="text-[#FFED29] font-semibold text-[26px]">{{ s.price.toFixed(2) }}</p>
                      </div>
                      <div class="flex flex-col">
                        <div v-if="s.discount > 0" class="flex bg-black items-center rounded-md px-1">
                          <img src="assets/sub-svgs/flash.svg" alt="" class="left-[-8px] relative">
                          <p class="text-white text-xs">-{{ s.discount_percentage }}%</p>
                        </div>
                        <p class="text-xs font-medium text-[#FCE40D]">/{{ s.billing_period }}</p>
                      </div>
                    </div>
                    <p class="text-xs font-semibold text-[#FCE40D]">was \${{ s.regular_price.toFixed(2) }}</p>
                  </div>
                  <div class="flex justify-end w-[97%] bottom-0 absolute">
                    <div class="flex w-full items-center gap-2">
                      <span class="text-xs font-medium text-[#FF0066]">See perks</span>
                      <img src="assets/sub-svgs/chevron-down-double.svg" alt="">
                    </div>
                    <img src="assets/svgs/Union.svg" alt="">
                    <div style="background: linear-gradient(180deg, #FF0066 0%, #FF492E 100%);" class="h-10 flex items-center justify-center">
                      <button @click.stop="toggle('subs', s)" class="font-semibold px-4 text-white text-[16px]">
                        {{ isSelected('subs', s.id) ? 'REMOVE' : 'SUBSCRIBE' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  `
});

// Export to global
if (!window.VueComponents) window.VueComponents = {};
window.VueComponents.MerchCardsPanel = MerchCardsPanel;
window.VueComponents.SubscriptionCardsPanel = SubscriptionCardsPanel;
})();
