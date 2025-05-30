// --- HELIX API CREDENTIALS: You must provide your own! ---
/* VISIT - https://twitchtokengenerator.com */ 
// --- TO GET YOUR TOKEN AND CLIENT ID 
// These should be moved to your backend for security in production!
const clientId = "";
const accessToken = ""; // No "oauth:" prefix!

const STREAMERS_PER_PAGE = 20;
let allStreamers = [];
let streamerStatuses = {};
let currentPage = 1;
let totalPages = 1;
let lastActiveStreamer = null;

// Get the current domain for Twitch embed parent parameter
function getParentDomain() {
  return window.location.hostname;
}

// Overlay for embed failure, now with auto-switch to next live streamer
function showEmbedError(username) {
  // Find the next live streamer (wrap around, skip current)
  let currentIdx = allStreamers.findIndex(s => s.username === username);
  let nextLive = null;
  for (let i = 1; i < allStreamers.length; ++i) {
    let idx = (currentIdx + i) % allStreamers.length;
    let s = allStreamers[idx];
    if (streamerStatuses[s.username]) {
      nextLive = s.username;
      break;
    }
  }

  const wrapper = document.getElementById("video-embed-wrapper");
  if (!wrapper) return;

  if (nextLive && nextLive !== username) {
    wrapper.innerHTML = `
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:#18181b;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;">
        <div style="color:#fff;font-size:1.2rem;margin-bottom:1rem;">
          Stream cannot be embedded right now.<br>
          (May occur after a raid or host event)<br>
          <span style="color:#a5b4fc;font-size:1.1em;">Switching to next live streamer...</span>
        </div>
      </div>
    `;
    setTimeout(() => setActiveStreamer(nextLive), 2000); // 2 second pause
  } else {
    wrapper.innerHTML = `
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:#18181b;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;">
        <div style="color:#fff;font-size:1.2rem;margin-bottom:1rem;">Stream cannot be embedded right now.<br>(May occur after a raid or host event)</div>
        <a href="https://twitch.tv/${username}" target="_blank" style="background:#9147ff;color:#fff;padding:0.7em 2em;border-radius:10px;text-decoration:none;font-weight:bold;font-size:1.1rem;">Watch on Twitch &rarr;</a>
      </div>
    `;
  }
}

// --- Utility to clean up containers before adding new content ---
function clearVideoContainer() {
  const videoContainer = document.getElementById("video-container");
  if (videoContainer) {
    while (videoContainer.firstChild) {
      videoContainer.removeChild(videoContainer.firstChild);
    }
  }
}

function clearChatContainer() {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    while (chatContainer.firstChild) {
      chatContainer.removeChild(chatContainer.firstChild);
    }
  }
}

// Create Twitch video and chat iframes
function createTwitchEmbed(username) {
  const parent = getParentDomain();

  const videoIframe = document.createElement("iframe");
  videoIframe.id = "twitch-player";
  videoIframe.src = `https://player.twitch.tv/?channel=${username}&parent=${parent}&autoplay=true&muted=true`;
  videoIframe.allowFullscreen = true;
  videoIframe.width = "100%";
  videoIframe.height = "100%";
  videoIframe.title = "Twitch Stream";

  // Fallback for embed failure (onerror isn't always triggered, but try it)
  videoIframe.onerror = function () {
    showEmbedError(username);
  };

  // Use a timer as well: if iframe fails to load after 2.5s, show error
  setTimeout(() => {
    try {
      if (!videoIframe.contentWindow || videoIframe.contentDocument?.body?.childElementCount === 0) {
        showEmbedError(username);
      }
    } catch (e) {
      showEmbedError(username);
    }
  }, 2500);

  const chatIframe = document.createElement("iframe");
  chatIframe.src = `https://www.twitch.tv/embed/${username}/chat?parent=${parent}&darkpopout`;
  chatIframe.width = "100%";
  chatIframe.height = "100%";
  chatIframe.title = "Twitch Chat";

  return { videoIframe, chatIframe };
}

