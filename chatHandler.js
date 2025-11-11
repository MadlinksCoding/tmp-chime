// Chat Input Handler - Integrates with existing chimeHandler
// Handles chat input, send button, enter key, and emoji insertion
// Uses existing styled chat UI (data-chat-messages-global container)

(function initChatHandler(retryCount = 0) {
  const MAX_RETRIES = 20; // Stop after 10 seconds (20 * 500ms)
  
  console.log('[chatHandler] Initializing... (attempt ' + (retryCount + 1) + ')');

  const chatInput = document.querySelector('[data-chat-input]');
  const chatSendBtn = document.querySelector('[data-chat-send]');
  const chatMessages = document.querySelector('[data-chat-messages-global]');

  console.log('[chatHandler] 🔍 Looking for elements:', {
    chatInput: !!chatInput,
    chatSendBtn: !!chatSendBtn,
    chatMessages: !!chatMessages
  });

  if (!chatInput || !chatSendBtn || !chatMessages) {
    if (retryCount < MAX_RETRIES) {
      console.log('[chatHandler] ⏳ Elements not found, retrying in 500ms...');
      setTimeout(() => initChatHandler(retryCount + 1), 500);
    } else {
      console.warn('[chatHandler] ❌ Chat elements not found after ' + MAX_RETRIES + ' attempts. Will initialize when WaitingConnected component mounts.');
    }
    return;
  }

  console.log('[chatHandler] ✅ Elements found, attaching handlers');
  console.log('[chatHandler] 📍 chatInput:', chatInput);
  console.log('[chatHandler] 📍 chatSendBtn:', chatSendBtn);
  console.log('[chatHandler] 📍 chatMessages:', chatMessages);

  // Send chat message function
  function sendChatMessage() {
    console.log('[chatHandler] 🔔 sendChatMessage() called');
    const message = chatInput.value.trim();
    console.log('[chatHandler] 📝 Message value:', message);
    if (!message) {
      console.log('[chatHandler] ⚠️ Message is empty, not sending');
      return;
    }

    console.log('[chatHandler] ✅ Sending message:', message);

    // Create payload for chimeHandler
    const payload = {
      message: message,
      timestamp: Date.now(),
      sender: 'You' // This should come from user data
    };

    // Send via existing chimeHandler
    if (window.chimeHandler && typeof window.chimeHandler.handleDataSend === 'function') {
      window.chimeHandler.handleDataSend('chat', payload);
      console.log('[chatHandler] Message sent via chimeHandler');
    } else {
      console.warn('[chatHandler] chimeHandler not available');
    }

    // Add to local chat UI
    renderChatMessage(message, 'You', true);

    // Clear input
    chatInput.value = '';
  }

  // Render chat message using existing styles
  function renderChatMessage(message, sender, isLocal = false) {
    const messageDiv = document.createElement('div');
    
    if (isLocal) {
      // Sender message (right side, tan/brown background)
      messageDiv.className = 'mt-1 bg-[#6b665d] rounded-t-[20px] rounded-bl-[20px] px-3 py-2 w-max ml-auto sender-msg';
      messageDiv.innerHTML = `
        <p class="text-white font-normal font-poppins text-base">${escapeHtml(message)}</p>
      `;
    } else {
      // Receiver message (left side, dark background)
      messageDiv.className = 'mt-1 bg-[#00000066] rounded-t-[20px] rounded-br-[20px] px-3 py-2 w-max receiver-msg';
      messageDiv.innerHTML = `
        <p class="text-white font-normal font-poppins text-base">${escapeHtml(message)}</p>
      `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Send button click
  chatSendBtn.addEventListener('click', (e) => {
    console.log('[chatHandler] 🖱️ Send button clicked');
    e.preventDefault();
    sendChatMessage();
  });

  // Enter key to send
  chatInput.addEventListener('keypress', (e) => {
    console.log('[chatHandler] ⌨️ Key pressed:', e.key);
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('[chatHandler] ✅ Enter key detected, sending message');
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Listen for emoji selection from emoji picker
  window.addEventListener('emojiSelected', (e) => {
    const emoji = e.detail.emoji;
    chatInput.value += emoji;
    chatInput.focus();
  });

  // Listen for incoming chat messages (from chimeHandler)
  window.addEventListener('receiveChatMessage', (e) => {
    console.log('[chatHandler] 📨 Received chat message event:', e.detail);
    const { message, sender } = e.detail || {};
    if (message) {
      console.log('[chatHandler] ✅ Rendering incoming message from:', sender);
      renderChatMessage(message, sender || 'Unknown', false);
    } else {
      console.warn('[chatHandler] ⚠️ Received chat event but no message content');
    }
  });

  console.log('[chatHandler] ✅ Chat handler initialized');

  // Initialize emoji picker
  initEmojiPicker();
  
  // Initialize plus menu
  initPlusMenu();
  
  // Expose globally for WaitingConnected component and debugging
  window.chatHandlerInitialized = true;
  window.testChatSend = function(testMessage) {
    console.log('[chatHandler] 🧪 Testing chat send with message:', testMessage);
    chatInput.value = testMessage || 'Test message from console';
    sendChatMessage();
  };
  
  console.log('[chatHandler] 💡 You can test chat by calling: window.testChatSend("hello")');
})();

// Expose initialization function globally
window.initChatHandlerManually = function() {
  console.log('[chatHandler] Manual initialization requested');
  // Clear any existing listeners to avoid duplicates
  const chatInput = document.querySelector('[data-chat-input]');
  const chatSendBtn = document.querySelector('[data-chat-send]');
  
  if (chatInput && chatSendBtn) {
    console.log('[chatHandler] ✅ Elements found, re-initializing');
    // Re-run initialization with retry count 0
    window.location.reload(); // Simple reload for now
  }
};

// Emoji Picker Initialization
let emojiPickerMode = 'chat'; // 'chat' or 'reaction'

function initEmojiPicker() {
  const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾"];

  function populateEmojiGrid() {
    const grid = document.querySelector("[data-emoji-grid]");
    if (!grid) return;
    
    grid.innerHTML = "";
    emojis.forEach((emoji) => {
      const emojiEl = document.createElement("div");
      emojiEl.textContent = emoji;
      emojiEl.className = "cursor-pointer hover:bg-gray-600 rounded text-center";
      emojiEl.addEventListener("click", () => {
        if (emojiPickerMode === 'reaction') {
          // Send as reaction (center screen animation)
          window.dispatchEvent(new CustomEvent("sendReaction", { detail: { reaction: emoji } }));
        } else {
          // Add to chat input
          window.dispatchEvent(new CustomEvent('emojiSelected', { detail: { emoji } }));
        }
        hideEmojiPicker();
      });
      grid.appendChild(emojiEl);
    });
  }

  function showEmojiPicker(mode = 'chat') {
    emojiPickerMode = mode;
    const picker = document.getElementById("emojiPicker");
    if (picker) {
      picker.classList.remove("hidden");
      populateEmojiGrid();
    }
  }

  function hideEmojiPicker() {
    const picker = document.getElementById("emojiPicker");
    if (picker) {
      picker.classList.add("hidden");
    }
    emojiPickerMode = 'chat';
  }

  // Chat emoji button
  const chatEmojiBtn = document.getElementById("emojiToggleBtn");
  if (chatEmojiBtn) {
    chatEmojiBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showEmojiPicker('chat');
    });
  }

  // Listen for reaction button clicks (react-button has aria-label="Toggle emoji")
  document.addEventListener("click", (e) => {
    const target = e.target.closest('[aria-label="Toggle emoji"]');
    if (target && target.id !== 'emojiToggleBtn') {
      e.preventDefault();
      e.stopPropagation();
      showEmojiPicker('reaction');
    }
  });

  // Close emoji picker when clicking outside
  document.addEventListener("click", (e) => {
    const picker = document.getElementById("emojiPicker");
    const emojiBtn = document.getElementById("emojiToggleBtn");
    const reactBtn = e.target.closest('[aria-label="Toggle emoji"]');
    if (picker && !picker.contains(e.target) && !emojiBtn?.contains(e.target) && !reactBtn) {
      hideEmojiPicker();
    }
  });

  console.log('[chatHandler] ✅ Emoji picker initialized (chat & reactions)');
}

// Plus Menu Initialization
function initPlusMenu() {
  const plusToggle = document.getElementById("plusMenuToggle");
  const plusPopup = document.getElementById("plusMenuPopup");
  
  if (!plusToggle || !plusPopup) {
    console.warn('[chatHandler] Plus menu elements not found');
    return;
  }

  // Toggle plus menu
  plusToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    plusPopup.classList.toggle("hidden");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!plusToggle.contains(e.target) && !plusPopup.contains(e.target)) {
      plusPopup.classList.add("hidden");
    }
  });

  // Close menu when any option inside is clicked (attach media/merch/subscription)
  plusPopup.addEventListener("click", (e) => {
    // Close the menu when clicking any item inside
    plusPopup.classList.add("hidden");
  });

  console.log('[chatHandler] ✅ Plus menu initialized');
}

