(() => {
  "use strict";

  const screen = document.querySelector("#device-screen");
  const scenes = [...document.querySelectorAll(".scene")];
  const navButtons = [...document.querySelectorAll("[data-go]")];
  const liveRegion = document.querySelector("#live-region");
  const deviceToast = document.querySelector("#device-toast");
  const edgeFeedback = document.querySelector("#edge-feedback");
  const statePickerWrap = document.querySelector("#state-picker-wrap");
  const statePicker = document.querySelector("#state-picker");

  const companionStorageKey = "lumiq-companion-v1";
  const companions = [
    {
      id: "fox",
      name: "Lumi",
      species: "Star fox",
      asset: "lumi-ip-fox-choice.png",
      choiceAsset: "lumi-ip-fox-choice.png",
      accent: "#ff9678",
      secondary: "#f2b5b1",
      yellow: "#ffd36b",
      ink: "#3c1b14",
      soft: "rgba(255, 150, 120, .16)"
    },
    {
      id: "bird",
      name: "Pico",
      species: "Star bird",
      asset: "lumi-ip-bird.png",
      choiceAsset: "lumi-ip-bird.png",
      accent: "#d2a5ff",
      secondary: "#f2b6dc",
      yellow: "#ffd36b",
      ink: "#29183e",
      soft: "rgba(210, 165, 255, .18)"
    },
    {
      id: "bunny",
      name: "Momo",
      species: "Star bunny",
      asset: "lumi-ip-bunny.png",
      choiceAsset: "lumi-ip-bunny.png",
      accent: "#ffb18e",
      secondary: "#ffd2bf",
      yellow: "#ffd36b",
      ink: "#3d2118",
      soft: "rgba(255, 177, 142, .18)"
    }
  ];

  const state = {
    scene: "home",
    chatMode: "listening",
    micLocked: false,
    recording: false,
    recordPaused: false,
    recordingPlayback: false,
    recordingPlaybackIndex: -1,
    recordingPlaybackFrame: null,
    recordingPlaybackStartedAt: 0,
    recordingPlaybackElapsed: 0,
    recordingPlaybackProgress: 0,
    recordSeconds: 0,
    recordings: [],
    voiceListView: false,
    controlsPage: "menu",
    quietMode: false,
    volumeMuted: false,
    volumeBeforeMute: null,
    recordTimer: null,
    recordMeterTimer: null,
    toastTimer: null,
    pointerStart: null,
    pairTimers: [],
    onboardingStep: 0,
    onboardingPointer: null,
    language: "English (US)",
    languageOpen: false,
    pairCode: "LQ-4821",
    wifiNetwork: "LUMIQ Studio",
    wifiPassword: "",
    wifiPasswordVisible: false,
    wifiKeyboardMode: "letters",
    wifiKeyboardPage: 0,
    uiStateIndex: 0,
    companionId: "fox",
    pendingCompanionId: "fox"
  };

  const setupStepCount = 12;
  const languageOptions = [
    { id: "en-US", label: "English (US)", confirm: "English" },
    { id: "zh-CN", label: "简体中文", confirm: "中文" },
    { id: "ja-JP", label: "日本語", confirm: "日本語" },
    { id: "ko-KR", label: "한국어", confirm: "한국어" },
    { id: "es-ES", label: "Español", confirm: "Español" },
    { id: "fr-FR", label: "Français", confirm: "Français" }
  ];
  const wifiKeyboardPages = {
    letters: [
      ["I", "J", "K", "M", "N", "O", "P"],
      ["Q", "R", "S", "T", "U", "V", "W"],
      ["X", "Y", "Z", "A", "B", "C", "D"],
      ["E", "F", "G", "H", "L"]
    ],
    numbers: [
      ["1", "2", "3", "4", "5", "6", "7"],
      ["8", "9", "0", "-", "_", "@", "#"]
    ]
  };
  const controlsWifiKeyboardPages = {
    letters: [
      ["A", "B", "C", "D", "E", "F", "G"],
      ["H", "I", "J", "K", "L", "M", "N"],
      ["O", "P", "Q", "R", "S", "T", "U"],
      ["V", "W", "X", "Y", "Z"]
    ],
    numbers: wifiKeyboardPages.numbers
  };
  const onboardingSteps = [
    {
      id: "brand",
      count: "Step 1 of 12",
      title: "Powering up LUMIQ",
      subtitle: "Checking your companion display.",
      primary: "Begin setup",
      icon: "arrow-right",
      visual: '<div class="onboarding-visual"><div class="onboarding-brand-mark"><i data-lucide="sparkles"></i><strong>LUMIQ</strong><small>LG01 companion display</small></div></div>'
    },
    {
      id: "language",
      count: "Step 2 of 12",
      title: "Choose your language",
      subtitle: "English (US) is ready. You can change this later in the app.",
      primary: "Confirm English",
      icon: "check",
      visual: ""
    },
    {
      id: "pair-code",
      count: "Step 3 of 12",
      title: "Scan to connect",
      subtitle: "Scan this QR code with the LUMIQ app.",
      primary: "Continue",
      icon: "check",
      visual: '<div class="onboarding-visual"><div class="pair-code-visual"><span class="setup-eyebrow">PAIR WITH APP</span><button class="pair-code-chip" type="button" data-action="copy-pair-code" aria-label="Copy pairing code LQ-4821"><strong>LQ-4821</strong><i data-lucide="copy"></i></button><small>Code expires in 05:00</small></div></div>'
    },
    {
      id: "linking",
      count: "Step 4 of 12",
      title: "Connecting your phone",
      subtitle: "Keep the LUMIQ app open and your phone nearby.",
      visual: '<div class="onboarding-visual"><div class="setup-link-visual"><span class="setup-phone"><i data-lucide="smartphone"></i></span><span class="setup-link-dots"><i></i><i></i><i></i></span><span class="setup-device">LG01</span></div></div>'
    },
    {
      id: "request",
      count: "Step 5 of 12",
      title: "Approve binding request",
      subtitle: "Confirm on LG01 to prevent accidental pairing.",
      visual: '<div class="onboarding-visual"><span class="setup-request-icon"><i data-lucide="shield-check"></i></span></div>'
    },
    {
      id: "connected",
      count: "Step 6 of 12",
      title: "Connected",
      subtitle: "LG01 is now linked to your account.",
      primary: "Continue",
      icon: "check",
      visual: '<div class="onboarding-visual"><div class="setup-link-visual"><span class="setup-phone"><i data-lucide="smartphone"></i></span><span class="setup-link-dots"><i></i><i></i><i></i></span><span class="setup-device">LG01</span></div><span class="setup-connected-badge"><i data-lucide="check"></i></span></div>'
    },
    {
      id: "wifi-select",
      count: "Step 7 of 12",
      title: "Choose Wi-Fi",
      subtitle: "Select a nearby network for your LG01 display.",
      primary: "Continue",
      icon: "arrow-right",
      visual: ""
    },
    {
      id: "wifi-password",
      count: "Step 8 of 12",
      title: "Wi-Fi password",
      subtitle: "Enter the password for the selected network.",
      primary: "Join",
      icon: "arrow-right",
      visual: ""
    },
    {
      id: "wifi-connecting",
      count: "Step 9 of 12",
      title: "Wi-Fi connecting",
      subtitle: "Joining the selected network.",
      visual: ""
    },
    {
      id: "wifi-connected",
      count: "Step 10 of 12",
      title: "Wi-Fi connected",
      subtitle: "Your LG01 display is online.",
      primary: "Done",
      icon: "check",
      visual: ""
    },
    {
      id: "choose",
      count: "Step 11 of 12",
      title: "Choose a companion",
      subtitle: "Lumi is ready in the LUMIQ app.",
      primary: "Use Lumi",
      icon: "heart",
      visual: ""
    },
    {
      id: "meet",
      count: "Step 12 of 12",
      title: "Nice to meet you",
      subtitle: "Lumi is now on LG01.",
      primary: "Touch guide",
      icon: "hand",
      visual: ""
    },
    {
      id: "touch-tap",
      count: "Touch guide · 1 / 4",
      title: "Tap",
      subtitle: "Tap the center target.",
      gesture: "tap"
    },
    {
      id: "touch-left",
      count: "Touch guide · 2 / 4",
      title: "Swipe left",
      subtitle: "Move across the center.",
      gesture: "left"
    },
    {
      id: "touch-down",
      count: "Touch guide · 3 / 4",
      title: "Swipe down",
      subtitle: "Pull down from the center.",
      gesture: "down"
    },
    {
      id: "touch-right",
      count: "Touch guide · 4 / 4",
      title: "Swipe right",
      subtitle: "Move back across the center.",
      gesture: "right"
    }
  ];

  const uiStates = [
    {
      id: "request-expired", category: "Connection", tone: "error", visual: "icon", icon: "clock-3",
      title: "Request expired", subtitle: "Return to the LUMIQ app and try binding again.",
      primary: { label: "Pair again", icon: "refresh-cw", scene: "pairing" },
      secondary: { label: "Home", icon: "house", scene: "home" }
    },
    {
      id: "connection-failed", category: "Connection", tone: "error", visual: "link", badge: "x",
      title: "Connection failed", subtitle: "LG01 could not finish linking with your phone.",
      primary: { label: "Retry", icon: "refresh-cw", scene: "pairing" },
      secondary: { label: "Back", icon: "arrow-left", scene: "home" }
    },
    {
      id: "transfer-paused", category: "Soul Link", tone: "warning", visual: "ring", progress: 34, metric: "Paused", detail: "Character is safe",
      title: "Transfer paused", subtitle: "Continue now or return when the connection is stable.",
      primary: { label: "Continue", icon: "play", toast: "Transfer resumed" },
      secondary: { label: "Later", icon: "clock-3", scene: "home" }
    },
    {
      id: "restore-failed", category: "Soul Link", tone: "error", visual: "ring", progress: 66, metric: "Restore", detail: "Memories are safe",
      title: "Restore failed", subtitle: "Your character and memories are still protected.",
      primary: { label: "Retry", icon: "refresh-cw", toast: "Restore restarted" },
      secondary: { label: "Back", icon: "arrow-left", scene: "home" }
    },
    {
      id: "no-speech", category: "Voice", tone: "error", visual: "icon", icon: "mic-off",
      title: "No speech detected", subtitle: "Move closer and try speaking again.",
      primary: { label: "Try again", icon: "mic", scene: "chat" },
      secondary: { label: "End", icon: "x", scene: "home" }
    },
    {
      id: "voice-cancelled", category: "Voice", tone: "info", visual: "icon", icon: "circle-slash",
      title: "Voice cancelled", subtitle: "Nothing was uploaded or sent.",
      primary: { label: "Done", icon: "check", scene: "home" }
    },
    {
      id: "taking-longer", category: "Voice", tone: "warning", visual: "ring", progress: 82, metric: "Still working", detail: "Your request is safe",
      title: "Taking longer", subtitle: "Retry now or continue with offline care.",
      primary: { label: "Retry", icon: "refresh-cw", scene: "chat" },
      secondary: { label: "Offline", icon: "heart-handshake", scene: "care" }
    },
    {
      id: "topic-changed", category: "Voice", tone: "calm", visual: "fox", motion: "gentle",
      title: "Topic changed", subtitle: "Lumi is ready to continue with a safer answer.",
      primary: { label: "Continue", icon: "message-circle", scene: "chat" },
      secondary: { label: "End", icon: "x", scene: "home" }
    },
    {
      id: "check-dock", category: "Device", tone: "warning", visual: "icon", icon: "battery-warning", pulse: true,
      title: "Check the dock", subtitle: "Place LG01 down again to restore stable power.",
      primary: { label: "Recheck", icon: "refresh-cw", toast: "Checking dock connection" },
      secondary: { label: "Home", icon: "house", scene: "home" }
    },
    {
      id: "sync-paused", category: "Sync", tone: "warning", visual: "ring", progress: 48, metric: "48%", detail: "Re-dock to resume",
      title: "Sync paused", subtitle: "Your progress was saved at a safe checkpoint.",
      primary: { label: "Resume", icon: "play", toast: "Sync resumed" },
      secondary: { label: "Later", icon: "clock-3", scene: "home" }
    },
    {
      id: "sync-failed", category: "Sync", tone: "error", visual: "ring", progress: 72, metric: "Sync failed", detail: "Current content works",
      title: "Content sync failed", subtitle: "Installed character content is still available.",
      primary: { label: "Retry", icon: "refresh-cw", toast: "Sync retry started" },
      secondary: { label: "Later", icon: "clock-3", scene: "home" }
    },
    {
      id: "too-warm", category: "Device", tone: "error", visual: "icon", icon: "thermometer-sun", pulse: true,
      title: "Device too warm", subtitle: "Remove LG01 from the dock and let it cool down.",
      primary: { label: "Understood", icon: "check", scene: "home" }
    },
    {
      id: "update-complete", category: "System", tone: "success", visual: "fox", motion: "arriving",
      title: "Update complete", subtitle: "LG01 will restart with your character and settings intact.",
      primary: { label: "Restart", icon: "power", scene: "home", toast: "Restarting LG01" }
    },
    {
      id: "rolling-back", category: "System", tone: "warning", visual: "ring", progress: 74, metric: "Rolling back", detail: "Character & memories safe",
      title: "Update recovery", subtitle: "Restoring the most recent stable version.",
      primary: { label: "Stay here", icon: "shield-check", toast: "Recovery continues safely" }
    },
    {
      id: "scan-figure", category: "Character", tone: "info", visual: "fox", motion: "scanning",
      title: "Scan your figure", subtitle: "Use the LUMIQ app camera to bring a character to life.",
      primary: { label: "Open app", icon: "smartphone", toast: "Continue in the LUMIQ app" },
      secondary: { label: "Cancel", icon: "x", scene: "home" }
    },
    {
      id: "bringing-to-life", category: "Character", tone: "warning", visual: "ring", progress: 61, metric: "Creating", detail: "Look & voice",
      title: "Bringing to life", subtitle: "Building the character securely from your scan.",
      primary: { label: "View status", icon: "scan-line", toast: "Character creation is in progress" }
    },
    {
      id: "character-ready", category: "Character", tone: "success", visual: "fox", motion: "arriving",
      title: "I'm alive", subtitle: "Your fox companion is ready to meet you.",
      primary: { label: "Start", icon: "sparkles", scene: "home" }
    },
    {
      id: "friend-nearby", category: "Friends", tone: "calm", visual: "fox", motion: "gentle",
      title: "Friend nearby", subtitle: "A LUMIQ friend is close enough to say hello.",
      primary: { label: "Say hi", icon: "hand", target: "say-hello" },
      secondary: { label: "Not now", icon: "clock-3", scene: "home" }
    },
    {
      id: "say-hello", category: "Friends", tone: "warning", visual: "fox", motion: "gentle",
      title: "Say hello to Milo?", subtitle: "Only your approved profile details will be shared.",
      primary: { label: "Say hello", icon: "hand", target: "new-friend" },
      secondary: { label: "Not now", icon: "x", scene: "home" }
    },
    {
      id: "new-friend", category: "Friends", tone: "success", visual: "fox", motion: "arriving",
      title: "New friend", subtitle: "Milo was added to your private friends list.",
      primary: { label: "Send wave", icon: "send", target: "milo-says-hi" },
      secondary: { label: "Done", icon: "check", scene: "home" }
    },
    {
      id: "milo-says-hi", category: "Friends", tone: "calm", visual: "fox", motion: "gentle",
      title: "Milo says hi", subtitle: "A new friend motion is waiting for your reply.",
      primary: { label: "Reply", icon: "message-circle", scene: "chat" },
      secondary: { label: "Later", icon: "clock-3", scene: "home" }
    },
    {
      id: "care-active", category: "Care", tone: "calm", visual: "voice", icon: "heart-pulse", wave: true,
      title: "Care mode active", subtitle: "Local sound awareness is on for the next 30 minutes.",
      primary: { label: "Open care", icon: "heart-handshake", scene: "care" },
      secondary: { label: "End", icon: "x", scene: "home" }
    },
    {
      id: "big-feelings", category: "Care", tone: "warning", visual: "fox", motion: "gentle",
      title: "Big feelings", subtitle: "Lumi can stay with you or begin a calming exercise.",
      primary: { label: "Stay with me", icon: "heart", target: "breathe-with-me" },
      secondary: { label: "Quiet", icon: "volume-x", scene: "home" }
    },
    {
      id: "breathe-with-me", category: "Care", tone: "calm", visual: "fox", motion: "breathing",
      title: "I'm here", subtitle: "Take a slow breath with Lumi.",
      primary: { label: "Breathe", icon: "waves", scene: "care" },
      secondary: { label: "I'm okay", icon: "check", scene: "home" }
    },
    {
      id: "softer-voice", category: "Care", tone: "calm", visual: "fox", motion: "breathing",
      title: "Softer voice", subtitle: "Lower the volume and slow the breathing rhythm.",
      primary: { label: "Volume", icon: "volume-1", scene: "controls" },
      secondary: { label: "Done", icon: "check", scene: "home" }
    },
    {
      id: "safe-hands", category: "Care", tone: "calm", visual: "fox", motion: "breathing",
      title: "Safe hands", subtitle: "Squeeze gently, then release with Lumi.",
      primary: { label: "Try it", icon: "hand-heart", toast: "Squeeze gently · now release" },
      secondary: { label: "Done", icon: "check", scene: "home" }
    },
    {
      id: "name-feeling", category: "Care", tone: "calm", visual: "fox", motion: "gentle",
      title: "Name the feeling", subtitle: "Say how it feels in your own words.",
      primary: { label: "Talk to Lumi", icon: "message-circle", scene: "chat" },
      secondary: { label: "Done", icon: "check", scene: "home" }
    },
    {
      id: "step-back", category: "Care", tone: "warning", visual: "fox", motion: "gentle",
      title: "Pause & step back", subtitle: "Create space first, then choose what happens next.",
      primary: { label: "I'm safe", icon: "shield-check", scene: "home" },
      secondary: { label: "Get help", icon: "life-buoy", target: "get-help" }
    },
    {
      id: "star-breaths", category: "Care", tone: "calm", visual: "fox", motion: "breathing",
      title: "Star breaths", subtitle: "Take three slow breaths before sleep.",
      primary: { label: "Begin", icon: "moon-star", scene: "care" },
      secondary: { label: "Later", icon: "clock-3", scene: "home" }
    },
    {
      id: "get-help", category: "Care", tone: "warning", visual: "icon", icon: "life-buoy", pulse: true,
      title: "Get help", subtitle: "Find a trusted adult and stay near them.",
      primary: { label: "I found help", icon: "shield-check", scene: "home" },
      secondary: { label: "Stay here", icon: "heart", toast: "Lumi will stay with you" }
    },
    {
      id: "upcoming-reminder", category: "Reminders", tone: "info", visual: "reminder", time: "3:30 PM", detail: "Dentist · in 30 minutes",
      title: "Up next", subtitle: "An important event is coming soon.",
      primary: { label: "Open", icon: "calendar-clock", target: "time-to-go" },
      secondary: { label: "Later", icon: "clock-3", scene: "home" }
    },
    {
      id: "time-to-go", category: "Reminders", tone: "warning", visual: "reminder", time: "3:30 PM", detail: "Dentist · time to leave",
      title: "Time to go", subtitle: "Your dentist appointment starts soon.",
      primary: { label: "Done", icon: "check", target: "reminder-done" },
      secondary: { label: "10 min", icon: "clock-3", toast: "Reminder moved 10 minutes" }
    },
    {
      id: "reminder-done", category: "Reminders", tone: "success", visual: "reminder", time: "Done", detail: "Today's plan is updated",
      title: "Reminder completed", subtitle: "The result was synced to your LUMIQ app.",
      primary: { label: "Home", icon: "house", scene: "home" }
    },
    {
      id: "voice-ready", category: "Voice Note", tone: "warning", visual: "voice", icon: "mic",
      title: "Ready to record", subtitle: "Tap once to begin a voice note.",
      primary: { label: "Record", icon: "mic", scene: "voice" },
      secondary: { label: "Back", icon: "arrow-left", scene: "apps" }
    },
    {
      id: "voice-recording", category: "Voice Note", tone: "error", visual: "voice", wave: true,
      title: "Recording · Mic on", subtitle: "Your note remains local until it is saved.",
      primary: { label: "Continue", icon: "mic", scene: "voice" },
      secondary: { label: "Cancel", icon: "x", scene: "home" }
    },
    {
      id: "voice-saved", category: "Voice Note", tone: "success", visual: "fox", motion: "arriving",
      title: "Voice note saved", subtitle: "The note is ready in your LUMIQ app.",
      primary: { label: "Record more", icon: "mic", scene: "voice" },
      secondary: { label: "Done", icon: "check", scene: "home" }
    },
    {
      id: "voice-save-failed", category: "Voice Note", tone: "error", visual: "icon", icon: "save",
      title: "Note not saved", subtitle: "The temporary copy is safe while you decide.",
      primary: { label: "Retry", icon: "refresh-cw", scene: "voice" },
      secondary: { label: "Discard", icon: "trash-2", scene: "home" }
    },
    {
      id: "notifications", category: "Reminders", tone: "warning", visual: "notifications",
      title: "Notifications · 3", subtitle: "Review reminders and private friend activity.",
      primary: { label: "Open", icon: "bell", scene: "notifications" },
      secondary: { label: "Home", icon: "house", scene: "home" }
    },
    {
      id: "reminder-queued", category: "Voice Note", tone: "warning", visual: "queued", time: "3:30 PM", detail: "Dentist reminder",
      title: "Reminder queued", subtitle: "Recording continues without interruption.",
      primary: { label: "Keep recording", icon: "mic", scene: "voice" },
      secondary: { label: "View later", icon: "bell", scene: "notifications" }
    }
  ];

  function getCompanion(id = state.companionId) {
    return companions.find((companion) => companion.id === id) || companions[0];
  }

  function persistCompanion(id) {
    try {
      window.localStorage.setItem(companionStorageKey, id);
    } catch (error) {
      // The prototype still keeps the selection in memory when storage is unavailable.
    }
  }

  function applyCompanion(id = state.companionId) {
    const companion = getCompanion(id);
    state.companionId = companion.id;
    screen.dataset.companion = companion.id;
    screen.style.setProperty("--peach", companion.accent);
    screen.style.setProperty("--peach-ink", companion.ink);
    screen.style.setProperty("--lavender", companion.secondary);
    screen.style.setProperty("--yellow", companion.yellow);
    screen.style.setProperty("--companion-accent", companion.accent);
    screen.style.setProperty("--companion-soft", companion.soft);
    document.querySelectorAll("[data-companion-image]").forEach((image) => {
      image.src = companion.asset;
      image.alt = `${companion.name}, your ${companion.species} companion`;
    });
    const panelKicker = document.querySelector("#panel-kicker");
    const panelTitle = document.querySelector("#panel-title");
    const companionType = companion.species.replace("Star ", "");
    const companionTypeTitle = companionType.charAt(0).toUpperCase() + companionType.slice(1);
    if (panelKicker) panelKicker.textContent = `${companion.species} edition`;
    if (panelTitle) panelTitle.textContent = `${companionTypeTitle} Companion UI`;
    document.title = `LUMIQ LG01 · 360 ${companionTypeTitle} Companion UI`;
    return companion;
  }

  function companionPickerMarkup() {
    return `<div class="companion-picker" role="listbox" aria-label="Choose a companion">${companions.map((companion) => {
      const selected = companion.id === state.pendingCompanionId;
      return `<button class="companion-option${selected ? " is-selected" : ""}" type="button" data-action="select-companion" data-companion="${companion.id}" role="option" aria-selected="${selected}" aria-label="${companion.name}, ${companion.species}" style="--option-accent:${companion.accent};--option-soft:${companion.soft}">
        <span class="companion-option-image"><img src="${companion.choiceAsset}" alt="${companion.name}, ${companion.species}"><span class="companion-option-check"><i data-lucide="check"></i></span></span>
        <strong>${companion.species}</strong><small>${companion.name}</small>
      </button>`;
    }).join("")}</div>`;
  }

  function renderCompanionPicker() {
    const stage = document.querySelector("#onboarding-stage");
    if (stage) stage.innerHTML = `<div class="onboarding-visual">${companionPickerMarkup()}</div>`;
  }

  function announce(message) {
    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 20);
  }

  function showToast(message, duration = 1800) {
    window.clearTimeout(state.toastTimer);
    deviceToast.textContent = message;
    deviceToast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => {
      deviceToast.classList.remove("is-visible");
    }, duration);
    announce(message);
  }

  function stateVisualMarkup(item) {
    if (item.visual === "link") {
      const badgeIcon = item.badge === "check" ? "check" : "x";
      return `<div class="state-link"><span class="state-link-phone"><i data-lucide="smartphone"></i></span><span class="state-link-path"><i></i><i></i><i></i><b class="state-link-badge"><i data-lucide="${badgeIcon}"></i></b></span><span class="state-link-device">LG01</span></div>`;
    }

    if (item.visual === "ring") {
      const angle = Math.max(12, Math.min(360, Number(item.progress || 0) * 3.6));
      return `<div class="state-ring" style="--state-progress-angle:${angle}deg"><div class="state-ring-content"><strong>${item.metric}</strong><small>${item.detail}</small></div></div>`;
    }

    if (item.visual === "fox") {
      const companion = getCompanion();
      return `<div class="state-fox-wrap is-${item.motion || "gentle"}"><img src="${companion.asset}" alt="${companion.name}, your ${companion.species} companion"><span class="sparkle-layer" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>`;
    }

    if (item.visual === "voice") {
      const center = item.wave
        ? '<span class="state-mini-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>'
        : `<i data-lucide="${item.icon || "mic"}"></i>`;
      return `<div class="state-voice-visual">${center}</div>`;
    }

    if (item.visual === "reminder") {
      return `<div class="state-reminder-card"><i data-lucide="calendar-clock"></i><strong>${item.time}</strong><small>${item.detail}</small></div>`;
    }

    if (item.visual === "notifications") {
      return '<div class="state-notice-preview"><span><i data-lucide="calendar-clock"></i>Dentist · 3:30 PM</span><span><i data-lucide="hand"></i>Milo says hi</span></div>';
    }

    if (item.visual === "queued") {
      return `<div class="state-queue-card"><i data-lucide="list-end"></i><strong>${item.detail}</strong><small>${item.time} · recording continues</small></div>`;
    }

    return `<div class="state-icon-wrap${item.pulse ? " is-pulsing" : ""}"><i data-lucide="${item.icon || "triangle-alert"}"></i></div>`;
  }

  function stateActionMarkup(action, type) {
    if (!action) return "";
    return `<button class="state-action${type === "primary" ? " is-primary" : ""}" type="button" data-action="state-${type}"><i data-lucide="${action.icon || "arrow-right"}"></i><span>${action.label}</span></button>`;
  }

  function renderUiState(index, { silent = false } = {}) {
    const total = uiStates.length;
    const wrappedIndex = ((index % total) + total) % total;
    const item = uiStates[wrappedIndex];
    const companion = getCompanion();
    const companionSubtitle = item.subtitle
      .replace(/\bLumi\b/g, companion.name)
      .replace(/fox companion/gi, `${companion.species.toLowerCase()} companion`);
    const scene = document.querySelector(".states-scene");

    state.uiStateIndex = wrappedIndex;
    scene.dataset.tone = item.tone;
    scene.setAttribute("aria-label", `${item.category}: ${item.title}`);
    document.querySelector("#state-category").textContent = item.category;
    document.querySelector("#state-position").textContent = `${wrappedIndex + 1} / ${total}`;
    document.querySelector("#state-title").textContent = item.title;
    document.querySelector("#state-subtitle").textContent = companionSubtitle;
    document.querySelector("#state-visual").innerHTML = stateVisualMarkup(item);
    document.querySelector("#state-actions").innerHTML = `${stateActionMarkup(item.secondary, "secondary")}${stateActionMarkup(item.primary, "primary")}`;
    document.querySelector("#state-progress").style.width = `${((wrappedIndex + 1) / total) * 100}%`;
    if (statePicker) statePicker.value = item.id;

    lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    if (!silent) announce(`${item.category}. ${item.title}. ${companionSubtitle}`);
  }

  function runUiStateAction(type) {
    const item = uiStates[state.uiStateIndex];
    const action = item?.[type];
    if (!action) return;

    if (action.target) {
      const targetIndex = uiStates.findIndex((candidate) => candidate.id === action.target);
      if (targetIndex >= 0) renderUiState(targetIndex);
    }
    if (action.scene) goTo(action.scene);
    if (action.toast) showToast(action.toast);
  }

  function populateStatePicker() {
    if (!statePicker) return;
    const groups = new Map();
    uiStates.forEach((item) => {
      if (!groups.has(item.category)) groups.set(item.category, []);
      groups.get(item.category).push(item);
    });

    groups.forEach((items, category) => {
      const group = document.createElement("optgroup");
      group.label = category;
      items.forEach((item) => group.append(new Option(item.title, item.id)));
      statePicker.append(group);
    });
    statePicker.value = uiStates[0].id;
  }

  function clearPairTimers() {
    state.pairTimers.forEach(window.clearTimeout);
    state.pairTimers = [];
    screen.classList.remove("is-screen-contacting");
  }

  function stopRecordMeter() {
    window.clearInterval(state.recordMeterTimer);
    state.recordMeterTimer = null;
    document.querySelectorAll("#record-wave i").forEach((bar) => {
      bar.style.setProperty("--meter", ".32");
    });
  }

  const recordingWaveformBarCount = 31;

  function recordingWaveform(progress = 0) {
    const playedBars = Math.min(recordingWaveformBarCount, Math.max(0, Math.ceil(progress * recordingWaveformBarCount)));
    return Array.from({ length: recordingWaveformBarCount }, (_, index) => `<i${index < playedBars ? ' class="is-played"' : ""}></i>`).join("");
  }

  function updateRecordingPlaybackBars(index, progress) {
    const item = document.querySelector(`.recording-item[data-recording-index="${index}"]`);
    if (!item) return;
    const playedBars = Math.min(recordingWaveformBarCount, Math.max(0, Math.ceil(progress * recordingWaveformBarCount)));
    item.querySelectorAll(".recording-waveform i").forEach((bar, barIndex) => {
      bar.classList.toggle("is-played", barIndex < playedBars);
    });
  }

  function clearRecordingPlayback({ reset = true } = {}) {
    window.cancelAnimationFrame(state.recordingPlaybackFrame);
    state.recordingPlaybackFrame = null;
    state.recordingPlayback = false;
    state.recordingPlaybackStartedAt = 0;
    if (reset) {
      state.recordingPlaybackIndex = -1;
      state.recordingPlaybackElapsed = 0;
      state.recordingPlaybackProgress = 0;
    }
  }

  function runRecordingPlayback(timestamp) {
    const index = state.recordingPlaybackIndex;
    const recording = state.recordings[index];
    if (!state.recordingPlayback || !recording) return;

    const duration = Math.max(1, recording.duration) * 1000;
    const elapsed = state.recordingPlaybackElapsed + (timestamp - state.recordingPlaybackStartedAt);
    state.recordingPlaybackProgress = Math.min(1, elapsed / duration);
    updateRecordingPlaybackBars(index, state.recordingPlaybackProgress);

    if (state.recordingPlaybackProgress >= 1) {
      window.cancelAnimationFrame(state.recordingPlaybackFrame);
      state.recordingPlaybackFrame = null;
      state.recordingPlayback = false;
      state.recordingPlaybackElapsed = duration;
      state.recordingPlaybackStartedAt = 0;
      renderRecordingList();
      announce("Voice note playback complete");
      return;
    }

    state.recordingPlaybackFrame = window.requestAnimationFrame(runRecordingPlayback);
  }

  function renderRecordingList() {
    const items = document.querySelector("#recording-items");
    const count = document.querySelector("#recording-count");
    if (!items) return;
    if (count) count.textContent = state.recordings.length ? `${state.recordings.length}` : "";
    items.innerHTML = state.recordings.map((recording, index) => {
      const isSelected = state.recordingPlaybackIndex === index;
      const isPlaying = isSelected && state.recordingPlayback;
      const progress = isSelected ? state.recordingPlaybackProgress : 0;
      const playLabel = isPlaying ? "Pause" : (progress >= 1 ? "Replay" : (progress > 0 ? "Resume" : "Play"));
      return `
      <article class="recording-item${isPlaying ? " is-playing" : ""}" data-recording-index="${index}">
        <div class="recording-list-head"><strong>${index === 0 ? "Latest recording" : `Recording ${state.recordings.length - index}`}</strong><time>${formatTime(recording.duration)}</time></div>
        <div class="recording-list-track">
          <button class="recording-play-button" type="button" data-action="toggle-latest-recording" aria-label="${playLabel} recording ${index + 1}">
            <i data-lucide="${isPlaying ? "pause" : "play"}" aria-hidden="true"></i>
          </button>
          <span class="recording-waveform" aria-hidden="true">${recordingWaveform(progress)}</span>
        </div>
      </article>
    `;
    }).join("");
    lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }

  function updateRecordingList(visible) {
    const list = document.querySelector("#recording-list");
    const scene = document.querySelector(".voice-note-scene");
    if (!list || !scene) return;
    renderRecordingList();
    const show = Boolean(visible && state.voiceListView && state.recordings.length);
    list.hidden = !show;
    scene.classList.toggle("has-recording-list", show);
  }

  function deleteRecording(index) {
    if (!Number.isInteger(index) || !state.recordings[index]) return;

    const selectedIndex = state.recordingPlaybackIndex;
    if (selectedIndex === index) {
      clearRecordingPlayback();
    } else if (selectedIndex > index) {
      state.recordingPlaybackIndex -= 1;
    }

    state.recordings.splice(index, 1);
    if (!state.recordings.length) {
      stopRecording({ reset: true });
    } else {
      updateRecordingList(true);
    }
    showToast("Recording deleted");
  }

  function setUpRecordingList() {
    const items = document.querySelector("#recording-items");
    if (!items || items.dataset.swipeReady === "true") return;
    items.dataset.swipeReady = "true";

    let gesture = null;
    const resetGesture = () => {
      if (!gesture) return;
      gesture.item.classList.remove("is-swiping");
      gesture.item.style.removeProperty("--swipe-offset");
      gesture = null;
    };

    items.addEventListener("pointerdown", (event) => {
      const item = event.target.closest?.(".recording-item");
      if (!item || event.target.closest?.("button")) return;
      gesture = {
        item,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
      };
      item.setPointerCapture?.(event.pointerId);
      event.stopPropagation();
    });

    items.addEventListener("pointermove", (event) => {
      if (!gesture) return;
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        resetGesture();
        return;
      }
      gesture.moved = true;
      const offset = Math.max(0, Math.min(deltaX, 104));
      gesture.item.classList.add("is-swiping");
      gesture.item.style.setProperty("--swipe-offset", `${offset}px`);
      event.preventDefault();
      event.stopPropagation();
    });

    items.addEventListener("pointerup", (event) => {
      if (!gesture) return;
      const { item, startX, startY, moved } = gesture;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const index = Number(item.dataset.recordingIndex);
      const shouldDelete = moved && deltaX >= 72 && deltaX > Math.abs(deltaY) * 1.2;
      event.preventDefault();
      event.stopPropagation();
      resetGesture();
      if (shouldDelete) deleteRecording(index);
    });

    items.addEventListener("pointercancel", resetGesture);

    // The release can happen outside the capsule after a long swipe, so keep a document-level fallback.
    document.addEventListener("pointermove", (event) => {
      if (!gesture || event.target.closest?.(".recording-items")) return;
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        resetGesture();
        return;
      }
      gesture.moved = true;
      const offset = Math.max(0, Math.min(deltaX, 104));
      gesture.item.classList.add("is-swiping");
      gesture.item.style.setProperty("--swipe-offset", `${offset}px`);
      event.preventDefault();
    }, { passive: false });

    document.addEventListener("pointerup", (event) => {
      if (!gesture) return;
      const { item, startX, startY, moved } = gesture;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const index = Number(item.dataset.recordingIndex);
      const shouldDelete = moved && deltaX >= 72 && deltaX > Math.abs(deltaY) * 1.2;
      event.preventDefault();
      event.stopPropagation();
      resetGesture();
      if (shouldDelete) deleteRecording(index);
    }, true);
  }

  function setVoiceListView(visible) {
    const scene = document.querySelector(".voice-note-scene");
    const hint = document.querySelector("#record-hint");
    const dots = document.querySelector(".voice-page-dots");
    if (!scene) return false;
    if (visible && (state.recording || !state.recordings.length)) {
      showToast(state.recording ? "Save the recording before viewing the list" : "No recordings yet");
      return false;
    }
    if (!visible) clearRecordingPlayback();
    state.voiceListView = visible;
    scene.classList.toggle("is-list-view", visible);
    if (hint) hint.textContent = visible ? "Slide to the left" : (state.recording ? "Tap to save" : "Slide to the right");
    if (dots) {
      dots.classList.toggle("is-list-view", visible);
      dots.children[0]?.classList.toggle("is-active", !visible);
      dots.children[1]?.classList.toggle("is-active", visible);
    }
    updateRecordingList(true);
    return true;
  }

  function toggleLatestRecording(button) {
    const list = document.querySelector("#recording-list");
    const item = button?.closest(".recording-item");
    const index = Number(item?.dataset.recordingIndex);
    if (!list || list.hidden || !Number.isInteger(index) || !state.recordings[index]) return;

    const sameRecording = state.recordingPlaybackIndex === index;
    if (sameRecording && state.recordingPlayback) {
      state.recordingPlaybackElapsed += performance.now() - state.recordingPlaybackStartedAt;
      clearRecordingPlayback({ reset: false });
      renderRecordingList();
      return;
    }

    if (!sameRecording || state.recordingPlaybackProgress >= 1) {
      clearRecordingPlayback();
      state.recordingPlaybackIndex = index;
      state.recordingPlaybackElapsed = 0;
      state.recordingPlaybackProgress = 1 / recordingWaveformBarCount;
    }

    state.recordingPlayback = true;
    state.recordingPlaybackStartedAt = performance.now();
    renderRecordingList();
    state.recordingPlaybackFrame = window.requestAnimationFrame(runRecordingPlayback);
  }

  function startRecordMeter() {
    stopRecordMeter();
    const bars = [...document.querySelectorAll("#record-wave i")];
    state.recordMeterTimer = window.setInterval(() => {
      bars.forEach((bar, index) => {
        const centerBoost = 1 - Math.abs(index - 3) * .09;
        const level = Math.max(.24, Math.min(1, .28 + Math.random() * .72 * centerBoost));
        bar.style.setProperty("--meter", level.toFixed(2));
      });
    }, 130);
  }

  function startRecordClock() {
    window.clearInterval(state.recordTimer);
    state.recordTimer = window.setInterval(() => {
      state.recordSeconds += 1;
      document.querySelector("#record-time").textContent = formatTime(state.recordSeconds);
      updateRecordingList(false);
      if (state.recordSeconds >= 60) {
        stopRecording({ saved: true });
        showToast("Note saved on LG01");
      }
    }, 1000);
  }

  function stopRecording({ reset = false, saved = false } = {}) {
    window.clearInterval(state.recordTimer);
    state.recordTimer = null;
    stopRecordMeter();
    state.recording = false;
    state.recordPaused = false;
    clearRecordingPlayback();
    if (saved && !reset && state.recordSeconds > 0) {
      state.recordings.unshift({ duration: state.recordSeconds });
    }
    const button = document.querySelector("#record-button");
    const pauseButton = document.querySelector("#record-pause-button");
    const voiceScene = document.querySelector(".voice-note-scene");
    button.classList.remove("is-recording");
    button.classList.toggle("is-saved", saved);
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", saved ? "Record another voice note" : "Start recording");
    pauseButton?.classList.remove("is-paused");
    if (pauseButton) {
      pauseButton.hidden = true;
      pauseButton.setAttribute("aria-label", "Pause recording");
      pauseButton.querySelector("svg")?.setAttribute("data-lucide", "pause");
    }
    updateRecordingList(false);
    voiceScene.classList.remove("is-recording");
    voiceScene.classList.toggle("is-saved", saved);
    document.querySelector("#voice-status").textContent = saved ? "Saved" : "Ready";
    document.querySelector("#record-hint").textContent = "Slide to the right";
    if (reset) {
      state.recordSeconds = 0;
      document.querySelector("#record-time").textContent = "00:00";
      button.classList.remove("is-saved");
      voiceScene.classList.remove("is-saved");
      setVoiceListView(false);
    }
  }

  function gestureVisual(type) {
    const labels = {
      tap: "Try the tap gesture",
      left: "Try the swipe left gesture",
      down: "Try the swipe down gesture",
      right: "Try the swipe right gesture"
    };
    const icons = { tap: "hand", left: "arrow-left", down: "arrow-down", right: "arrow-right" };
    return `<div class="onboarding-visual"><button class="gesture-pad" id="onboarding-gesture-pad" type="button" data-gesture="${type}" aria-label="${labels[type]}"><span class="gesture-track"></span><span class="gesture-direction" aria-hidden="true"><i data-lucide="${icons[type]}"></i></span><span class="gesture-dot"></span></button></div>`;
  }

  function finishOnboarding() {
    clearPairTimers();
    const companion = applyCompanion(state.companionId);
    persistCompanion(companion.id);
    try {
      window.localStorage.setItem("lumiq-fox-onboarding-v1", "complete");
    } catch (error) {
      // The prototype still completes when storage is unavailable.
    }
    goTo("home");
    showToast(`Setup complete · Welcome, ${companion.name}`);
    announce(`First-time setup complete. Welcome, ${companion.name}.`);
  }

  function completeOnboardingGesture() {
    const step = onboardingSteps[state.onboardingStep];
    const pad = document.querySelector("#onboarding-gesture-pad");
    if (!step?.gesture || !pad || pad.classList.contains("is-complete")) return;

    pad.classList.remove("is-trying");
    pad.classList.add("is-complete");
    document.querySelector("#onboarding-subtitle").textContent = "Great. Gesture recognized.";
    announce(`${step.title} complete`);
    state.pairTimers.push(window.setTimeout(() => {
      if (state.onboardingStep === onboardingSteps.length - 1) finishOnboarding();
      else renderOnboardingStep(state.onboardingStep + 1);
    }, 650));
  }

  function setUpGesturePad(type) {
    const pad = document.querySelector("#onboarding-gesture-pad");
    const dot = pad?.querySelector(".gesture-dot");
    if (!pad || !dot) return;

    function resetDot() {
      pad.classList.remove("is-trying");
      dot.style.setProperty("--drag-x", "0px");
      dot.style.setProperty("--drag-y", "0px");
      state.onboardingPointer = null;
    }

    pad.addEventListener("pointerdown", (event) => {
      pad.setPointerCapture(event.pointerId);
      pad.classList.add("is-trying");
      state.onboardingPointer = { x: event.clientX, y: event.clientY };
    });

    pad.addEventListener("pointermove", (event) => {
      if (!state.onboardingPointer) return;
      const rawX = event.clientX - state.onboardingPointer.x;
      const rawY = event.clientY - state.onboardingPointer.y;
      const dragX = type === "down" || type === "tap" ? 0 : Math.max(-52, Math.min(52, rawX));
      const dragY = type === "left" || type === "right" || type === "tap" ? 0 : Math.max(-46, Math.min(46, rawY));
      dot.style.setProperty("--drag-x", `${dragX}px`);
      dot.style.setProperty("--drag-y", `${dragY}px`);
    });

    pad.addEventListener("pointerup", (event) => {
      if (!state.onboardingPointer) return;
      const deltaX = event.clientX - state.onboardingPointer.x;
      const deltaY = event.clientY - state.onboardingPointer.y;
      const distance = Math.hypot(deltaX, deltaY);
      const correct = (type === "tap" && distance < 18)
        || (type === "left" && deltaX <= -46 && Math.abs(deltaX) > Math.abs(deltaY))
        || (type === "right" && deltaX >= 46 && Math.abs(deltaX) > Math.abs(deltaY))
        || (type === "down" && deltaY >= 46 && Math.abs(deltaY) > Math.abs(deltaX));

      if (correct) {
        state.onboardingPointer = null;
        completeOnboardingGesture();
      } else {
        document.querySelector("#onboarding-subtitle").textContent = type === "tap" ? "Tap without dragging." : "Try a longer swipe.";
        resetDot();
      }
    });

    pad.addEventListener("pointercancel", resetDot);
    pad.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      completeOnboardingGesture();
    });
  }

  function getLanguageOption() {
    return languageOptions.find((option) => option.label === state.language) || languageOptions[0];
  }

  function languageVisualMarkup() {
    const selected = getLanguageOption();
    const selectedIndex = languageOptions.findIndex((option) => option.id === selected.id);
    const visibleOptions = [-1, 0, 1].map((offset) => {
      const index = (selectedIndex + offset + languageOptions.length) % languageOptions.length;
      return languageOptions[index];
    });
    const options = visibleOptions.map((option) => `
      <button class="language-option${option.id === selected.id ? " is-selected" : ""}" type="button" data-action="select-language" data-language="${option.id}" role="option" aria-selected="${option.id === selected.id}">
        <span>${option.label}</span>
      </button>`).join("");
    return `<div class="onboarding-visual"><div class="language-visual">
      <span class="language-title">Language</span>
      <div class="language-list" role="listbox" aria-label="Language choices">${options}</div>
    </div></div>`;
  }

  function qrCodeMarkup() {
    const size = 29;
    const reserved = Array.from({ length: size }, () => Array(size).fill(false));
    const cells = [];
    const mark = (x, y, filled) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      reserved[y][x] = true;
      if (filled) cells.push([x, y]);
    };
    const finder = (originX, originY) => {
      for (let y = -1; y <= 7; y += 1) {
        for (let x = -1; x <= 7; x += 1) {
          const inside = x >= 0 && x < 7 && y >= 0 && y < 7;
          const filled = inside && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
          mark(originX + x, originY + y, filled);
        }
      }
    };
    finder(1, 1);
    finder(size - 8, 1);
    finder(1, size - 8);
    for (let i = 9; i < size - 9; i += 1) {
      mark(i, 7, i % 2 === 0);
      mark(7, i, i % 2 === 0);
    }
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (reserved[y][x]) continue;
        const value = (x * 17 + y * 31 + x * y * 7 + 13) % 19;
        if (value < 8 || ((x + y) % 11 === 0)) cells.push([x, y]);
      }
    }
    const modules = cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"></rect>`).join("");
    return `<svg class="pair-qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="Pairing QR code" shape-rendering="crispEdges"><rect class="pair-qr-bg" width="${size}" height="${size}"></rect><g class="pair-qr-modules">${modules}</g></svg>`;
  }

  function qrBindVisualMarkup() {
    return `<div class="onboarding-visual"><div class="qr-bind-visual">
      ${qrCodeMarkup()}
      <p>Scan this QR code with the LUMIQ app</p>
    </div></div>`;
  }

  function setUpLanguagePicker() {
    const list = document.querySelector('.onboarding-scene[data-step="language"] .language-list');
    if (!list) return;

    let pointerStartY = null;
    let pointerMoved = false;
    const shiftLanguage = (direction) => {
      const currentIndex = languageOptions.findIndex((option) => option.label === state.language);
      const nextIndex = (currentIndex + direction + languageOptions.length) % languageOptions.length;
      selectLanguage(languageOptions[nextIndex].id);
    };

    list.addEventListener("pointerdown", (event) => {
      pointerStartY = event.clientY;
      pointerMoved = false;
      list.setPointerCapture?.(event.pointerId);
    });
    list.addEventListener("pointermove", (event) => {
      if (pointerStartY === null) return;
      pointerMoved = Math.abs(event.clientY - pointerStartY) >= 10;
    });
    list.addEventListener("pointerup", (event) => {
      if (pointerStartY === null) return;
      const deltaY = event.clientY - pointerStartY;
      pointerStartY = null;
      if (!pointerMoved || Math.abs(deltaY) < 24) return;
      event.preventDefault();
      shiftLanguage(deltaY < 0 ? 1 : -1);
    });
    list.addEventListener("pointercancel", () => {
      pointerStartY = null;
    });
    list.addEventListener("wheel", (event) => {
      event.preventDefault();
      shiftLanguage(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });
  }

  function wifiNetworksMarkup() {
    const networks = [
      { name: "Home_5G", status: "Locked", icon: "lock" },
      { name: "LUMIQ Studio", status: "Locked", icon: "lock" },
      { name: "Guest", status: "Open", icon: "unlock" }
    ];
    return `<div class="onboarding-visual"><div class="wifi-visual wifi-select-visual">
      <span class="wifi-symbol"><i data-lucide="wifi"></i></span>
      <div class="wifi-network-list" role="listbox" aria-label="Available Wi-Fi networks">
        ${networks.map((network) => {
          const selected = state.wifiNetwork === network.name;
          return `<button class="wifi-network${selected ? " is-selected" : ""}" type="button" data-action="select-wifi" data-network="${network.name}" role="option" aria-selected="${selected}">
            <strong>${network.name}</strong>
          </button>`;
        }).join("")}
      </div>
      <button class="wifi-skip" type="button" data-action="skip-wifi">Skip for now <span aria-hidden="true">· Swipe back</span></button>
    </div></div>`;
  }

  function wifiPasswordMarkup() {
    const inputType = state.wifiPasswordVisible ? "text" : "password";
    const visibilityIcon = state.wifiPasswordVisible ? "eye-off" : "eye";
    const keyboardPages = wifiKeyboardPages[state.wifiKeyboardMode];
    const keyboardPage = keyboardPages[state.wifiKeyboardPage % keyboardPages.length];
    const modeKey = state.wifiKeyboardMode === "numbers" ? "ABC" : "123";
    const keyboardKeys = keyboardPage.map((key) => `<button type="button" data-action="wifi-key" data-key="${key}">${key}</button>`).join("");
    return `<div class="onboarding-visual"><div class="wifi-visual wifi-password-visual">
      <span class="wifi-network-label"><i data-lucide="wifi"></i><strong>${state.wifiNetwork}</strong></span>
      <label class="wifi-password-field"><span class="sr-only">Wi-Fi password</span><input id="wifi-password" type="${inputType}" value="${state.wifiPassword.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\"/g, "&quot;")}" placeholder="Wi-Fi password" autocomplete="off"><button type="button" data-action="toggle-wifi-password" aria-label="${state.wifiPasswordVisible ? "Hide" : "Show"} Wi-Fi password"><i data-lucide="${visibilityIcon}"></i></button></label>
      <small>Enter the password to join this network.</small>
      <div class="wifi-keyboard" aria-label="On-screen keyboard">
        <div class="wifi-key-row" data-keyboard-mode="${state.wifiKeyboardMode}" aria-label="${state.wifiKeyboardMode === "numbers" ? "Number keys" : "Letter keys"}">${keyboardKeys}</div>
        <div class="wifi-key-actions"><button type="button" data-action="wifi-key" data-key="${modeKey}">${modeKey}</button><button type="button" data-action="wifi-delete" aria-label="Delete last character"><i data-lucide="delete"></i></button></div>
      </div>
    </div></div>`;
  }

  function toggleWifiKeyboard() {
    if (!isWifiPasswordContext()) return;
    state.wifiKeyboardMode = state.wifiKeyboardMode === "numbers" ? "letters" : "numbers";
    state.wifiKeyboardPage = 0;
    if (isControlsWifiPasswordPage()) renderControlsPage("wifi-password");
    else renderOnboardingStep(state.onboardingStep);
    getWifiPasswordInput()?.focus();
  }

  function shiftWifiKeyboardPage(direction) {
    if (!isWifiPasswordContext()) return;
    const keyboardPages = isControlsWifiPasswordPage() ? controlsWifiKeyboardPages : wifiKeyboardPages;
    const pageCount = keyboardPages[state.wifiKeyboardMode].length;
    state.wifiKeyboardPage = (state.wifiKeyboardPage + direction + pageCount) % pageCount;
    if (isControlsWifiPasswordPage()) renderControlsPage("wifi-password");
    else renderOnboardingStep(state.onboardingStep);
    getWifiPasswordInput()?.focus();
  }

  function isWifiPasswordContext() {
    return Boolean(document.querySelector('[data-scene="controls"] .controls-detail:not([hidden]) #controls-wifi-password')) || onboardingSteps[state.onboardingStep]?.id === "wifi-password";
  }

  function getWifiPasswordInput() {
    return document.querySelector('[data-scene="controls"] .controls-detail:not([hidden]) #controls-wifi-password') || document.querySelector("#wifi-password");
  }

  function isControlsWifiPasswordPage() {
    return Boolean(document.querySelector('[data-scene="controls"] .controls-detail:not([hidden]) #controls-wifi-password'));
  }

  function enterWifiKey(key) {
    if (!key || !isWifiPasswordContext()) return;
    if (key === "123" || key === "ABC") {
      toggleWifiKeyboard();
      return;
    }
    const input = getWifiPasswordInput();
    if (!input) return;
    state.wifiPassword += key;
    input.value = state.wifiPassword;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus({ preventScroll: true });
    input.setSelectionRange?.(input.value.length, input.value.length);
  }

  function deleteWifiKey() {
    if (!isWifiPasswordContext()) return;
    const input = getWifiPasswordInput();
    if (!input) return;
    state.wifiPassword = state.wifiPassword.slice(0, -1);
    input.value = state.wifiPassword;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus({ preventScroll: true });
    input.setSelectionRange?.(input.value.length, input.value.length);
  }

  function setUpWifiKeyboard() {
    const keyboard = document.querySelector('[data-scene="controls"] .controls-detail:not([hidden]) .controls-wifi-keyboard') || document.querySelector(".wifi-keyboard");
    const row = keyboard?.querySelector(".wifi-key-row");
    keyboard?.querySelectorAll("[data-action='wifi-key']").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        button.classList.add("is-pressed");
        window.setTimeout(() => button.classList.remove("is-pressed"), 140);
        enterWifiKey(button.dataset.key);
      });
    });
    keyboard?.querySelectorAll("[data-action='wifi-delete']").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteWifiKey();
      });
    });
    if (!row) return;

    let pointerStart = null;
    let pointerMoved = false;
    let swipeHandled = false;
    row.addEventListener("pointerdown", (event) => {
      pointerStart = { x: event.clientX, y: event.clientY };
      pointerMoved = false;
      swipeHandled = false;
      row.setPointerCapture?.(event.pointerId);
    });
    row.addEventListener("pointermove", (event) => {
      if (!pointerStart) return;
      pointerMoved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) >= 10;
    });
    row.addEventListener("pointerup", (event) => {
      if (!pointerStart) return;
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = null;
      const delta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
      if (!pointerMoved || Math.abs(delta) < 24) return;
      event.preventDefault();
      swipeHandled = true;
      shiftWifiKeyboardPage(delta < 0 ? 1 : -1);
    });
    row.addEventListener("pointercancel", () => {
      pointerStart = null;
    });
    row.addEventListener("click", (event) => {
      if (!swipeHandled) return;
      event.preventDefault();
      event.stopPropagation();
      swipeHandled = false;
    }, true);
    row.addEventListener("wheel", (event) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      shiftWifiKeyboardPage(delta > 0 ? 1 : -1);
    }, { passive: false });
  }

  function wifiConnectingMarkup() {
    return `<div class="onboarding-visual"><div class="wifi-visual wifi-connecting-visual">
      <span class="wifi-progress-ring" aria-hidden="true"><i></i></span>
      <strong>Joining Wi-Fi</strong><small>${state.wifiNetwork}</small>
    </div></div>`;
  }

  function wifiConnectedMarkup() {
    return `<div class="onboarding-visual"><div class="wifi-visual wifi-connected-visual">
      <span class="wifi-success-icon"><i data-lucide="check"></i></span>
      <strong>${state.wifiNetwork}</strong>
    </div></div>`;
  }

  function renderOnboardingStep(index) {
    clearPairTimers();
    const boundedIndex = Math.max(0, Math.min(onboardingSteps.length - 1, index));
    const step = onboardingSteps[boundedIndex];
    const scene = document.querySelector(".onboarding-scene");
    const stage = document.querySelector("#onboarding-stage");
    const actions = document.querySelector("#onboarding-actions");
    const back = document.querySelector("#onboarding-back");

    const previousStepId = scene.dataset.step;
    state.onboardingStep = boundedIndex;
    state.onboardingPointer = null;
    if (previousStepId !== step.id) {
      state.languageOpen = false;
      if (step.id === "wifi-password") {
        state.wifiKeyboardMode = "letters";
        state.wifiKeyboardPage = 0;
      }
    }
    scene.dataset.step = step.id;
    screen.classList.toggle("is-screen-contacting", step.id === "linking");
    const isChoose = step.id === "choose";
    const isMeet = step.id === "meet";
    const companion = getCompanion(isChoose ? state.pendingCompanionId : state.companionId);
    const title = isMeet
      ? `Nice to meet you, ${companion.name}`
      : step.id === "pair-code"
        ? "Scan QR code to connect"
        : step.title;
    const language = getLanguageOption();
    const subtitle = step.id === "language"
      ? `${state.language} is ready. You can change this later in the app.`
      : step.id === "wifi-password"
      ? `Enter the password for ${state.wifiNetwork}.`
      : step.id === "wifi-connecting"
      ? `Joining ${state.wifiNetwork}.`
      : step.id === "wifi-connected"
      ? `${state.wifiNetwork} is ready on LG01.`
      : isChoose
      ? `${companion.name} · ${companion.species} is ready in the LUMIQ app.`
      : isMeet
        ? `${companion.name} is now on LG01.`
        : step.subtitle;
    document.querySelector("#onboarding-count").textContent = step.id === "wifi-select" || step.id === "wifi-password" ? (step.id === "wifi-select" ? "Choose Wi-Fi" : "") : step.count;
    document.querySelector("#onboarding-title").textContent = title;
    document.querySelector("#onboarding-subtitle").textContent = subtitle;
    const progress = step.gesture ? 100 : (Math.min(boundedIndex + 1, setupStepCount) / setupStepCount) * 100;
    document.querySelector("#onboarding-progress").style.width = `${progress}%`;
    document.querySelector(".onboarding-skip").textContent = step.gesture ? "Skip guide" : "Skip";
    back.hidden = boundedIndex === 0 || step.id === "linking" || step.id === "wifi-connecting";
    if (isChoose) {
      renderCompanionPicker();
    } else if (isMeet) {
      stage.innerHTML = `<div class="onboarding-visual"><span class="sparkle-layer" aria-hidden="true"><i></i><i></i><i></i><i></i></span><img class="onboarding-fox" src="${companion.asset}" alt="${companion.name}, your ${companion.species} companion"></div>`;
    } else if (step.id === "language") {
      stage.innerHTML = languageVisualMarkup();
      setUpLanguagePicker();
    } else if (step.id === "pair-code") {
      stage.innerHTML = qrBindVisualMarkup();
    } else if (step.id === "wifi-select") {
      stage.innerHTML = wifiNetworksMarkup();
    } else if (step.id === "wifi-password") {
      stage.innerHTML = wifiPasswordMarkup();
    } else if (step.id === "wifi-connecting") {
      stage.innerHTML = wifiConnectingMarkup();
    } else if (step.id === "wifi-connected") {
      stage.innerHTML = wifiConnectedMarkup();
    } else {
      stage.innerHTML = step.gesture ? gestureVisual(step.gesture) : step.visual;
    }

    if (step.id === "request") {
      actions.innerHTML = '<button class="onboarding-secondary" type="button" data-action="cancel-pair" aria-label="Decline pairing"><i data-lucide="x"></i></button><button class="onboarding-primary" type="button" data-action="confirm-pair"><i data-lucide="check"></i><span>Connect</span></button>';
    } else if (step.id === "wifi-connecting") {
      actions.innerHTML = '<button class="onboarding-secondary wifi-cancel" type="button" data-action="cancel-wifi"><i data-lucide="x"></i><span>Cancel</span></button>';
    } else if (step.primary) {
      const label = isChoose
        ? `Use ${companion.name}`
        : step.id === "language"
          ? "Confirm"
          : step.primary;
      const buttonAriaLabel = step.id === "pair-code" ? step.primary : label;
      actions.innerHTML = `<button class="onboarding-primary" type="button" data-action="onboarding-next" aria-label="${buttonAriaLabel}"><i data-lucide="check"></i><span>${label}</span></button>`;
    } else {
      actions.innerHTML = "";
    }

    lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    if (step.id === "wifi-password") setUpWifiKeyboard();
    if (step.gesture) setUpGesturePad(step.gesture);
    if (step.id === "linking") {
      state.pairTimers.push(window.setTimeout(() => renderOnboardingStep(boundedIndex + 1), 1750));
    }
    if (step.id === "wifi-connecting") {
      state.pairTimers.push(window.setTimeout(() => renderOnboardingStep(boundedIndex + 1), 1900));
    }
    announce(`${step.count}. ${step.title}. ${subtitle}`);
  }

  function resetPairing() {
    state.pendingCompanionId = state.companionId;
    renderOnboardingStep(0);
  }

  function selectCompanion(id) {
    const companion = getCompanion(id);
    state.pendingCompanionId = companion.id;
    renderCompanionPicker();
    lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    document.querySelector("#onboarding-subtitle").textContent = `${companion.name} · ${companion.species} is ready in the LUMIQ app.`;
    document.querySelector("#onboarding-actions .onboarding-primary span").textContent = `Use ${companion.name}`;
    announce(`${companion.name}, ${companion.species}, selected`);
  }

  function selectWifi(network) {
    if (!network) return;
    state.wifiNetwork = network;
    renderOnboardingStep(state.onboardingStep);
    announce(`${network} selected`);
  }

  function toggleWifiPassword() {
    if (!isWifiPasswordContext()) return;
    state.wifiPasswordVisible = !state.wifiPasswordVisible;
    if (isControlsWifiPasswordPage()) renderControlsPage("wifi-password");
    else renderOnboardingStep(state.onboardingStep);
    window.setTimeout(() => getWifiPasswordInput()?.focus(), 0);
  }

  function skipWifi() {
    const chooseIndex = onboardingSteps.findIndex((step) => step.id === "choose");
    if (chooseIndex < 0) return;
    showToast("Wi-Fi setup skipped");
    renderOnboardingStep(chooseIndex);
  }

  function cancelWifi() {
    const passwordIndex = onboardingSteps.findIndex((step) => step.id === "wifi-password");
    if (passwordIndex < 0) return;
    renderOnboardingStep(passwordIndex);
  }

  function controlsMenuMarkup() {
    const items = [
      { page: "brightness", icon: "sun", label: "Brightness", detail: `${document.querySelector("#brightness")?.value || 72}%` },
      { page: "volume", icon: "volume-2", label: "Volume", detail: `${document.querySelector("#volume")?.value || 46}%` },
      { page: "quiet", icon: "moon-star", label: "Quiet Mode", detail: state.quietMode ? "On" : "Off" },
      { page: "wifi", icon: "wifi", label: "Wi-Fi", detail: state.wifiNetwork },
      { page: "language", icon: "globe", label: "Language", detail: state.language },
      { page: "about", icon: "info", label: "About", detail: "LG01" }
    ];
    return `<div class="controls-menu-list" role="list">${items.map((item) => `<button class="controls-menu-item" type="button" data-action="controls-page" data-page="${item.page}" aria-label="Open ${item.label}" role="listitem"><span class="controls-menu-dot controls-menu-dot-${item.page}" aria-hidden="true"><i data-lucide="${item.icon}"></i></span><span class="controls-menu-copy"><strong>${item.label}</strong></span><i class="controls-menu-chevron" data-lucide="chevron-right" aria-hidden="true"></i></button>`).join("")}</div>`;
  }

  function controlsDetailMarkup(page) {
    if (page === "menu") return controlsMenuMarkup();
    if (page === "brightness" || page === "volume") {
      const id = page;
      const input = document.querySelector(`#${id}`);
      const value = input?.value || (page === "brightness" ? "72" : "46");
      const icon = page === "brightness" ? "sun" : "volume-2";
      const label = page === "brightness" ? "Brightness" : "Volume";
      const ticks = Array.from({ length: 41 }, (_, index) => `<span class="controls-gauge-tick${index % 10 === 0 ? " is-major" : ""}" style="--tick-angle:${-135 + index * 6.75}deg"></span>`).join("");
      const labels = [
        ["0", -135], ["25", -67.5], ["50", 0], ["75", 67.5], ["100", 135]
      ].map(([text, angle]) => `<span class="controls-gauge-label" style="--label-angle:${angle}deg">${text}</span>`).join("");
      const angle = -135 + (Number(value) / 100) * 270;
      const arc = (Number(value) / 100) * 75;
      const gaugeClass = page === "volume" ? "controls-volume-gauge" : "controls-brightness-gauge";
      const centerNote = page === "volume" ? `<span class="controls-gauge-note">${state.volumeMuted ? "Press to Unmute" : "Press to Mute"}</span>` : "";
      const centerAction = page === "volume" ? ` data-action="controls-volume-mute" aria-label="${state.volumeMuted ? "Unmute" : "Mute"}" aria-pressed="${state.volumeMuted}"` : "";
      const centerIcon = page === "volume" && state.volumeMuted ? "volume-x" : icon;
      const centerTag = page === "volume" ? "button" : "div";
      return `<div class="controls-detail-page controls-gauge-page ${gaugeClass}"><div class="controls-gauge" data-gauge="${page}" style="--gauge-arc:${arc}%;--gauge-angle:${angle}deg"><div class="controls-gauge-ticks" aria-hidden="true">${ticks}</div>${labels}<div class="controls-gauge-ring" aria-hidden="true"></div><button class="controls-gauge-knob" type="button" aria-label="Adjust ${label.toLowerCase()}" style="--gauge-angle:${angle}deg"></button><${centerTag} class="controls-gauge-center"${centerTag === "button" ? ` type="button"${centerAction}` : ""}>${centerNote}<i data-lucide="${centerIcon}" aria-hidden="true"></i><strong class="controls-detail-value">${value}%</strong></${centerTag}><div class="controls-gauge-stepper controls-stepper"><button type="button" data-action="controls-adjust" data-target="${id}" data-delta="-5" aria-label="Decrease ${label}"><i data-lucide="minus" aria-hidden="true"></i></button><button type="button" data-action="controls-adjust" data-target="${id}" data-delta="5" aria-label="Increase ${label}"><i data-lucide="plus" aria-hidden="true"></i></button></div></div></div>`;
    }
    if (page === "quiet") {
      const companion = getCompanion();
      return `<div class="controls-detail-page controls-quiet-page controls-quiet-reference"><img class="controls-quiet-pet" src="${companion.asset}" alt="${companion.name}, your ${companion.species} companion"><button class="controls-quiet-switch" type="button" role="switch" data-toggle="dnd" aria-pressed="${state.quietMode}" aria-label="${state.quietMode ? "Turn off Do Not Disturb" : "Turn on Do Not Disturb"}"><span class="controls-quiet-switch-thumb" aria-hidden="true"></span></button></div>`;
    }
    if (page === "wifi") {
      return `<div class="controls-detail-page controls-wifi-page controls-wifi-connected-page"><span class="controls-detail-icon controls-detail-icon-wifi"><i data-lucide="wifi" aria-hidden="true"></i></span><strong class="controls-wifi-connected-name">${state.wifiNetwork}</strong><button class="controls-wifi-change" type="button" data-action="controls-wifi-change">Change</button></div>`;
    }
    if (page === "wifi-list") {
      const networks = ["Home_5G", "LUMIQ Studio", "Guest", "Office_WiFi", "LUMIQ_2G", "Studio_Guest", "Cafe_Free", "Visitor_WiFi"];
      return `<div class="controls-detail-page controls-wifi-page controls-wifi-select-reference"><div class="controls-network-list" role="listbox" aria-label="Available Wi-Fi networks">${networks.map((network) => `<button type="button" class="controls-network-item${network === state.wifiNetwork ? " is-selected" : ""}" data-action="controls-select-wifi" data-network="${network}" role="option" aria-selected="${network === state.wifiNetwork}"><span>${network}</span></button>`).join("")}</div><button class="controls-wifi-select-confirm" type="button" data-action="controls-wifi-confirm" aria-label="Confirm Wi-Fi network"><i data-lucide="check" aria-hidden="true"></i></button></div>`;
    }
    if (page === "wifi-password") {
      const escaped = state.wifiPassword.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\"/g, "&quot;");
      const keyboardPages = controlsWifiKeyboardPages[state.wifiKeyboardMode];
      const keyboardPage = keyboardPages[state.wifiKeyboardPage % keyboardPages.length];
      const modeKey = state.wifiKeyboardMode === "numbers" ? "ABC" : "123";
      const keyboardKeys = keyboardPage.map((key) => `<button type="button" data-action="wifi-key" data-key="${key}">${key}</button>`).join("");
      const inputType = state.wifiPasswordVisible ? "text" : "password";
      const visibilityIcon = state.wifiPasswordVisible ? "eye-off" : "eye";
      return `<div class="controls-detail-page controls-password-page controls-wifi-password-reference"><div class="controls-wifi-password-network"><i data-lucide="wifi" aria-hidden="true"></i><strong>${state.wifiNetwork}</strong></div><label class="controls-password-field"><span class="sr-only">Wi-Fi password</span><input id="controls-wifi-password" type="${inputType}" value="${escaped}" placeholder="Wi-Fi password" autocomplete="off"><button type="button" data-action="toggle-wifi-password" aria-label="${state.wifiPasswordVisible ? "Hide" : "Show"} Wi-Fi password"><i data-lucide="${visibilityIcon}" aria-hidden="true"></i></button></label><div class="wifi-keyboard controls-wifi-keyboard" aria-label="On-screen keyboard"><div class="wifi-key-row" data-keyboard-mode="${state.wifiKeyboardMode}" aria-label="${state.wifiKeyboardMode === "numbers" ? "Number keys" : "Letter keys"}">${keyboardKeys}</div><div class="wifi-key-actions"><button type="button" data-action="wifi-key" data-key="${modeKey}">${modeKey}</button><button type="button" data-action="wifi-delete" aria-label="Delete last character"><i data-lucide="delete" aria-hidden="true"></i></button></div></div><button class="controls-wifi-password-confirm" type="button" data-action="controls-wifi-join" aria-label="Join Wi-Fi"><i data-lucide="check" aria-hidden="true"></i></button></div>`;
    }
    if (page === "language") {
      const languageDisplayOrder = ["zh-CN", "en-US", "ja-JP", "ko-KR"];
      const displayOptions = languageDisplayOrder.map((id) => languageOptions.find((option) => option.id === id)).filter(Boolean);
      return `<div class="controls-detail-page controls-language-page controls-language-reference"><div class="controls-language-list" role="listbox" aria-label="Language choices">${displayOptions.map((option) => `<button type="button" class="controls-language-option${option.label === state.language ? " is-selected" : ""}" data-action="controls-language" data-language="${option.id}" role="option" aria-selected="${option.label === state.language}">${option.id === "zh-CN" ? "繁体字" : option.label === "English (US)" ? "English" : option.label}</button>`).join("")}</div><button class="controls-language-confirm" type="button" data-action="controls-language-confirm" aria-label="Confirm language"><i data-lucide="check" aria-hidden="true"></i></button></div>`;
    }
    return `<div class="controls-detail-page controls-about-page"><div class="about-hero"><span class="about-hero-icon"><i data-lucide="info" aria-hidden="true"></i></span><strong>LUMIQ</strong></div><div class="about-info-panel"><div class="about-info-row"><span class="about-row-icon"><i data-lucide="smartphone" aria-hidden="true"></i></span><span class="about-row-label">Device Name</span><strong>LUMIQ</strong></div><div class="about-info-row"><span class="about-row-icon"><i data-lucide="box" aria-hidden="true"></i></span><span class="about-row-label">Model</span><strong>LG01</strong></div><div class="about-info-row"><span class="about-row-icon"><i data-lucide="tag" aria-hidden="true"></i></span><span class="about-row-label">Version</span><strong>V1.01</strong></div></div></div>`;
  }

  function renderControlsPage(page = "menu") {
    const main = document.querySelector("#controls-main");
    const detail = document.querySelector("#controls-detail");
    const title = document.querySelector("#controls-title");
    const back = document.querySelector('.scene[data-scene="controls"] .scene-header .icon-button');
    if (!main || !detail || !title || !back) return;
    if (page === "main") page = "menu";
    state.controlsPage = page;
    const isRoot = page === "menu";
    main.hidden = true;
    detail.hidden = false;
    title.textContent = isRoot ? "Settings" : page === "wifi-password" || page === "wifi" || page === "wifi-list" ? "Wi-Fi" : page === "quiet" ? "Quiet Mode" : page[0].toUpperCase() + page.slice(1);
    back.dataset.action = isRoot ? "home" : "controls-back";
    back.setAttribute("aria-label", isRoot ? "Back to home" : "Back to Settings");
    back.hidden = false;
    back.style.visibility = "";
    title.classList.toggle("controls-title-language", page === "language");
    title.classList.toggle("controls-title-wifi", page === "wifi-list");
    detail.innerHTML = controlsDetailMarkup(page);
    lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    if (page === "brightness" || page === "volume") setUpControlsGauge(page);
    if (page === "wifi-password") setUpWifiKeyboard();
  }

  function setUpControlsGauge(page = "brightness") {
    const gauge = document.querySelector(`.controls-gauge[data-gauge="${page}"]`);
    const input = document.querySelector(`#${page}`);
    if (!gauge || !input) return;

    let dragging = false;
    const updateFromPointer = (event) => {
      const rect = gauge.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let angle = Math.atan2(event.clientX - centerX, centerY - event.clientY) * 180 / Math.PI;
      if (angle < -135) angle += 360;
      angle = Math.max(-135, Math.min(135, angle));
      const value = Math.round(((angle + 135) / 270) * 100);
      input.value = String(value);
      updateRange(input);
      gauge.style.setProperty("--gauge-arc", `${(value / 100) * 75}%`);
      gauge.style.setProperty("--gauge-angle", `${angle}deg`);
      gauge.querySelector(".controls-gauge-knob")?.style.setProperty("--gauge-angle", `${angle}deg`);
      const output = gauge.querySelector(".controls-detail-value");
      if (output) output.textContent = `${value}%`;
    };
    gauge.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".controls-gauge-stepper, .controls-gauge-center")) return;
      dragging = true;
      gauge.setPointerCapture?.(event.pointerId);
      updateFromPointer(event);
    });
    gauge.addEventListener("pointermove", (event) => {
      if (dragging) updateFromPointer(event);
    });
    gauge.addEventListener("pointerup", (event) => {
      dragging = false;
      gauge.releasePointerCapture?.(event.pointerId);
    });
    gauge.addEventListener("pointercancel", () => { dragging = false; });
  }

  function adjustControl(id, delta) {
    const input = document.querySelector(`#${id}`);
    if (!input) return;
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    input.value = String(Math.max(min, Math.min(max, Number(input.value) + Number(delta))));
    if (id === "volume") state.volumeMuted = false;
    updateRange(input);
    renderControlsPage(state.controlsPage);
  }

  function toggleVolumeMute() {
    const input = document.querySelector("#volume");
    if (!input) return;
    if (state.volumeMuted) {
      input.value = String(state.volumeBeforeMute ?? 46);
      state.volumeMuted = false;
    } else {
      state.volumeBeforeMute = Number(input.value) || 46;
      input.value = "0";
      state.volumeMuted = true;
    }
    updateRange(input);
    renderControlsPage(state.controlsPage);
  }

  function selectControlsWifi(network) {
    if (!network) return;
    state.wifiNetwork = network;
    state.wifiPassword = "";
    if (state.controlsPage === "wifi-list") renderControlsPage("wifi-list");
    else renderControlsPage("wifi");
    announce(`${network} selected`);
  }

  function selectControlsLanguage(id) {
    const option = languageOptions.find((item) => item.id === id);
    if (!option) return;
    state.language = option.label;
    renderControlsPage("language");
    announce(`${state.language} selected`);
  }

  function joinControlsWifi() {
    if (!state.wifiPassword.trim()) {
      showToast("Enter the Wi-Fi password");
      document.querySelector("#controls-wifi-password")?.focus();
      return;
    }
    showToast(`${state.wifiNetwork} connected`);
    renderControlsPage("wifi");
  }

  function advanceOnboarding() {
    const step = onboardingSteps[state.onboardingStep];
    if (step.id === "request" || step.id === "linking" || step.gesture) return;
    if (step.id === "wifi-password" && !state.wifiPassword.trim()) {
      showToast("Enter the Wi-Fi password");
      document.querySelector("#wifi-password")?.focus();
      return;
    }
    if (step.id === "choose") {
      state.companionId = state.pendingCompanionId;
      applyCompanion();
      persistCompanion(state.companionId);
    }
    renderOnboardingStep(state.onboardingStep + 1);
  }

  function goTo(sceneName, options = {}) {
    const target = scenes.find((scene) => scene.dataset.scene === sceneName);
    const current = scenes.find((scene) => scene.classList.contains("is-active"));
    if (!target || target === current) return;

    if (state.scene === "voice" && sceneName !== "voice") {
      stopRecording({ reset: true });
    }
    if (state.scene === "pairing" && sceneName !== "pairing") {
      clearPairTimers();
    }

    current?.classList.add("is-leaving");
    current?.classList.remove("is-active");
    current?.setAttribute("aria-hidden", "true");

    target.classList.remove("is-leaving");
    target.classList.add("is-active");
    target.setAttribute("aria-hidden", "false");

    window.setTimeout(() => current?.classList.remove("is-leaving"), 300);
    state.scene = sceneName;

    navButtons.forEach((button) => {
      button.classList.toggle("is-current", button.dataset.go === sceneName);
    });
    if (statePickerWrap) statePickerWrap.hidden = sceneName !== "states";

    if (sceneName === "chat") {
      setChatMode(state.micLocked ? "locked" : "listening");
    }
    if (sceneName === "controls") {
      renderControlsPage("menu");
    }
    if (sceneName === "states") {
      renderUiState(state.uiStateIndex, { silent: true });
    }
    if (sceneName === "pairing") {
      resetPairing();
    }

    if (!options.silent) {
      announce(target.getAttribute("aria-label") || sceneName);
    }
  }

  function setChatMode(mode) {
    const label = document.querySelector("#session-state");
    const hint = document.querySelector("#session-hint");
    const visual = document.querySelector("#voice-visual");
    const privacy = document.querySelector("#privacy-state");
    const character = document.querySelector(".chat-character img");
    const characterButton = document.querySelector(".chat-character");

    visual.className = "voice-visual";
    state.chatMode = mode;
    characterButton.classList.remove("is-listening", "is-thinking", "is-speaking", "is-locked");
    characterButton.classList.add(`is-${mode}`);
    characterButton.dataset.expression = mode;

    if (mode === "locked") {
      label.textContent = "Microphone locked";
      hint.textContent = "Unlock in Quick Controls";
      privacy.textContent = "Mic off";
      visual.hidden = true;
      character.alt = `${getCompanion().name} waiting while the microphone is locked`;
      return;
    }

    privacy.textContent = "Mic on";
    visual.hidden = false;

    if (mode === "listening") {
      label.textContent = "Listening";
      hint.textContent = "Swipe right to end";
      visual.classList.add("is-listening");
      character.alt = `${getCompanion().name} listening`;
    } else if (mode === "thinking") {
      label.textContent = "Thinking";
      hint.textContent = "Swipe right to end";
      visual.classList.add("is-thinking");
      character.alt = `${getCompanion().name} thinking`;
    } else {
      label.textContent = "Speaking";
      hint.textContent = "Tap to interrupt";
      visual.classList.add("is-speaking");
      character.alt = `${getCompanion().name} speaking`;
    }

    announce(label.textContent);
  }

  function cycleChat() {
    if (state.micLocked) {
      showToast("Microphone is locked");
      return;
    }

    if (state.chatMode === "listening") {
      setChatMode("thinking");
      window.setTimeout(() => {
        if (state.scene === "chat" && state.chatMode === "thinking") {
          setChatMode("speaking");
        }
      }, 1900);
    } else {
      setChatMode("listening");
    }
  }

  function endChat() {
    if (state.scene !== "chat") return;
    showToast("Chat ended", 900);
    window.setTimeout(() => goTo("home"), 180);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
  }

  function toggleRecording() {
    if (state.micLocked) {
      showToast("Unlock microphone first");
      return;
    }

    if (!state.recording) {
      state.recording = true;
      state.recordPaused = false;
      clearRecordingPlayback();
      state.recordSeconds = 0;
      const button = document.querySelector("#record-button");
      const voiceScene = document.querySelector(".voice-note-scene");
      const pauseButton = document.querySelector("#record-pause-button");
      button.classList.remove("is-saved");
      button.classList.add("is-recording");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Stop and save recording");
      if (pauseButton) {
        pauseButton.hidden = false;
        pauseButton.classList.remove("is-paused");
        pauseButton.setAttribute("aria-label", "Pause recording");
        pauseButton.querySelector("svg")?.setAttribute("data-lucide", "pause");
      }
      voiceScene.classList.remove("is-saved");
      voiceScene.classList.add("is-recording");
      document.querySelector("#voice-status").textContent = "Recording · Mic on";
      document.querySelector("#record-hint").textContent = "Tap to save";
      document.querySelector("#record-time").textContent = "00:00";
      updateRecordingList(false);
      startRecordMeter();
      lucide.createIcons({ attrs: { "aria-hidden": "true" } });
      startRecordClock();
      announce("Recording started. Microphone on.");
    } else {
      stopRecording({ saved: true });
      showToast("Voice note saved");
      announce("Voice note saved. Tap to record again.");
    }
  }

  function toggleRecordingPause() {
    if (!state.recording) return;
    const pauseButton = document.querySelector("#record-pause-button");
    const voiceScene = document.querySelector(".voice-note-scene");
    state.recordPaused = !state.recordPaused;
    pauseButton?.classList.toggle("is-paused", state.recordPaused);
    voiceScene?.classList.toggle("is-paused", state.recordPaused);
    if (state.recordPaused) {
      window.clearInterval(state.recordTimer);
      state.recordTimer = null;
      stopRecordMeter();
      document.querySelector("#voice-status").textContent = "Recording paused";
      document.querySelector("#record-hint").textContent = "Tap to resume";
      pauseButton?.setAttribute("aria-label", "Resume recording");
      pauseButton?.querySelector("svg")?.setAttribute("data-lucide", "play");
      announce("Recording paused");
    } else {
      startRecordMeter();
      startRecordClock();
      document.querySelector("#voice-status").textContent = "Recording · Mic on";
      document.querySelector("#record-hint").textContent = "Tap to save";
      pauseButton?.setAttribute("aria-label", "Pause recording");
      pauseButton?.querySelector("svg")?.setAttribute("data-lucide", "pause");
      announce("Recording resumed");
    }
    lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }

  function toggleControl(button) {
    const key = button.dataset.toggle;
    const pressed = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(pressed));

    if (key === "mic") {
      state.micLocked = pressed;
      button.querySelector("span")?.replaceChildren(document.createTextNode(pressed ? "Mic off" : "Mic"));
      const icon = button.querySelector("svg");
      if (icon) {
        icon.setAttribute("data-lucide", pressed ? "mic-off" : "mic");
        lucide.createIcons({ attrs: { "aria-hidden": "true" } });
      }
      showToast(pressed ? "Microphone locked" : "Microphone available");
    } else {
      state.quietMode = pressed;
      showToast(pressed ? "Quiet mode on" : "Quiet mode off");
      if (state.scene === "controls" && state.controlsPage === "quiet") renderControlsPage("quiet");
    }
  }

  function confirmPairing() {
    if (onboardingSteps[state.onboardingStep]?.id !== "request") return;
    renderOnboardingStep(state.onboardingStep + 1);
  }

  function toggleLanguage() {
    if (onboardingSteps[state.onboardingStep]?.id !== "language") return;
    state.languageOpen = !state.languageOpen;
    renderOnboardingStep(state.onboardingStep);
  }

  function selectLanguage(id) {
    const option = languageOptions.find((item) => item.id === id);
    if (!option) return;
    state.language = option.label;
    state.languageOpen = false;
    renderOnboardingStep(state.onboardingStep);
    showToast(`${state.language} selected`);
    announce(`${state.language} selected`);
  }

  async function copyPairCode() {
    try {
      await navigator.clipboard?.writeText(state.pairCode);
    } catch (error) {
      // Clipboard access is optional in the prototype preview.
    }
    showToast(`Pairing code ${state.pairCode} copied`);
    announce(`Pairing code ${state.pairCode} copied`);
  }

  function flashEdge(position) {
    edgeFeedback.className = `edge-feedback at-${position}`;
    void edgeFeedback.offsetWidth;
    edgeFeedback.classList.add("is-visible");
  }

  function handleSwipe(deltaX, deltaY) {
    if (state.scene === "pairing") return;
    const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const threshold = 48;

    if (horizontal && Math.abs(deltaX) >= threshold) {
      if (deltaX > 0) {
        flashEdge("right");
        if (state.scene === "home") return;
        if (state.scene === "chat") showToast("Chat ended", 900);
        if (state.scene === "voice") setVoiceListView(true);
        else if (state.scene === "reminder") goTo("notifications");
        else goTo("home");
      } else if (state.scene === "voice" && state.voiceListView) {
        flashEdge("left");
        setVoiceListView(false);
      } else if (state.scene === "home") {
        flashEdge("left");
        goTo("apps");
      }
      return;
    }

    if (!horizontal && Math.abs(deltaY) >= threshold && state.scene === "home") {
      if (deltaY > 0) {
        flashEdge("bottom");
        goTo("controls");
      } else {
        flashEdge("top");
        goTo("notifications");
      }
    }
  }

  screen.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button, input")) return;
    state.pointerStart = { x: event.clientX, y: event.clientY };
  });

  screen.addEventListener("pointerup", (event) => {
    if (!state.pointerStart) return;
    const deltaX = event.clientX - state.pointerStart.x;
    const deltaY = event.clientY - state.pointerStart.y;
    state.pointerStart = null;
    handleSwipe(deltaX, deltaY);
  });

  screen.addEventListener("pointercancel", () => {
    state.pointerStart = null;
  });

  document.addEventListener("click", (event) => {
    const sceneChoice = event.target.closest("[data-go]");
    if (sceneChoice) {
      goTo(sceneChoice.dataset.go);
      return;
    }

    const toggle = event.target.closest("[data-toggle]");
    if (toggle) {
      toggleControl(toggle);
      return;
    }

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    const destinations = new Set(["overview", "home", "apps", "chat", "controls", "notifications", "voice", "care", "reminder", "states", "pairing"]);
    if (destinations.has(action)) {
      goTo(action);
    } else if (action === "controls-menu") {
      renderControlsPage("menu");
    } else if (action === "controls-page") {
      renderControlsPage(event.target.closest("[data-page]")?.dataset.page || "main");
    } else if (action === "controls-back") {
      renderControlsPage("menu");
    } else if (action === "controls-adjust") {
      const control = event.target.closest("[data-action=\"controls-adjust\"]");
      adjustControl(control?.dataset.target, Number(control?.dataset.delta || 0));
    } else if (action === "controls-volume-mute") {
      toggleVolumeMute();
    } else if (action === "controls-select-wifi") {
      selectControlsWifi(event.target.closest("[data-network]")?.dataset.network);
    } else if (action === "controls-wifi-confirm") {
      renderControlsPage("wifi-password");
    } else if (action === "controls-wifi-change") {
      renderControlsPage("wifi-list");
    } else if (action === "controls-language") {
      selectControlsLanguage(event.target.closest("[data-language]")?.dataset.language);
    } else if (action === "controls-language-confirm") {
      renderControlsPage("menu");
    } else if (action === "controls-wifi-join") {
      joinControlsWifi();
    } else if (action === "weather") {
      showToast("24° · Sunny all afternoon");
    } else if (action === "cycle-chat") {
      cycleChat();
    } else if (action === "end-chat") {
      endChat();
    } else if (action === "select-wifi") {
      selectWifi(event.target.closest("[data-network]")?.dataset.network);
    } else if (action === "toggle-wifi-password") {
      toggleWifiPassword();
    } else if (action === "wifi-key") {
      enterWifiKey(event.target.closest("[data-key]")?.dataset.key);
    } else if (action === "wifi-delete") {
      deleteWifiKey();
    } else if (action === "skip-wifi") {
      skipWifi();
    } else if (action === "cancel-wifi") {
      cancelWifi();
    } else if (action === "record") {
      toggleRecording();
    } else if (action === "toggle-recording-pause") {
      toggleRecordingPause();
    } else if (action === "toggle-latest-recording") {
      toggleLatestRecording(event.target.closest(".recording-play-button"));
    } else if (action === "friend") {
      showToast("Milo waved hello");
      event.target.closest(".notice-item")?.setAttribute("disabled", "");
    } else if (action === "snooze") {
      showToast("Reminder moved 10 min");
      window.setTimeout(() => goTo("home"), 1100);
    } else if (action === "done") {
      showToast("Reminder completed");
      window.setTimeout(() => goTo("home"), 1100);
    } else if (action === "onboarding-next") {
      advanceOnboarding();
    } else if (action === "toggle-language") {
      toggleLanguage();
    } else if (action === "select-language") {
      selectLanguage(event.target.closest("[data-language]")?.dataset.language);
    } else if (action === "copy-pair-code") {
      copyPairCode();
    } else if (action === "select-companion") {
      selectCompanion(event.target.closest("[data-companion]")?.dataset.companion);
    } else if (action === "onboarding-back") {
      if (state.onboardingStep > 0) renderOnboardingStep(state.onboardingStep - 1);
      else goTo("home");
    } else if (action === "skip-onboarding") {
      finishOnboarding();
    } else if (action === "confirm-pair") {
      confirmPairing();
    } else if (action === "cancel-pair") {
      showToast("Request declined");
      renderOnboardingStep(2);
    } else if (action === "previous-state") {
      renderUiState(state.uiStateIndex - 1);
    } else if (action === "next-state") {
      renderUiState(state.uiStateIndex + 1);
    } else if (action === "state-primary") {
      runUiStateAction("primary");
    } else if (action === "state-secondary") {
      runUiStateAction("secondary");
    }
  });

  statePicker?.addEventListener("change", () => {
    const index = uiStates.findIndex((item) => item.id === statePicker.value);
    if (index >= 0) renderUiState(index);
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("#wifi-password, #controls-wifi-password")) state.wifiPassword = event.target.value;
  });

  const rangeHighlightTimers = new WeakMap();
  const rangeTones = {
    brightness: { low: [211, 146, 52], high: [255, 231, 126] },
    volume: { low: [204, 91, 79], high: [255, 151, 113] }
  };

  function mixTone(start, end, amount) {
    return start.map((channel, index) => Math.round(channel + (end[index] - channel) * amount));
  }

  function applyRangeTone(input, control, amount) {
    const tone = rangeTones[input.id];
    if (!tone || !control) return;

    const accent = mixTone(tone.low, tone.high, amount);
    const soft = mixTone(tone.low, accent, .42);
    control.style.setProperty("--slider-color", `rgb(${accent.join(", ")})`);
    control.style.setProperty("--slider-color-soft", `rgb(${soft.join(", ")})`);
    control.style.setProperty("--slider-glow", `rgba(${accent.join(", ")}, ${(.24 + amount * .2).toFixed(2)})`);
  }

  function updateRange(input, flash = true) {
    const min = Number(input.min) || 0;
    const max = Number(input.max) || 100;
    const value = Number(input.value);
    const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
    const control = input.closest(".slider-control");
    const output = document.querySelector(`#${input.id}-output`);

    const boundedProgress = Math.max(0, Math.min(100, progress));
    input.style.setProperty("--slider-progress", `${boundedProgress}%`);
    applyRangeTone(input, control, boundedProgress / 100);
    if (output) output.value = input.value;
    if (!flash || !control) return;

    control.classList.add("is-changing");
    window.clearTimeout(rangeHighlightTimers.get(input));
    rangeHighlightTimers.set(input, window.setTimeout(() => {
      if (!control.classList.contains("is-sliding")) control.classList.remove("is-changing");
    }, 420));
  }

  function setRangeSliding(input, isSliding) {
    const control = input.closest(".slider-control");
    if (!control) return;
    control.classList.toggle("is-sliding", isSliding);
    if (isSliding) {
      control.classList.add("is-changing");
      return;
    }
    window.clearTimeout(rangeHighlightTimers.get(input));
    rangeHighlightTimers.set(input, window.setTimeout(() => {
      control.classList.remove("is-changing");
    }, 180));
  }

  document.querySelectorAll("input[type='range']").forEach((input) => {
    updateRange(input, false);
    input.addEventListener("input", () => updateRange(input));
    input.addEventListener("pointerdown", () => setRangeSliding(input, true));
    input.addEventListener("pointerup", () => setRangeSliding(input, false));
    input.addEventListener("pointercancel", () => setRangeSliding(input, false));
    input.addEventListener("lostpointercapture", () => setRangeSliding(input, false));
    input.addEventListener("keydown", () => setRangeSliding(input, true));
    input.addEventListener("keyup", () => setRangeSliding(input, false));
    input.addEventListener("blur", () => setRangeSliding(input, false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input[type='range'], select")) return;
    if (state.scene === "pairing") {
      if (event.key === "Escape") goTo("home");
      return;
    }
    if (state.scene === "states") {
      if (event.key === "ArrowLeft") renderUiState(state.uiStateIndex - 1);
      else if (event.key === "ArrowRight") renderUiState(state.uiStateIndex + 1);
      else if (event.key === "Escape") goTo("home");
      return;
    }
    if (event.key === "ArrowRight" && state.scene === "voice") setVoiceListView(true);
    else if (event.key === "ArrowLeft" && state.scene === "voice" && state.voiceListView) setVoiceListView(false);
    else if (event.key === "ArrowRight" && state.scene === "reminder") goTo("notifications");
    else if (event.key === "ArrowRight" && state.scene !== "home") goTo("home");
    if (event.key === "ArrowLeft" && state.scene === "home") goTo("apps");
    if (event.key === "ArrowDown" && state.scene === "home") goTo("controls");
    if (event.key === "ArrowUp" && state.scene === "home") goTo("notifications");
    if (event.key === "Escape" && state.scene !== "home") goTo("home");
  });

  const breathPhase = document.querySelector("#breath-phase");
  let breathTick = 4;
  let inhaling = true;
  window.setInterval(() => {
    if (state.scene !== "care") return;
    breathTick -= 1;
    if (breathTick <= 0) {
      inhaling = !inhaling;
      breathTick = 4;
    }
    breathPhase.textContent = `${inhaling ? "Inhale" : "Exhale"} · ${breathTick}`;
  }, 1000);

  const query = new URLSearchParams(window.location.search);
  let storedCompanionId = "fox";
  try {
    const savedCompanion = window.localStorage.getItem(companionStorageKey);
    if (companions.some((companion) => companion.id === savedCompanion)) storedCompanionId = savedCompanion;
  } catch (error) {
    storedCompanionId = "fox";
  }
  const requestedCompanionId = query.get("companion");
  const initialCompanionId = companions.some((companion) => companion.id === requestedCompanionId)
    ? requestedCompanionId
    : storedCompanionId;
  state.companionId = initialCompanionId;
  state.pendingCompanionId = initialCompanionId;
  applyCompanion(initialCompanionId);

  populateStatePicker();
  renderUiState(0, { silent: true });
  lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  setUpRecordingList();

  let onboardingComplete = false;
  try {
    onboardingComplete = window.localStorage.getItem("lumiq-fox-onboarding-v1") === "complete";
  } catch (error) {
    onboardingComplete = false;
  }
  const forceOnboarding = query.get("onboarding") === "1";
  const forceOverview = query.get("overview") === "1";
  const requestedStateIndex = uiStates.findIndex((item) => item.id === query.get("state"));
  if (requestedStateIndex >= 0) {
    renderUiState(requestedStateIndex, { silent: true });
    goTo("states", { silent: true });
  } else if (forceOverview) {
    goTo("overview", { silent: true });
  } else if (forceOnboarding || !onboardingComplete) {
    goTo("pairing", { silent: true });
  }
})();
