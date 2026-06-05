
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const homePanel = document.getElementById("homePanel");
  const gameOverPanel = document.getElementById("gameOverPanel");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalChip = document.getElementById("modalChip");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalBody = document.getElementById("modalBody");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const bgm = document.getElementById("bgm");
  const statusMessage = document.getElementById("statusMessage");

  const playBtn = document.getElementById("playBtn");
  const replayBtn = document.getElementById("replayBtn");
  const openShopBtn = document.getElementById("openShopBtn");
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  const howToBtn = document.getElementById("howToBtn");
  const creditsBtn = document.getElementById("creditsBtn");
  const claimDailyBtn = document.getElementById("claimDailyBtn");
  const goShopBtn = document.getElementById("goShopBtn");
  const goMenuBtn = document.getElementById("goMenuBtn");
  const shopHudBtn = document.getElementById("shopHudBtn");
  const resetBtn = document.getElementById("resetBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const muteBtn = document.getElementById("muteBtn");

  const scoreBadge = document.getElementById("scoreBadge");
  const bestBadge = document.getElementById("bestBadge");
  const coinsBadge = document.getElementById("coinsBadge");
  const shieldBadge = document.getElementById("shieldBadge");
  const stageBadge = document.getElementById("stageBadge");
  const powerBadge = document.getElementById("powerBadge");

  const homeBest = document.getElementById("homeBest");
  const homeCoins = document.getElementById("homeCoins");
  const homeStage = document.getElementById("homeStage");
  const finalScore = document.getElementById("finalScore");
  const finalBest = document.getElementById("finalBest");
  const finalCoins = document.getElementById("finalCoins");
  const gameOverLead = document.getElementById("gameOverLead");

  const STORAGE = {
    best: "starHopperBest",
    coins: "starHopperCoins",
    muted: "starHopperMuted",
    selectedShip: "starHopperSelectedShip",
    unlockedShips: "starHopperUnlockedShips",
    selectedObstacle: "starHopperSelectedObstacle",
    unlockedObstacles: "starHopperUnlockedObstacles",
    selectedBackground: "starHopperSelectedBackground",
    unlockedBackgrounds: "starHopperUnlockedBackgrounds",
    selectedTrail: "starHopperSelectedTrail",
    unlockedTrails: "starHopperUnlockedTrails",
    highestStage: "starHopperHighestStage",
    lastDaily: "starHopperLastDaily"
  };
  const DAY_MS = 24 * 60 * 60 * 1000;

  const storage = {
    get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };

  const shipItems = [
    { id: "scout", name: "Scout", price: 0, description: "Balanced starter ship." },
    { id: "nova", name: "Nova", price: 35, description: "Blue fast-look hull." },
    { id: "ember", name: "Ember", price: 70, description: "Red hot comet style." },
    { id: "mint", name: "Mint Jet", price: 105, description: "Fresh green sleek frame." }
  ];
  const obstacleItems = [
    { id: "asteroid", name: "Asteroids", price: 0, description: "Classic rocky gate chunks." },
    { id: "crystal", name: "Crystals", price: 40, description: "Bright cosmic crystal gates." },
    { id: "tech", name: "Tech Pillars", price: 80, description: "Metal station pylons." }
  ];
  const backgroundItems = [
    { id: "nebula", name: "Nebula", price: 0, description: "Colorful deep-space clouds." },
    { id: "midnight", name: "Midnight", price: 50, description: "Dark starfield with moon glow." },
    { id: "retro", name: "Retro Grid", price: 90, description: "Synthwave flight lane." }
  ];
  const trailItems = [
    { id: "stardust", name: "Stardust", price: 0, description: "Soft glowing particle trail." },
    { id: "rainbow", name: "Rainbow", price: 45, description: "Color-pop booster trail." },
    { id: "plasma", name: "Plasma", price: 85, description: "Electric violet wake." }
  ];

  function loadUnlocked(key, defaultItem) {
    try {
      const arr = JSON.parse(storage.get(key, JSON.stringify([defaultItem])));
      return Array.isArray(arr) && arr.length ? arr : [defaultItem];
    } catch {
      return [defaultItem];
    }
  }

  let totalCoins = Number(storage.get(STORAGE.coins, "0")) || 0;
  let best = Number(storage.get(STORAGE.best, "0")) || 0;
  let highestStage = Number(storage.get(STORAGE.highestStage, "1")) || 1;
  let muted = storage.get(STORAGE.muted, "0") === "1";

  let unlockedShips = loadUnlocked(STORAGE.unlockedShips, "scout");
  let unlockedObstacles = loadUnlocked(STORAGE.unlockedObstacles, "asteroid");
  let unlockedBackgrounds = loadUnlocked(STORAGE.unlockedBackgrounds, "nebula");
  let unlockedTrails = loadUnlocked(STORAGE.unlockedTrails, "stardust");
  let selectedShip = storage.get(STORAGE.selectedShip, "scout");
  let selectedObstacle = storage.get(STORAGE.selectedObstacle, "asteroid");
  let selectedBackground = storage.get(STORAGE.selectedBackground, "nebula");
  let selectedTrail = storage.get(STORAGE.selectedTrail, "stardust");
  if (!unlockedShips.includes(selectedShip)) selectedShip = "scout";
  if (!unlockedObstacles.includes(selectedObstacle)) selectedObstacle = "asteroid";
  if (!unlockedBackgrounds.includes(selectedBackground)) selectedBackground = "nebula";
  if (!unlockedTrails.includes(selectedTrail)) selectedTrail = "stardust";

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  let W = 0, H = 0, DPR = 1, lastTime = 0;
  let state = "menu"; // menu playing paused gameover
  let activeModal = null;
  let resumeAfterModal = false;
  let score = 0;
  let runCoins = 0;
  let shields = 0;
  let stage = 1;
  let invincibleTimer = 0;
  let magnetTimer = 0;
  let boostTimer = 0;
  let bgOffset = 0;
  let previewTime = 0;
  let overlayMessage = "";
  let overlayTimer = 0;

  const ship = { x: 120, y: 260, w: 72, h: 52, vy: 0, rot: 0 };
  const game = {
    baseSpeed: 210,
    gravity: 1640,
    flap: -420,
    gapBase: 178,
    pipeWidth: 94,
    pipeTimer: 0,
    pipeEvery: 1.45,
    enemyTimer: 0,
    enemyEvery: 2.8,
    coinTimer: 0,
    coinEvery: 3.6,
    shieldTimer: 0,
    shieldEvery: 11.0,
    magnetSpawnTimer: 0,
    magnetEvery: 15.0,
    boostSpawnTimer: 0,
    boostEvery: 18.0,
    pipes: [],
    enemies: [],
    coins: [],
    shields: [],
    magnets: [],
    boosts: [],
    particles: []
  };

  function announce(msg) {
    statusMessage.textContent = msg;
  }

  function saveProgress() {
    storage.set(STORAGE.coins, String(totalCoins));
    storage.set(STORAGE.best, String(best));
    storage.set(STORAGE.highestStage, String(highestStage));
    storage.set(STORAGE.unlockedShips, JSON.stringify(unlockedShips));
    storage.set(STORAGE.unlockedObstacles, JSON.stringify(unlockedObstacles));
    storage.set(STORAGE.unlockedBackgrounds, JSON.stringify(unlockedBackgrounds));
    storage.set(STORAGE.unlockedTrails, JSON.stringify(unlockedTrails));
    storage.set(STORAGE.selectedShip, selectedShip);
    storage.set(STORAGE.selectedObstacle, selectedObstacle);
    storage.set(STORAGE.selectedBackground, selectedBackground);
    storage.set(STORAGE.selectedTrail, selectedTrail);
  }

  function ensureAudio() {
    if (!AudioContextCtor) return;
    if (!audioCtx) audioCtx = new AudioContextCtor({ latencyHint: "interactive" });
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  }

  function playSfx(type) {
    if (muted || !audioCtx) return;
    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, now);

    const o1 = audioCtx.createOscillator();
    o1.connect(gain);

    if (type === "flap") {
      o1.type = "triangle";
      o1.frequency.setValueAtTime(430, now);
      o1.frequency.exponentialRampToValueAtTime(760, now + 0.10);
      gain.gain.exponentialRampToValueAtTime(0.13, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      o1.start(now); o1.stop(now + 0.14);
    } else if (type === "point") {
      o1.type = "sine";
      o1.frequency.setValueAtTime(740, now);
      o1.frequency.exponentialRampToValueAtTime(1020, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
      o1.start(now); o1.stop(now + 0.12);
    } else if (type === "coin") {
      const o2 = audioCtx.createOscillator(); o2.connect(gain);
      o1.type = "sine"; o2.type = "triangle";
      o1.frequency.setValueAtTime(880, now);
      o1.frequency.exponentialRampToValueAtTime(1180, now + 0.11);
      o2.frequency.setValueAtTime(1170, now + 0.03);
      o2.frequency.exponentialRampToValueAtTime(1460, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      o1.start(now); o1.stop(now + 0.12); o2.start(now + 0.03); o2.stop(now + 0.17);
    } else if (type === "shield") {
      const o2 = audioCtx.createOscillator(); o2.connect(gain);
      o1.type = "sine"; o2.type = "triangle";
      o1.frequency.setValueAtTime(520, now);
      o1.frequency.exponentialRampToValueAtTime(820, now + 0.20);
      o2.frequency.setValueAtTime(840, now + 0.04);
      o2.frequency.exponentialRampToValueAtTime(1160, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      o1.start(now); o1.stop(now + 0.20); o2.start(now + 0.04); o2.stop(now + 0.26);
    } else if (type === "power") {
      const o2 = audioCtx.createOscillator(); o2.connect(gain);
      o1.type = "sawtooth"; o2.type = "square";
      o1.frequency.setValueAtTime(260, now);
      o1.frequency.exponentialRampToValueAtTime(540, now + 0.24);
      o2.frequency.setValueAtTime(540, now + 0.05);
      o2.frequency.exponentialRampToValueAtTime(920, now + 0.27);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
      o1.start(now); o1.stop(now + 0.26); o2.start(now + 0.05); o2.stop(now + 0.30);
    } else if (type === "hit") {
      const o2 = audioCtx.createOscillator(); o2.connect(gain);
      o1.type = "sawtooth"; o2.type = "square";
      o1.frequency.setValueAtTime(210, now);
      o1.frequency.exponentialRampToValueAtTime(64, now + 0.34);
      o2.frequency.setValueAtTime(120, now + 0.03);
      o2.frequency.exponentialRampToValueAtTime(50, now + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.20, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      o1.start(now); o1.stop(now + 0.34); o2.start(now + 0.03); o2.stop(now + 0.29);
    }
  }

  function syncMusic() {
    bgm.volume = 0.30;
    bgm.muted = muted;
    if (muted || state !== "playing" || document.visibilityState !== "visible") {
      bgm.pause();
      return;
    }
    bgm.play().catch(() => {});
  }

  function setMuted(next) {
    muted = next;
    storage.set(STORAGE.muted, muted ? "1" : "0");
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-pressed", String(muted));
    announce(muted ? "Audio muted" : "Audio on");
    syncMusic();
    renderSettings();
  }

  function setPaused(next) {
    if (state !== "playing" && state !== "paused") return;
    state = next ? "paused" : "playing";
    pauseBtn.textContent = next ? "▶" : "⏸";
    pauseBtn.setAttribute("aria-pressed", String(next));
    announce(next ? "Game paused" : "Game resumed");
    if (next && audioCtx && audioCtx.state === "running") audioCtx.suspend().catch(() => {});
    if (!next && audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    syncMusic();
    lastTime = performance.now();
  }

  function showOverlay(text, seconds=1.6) {
    overlayMessage = text;
    overlayTimer = seconds;
  }

  function openModal(type) {
    if (state === "playing") {
      resumeAfterModal = true;
      setPaused(true);
    } else {
      resumeAfterModal = false;
    }
    activeModal = type;
    modalBackdrop.classList.remove("hidden");
    modalBackdrop.setAttribute("aria-hidden", "false");
    renderModal();
  }

  function closeModal() {
    modalBackdrop.classList.add("hidden");
    modalBackdrop.setAttribute("aria-hidden", "true");
    activeModal = null;
    if (resumeAfterModal) {
      resumeAfterModal = false;
      setPaused(false);
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ship.x = Math.max(98, W * 0.24);
    if (state === "menu") ship.y = H * 0.42;
  }

  function updateHomeStats() {
    homeBest.textContent = best;
    homeCoins.textContent = totalCoins;
    homeStage.textContent = highestStage;
  }

  function currentPowerLabel() {
    const labels = [];
    if (magnetTimer > 0) labels.push("Magnet");
    if (boostTimer > 0) labels.push("Boost");
    return labels.length ? labels.join(" + ") : "Cruise";
  }

  function updateHud() {
    scoreBadge.textContent = `Score: ${score}`;
    bestBadge.textContent = `Best: ${best}`;
    coinsBadge.textContent = `Credits: ${totalCoins}`;
    shieldBadge.textContent = `Shields: ${shields}`;
    stageBadge.textContent = `Sector ${stage}`;
    powerBadge.textContent = currentPowerLabel();
    updateHomeStats();
    updateDailyRewardButton();
  }

  function getCurrentSpeed() {
    const stageBoost = (stage - 1) * 12;
    const hyper = boostTimer > 0 ? 36 : 0;
    return game.baseSpeed + stageBoost + hyper;
  }

  function getCurrentGap() {
    return Math.max(126, game.gapBase - (stage - 1) * 7);
  }

  function resetRun() {
    score = 0;
    runCoins = 0;
    shields = 0;
    stage = 1;
    invincibleTimer = 0.85;
    magnetTimer = 0;
    boostTimer = 0;
    bgOffset = 0;
    previewTime = 0;
    overlayMessage = "";
    overlayTimer = 0;
    ship.y = H * 0.42;
    ship.vy = 0;
    ship.rot = 0;
    game.pipeTimer = 0;
    game.enemyTimer = 0.8;
    game.coinTimer = 1.2;
    game.shieldTimer = 5.2;
    game.magnetSpawnTimer = 9.0;
    game.boostSpawnTimer = 12.0;
    game.pipes = [];
    game.enemies = [];
    game.coins = [];
    game.shields = [];
    game.magnets = [];
    game.boosts = [];
    game.particles = [];
    updateHud();
  }

  function showHome() {
    state = "menu";
    homePanel.classList.remove("hidden");
    gameOverPanel.classList.add("hidden");
    pauseBtn.textContent = "⏸";
    pauseBtn.setAttribute("aria-pressed", "false");
    syncMusic();
    updateHud();
  }

  function startGame() {
    ensureAudio();
    resetRun();
    state = "playing";
    homePanel.classList.add("hidden");
    gameOverPanel.classList.add("hidden");
    ship.vy = game.flap;
    playSfx("flap");
    syncMusic();
    announce("Launch successful");
  }

  function resetCurrentRun() {
    if (state === "menu") return startGame();
    if (state === "paused") setPaused(false);
    startGame();
  }

  function birdBounds() {
    return { x: ship.x - ship.w / 2 + 10, y: ship.y - ship.h / 2 + 8, w: ship.w - 20, h: ship.h - 16 };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function addParticles(x, y, color, count, spread = 1) {
    for (let i = 0; i < count; i++) {
      game.particles.push({
        x, y,
        vx: (-100 + Math.random() * 200) * spread,
        vy: (-120 + Math.random() * 200) * spread,
        r: 2 + Math.random() * 4,
        life: 0.28 + Math.random() * 0.5,
        color
      });
    }
  }

  function awardCredits(amount, countForRun = true) {
    totalCoins += amount;
    if (countForRun) runCoins += amount;
    saveProgress();
    updateHud();
  }

  function shipPalette(id = selectedShip) {
    if (id === "nova") return { body1: "#60a5fa", body2: "#2563eb", accent: "#dbeafe", flame: "#f59e0b" };
    if (id === "ember") return { body1: "#fb7185", body2: "#dc2626", accent: "#fecaca", flame: "#f97316" };
    if (id === "mint") return { body1: "#6ee7b7", body2: "#10b981", accent: "#d1fae5", flame: "#f59e0b" };
    return { body1: "#7dd3fc", body2: "#38bdf8", accent: "#dbeafe", flame: "#f59e0b" };
  }

  function obstaclePalette(id = selectedObstacle) {
    if (id === "crystal") return { base: "#7c3aed", alt: "#c4b5fd", edge: "#ddd6fe" };
    if (id === "tech") return { base: "#334155", alt: "#64748b", edge: "#cbd5e1" };
    return { base: "#6b7280", alt: "#9ca3af", edge: "#e5e7eb" };
  }

  function trailPalette(id = selectedTrail) {
    if (id === "rainbow") return ["#fb7185", "#f59e0b", "#fde047", "#34d399", "#60a5fa"];
    if (id === "plasma") return ["#c084fc", "#8b5cf6", "#22d3ee"];
    return ["#ffffff", "#7dd3fc", "#c4b5fd"];
  }

  function shipPreviewSVG(id) {
    const p = shipPalette(id);
    return `
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="${id}-ship" x1="0" x2="1">
            <stop offset="0%" stop-color="${p.body1}"/>
            <stop offset="100%" stop-color="${p.body2}"/>
          </linearGradient>
        </defs>
        <path d="M24 60 Q66 24 112 26 L148 60 L112 94 Q66 96 24 60 Z" fill="url(#${id}-ship)" stroke="${p.accent}" stroke-width="5"/>
        <path d="M56 42 L34 26 L42 54 Z" fill="${p.body2}" stroke="${p.accent}" stroke-width="3"/>
        <path d="M56 78 L34 94 L42 66 Z" fill="${p.body2}" stroke="${p.accent}" stroke-width="3"/>
        <circle cx="92" cy="60" r="12" fill="#0f172a" stroke="${p.accent}" stroke-width="4"/>
        <path d="M20 60 L6 48 L6 72 Z" fill="${p.flame}"/>
      </svg>`;
  }

  function obstaclePreviewSVG(id) {
    const p = obstaclePalette(id);
    return `
      <svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="24" y="10" width="36" height="48" rx="10" fill="${p.base}" stroke="${p.edge}" stroke-width="4"/>
        <rect x="24" y="70" width="36" height="40" rx="10" fill="${p.alt}" stroke="${p.edge}" stroke-width="4"/>
        <rect x="120" y="10" width="36" height="28" rx="10" fill="${p.alt}" stroke="${p.edge}" stroke-width="4"/>
        <rect x="120" y="52" width="36" height="58" rx="10" fill="${p.base}" stroke="${p.edge}" stroke-width="4"/>
      </svg>`;
  }

  function backgroundPreviewSVG(id) {
    if (id === "retro") return `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg"><rect width="180" height="120" fill="#0f1020"/><circle cx="90" cy="28" r="20" fill="#f472b6"/><path d="M0 80 L180 80" stroke="#38bdf8" stroke-width="2"/>${Array.from({length:8},(_,i)=>`<path d="M${i*22} 120 L90 80" stroke="#a855f7" stroke-width="1.5"/>`).join('')}</svg>`;
    if (id === "midnight") return `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg"><rect width="180" height="120" fill="#020617"/><circle cx="128" cy="30" r="18" fill="#e2e8f0"/><circle cx="40" cy="22" r="2" fill="#fff"/><circle cx="72" cy="44" r="1.5" fill="#fff"/><circle cx="102" cy="12" r="1.5" fill="#fff"/><circle cx="150" cy="64" r="1.5" fill="#fff"/></svg>`;
    return `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#08111f"/><stop offset="100%" stop-color="#3b0764"/></linearGradient></defs><rect width="180" height="120" fill="url(#g)"/><ellipse cx="50" cy="35" rx="40" ry="18" fill="#7c3aed" opacity="0.35"/><ellipse cx="118" cy="60" rx="52" ry="24" fill="#0ea5e9" opacity="0.25"/><circle cx="150" cy="20" r="2" fill="#fff"/><circle cx="102" cy="38" r="1.5" fill="#fff"/></svg>`;
  }

  function trailPreviewSVG(id) {
    const cols = trailPalette(id);
    return `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg"><circle cx="120" cy="60" r="16" fill="#7dd3fc"/>${cols.map((c,i)=>`<circle cx="${88 - i*18}" cy="60" r="${10 - i*1.3}" fill="${c}" opacity="${0.95 - i*0.14}"/>`).join('')}</svg>`;
  }

  function previewFor(category, id) {
    if (category === "ships") return shipPreviewSVG(id);
    if (category === "obstacles") return obstaclePreviewSVG(id);
    if (category === "backgrounds") return backgroundPreviewSVG(id);
    return trailPreviewSVG(id);
  }

  function spawnPipe() {
    const gap = getCurrentGap();
    const margin = 60;
    const top = margin + Math.random() * Math.max(60, (H - 170 - gap - margin));
    game.pipes.push({
      x: W + 80,
      top,
      gap,
      passed: false,
      moving: stage >= 2 && Math.random() < 0.58,
      amp: 18 + Math.random() * (stage >= 3 ? 36 : 24),
      phase: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 1.7,
      offset: 0
    });
  }

  function spawnEnemy() {
    game.enemies.push({
      x: W + 100,
      y: 88 + Math.random() * Math.max(80, H - 230),
      w: 54,
      h: 34,
      vx: getCurrentSpeed() + 32 + Math.random() * 85,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: Math.random() * (stage >= 4 ? 18 : 10),
      bobSpeed: 1.6 + Math.random() * 2.0
    });
  }

  function spawnCoin() {
    game.coins.push({
      x: W + 70,
      y: 90 + Math.random() * Math.max(80, H - 220),
      w: 28,
      h: 28,
      vx: getCurrentSpeed() - 10,
      phase: Math.random() * Math.PI * 2
    });
  }

  function spawnShieldPickup() {
    game.shields.push({
      x: W + 70,
      y: 110 + Math.random() * Math.max(80, H - 240),
      w: 38,
      h: 36,
      vx: getCurrentSpeed() - 25,
      phase: Math.random() * Math.PI * 2
    });
  }

  function spawnMagnetPickup() {
    game.magnets.push({
      x: W + 70,
      y: 120 + Math.random() * Math.max(80, H - 240),
      w: 34,
      h: 34,
      vx: getCurrentSpeed() - 15,
      phase: Math.random() * Math.PI * 2
    });
  }

  function spawnBoostPickup() {
    game.boosts.push({
      x: W + 70,
      y: 120 + Math.random() * Math.max(80, H - 240),
      w: 34,
      h: 34,
      vx: getCurrentSpeed() - 15,
      phase: Math.random() * Math.PI * 2
    });
  }

  function stageForScore() {
    return Math.floor(score / 25) + 1;
  }

  function handleStageProgression() {
    const newStage = stageForScore();
    if (newStage !== stage) {
      stage = newStage;
      if (stage > highestStage) {
        highestStage = stage;
        saveProgress();
      }
      updateHud();
      addParticles(W * 0.5, H * 0.28, "#fde68a", 30, 1.25);
      showOverlay(`Sector ${stage} Challenge!`, 2.0);
      announce(`Sector ${stage} challenge`);
    }
  }

  function useShieldOrEnd() {
    if (state !== "playing" || invincibleTimer > 0) return;
    if (shields > 0) {
      shields -= 1;
      invincibleTimer = 1.20;
      ship.vy = Math.min(0, ship.vy) - 90;
      playSfx("hit");
      addParticles(ship.x, ship.y, "#7dd3fc", 22, 1.1);
      updateHud();
      announce(shields > 0 ? `Shield hit. ${shields} left.` : "Last shield used.");
      showOverlay("Shield absorbed hit", 1.2);
      return;
    }
    playSfx("hit");
    state = "gameover";
    bgm.pause();
    const bonus = Math.floor(score / 5);
    if (bonus > 0) awardCredits(bonus, false);
    if (score > best) best = score;
    if (stage > highestStage) highestStage = stage;
    saveProgress();
    finalScore.textContent = score;
    finalBest.textContent = best;
    finalCoins.textContent = runCoins + bonus;
    gameOverLead.textContent = bonus > 0 ? `You earned ${runCoins} star credits and ${bonus} bonus credits.` : `You earned ${runCoins} star credits this run.`;
    gameOverPanel.classList.remove("hidden");
    homePanel.classList.add("hidden");
    updateHud();
    updateHomeStats();
    announce("Mission ended");
  }

  function flap() {
    if (modalBackdrop && !modalBackdrop.classList.contains("hidden")) return;
    ensureAudio();
    if (state === "menu") return startGame();
    if (state === "gameover") return startGame();
    if (state !== "playing") return;
    ship.vy = game.flap + (boostTimer > 0 ? -24 : 0);
    playSfx("flap");
    const trail = trailPalette()[0] || "white";
    addParticles(ship.x - 14, ship.y + 8, trail, 8, 0.9);
  }

  function updateMenuPreview(dt) {
    previewTime += dt;
    bgOffset = (bgOffset + getCurrentSpeed() * 0.08 * dt) % 2000;
    ship.y = H * 0.38 + Math.sin(previewTime * 2.2) * 16;
    ship.rot = Math.sin(previewTime * 2.2) * 0.12;
    for (const p of game.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 140 * dt;
    }
    game.particles = game.particles.filter(p => p.life > 0);
  }

  function update(dt) {
    if (overlayTimer > 0) overlayTimer -= dt;

    if (state === "menu" || state === "gameover") {
      updateMenuPreview(dt);
      return;
    }
    if (state !== "playing") return;

    if (invincibleTimer > 0) invincibleTimer -= dt;
    if (magnetTimer > 0) magnetTimer -= dt;
    if (boostTimer > 0) boostTimer -= dt;

    const speed = getCurrentSpeed();
    bgOffset = (bgOffset + speed * 0.18 * dt) % 2000;
    ship.vy += game.gravity * dt * (boostTimer > 0 ? 0.95 : 1);
    ship.y += ship.vy * dt;
    ship.rot = Math.max(-0.70, Math.min(1.1, ship.vy / 700));

    game.pipeTimer += dt;
    if (game.pipeTimer >= game.pipeEvery) {
      game.pipeTimer = 0;
      spawnPipe();
    }
    game.coinTimer += dt;
    if (game.coinTimer >= game.coinEvery) {
      game.coinTimer = 0;
      spawnCoin();
    }
    game.shieldTimer += dt;
    if (game.shieldTimer >= game.shieldEvery) {
      game.shieldTimer = 0;
      if (Math.random() < 0.72) spawnShieldPickup();
    }
    game.magnetSpawnTimer += dt;
    if (game.magnetSpawnTimer >= game.magnetEvery) {
      game.magnetSpawnTimer = 0;
      if (Math.random() < 0.65) spawnMagnetPickup();
    }
    game.boostSpawnTimer += dt;
    if (game.boostSpawnTimer >= game.boostEvery) {
      game.boostSpawnTimer = 0;
      if (Math.random() < 0.60) spawnBoostPickup();
    }

    const enemyUnlocked = stage >= 2;
    game.enemyEvery = stage >= 4 ? 1.9 : stage >= 3 ? 2.2 : 2.8;
    if (enemyUnlocked) {
      game.enemyTimer += dt;
      if (game.enemyTimer >= game.enemyEvery) {
        game.enemyTimer = 0;
        spawnEnemy();
      }
    }

    const bb = birdBounds();

    for (const pipe of game.pipes) {
      pipe.x -= speed * dt;
      if (pipe.moving) pipe.offset = Math.sin(performance.now() * 0.001 * pipe.speed + pipe.phase) * pipe.amp;
      const top = pipe.top + pipe.offset;
      const bottomY = top + pipe.gap;
      if (!pipe.passed && pipe.x + game.pipeWidth < ship.x) {
        pipe.passed = true;
        score += 1;
        if (score > best) best = score;
        playSfx("point");
        updateHud();
        handleStageProgression();
      }
      const topRect = { x: pipe.x + 16, y: 0, w: game.pipeWidth - 32, h: Math.max(0, top - 18) };
      const bottomRect = { x: pipe.x + 16, y: bottomY + 18, w: game.pipeWidth - 32, h: Math.max(0, H - bottomY - 76) };
      if (rectsOverlap(bb, topRect) || rectsOverlap(bb, bottomRect)) { useShieldOrEnd(); if (state !== "playing") return; }
    }
    game.pipes = game.pipes.filter(p => p.x + game.pipeWidth > -140);

    for (const enemy of game.enemies) {
      enemy.x -= enemy.vx * dt;
      enemy.y += Math.sin(performance.now() * 0.001 * enemy.bobSpeed + enemy.bobPhase) * enemy.bobAmp * dt * 2.2;
      const rect = { x: enemy.x - enemy.w / 2 + 3, y: enemy.y - enemy.h / 2 + 3, w: enemy.w - 6, h: enemy.h - 6 };
      if (rectsOverlap(bb, rect)) { useShieldOrEnd(); if (state !== "playing") return; }
    }
    game.enemies = game.enemies.filter(e => e.x + e.w > -80);

    for (const coin of game.coins) {
      coin.x -= coin.vx * dt;
      coin.y += Math.sin(performance.now() * 0.003 + coin.phase) * 18 * dt;
      if (magnetTimer > 0) {
        const dx = ship.x - coin.x, dy = ship.y - coin.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180) {
          coin.x += dx * Math.min(0.08, dt * 3.6);
          coin.y += dy * Math.min(0.08, dt * 3.6);
        }
      }
      const rect = { x: coin.x - coin.w / 2, y: coin.y - coin.h / 2, w: coin.w, h: coin.h };
      if (rectsOverlap(bb, rect)) {
        coin.collected = true;
        awardCredits(boostTimer > 0 ? 2 : 1);
        playSfx("coin");
        addParticles(coin.x, coin.y, "#fde68a", 12, 0.8);
      }
    }
    game.coins = game.coins.filter(c => !c.collected && c.x + c.w > -60);

    for (const s of game.shields) {
      s.x -= s.vx * dt;
      s.y += Math.sin(performance.now() * 0.002 + s.phase) * 20 * dt;
      const rect = { x: s.x - s.w / 2, y: s.y - s.h / 2, w: s.w, h: s.h };
      if (rectsOverlap(bb, rect)) {
        s.collected = true;
        shields = Math.min(3, shields + 1);
        playSfx("shield");
        addParticles(s.x, s.y, "#7dd3fc", 18, 1.0);
        updateHud();
        showOverlay("Shield +1", 1.2);
      }
    }
    game.shields = game.shields.filter(s => !s.collected && s.x + s.w > -60);

    for (const m of game.magnets) {
      m.x -= m.vx * dt;
      m.y += Math.sin(performance.now() * 0.0025 + m.phase) * 22 * dt;
      const rect = { x: m.x - m.w / 2, y: m.y - m.h / 2, w: m.w, h: m.h };
      if (rectsOverlap(bb, rect)) {
        m.collected = true;
        magnetTimer = 6.5;
        playSfx("power");
        addParticles(m.x, m.y, "#f472b6", 18, 1.0);
        updateHud();
        showOverlay("Magnet online", 1.2);
      }
    }
    game.magnets = game.magnets.filter(m => !m.collected && m.x + m.w > -60);

    for (const b of game.boosts) {
      b.x -= b.vx * dt;
      b.y += Math.sin(performance.now() * 0.0028 + b.phase) * 22 * dt;
      const rect = { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h };
      if (rectsOverlap(bb, rect)) {
        b.collected = true;
        boostTimer = 5.5;
        playSfx("power");
        addParticles(b.x, b.y, "#fb7185", 18, 1.0);
        updateHud();
        showOverlay("Hyper boost", 1.2);
      }
    }
    game.boosts = game.boosts.filter(b => !b.collected && b.x + b.w > -60);

    for (const p of game.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vy += 160 * dt;
    }
    game.particles = game.particles.filter(p => p.life > 0);

    if (ship.y + ship.h / 2 > H - 58) {
      ship.y = H - 58 - ship.h / 2;
      useShieldOrEnd(); if (state !== "playing") return;
    }
    if (ship.y - ship.h / 2 < 0) {
      ship.y = ship.h / 2;
      useShieldOrEnd(); if (state !== "playing") return;
    }
  }

  function drawBackground() {
    if (selectedBackground === "retro") {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#090716"); sky.addColorStop(1, "#1a1030");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(244,114,182,.9)";
      ctx.beginPath(); ctx.arc(W - 90, 90, 40, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(56,189,248,.55)";
      for (let y = H * 0.68; y <= H; y += 22) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(168,85,247,.35)";
      for (let x = -W; x < W * 2; x += 52) {
        ctx.beginPath(); ctx.moveTo(x - bgOffset * 0.6, H); ctx.lineTo(W / 2, H * 0.68); ctx.stroke();
      }
      return;
    }

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    if (selectedBackground === "midnight") {
      sky.addColorStop(0, "#020617"); sky.addColorStop(0.68, "#0f172a"); sky.addColorStop(1, "#111827");
    } else {
      sky.addColorStop(0, "#050816"); sky.addColorStop(0.55, "#16103a"); sky.addColorStop(1, "#30115e");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // stars
    ctx.fillStyle = "rgba(255,255,255,.9)";
    for (let i = 0; i < 60; i++) {
      const x = (i * 173 + bgOffset * (0.12 + (i % 4) * 0.05)) % (W + 200) - 100;
      const y = (i * 97) % Math.max(120, H - 80);
      const r = 0.8 + (i % 3) * 0.5;
      ctx.beginPath(); ctx.arc(x, y + 20, r, 0, Math.PI * 2); ctx.fill();
    }

    if (selectedBackground === "nebula") {
      ctx.fillStyle = "rgba(124,58,237,.18)";
      ctx.beginPath(); ctx.ellipse(W*0.25, H*0.22, 180, 62, 0.12, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(34,211,238,.15)";
      ctx.beginPath(); ctx.ellipse(W*0.72, H*0.35, 220, 90, -0.25, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle = "rgba(226,232,240,.86)";
      ctx.beginPath(); ctx.arc(W - 92, 94, 34, 0, Math.PI*2); ctx.fill();
    }

    // ground lane
    const grd = ctx.createLinearGradient(0, H-58, 0, H);
    grd.addColorStop(0, "rgba(56,189,248,.16)");
    grd.addColorStop(1, "rgba(2,6,23,.75)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, H-58, W, 58);
  }

  function drawShip() {
    const p = shipPalette();
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rot);
    if (invincibleTimer > 0 && Math.floor(invincibleTimer * 14) % 2 === 0) ctx.globalAlpha = 0.42;

    const bodyGrad = ctx.createLinearGradient(-30, 0, 40, 0);
    bodyGrad.addColorStop(0, p.body1);
    bodyGrad.addColorStop(1, p.body2);

    // Main fuselage - more pointy rocket silhouette.
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.quadraticCurveTo(-10, -26, 18, -18);
    ctx.lineTo(38, 0);
    ctx.lineTo(18, 18);
    ctx.quadraticCurveTo(-10, 26, -30, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rear fins.
    ctx.fillStyle = p.body2;
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-28, -22);
    ctx.lineTo(-18, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-10, 12);
    ctx.lineTo(-28, 22);
    ctx.lineTo(-18, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit.
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(6, 0, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nose highlight.
    ctx.fillStyle = "rgba(255,255,255,.34)";
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.lineTo(28, -2);
    ctx.lineTo(10, 2);
    ctx.closePath();
    ctx.fill();

    // Engine flame.
    ctx.fillStyle = p.flame;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-46 - Math.random() * 4, -7);
    ctx.lineTo(-44, 0);
    ctx.lineTo(-46 - Math.random() * 4, 7);
    ctx.closePath();
    ctx.fill();

    if (magnetTimer > 0) {
      ctx.strokeStyle = "rgba(244,114,182,.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 34 + Math.sin(performance.now() * 0.012) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (shields > 0) {
      ctx.strokeStyle = "rgba(125,211,252,.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawObstacleSegment(x, y, w, h, upsideDown) {
    if (h <= 0) return;
    const p = obstaclePalette();
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, p.alt); grad.addColorStop(1, p.base);
    ctx.fillStyle = grad;
    ctx.strokeStyle = p.edge;
    ctx.lineWidth = 3;

    const step = 16;
    ctx.beginPath();
    if (upsideDown) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - 20);
      for (let px = x + w; px >= x; px -= step) {
        const pointY = y + h - (12 + ((px/step)%2===0 ? 20 : 8));
        ctx.lineTo(px, pointY);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(x, y + 20);
      for (let px = x; px <= x + w; px += step) {
        const pointY = y + (12 + ((px/step)%2===0 ? 20 : 8));
        ctx.lineTo(px, pointY);
      }
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    }
    ctx.fill(); ctx.stroke();

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,.20)" : "rgba(0,0,0,.15)";
      const cx = x + 16 + (i * (w-30)/4);
      const cy = upsideDown ? y + h * 0.45 : y + h * 0.55;
      ctx.beginPath(); ctx.arc(cx, cy, 6 + (i%3)*2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = "#f43f5e";
    ctx.strokeStyle = "#fecdd3";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, e.w/2, e.h/2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(10, -5, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#111827"; ctx.beginPath(); ctx.arc(12, -5, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.moveTo(e.w/2-2, 0); ctx.lineTo(e.w/2+12, -5); ctx.lineTo(e.w/2+12, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawCredit(c) {
    ctx.fillStyle = "#fbbf24"; ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.w/2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#7c2d12";
    ctx.font = "800 14px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("★", c.x, c.y + 1);
  }

  function drawShieldPickup(s) {
    ctx.save(); ctx.translate(s.x, s.y);
    ctx.scale(s.w/40, s.h/36);
    ctx.fillStyle = "#7dd3fc"; ctx.strokeStyle = "#dbeafe"; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.bezierCurveTo(-24, -2, -12, -18, 0, -8);
    ctx.bezierCurveTo(12, -18, 24, -2, 0, 14);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawMagnetPickup(m) {
    ctx.save(); ctx.translate(m.x, m.y);
    ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.strokeStyle = "#fca5a5";
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-8, 11); ctx.moveTo(8, 0); ctx.lineTo(8, 11); ctx.stroke();
    ctx.restore();
  }

  function drawBoostPickup(b) {
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = "#fb7185"; ctx.strokeStyle = "#fecdd3"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(10, -12); ctx.lineTo(0, 2); ctx.lineTo(8, 2); ctx.lineTo(-10, 16); ctx.lineTo(-2, 4); ctx.lineTo(-10, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawTrailParticle(p) {
    ctx.globalAlpha = Math.max(0, p.life / 0.5);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawOverlay() {
    if (overlayTimer <= 0 || !overlayMessage) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, overlayTimer / 0.4);
    ctx.fillStyle = "rgba(2,6,23,.48)";
    const padX = 16, h = 40;
    ctx.font = "800 22px system-ui";
    const textW = ctx.measureText(overlayMessage).width;
    const w = textW + padX * 2;
    const x = W / 2 - w / 2, y = H * 0.20;
    roundRect(ctx, x, y, w, h, 20, true, false);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(overlayMessage, W / 2, y + h/2 + 1);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    for (const pipe of game.pipes) {
      const top = pipe.top + pipe.offset;
      const bottomY = top + pipe.gap;
      drawObstacleSegment(pipe.x, 0, game.pipeWidth, top, true);
      drawObstacleSegment(pipe.x, bottomY, game.pipeWidth, H - bottomY - 58, false);
    }

    for (const c of game.coins) drawCredit(c);
    for (const s of game.shields) drawShieldPickup(s);
    for (const m of game.magnets) drawMagnetPickup(m);
    for (const b of game.boosts) drawBoostPickup(b);
    for (const e of game.enemies) drawEnemy(e);

    drawShip();

    if (selectedTrail) {
      for (const p of game.particles) drawTrailParticle(p);
    }

    drawOverlay();

    if (state === "paused") {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "900 42px system-ui";
      ctx.fillText("Paused", W / 2, H / 2);
    }
  }

  function loop(now) {
    const dt = Math.min(0.032, ((now - lastTime) || 16) / 1000);
    lastTime = now;
    try { update(dt); draw(); }
    catch (err) {
      console.error("Star Hopper frame error", err);
      try { drawBackground(); drawShip(); } catch {}
    }
    requestAnimationFrame(loop);
  }

  function renderShop(category = "ships") {
    modalChip.textContent = "Shop";
    modalTitle.textContent = "Cosmic Market";
    modalSubtitle.textContent = "Unlock and equip ship skins, obstacle looks, backgrounds, and trails.";
    const categories = [
      ["ships", "Ships", shipItems],
      ["obstacles", "Obstacles", obstacleItems],
      ["backgrounds", "Backgrounds", backgroundItems],
      ["trails", "Trails", trailItems]
    ];
    const selectedMap = { ships: selectedShip, obstacles: selectedObstacle, backgrounds: selectedBackground, trails: selectedTrail };
    const unlockedMap = { ships: unlockedShips, obstacles: unlockedObstacles, backgrounds: unlockedBackgrounds, trails: unlockedTrails };

    modalBody.innerHTML = "";
    const summary = document.createElement("div");
    summary.className = "shopSummary";
    summary.innerHTML = `<span>Total Credits</span><strong>${totalCoins}</strong>`;
    modalBody.appendChild(summary);

    const tabBar = document.createElement("div");
    tabBar.className = "tabBar";
    categories.forEach(([key, label]) => {
      const btn = document.createElement("button");
      btn.className = `tabBtn${category === key ? " active" : ""}`;
      btn.textContent = label;
      btn.addEventListener("click", () => renderShop(key));
      tabBar.appendChild(btn);
    });
    modalBody.appendChild(tabBar);

    const grid = document.createElement("div");
    grid.className = "shopGrid";
    const items = categories.find(([key]) => key === category)[2];
    items.forEach(item => {
      const unlocked = unlockedMap[category].includes(item.id);
      const selected = selectedMap[category] === item.id;
      const card = document.createElement("div");
      card.className = `shopCard${selected ? " selected" : ""}`;
      card.innerHTML = `
        <div class="shopPreview">${previewFor(category, item.id)}</div>
        <h4>${item.name}</h4>
        <p>${item.description}</p>
        <div class="shopMeta"><span class="shopPrice">${item.price === 0 ? "Free" : item.price + " credits"}</span></div>
      `;
      const btn = document.createElement("button");
      btn.className = "shopBtn";
      if (selected) {
        btn.textContent = "Selected"; btn.classList.add("selectedBtn"); btn.disabled = true;
      } else if (unlocked) {
        btn.textContent = "Select"; btn.classList.add("select");
        btn.addEventListener("click", () => {
          if (category === "ships") selectedShip = item.id;
          else if (category === "obstacles") selectedObstacle = item.id;
          else if (category === "backgrounds") selectedBackground = item.id;
          else selectedTrail = item.id;
          saveProgress(); updateHud(); renderShop(category); announce(`${item.name} selected`);
        });
      } else {
        btn.textContent = totalCoins >= item.price ? `Unlock (${item.price})` : `Need ${item.price}`;
        if (totalCoins >= item.price) btn.classList.add("buy");
        btn.disabled = totalCoins < item.price;
        btn.addEventListener("click", () => {
          if (totalCoins < item.price) return;
          totalCoins -= item.price;
          if (category === "ships") { unlockedShips.push(item.id); selectedShip = item.id; }
          else if (category === "obstacles") { unlockedObstacles.push(item.id); selectedObstacle = item.id; }
          else if (category === "backgrounds") { unlockedBackgrounds.push(item.id); selectedBackground = item.id; }
          else { unlockedTrails.push(item.id); selectedTrail = item.id; }
          saveProgress(); updateHud(); renderShop(category); announce(`${item.name} unlocked`);
        });
      }
      card.appendChild(btn);
      grid.appendChild(card);
    });
    modalBody.appendChild(grid);
  }

  function renderSettings() {
    if (activeModal !== "settings") return;
    modalChip.textContent = "Settings";
    modalTitle.textContent = "Flight Settings";
    modalSubtitle.textContent = "Adjust your session without losing progress.";
    modalBody.innerHTML = "";
    const section = document.createElement("div");
    section.className = "modalSection";
    section.innerHTML = `
      <div class="settingRow"><div><strong>Audio</strong><div>Toggle music and sound effects.</div></div><button id="settingsMuteBtn" class="miniBtn" type="button">${muted ? "Unmute" : "Mute"}</button></div>
      <div class="settingRow"><div><strong>Reset Current Run</strong><div>Restart the current mission. Credits and unlocks stay.</div></div><button id="settingsResetBtn" class="miniBtn" type="button">Reset Run</button></div>
      <div class="settingRow"><div><strong>Main Menu</strong><div>Return to the title screen after your current run.</div></div><button id="settingsMenuBtn" class="miniBtn" type="button">Go to Menu</button></div>
    `;
    modalBody.appendChild(section);
    document.getElementById("settingsMuteBtn").addEventListener("click", () => setMuted(!muted));
    document.getElementById("settingsResetBtn").addEventListener("click", () => { resetCurrentRun(); closeModal(); });
    document.getElementById("settingsMenuBtn").addEventListener("click", () => { showHome(); closeModal(); });
  }

  function renderHowTo() {
    modalChip.textContent = "Guide";
    modalTitle.textContent = "How to Play";
    modalSubtitle.textContent = "Core controls, power-ups, and challenge sectors.";
    modalBody.innerHTML = `
      <div class="modalSection">
        <h4>Basics</h4>
        <ul>
          <li>Tap anywhere to thrust upward.</li>
          <li>Fly through asteroid gates to score.</li>
          <li>Avoid asteroid walls, comets, and ground impacts.</li>
        </ul>
      </div>
      <div class="modalSection">
        <h4>Power-ups</h4>
        <ul>
          <li><strong>Shield Hearts</strong>: absorb one crash.</li>
          <li><strong>Magnet</strong>: pulls in nearby star credits.</li>
          <li><strong>Hyper Boost</strong>: faster run and double-value credits.</li>
        </ul>
      </div>
      <div class="modalSection">
        <h4>Sectors</h4>
        <ul>
          <li>Every 25 points you enter a new sector.</li>
          <li>Later sectors add moving gates, faster speed, and more enemy comets.</li>
        </ul>
      </div>
    `;
  }

  function renderCredits() {
    modalChip.textContent = "Credits";
    modalTitle.textContent = "Credits";
    modalSubtitle.textContent = "This version was rebuilt as a custom arcade web app.";
    modalBody.innerHTML = `
      <div class="modalSection">
        <p><strong>Game:</strong> Star Hopper: Cosmic Drift</p>
        <p><strong>Built for:</strong> Cody</p>
        <p><strong>Features:</strong> Space theme, shop, skins, trails, daily reward, challenge sectors, power-ups, and mobile-friendly controls.</p>
      </div>
    `;
  }

  function renderModal() {
    if (activeModal === "shop") renderShop();
    else if (activeModal === "settings") renderSettings();
    else if (activeModal === "howto") renderHowTo();
    else if (activeModal === "credits") renderCredits();
  }

  function getDailyRewardInfo() {
    const lastDaily = Number(storage.get(STORAGE.lastDaily, "0")) || 0;
    const now = Date.now();
    const remaining = Math.max(0, DAY_MS - (now - lastDaily));
    const available = remaining <= 0;
    return { available, remaining, amount: 25 };
  }

  function formatRemaining(ms) {
    const totalMinutes = Math.ceil(ms / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  }

  function updateDailyRewardButton() {
    const info = getDailyRewardInfo();
    if (info.available) {
      claimDailyBtn.textContent = `Claim Daily Reward (+${info.amount})`;
      claimDailyBtn.disabled = false;
      claimDailyBtn.classList.remove("cooldown");
    } else {
      claimDailyBtn.textContent = `Daily Reward in ${formatRemaining(info.remaining)}`;
      claimDailyBtn.disabled = true;
      claimDailyBtn.classList.add("cooldown");
    }
  }

  function claimDailyReward() {
    const info = getDailyRewardInfo();
    if (!info.available) return;
    totalCoins += info.amount;
    storage.set(STORAGE.lastDaily, String(Date.now()));
    saveProgress();
    updateHud();
    renderModal();
    announce("Daily reward claimed");
    showOverlay(`+${info.amount} Daily Credits`, 1.5);
  }

  // Events
  window.addEventListener("resize", resize);

  document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
    if (key === "p") { ensureAudio(); setPaused(state === "playing"); }
    if (key === "m") { ensureAudio(); setMuted(!muted); }
  });

  playBtn.addEventListener("click", startGame);
  replayBtn.addEventListener("click", startGame);
  openShopBtn.addEventListener("click", () => openModal("shop"));
  goShopBtn.addEventListener("click", () => openModal("shop"));
  openSettingsBtn.addEventListener("click", () => openModal("settings"));
  howToBtn.addEventListener("click", () => openModal("howto"));
  creditsBtn.addEventListener("click", () => openModal("credits"));
  claimDailyBtn.addEventListener("click", claimDailyReward);
  goMenuBtn.addEventListener("click", showHome);

  shopHudBtn.addEventListener("click", e => { e.stopPropagation(); ensureAudio(); openModal("shop"); });
  resetBtn.addEventListener("click", e => { e.stopPropagation(); resetCurrentRun(); });
  pauseBtn.addEventListener("click", e => { e.stopPropagation(); ensureAudio(); setPaused(state === "playing"); });
  muteBtn.addEventListener("click", e => { e.stopPropagation(); ensureAudio(); setMuted(!muted); });

  closeModalBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", e => { if (e.target === modalBackdrop) closeModal(); });

  document.addEventListener("pointerdown", e => {
    const interactive = e.target.closest("button, .modalCard, .panel");
    if (interactive) return;
    flap();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      bgm.pause();
      if (audioCtx && audioCtx.state === "running") audioCtx.suspend().catch(() => {});
    } else {
      lastTime = performance.now();
      if ((state === "playing" || state === "paused") && audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      syncMusic();
      updateDailyRewardButton();
    }
  });

  setInterval(updateDailyRewardButton, 60000);

  // init
  setMuted(muted);
  resize();
  resetRun();
  updateHud();
  updateHomeStats();
  showHome();
  requestAnimationFrame(t => { lastTime = t; requestAnimationFrame(loop); });
})();