// Card Rendering Functions
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function money(amount) {
  return '$' + (parseFloat(amount) || 0).toFixed(2);
}

function renderMediaCard(item) {
  let durationOrCount = item.durationOrCount || "";
  let typeIcon = "camera-03";
  if (item.type === "audio") typeIcon = "recording-02";
  if (item.type === "video") typeIcon = "play-square";
  if (item.type === "image-gallery") typeIcon = "image-02";

  const cardDiv = document.createElement("div");
  cardDiv.className = "mt-2";

  cardDiv.innerHTML = `
    <div class="border-l-2 border-[#FF0066] bg-gradient-pink p-[0.75rem] overflow-hidden">
      <div class="flex flex-col gap-[0.688rem]">
        <div class="flex items-center gap-1">
          <div class="flex items-center gap-1">
            <span>
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/star-07-pink.svg" alt="" class="w-[16px] h-[16px] aspect-344-198">
            </span>
            <span class="text-[#FB5BA2] text-[14px] leading-[1.25rem] italic font-bold">${escapeHtml(item.creator?.username || 'You')}</span>
          </div>
          <span class="text-[14px] text-[#D0D5DD] leading-[1.25rem] italic">shared a media:</span>
        </div>
        <div class="relative w-full">
          <div class="w-100">
            <img src="${item.thumbnail_url || "https://picsum.photos/seed/v1/900/600"}" alt="Sunday by the River - watch me catch a 10 kg..." class="w-full max-h-60 object-cover aspect-344-198" loading="lazy">
          </div>
          <div class="absolute top-1 left-1">
            <span class="px-1 py-[1px] flex items-center justify-center gap-[3px] bg-gray-600">
              <span>
                <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/${typeIcon}.svg" alt="" class="w-[1rem] h-[1rem] selected-media-icon">
              </span>
              ${durationOrCount ? `<span class="text-[11px] text-white">${escapeHtml(durationOrCount)}</span>` : ''}
            </span>
          </div>
          <div class="absolute bottom-2 left-2 hidden">
            <span class="px-1 py-[1px] flex items-center justify-center gap-[3px] text-[11px]  bg-pink-600 text-white">Buy Now</span>
          </div>
          <div class="absolute top-2 right-2 hidden">
            <span class="px-1 py-[1px] flex items-center justify-center gap-[3px] text-[11px]  bg-blue-600 text-white">media</span>
          </div>
        </div>
      </div>
      <div class="py-2 px-1">
        <div class="flex items-center justify-between gap-3">
          <div class="text-white font-medium text-base line-clamp-2">${escapeHtml(item.title || "No title")}</div>
          <span class="text-black text-xs px-2 hidden  bg-[#07F468]">$5.00</span>
        </div>
        <div class="flex w-full gap-2 mt-3">
          ${item.is_subscription ? `
          <button data-subscribe-button type="button" class="text-base w-1/2 bg-[#FF0066] text-white font-medium px-2 py-1 flex items-center justify-between">
            <span class="text-white font-medium">Subscribe</span> 
            <span class="text-white font-medium">${money(item.subscription?.price || 0)}</span>
          </button>
          ` : ''}
          ${item.is_p2v ? `
          <button data-p2v-button type="button" class="text-base w-1/2 bg-[#0133FB] text-white font-medium px-2 py-1 flex items-center justify-between">
            <span class="text-white font-medium">Buy</span> 
            <span class="text-white font-medium">${money(item.p2v?.price || 0)}</span>
          </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  const subscribeButton = cardDiv.querySelector("[data-subscribe-button]");
  if (subscribeButton) {
    subscribeButton.addEventListener("click", (e) => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          event: 'chime-card-subscribe',
          type: 'media',
          item_id: item.id,
          product_id: item.subscription?.product_id,
          variation_id: item.subscription?.variation_id,
        }, '*');
      }
    });
  }

  const p2vButton = cardDiv.querySelector("[data-p2v-button]");
  if (p2vButton) {
    p2vButton.addEventListener("click", () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          event: 'chime-card-buynow',
          type: 'media',
          item_id: item.id,
          product_id: item.p2v?.product_id,
        }, '*');
      }
    });
  }

  return cardDiv;
}

