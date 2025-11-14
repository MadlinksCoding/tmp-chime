// Vue Component Templates - EXTRACTED FROM ORIGINAL WORKING CODE
// Individual component definitions with their templates

// Import Vue from global
(function() {
const { defineComponent, ref, onMounted } = Vue;

// ---- Components ----
const MediaCardsPanel = defineComponent({
  name: "MediaCardsPanel",
  setup() {
    // Card selection data
    const media = ref([]);
    
    // Selection state
    const selected = ref({
      media: [],
    });

    // Fetch media from API
    async function fetchMedia() {
      try {
        const res = await fetch("https://new-stage.fansocial.app/wp-json/api/media/list?creator_id=1&count=100&mock=1");
        if (!res.ok) throw new Error("Failed to fetch media");
        const data = await res.json();
        
        if (data.status === "success" && Array.isArray(data.results)) {
          media.value = data.results.map((item) => {
            let durationOrCount = null;
            if (item.type === "video" && item.video_duration_formatted) {
              durationOrCount = item.video_duration_formatted;
            } else if (item.type === "audio" && item.audio_duration_formatted) {
              durationOrCount = item.audio_duration_formatted;
            } else if (item.type === "image-gallery" && item.gallery_count_formatted) {
              durationOrCount = item.gallery_count_formatted;
            }

            let typeIcon = "camera-03";
            if (item.type === "audio") typeIcon = "recording-02";
            if (item.type === "video") typeIcon = "play-square";
            if (item.type === "image-gallery") typeIcon = "image-02";

            return {
              ...item,
              typeIcon,
              title: item.title || 'No title',
              description: item.description || 'Lorem ipsum dolor',
              background_image: item.thumbnail_url || "https://picsum.photos/seed/m1/900/600",
              durationOrCount: durationOrCount,
            };
          });
        } else {
          media.value = [];
          console.warn("No media results found");
        }
      } catch (err) {
        console.error("Error fetching media:", err);
      }
    }

    // Lifecycle hook
    onMounted(() => {
      fetchMedia();
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
      if (item.is_p2v && item.is_subscription) {
        return "Subscribe or Buy";
      } else if (item.is_p2v) {
        return "Buy";
      } else if (item.is_subscription) {
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
          type: item.type,
          durationOrCount: item.durationOrCount,
          creator: item.creator,
          thumbnail_url: item.thumbnail_url,
          title: item.title,
          is_subscription: item.is_subscription,
          subscription: {
            product_id: item.subscription?.product_id || null,
            variation_id: item.subscription?.variation_id || null,
            price: item.subscription?.price || 0,
          },
          is_p2v: item.is_p2v,
          p2v: {
            product_id: item.p2v?.product_id || null,
            price: item.p2v?.price || 0,
          }
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
      media,
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
    <aside data-media-cards-panel class="z-[99999] flex flex-col justify-between lg:w-40 h-screen sm:h-full lg:h-full md:h-[730px] absolute top-0 overflow-y-auto g-2 lg:rounded-card bg-black/50 shadow-control lg:flex w-full backdrop-blur-md flex-col">
      <!-- Card Selection System -->
      <div class="p-4 bg-black/50 rounded-lg flex-1 h-full">
        <div class="flex justify-between">
          <span @click="setActivePanel('chat');" class="text-white cursor-pointer fs-4">
            Cancel
          </span>
          <span class="text-[#EAECF0] font-bold mb-4 fs-4">Attach media</span>
          <span class="w-[51px]"> </span>
        </div>

        <!-- MEDIA — selection cards -->
        <section class="mb-6 h-full overflow-y-auto">
          <div class="flex items-center justify-between mb-2">
          <!--  <h3 class="font-semibold text-white">Media</h3> -->
            <div class="absolute left-0 bottom-0 p-4 w-full z-10">
              <!-- selected media length-->
              <button @click="pushToChat('media')" class="px-4 py-[10px] bg-[#07F468] text-black text-sm rounded-full w-full">
                Send to chat 
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-1">
            <div v-for="m in media" :key="m.id" @click="toggle('media', m)" class="p-[6px] cursor-pointer"
              :class="isSelected('media', m.id) ? 'border-l-2 border-[#FF0066] bg-gradient-pink' : ''" tabindex="0"
              role="button" :aria-pressed="isSelected('media', m.id)">
              <div class="flex flex-col">
                <div class="w-full relative aspect-[179/103.11] overflow-hidden"
                  :style="{backgroundImage:'url('+m.background_image+')', backgroundSize:'cover', backgroundPosition:'center'}">
                  <div class="absolute bg-black/50 py-[1px] px-1 top-0 left-0">
                    <div class="flex gap-1">
                      <img :src="'/wp-content/plugins/fansocial/assets/icons/svg/' + m.typeIcon + '.svg'" alt="" class="w-[16px] h-[16px] attach-media-icon">
                      <p v-if="m.durationOrCount > 0" class="text-xs text-white font-medium">
                        {{ m.durationOrCount }}
                      </p>
                    </div>
                  </div>
                  <div
                    class="absolute bottom-0 left-0 px-[6px] py-1 bg-[#FF0066] flex items-center justify-center">
                    <p class="text-[12px] text-white leading-[18px]">
                      {{ accessLabel(m) }}
                    </p>
                  </div>
                </div>
                <div class="pt-1">
                  <p class="text-gray-200 line-clamp-2 text-[14px] font-medium">
                    {{ m.title }}
                  </p>
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
window.VueComponents.MediaCardsPanel = MediaCardsPanel;
})();