// Set the active streamer, clean up all overlays, and inject content
function setActiveStreamer(username) {
  lastActiveStreamer = username;

  // Always clean out old content first
  clearVideoContainer();
  clearChatContainer();

  const videoContainer = document.getElementById("video-container");
  const chatContainer = document.getElementById("chat-container");

  // Wrapper for fallback overlay
  let wrapper = document.createElement("div");
  wrapper.id = "video-embed-wrapper";
  wrapper.style.position = "relative";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  videoContainer.appendChild(wrapper);

  const { videoIframe, chatIframe } = createTwitchEmbed(username);
  wrapper.appendChild(videoIframe);

  // --- Inject Donate Button Container and Copyright ---
  const footer = document.createElement("div");
  footer.id = "video-footer";
  footer.innerHTML = `
    <div id="donate-button-container">
      <div id="donate-button"></div>
    </div>
    <div class="copyright">
      &copy; <span id="current-year"></span> RagingStray
    </div>
  `;
  videoContainer.appendChild(footer);

  // Set copyright year
  const yearSpan = footer.querySelector("#current-year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  function renderPaypalButton() {
    if (window.PayPal && PayPal.Donation) {
      PayPal.Donation.Button({
        env: 'production',
        hosted_button_id: 'N5UE3E5D73GPC',
        image: {
          src: 'https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif',
          alt: 'Donate with PayPal button',
          title: 'PayPal - The safer, easier way to pay online!',
        }
      }).render('#donate-button');
    }
  }

  // --- Load PayPal SDK only once ---
  if (!window.paypalDonateScriptLoaded) {
    const sdkScript = document.createElement('script');
    sdkScript.src = "https://www.paypalobjects.com/donate/sdk/donate-sdk.js";
    sdkScript.charset = "UTF-8";
    sdkScript.onload = function() {
      window.paypalDonateScriptLoaded = true;
      renderPaypalButton();
    };
    document.body.appendChild(sdkScript);
  } else {
    renderPaypalButton();
  }

  chatContainer.appendChild(chatIframe);

  // Highlight active streamer in current page
  document.querySelectorAll("#streamer-list li").forEach(li => {
    li.classList.toggle("active", li.dataset.username === username);
  });
}

// PAGINATION: Render only current page of streamers
function renderSidebarPage() {
  const list = document.getElementById("streamer-list");
  list.innerHTML = "";

  const startIdx = (currentPage - 1) * STREAMERS_PER_PAGE;
  const pageStreamers = allStreamers.slice(startIdx, startIdx + STREAMERS_PER_PAGE);

  pageStreamers.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = s.displayName || s.username;
    li.dataset.username = s.username;

    // Status dot
    const dot = document.createElement("span");
    dot.className = "status-dot " + (streamerStatuses[s.username] ? "live" : "off");
    li.prepend(dot);

    li.onclick = () => setActiveStreamer(s.username);
    list.appendChild(li);

    // Auto-select if this is the active streamer (so highlight stays across pages)
    if (s.username === lastActiveStreamer) {
      setActiveStreamer(s.username);
    }
    // On initial load: auto-select the first streamer on page 1 if none is selected
    if (!lastActiveStreamer && currentPage === 1 && i === 0) {
      setActiveStreamer(s.username);
    }
  });

  // Update nav
  document.getElementById("sidebar-page-info").textContent = `${currentPage} / ${totalPages}`;
  document.getElementById("sidebar-prev").disabled = (currentPage <= 1);
  document.getElementById("sidebar-next").disabled = (currentPage >= totalPages);
}

async function loadStreamers() {
  const res = await fetch("./streamers.json");
  const streamers = await res.json();
  const usernames = streamers.map(s => s.username);

  // Fetch live status from Twitch Helix
  streamerStatuses = await getStreamStatuses(usernames);

  // Sort: online first, then offline
  allStreamers = [...streamers].sort((a, b) => {
    const aOnline = streamerStatuses[a.username] ? 1 : 0;
    const bOnline = streamerStatuses[b.username] ? 1 : 0;
    return bOnline - aOnline; // online first
  });

  totalPages = Math.ceil(allStreamers.length / STREAMERS_PER_PAGE);
  currentPage = 1;
  lastActiveStreamer = null;
  renderSidebarPage();
}

// Sidebar nav event listeners
document.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("sidebar-prev");
  const nextBtn = document.getElementById("sidebar-next");
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderSidebarPage();
      }
    };
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderSidebarPage();
      }
    };
  }
});

window.onload = loadStreamers;

// --- getStreamStatuses unchanged ---
async function getStreamStatuses(usernames) {
  if (!clientId || !accessToken) {
    // No API credentials, fallback: all offline
    return Object.fromEntries(usernames.map(u => [u, false]));
  }
  const online = {};
  for (let i = 0; i < usernames.length; i += 100) {
    const batch = usernames.slice(i, i + 100);
    const params = batch.map(u => `user_login=${encodeURIComponent(u)}`).join("&");
    const url = `https://api.twitch.tv/helix/streams?${params}`;

    const resp = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        "Authorization": "Bearer " + accessToken
      }
    });
    if (!resp.ok) {
      alert("Twitch API error. Please check your Client ID and OAuth Token.");
      return Object.fromEntries(usernames.map(u => [u, false]));
    }
    const data = await resp.json();
    data.data.forEach(stream => {
      online[stream.user_login.toLowerCase()] = true;
    });
  }
  const statuses = {};
  usernames.forEach(u => {
    statuses[u] = !!online[u.toLowerCase()];
  });
  return statuses;
}