function renderMerchCard(item) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "mt-2";

  const discountHtml =
    item.discount_percentage
      ? `<span class="text-yellow-400 text-xs font-bold">${item.discount_percentage}% OFF</span>`
      : "";

  cardDiv.innerHTML = `
    <div class="border-l-2 border-[#FF0066] bg-gradient-pink p-[0.75rem] overflow-hidden">
      <div class="flex flex-col gap-[0.688rem]">
        <div class="flex items-center gap-1">
          <div class="flex items-center gap-1">
            <span>
              <img src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/star-07-pink.svg" alt="" class="w-[16px] h-[16px] aspect-344-198">
            </span>
            <span class="text-[#FB5BA2] text-[14px] leading-[1.25rem] italic font-bold">${escapeHtml(item.creator?.username || 'You')}</span>
          </div>
          <span class="text-[14px] text-[#D0D5DD] leading-[1.25rem] italic">shared a product:</span>
        </div>
        <div class="relative w-full">
          <div class="w-100">
            <img src="${(Array.isArray(item.gallery) && item.gallery.length > 0) ? item.gallery[0] : "https://picsum.photos/seed/m2/900/600"}" alt="Sunday by the River - watch me catch a 10 kg..." class="w-full max-h-60 object-cover aspect-344-198" loading="lazy">
          </div>
        </div>
      </div>
      <div class="py-2 px-1">
        <div class="flex items-center justify-between gap-3">
          <div class="text-white font-medium text-base line-clamp-2">${escapeHtml(item.title || "No title")}</div>
          <span class="text-black text-xs px-2 hidden  bg-[#07F468]">$5.00</span>
        </div>
        <div class="flex w-full gap-2 mt-3">
          ${item.can_subscribe && item.subscribe_data ? `
          <button data-subscribe-button type="button" class="text-base w-1/2 bg-[#FF0066] text-white font-medium px-2 py-1 flex items-center justify-between">
            <span class="text-white font-medium">Subscribe</span> 
            <span class="text-white font-medium">${money(item.subscribe_data.price || 0)}</span>
          </button>
          ` : ''}
          ${item.can_buy ? `<button data-buy-button type="button" class="text-base w-1/2 bg-[#0133FB] text-white font-medium px-2 py-1 flex items-center justify-between">
            <span class="text-white font-medium">Buy</span> 
            <span class="text-white font-medium">${money(item.price || 0)}</span>
          </button>` : ''}
        </div>
      </div>
    </div>
  `;

  const subscribeButton = cardDiv.querySelector("[data-subscribe-button]");
  if (subscribeButton) {
    subscribeButton.addEventListener("click", (e) => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          event: 'chime-card-subscribe',
          type: 'merch',
          item_id: item.id,
          product_id: item.tier_id,
          variation_id: item.tier_id,
        }, '*');
      }
    });
  }

  const buyButton = cardDiv.querySelector("[data-buy-button]");
  if (buyButton) {
    buyButton.addEventListener("click", () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          event: 'chime-card-buynow',
          type: 'merch',
          item_id: item.id,
          product_id: item.id,
        }, '*');
      }
    });
  }

  return cardDiv;
}

function renderSubscriptionCard(item) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "mt-2";

  cardDiv.innerHTML = `
    <div class="px-1 py-1 text-sm font-poppins flex flex-col">
      <div class="flex gap-1 items-center">
        <img class="w-[16px] h-[16px] aspect-344-198" src="https://new-stage.fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/star-07-pink.svg" alt="">
        <span class="font-semibold text-[#FB5BA2] text-sm">${escapeHtml(item.creator?.username || 'You')}</span>
        <p class="text-gray-300 italic font-normal font-poppins text-sm w-full">
          posted a subscription tier
        </p>
      </div>
      <div class="mt-2">
        <div class="relative w-[344px] max-h-[188px] bottom-0 overflow-hidden">
          <img src="${item.background_image || "https://picsum.photos/seed/s1/1200/800"}" alt="Sunday by the River - watch me catch a 10 kg..." class="w-full h-full opacity-50 object-cover" />
          
          <div style="background: linear-gradient(90deg, rgba(255, 0, 102, 0.1875) 0%, rgba(255, 0, 102, 0.125) 50%, rgba(255, 0, 102, 0) 100%);" class="absolute inset-x-0 top-0 border-l-2 border-[#FF0066] h-full  text-white p-4">
            <div class="absolute right-0 top-0 lg:hidden">
              <img class="h-5 w-5" src="assets/sub-svgs/x-close.svg" alt="">
            </div>
            <div class="flex items-center justify-between">
              <div class="flex flex-col w-full">
                <div class="flex items-center gap-1">
                  <h2 class="font-semibold text-2xl text-white">${escapeHtml(item.title || "No title")}</h2>
                </div>
                <div class="flex items-center mt-2 gap-3">
                  <div class="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.33333 5.97689C6.33333 5.6587 6.33333 5.4996 6.39983 5.41078C6.45778 5.33338 6.54648 5.28496 6.64292 5.27807C6.75359 5.27016 6.88742 5.3562 7.15507 5.52826L10.3021 7.55137C10.5344 7.70068 10.6505 7.77533 10.6906 7.87026C10.7257 7.9532 10.7257 8.0468 10.6906 8.12974C10.6505 8.22467 10.5344 8.29932 10.3021 8.44863L7.15507 10.4717C6.88742 10.6438 6.75359 10.7298 6.64292 10.7219C6.54648 10.715 6.45778 10.6666 6.39983 10.5892C6.33333 10.5004 6.33333 10.3413 6.33333 10.0231V5.97689Z" stroke="#EAECF0" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 5.2C2 4.0799 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2H10.8C11.9201 2 12.4802 2 12.908 2.21799C13.2843 2.40973 13.5903 2.71569 13.782 3.09202C14 3.51984 14 4.0799 14 5.2V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.0799 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V5.2Z" stroke="#EAECF0" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span class="text-gray-200 text-xs tracking-tiny">80</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.84798 13.8186L7.24567 9.42091C7.50968 9.1569 7.64169 9.0249 7.79391 8.97544C7.9278 8.93193 8.07203 8.93193 8.20593 8.97544C8.35815 9.0249 8.49016 9.15691 8.75417 9.42091L13.1225 13.7893M9.33325 10L11.2457 8.08758C11.5097 7.82357 11.6417 7.69156 11.7939 7.6421C11.9278 7.5986 12.072 7.5986 12.2059 7.6421C12.3581 7.69156 12.4902 7.82357 12.7542 8.08758L14.6666 10M6.66659 6C6.66659 6.73638 6.06963 7.33333 5.33325 7.33333C4.59687 7.33333 3.99992 6.73638 3.99992 6C3.99992 5.26362 4.59687 4.66667 5.33325 4.66667C6.06963 4.66667 6.66659 5.26362 6.66659 6ZM4.53325 14H11.4666C12.5867 14 13.1467 14 13.5746 13.782C13.9509 13.5903 14.2569 13.2843 14.4486 12.908C14.6666 12.4802 14.6666 11.9201 14.6666 10.8V5.2C14.6666 4.0799 14.6666 3.51984 14.4486 3.09202C14.2569 2.71569 13.9509 2.40973 13.5746 2.21799C13.1467 2 12.5867 2 11.4666 2H4.53325C3.41315 2 2.85309 2 2.42527 2.21799C2.04895 2.40973 1.74299 2.71569 1.55124 3.09202C1.33325 3.51984 1.33325 4.0799 1.33325 5.2V10.8C1.33325 11.9201 1.33325 12.4802 1.55124 12.908C1.74299 13.2843 2.04895 13.5903 2.42527 13.782C2.85309 14 3.41315 14 4.53325 14Z" stroke="#EAECF0" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span class="text-gray-200 text-xs tracking-tiny">100</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 6.66667L2 9.33333M5 7.33333V8.66667M8 4V12M11 2V14M14 6.66667V9.33333" stroke="#EAECF0" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span class="text-gray-200 text-xs tracking-tiny">70</span>
                  </div>
                </div> 
                <div class="flex gap-2 mt-2">
                  <div class="flex items-baseline">
                    <p class="text-sm  font-semibold  text-[#FFED29]">USD$</p>
                    <p class="text-[#FFED29]  font-semibold text-[26px]">${money(item.price || 0)}</p>
                  </div>
                  <div class="">
                    <div class="flex flex-col ">
                      <div class="flex items-center bg-black rounded-md">
                        <img src="assets/svgs/flash.svg" alt="" class="relative left-[-6px]">
                        <p class="text-white text-xs">-50%</p>
                      </div>
                      <p class="text-xs font-medium text-[#FCE40D]">6 months</p>
                    </div>
                  </div>
                </div>
                <p class="text-xs font-semibold text-[#FCE40D]">was $123.72</p>
                <div class="hidden flex-col">
                  <p class="text-sm text-white font-poppins mt-2 drop-shadow-md">Welcome to Jenny's  VIP Lounge! This plan includes everything in Basic/VIP Lounge, plus: Behind the scene of every shot! stuff i wore from the shot for sale! Talk to me 24/7 ❤️️️ Welcome to Jenny's  VIP Lounge! Welcome to Jenny's  VIP Lounge! </p>
                  <div class="flex flex-col text-white w-full mt-2">
                    <div class="flex mt-1 w-full ">
                      <div class="flex w-full items-center gap-2">
                        <img src="assets/svgs/coins-hand.svg" alt="">
                        <p>Free Tokens</p>
                      </div>
                      <p class="font-medium w-full text-sm">100 tokens everyday</p>
                    </div>
                    <div class="flex mt-1 w-full ">
                      <div class="flex w-full items-center gap-2">
                        <img src="assets/sub-svgs/shopping-cart-03.svg" alt="">
                        <p>Merch Discount</p>
                      </div>
                      <p class="font-medium w-full text-sm">10% off</p>
                    </div>
                    <div class="flex mt-1 w-full ">
                      <div class="flex w-full items-center gap-2">
                        <img src="assets/svgs/image-03.svg" alt="">
                        <p>PPV Discount</p>
                      </div>
                      <p class="font-medium w-full text-sm">10% off</p>
                    </div>
                    <div class="flex  mt-1 w-full ">
                      <div class="flex w-full items-center gap-2">
                        <img src="assets/svgs/shopping-cart-03.svg" alt="">
                        <p>Custom Request</p>
                      </div>
                      <p class="font-medium w-full text-sm">5% off</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex justify-end w-[96%] bottom-0 absolute">
                <div class="flex w-full items-center gap-2">
                  <p class="text-xs font-medium text-[#FF0066]">See Perks</p>
                  <img src="assets/svgs/chevron-down-double.svg" alt="">
                </div>
                <img src="assets/svgs/Union.svg" alt="">
                <div style="background: linear-gradient(180deg, #FF0066 0%, #FF492E 100%);" class="h-10 flex items-center justify-center">
                  <button data-subscribe-button class="font-semibold p-3 text-white text-[20px]">SUBSCRIBE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const subscribeButton = cardDiv.querySelector("[data-subscribe-button]");
  if (subscribeButton) {
    subscribeButton.addEventListener("click", (e) => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          event: 'chime-card-subscribe',
          type: 'subscription',
          item_id: item.id,
          product_id: item.id,
          variation_id: item.id,
        }, '*');
      }
    });
  }

  return cardDiv;
}

// Listen for ingest-cards event (from local component)
window.addEventListener('ingest-cards', (e) => {
  console.log('[chatHandler] 🎴 ingest-cards event received:', e.detail);
  
  const payload = e.detail;
  const chatMessages = document.querySelector('[data-chat-messages-global]') || document.getElementById('chat-messages');
  
  if (!chatMessages) {
    console.warn('[chatHandler] Chat messages container not found');
    return;
  }
  
  payload.forEach((cardData) => {
    const { scope, item } = cardData;
    
    let cardElement;
    
    switch (scope) {
      case "media":
        cardElement = renderMediaCard(item);
        break;
      case "merch":
        cardElement = renderMerchCard(item);
        break;
      case "subs":
        cardElement = renderSubscriptionCard(item);
        break;
      default:
        console.warn('[chatHandler] Unknown card scope:', scope);
        return;
    }
    
    if (cardElement) {
      chatMessages.appendChild(cardElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      console.log('[chatHandler] ✅ Card rendered in chat:', scope);
    }
  });
});

// Listen for sendChatPromotion event (send card via Chime)
window.addEventListener('sendChatPromotion', (e) => {
  console.log('[chatHandler] 📤 sendChatPromotion event received:', e.detail);
  
  const { payload } = e.detail;
  
  // Send via chimeHandler
  if (window.chimeHandler && typeof window.chimeHandler.handleDataSend === 'function') {
    window.chimeHandler.handleDataSend('chatPromo', {
      cards: payload,
      timestamp: Date.now(),
      sender: 'You'
    });
    console.log('[chatHandler] ✅ Chat promotion sent via chimeHandler');
  } else {
    console.warn('[chatHandler] chimeHandler not available');
  }
});

