const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const state = {
  musicPlaying: true,
  snowflakes: [],
  animationFrame: null,
  popupTimers: [],
  popupIndex: 0,
  endlessInterval: null,
  heartIndex: 0,
  heartSlots: [],
  heartMode: false,
  preHeartPopups: [],
};

const giftsMap = {
  fireflies: {
    title: "点亮爱意",
    content:
      "此刻，心跳与烟火共鸣。愿你的每个愿望，都被温柔点亮，照亮我们同行的路。",
  },
  wishes: {
    title: "留下一封告白",
    content:
      "你是冬夜最温暖的光，我愿化作无数星尘环绕你，将每一句我爱你轻声放进你心里。",
  },
  memory: {
    title: "收藏时光",
    content:
      "翻开记忆簿，是一幕幕静好的画面。未来的每一页，都想和你一起写下。",
  },
};

const introPopups = [
  {
    title: "雪夜的第一束光",
    message: "在风雪初见的夜晚，我为你点亮一盏灯，照亮与你相遇的小径。",
  },
  {
    title: "听见心跳了吗",
    message: "雪落无声，心却很吵。它提醒我，把每一次怦然都写成你的名字。",
  },
  {
    title: "把愿望交给我",
    message: "如果寒夜稍显寂静，就把想说的话告诉我，我会替你放进冬日的星河。",
  },
];

const endlessPopups = [
  {
    title: "冬夜继续发光",
    message: "星光在你眉眼跳跃，我在你身侧守护，直到天亮。",
  },
  {
    title: "雪花正在排队",
    message: "它们想把爱的形状兜满怀抱，然后全部交给你。",
  },
  {
    title: "被你点亮的心",
    message: "即使寒夜漫长，我的心也因为你而一直温热。",
  },
  {
    title: "请收下这份心动",
    message: "从雪落到花开，我都会用最柔软的方式把爱赠与你。",
  },
  {
    title: "恋人耳语",
    message: "在你看不见的角落，我把想念折成无数小纸灯。",
  },
];

const heartPositions = createHeartPositions(18, 9);

function createHeartPositions(samples = 18, scale = 9) {
  const positions = [];
  for (let i = 0; i < samples; i += 1) {
    const t = Math.PI - (2 * Math.PI * i) / samples;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    positions.push({ x: x * scale, y: -y * scale });
  }
  return positions;
}

function toggleModal(hidden) {
  const backdrop = qs("#start-backdrop");
  backdrop?.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function playMusic() {
  const audio = qs("#bgMusic");
  if (!audio) return;
  audio.volume = 0.75;
  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch(() => {
      state.musicPlaying = false;
      updateMusicToggle();
    });
  }
}

function pauseMusic() {
  const audio = qs("#bgMusic");
  audio?.pause();
}

function updateMusicToggle() {
  const btn = qs("#toggle-music");
  if (!btn) return;
  btn.textContent = state.musicPlaying ? "🎵 暂停音乐" : "🎵 播放音乐";
  btn.setAttribute("aria-pressed", state.musicPlaying ? "false" : "true");
}

function initMusicToggle() {
  const btn = qs("#toggle-music");
  if (!btn) return;
  btn.addEventListener("click", () => {
    state.musicPlaying = !state.musicPlaying;
    state.musicPlaying ? playMusic() : pauseMusic();
    updateMusicToggle();
  });
}

function showLetter(show) {
  const letter = qs("#love-letter");
  if (!letter) return;
  letter.setAttribute("aria-hidden", show ? "false" : "true");
  letter.toggleAttribute("data-open", show);
  if (show) {
    const closeBtn = qs("#close-letter");
    closeBtn?.focus({ preventScroll: true });
    qs("#chime")?.play().catch(() => undefined);
  }
}

function initLetter() {
  const openBtn = qs("#open-letter");
  const closeBtn = qs("#close-letter");
  if (openBtn) {
    openBtn.addEventListener("click", () => showLetter(true));
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => showLetter(false));
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      showLetter(false);
    }
  });
}

function updateSurprise(type) {
  const container = qs("#surprise-content");
  if (!container) return;
  const data = giftsMap[type];
  if (!data) return;

  container.classList.remove("is-visible");
  // trigger reflow so animation restarts
  void container.offsetWidth;

  container.innerHTML = `
    <h3>${data.title}</h3>
    <p>${data.content}</p>
  `;

  requestAnimationFrame(() => {
    container.classList.add("is-visible");
  });

  if (type === "fireflies") {
    triggerFireflyShow();
  }
  if (type === "memory") {
    triggerMemoryPolaroids();
  }
}

function initGifts() {
  qsa(".gift").forEach((gift) => {
    gift.addEventListener("click", () => {
      const type = gift.getAttribute("data-gift");
      updateSurprise(type);
    });
  });
}

function clearPopupTimers() {
  state.popupTimers.forEach((id) => clearTimeout(id));
  state.popupTimers = [];
  if (state.endlessInterval) {
    clearInterval(state.endlessInterval);
    state.endlessInterval = null;
  }
  state.heartIndex = 0;
  state.heartSlots = new Array(heartPositions.length).fill(null);
  state.heartMode = false;
  state.preHeartPopups = [];

  const heartContainer = qs("#heart-popups");
  if (heartContainer) {
    heartContainer.innerHTML = "";
  }

  const popupLayer = qs("#popup-layer");
  if (popupLayer) {
    popupLayer.innerHTML = "";
    popupLayer.classList.remove("is-centered");
  }

  const overlay = qs("#heart-overlay");
  if (overlay) {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
  }
}

function createPopup(story, options = {}) {
  const container =
    options.container ??
    (options.containerId ? qs(options.containerId) : qs("#popup-layer"));
  if (!container) return null;

  if (options.requiresConfirm) {
    container.innerHTML = "";
    container.classList.add("is-centered");
  }

  const popup = document.createElement("div");
  popup.className = "popup-message";
  if (options.variant) {
    popup.classList.add(options.variant);
  }

  popup.innerHTML = `
    <strong>${story.title}</strong>
    <p>${story.message}</p>
  `;

  if (options.position) {
    popup.style.setProperty("--x", `${options.position.x}px`);
    popup.style.setProperty("--y", `${options.position.y}px`);
  }

  if (options.requiresConfirm) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "popup-confirm";
    button.textContent = options.confirmText ?? "确定";
    button.addEventListener("click", () => {
      popup.classList.remove("is-visible");
      setTimeout(() => popup.remove(), 240);
      options.onConfirm?.();
    });
    popup.appendChild(button);
  }

  container.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add("is-visible"));

  const duration = options.duration ?? 4800;
  if (!options.requiresConfirm && duration > 0) {
    const removeTimer = setTimeout(() => {
      popup.classList.remove("is-visible");
      setTimeout(() => popup.remove(), 500);
    }, duration);
    state.popupTimers.push(removeTimer);
  }

  return popup;
}

function renderHeartFormation() {
  const overlay = qs("#heart-overlay");
  if (!overlay) return;

  if (overlay.childElementCount === 0) {
    const total = 60;
    for (let i = 0; i < total; i += 1) {
      const t = Math.PI - (2 * Math.PI * i) / total;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      const span = document.createElement("span");
      span.className = "heart-particle";
      span.style.setProperty("--x", `${(x * 9).toFixed(1)}px`);
      span.style.setProperty("--y", `${(-y * 9).toFixed(1)}px`);
      span.style.setProperty("--delay", `${(Math.random() * 2.5).toFixed(2)}s`);
      overlay.appendChild(span);
    }
  }

  overlay.setAttribute("aria-hidden", "false");
  overlay.classList.add("is-visible");
}

function showNextIntroPopup() {
  if (state.popupIndex >= introPopups.length) {
    startEndlessPopups();
    return;
  }

  const story = introPopups[state.popupIndex];
  createPopup(story, {
    requiresConfirm: true,
    confirmText: "确定",
    onConfirm: () => {
      state.popupIndex += 1;
      showNextIntroPopup();
    },
  });
}

function startIntroPopups() {
  clearPopupTimers();
  state.popupIndex = 0;
  showNextIntroPopup();
}

function startEndlessPopups() {
  const popupLayer = qs("#popup-layer");
  const heartContainer = qs("#heart-popups");
  if (!popupLayer || !heartContainer) return;

  popupLayer.classList.remove("is-centered");
  popupLayer.innerHTML = "";
  heartContainer.innerHTML = "";

  state.heartIndex = 0;
  state.heartSlots = new Array(heartPositions.length).fill(null);
  state.preHeartPopups = [];
  state.heartMode = false;

  let spawnCount = 0;

  const spawn = () => {
    const story = endlessPopups[Math.floor(Math.random() * endlessPopups.length)];
    spawnCount += 1;

    if (!state.heartMode) {
      const popup = createPopup(story, {
        container: popupLayer,
        duration: 0,
      });
      if (popup) {
        state.preHeartPopups.push(popup);
      }

      if (spawnCount === 4) {
        state.heartMode = true;
        transitionPopupsToHeart();
        renderHeartFormation();

        const remaining = heartPositions.length - state.heartIndex;
        for (let i = 0; i < remaining; i += 1) {
          const fillTimer = setTimeout(() => {
            spawn();
          }, 220 * (i + 1));
          state.popupTimers.push(fillTimer);
        }
      }
      return;
    }

    const slot = state.heartIndex % heartPositions.length;
    const position = heartPositions[slot];
    state.heartIndex += 1;

    const existing = state.heartSlots[slot];
    if (existing?.element) {
      existing.element.classList.remove("is-visible");
      setTimeout(() => existing.element.remove(), 320);
    }

    const popup = createPopup(story, {
      container: heartContainer,
      variant: "popup-message--heart",
      duration: 0,
      position,
    });

    if (popup) {
      state.heartSlots[slot] = { element: popup };
    }
  };

  spawn();
  state.endlessInterval = setInterval(spawn, 1600);
}

function initSnow() {
  const canvas = qs("#snow-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.snowflakes = createSnowflakes(160, canvas.width, canvas.height);
  };

  resize();
  window.addEventListener("resize", resize);

  const render = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.snowflakes.forEach((flake) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fill();
      flake.y += flake.speedY;
      flake.x += Math.sin(flake.angle) * flake.speedX;
      flake.angle += 0.01;

      if (flake.y > canvas.height + flake.radius) {
        flake.y = -flake.radius;
        flake.x = Math.random() * canvas.width;
      }
    });

    state.animationFrame = requestAnimationFrame(render);
  };

  render();
}

function createSnowflakes(count, width, height) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 3 + 1.2,
    speedY: Math.random() * 1.2 + 0.4,
    speedX: Math.random() * 0.8 + 0.2,
    opacity: Math.random() * 0.6 + 0.3,
    angle: Math.random() * Math.PI * 2,
  }));
}

function triggerFireflyShow() {
  const hero = qs("#hero");
  if (!hero) return;
  const fireflyLayer = document.createElement("div");
  fireflyLayer.className = "firefly-layer";

  const fireflies = Array.from({ length: 24 }, () => {
    const span = document.createElement("span");
    span.className = "firefly";
    span.style.setProperty("--tx", `${(Math.random() - 0.5) * 200}px`);
    span.style.setProperty("--ty", `${(Math.random() - 0.5) * 200}px`);
    span.style.animationDelay = `${Math.random() * 2}s`;
    fireflyLayer.appendChild(span);
    return span;
  });

  hero.appendChild(fireflyLayer);

  setTimeout(() => {
    fireflyLayer.classList.add("is-active");
  }, 50);

  setTimeout(() => {
    fireflyLayer.classList.remove("is-active");
    fireflyLayer.classList.add("is-fading");
    setTimeout(() => fireflyLayer.remove(), 1500);
  }, 5000);
}

function triggerMemoryPolaroids() {
  const section = qs("#moments");
  if (!section) return;
  section.classList.add("highlight");
  setTimeout(() => section.classList.remove("highlight"), 3200);
}

function startExperience() {
  toggleModal(true);
  playMusic();
  initSnow();
  startIntroPopups();
}

function initStartButton() {
  const confirmBtn = qs("#confirm-btn");
  confirmBtn?.addEventListener("click", () => {
    startExperience();
    confirmBtn.blur();
  });
}

function enhanceTabbing() {
  document.body.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    document.body.classList.add("user-is-tabbing");
  });
}

function init() {
  enhanceTabbing();
  initStartButton();
  initMusicToggle();
  initLetter();
  initGifts();
}

function transitionPopupsToHeart() {
  const heartContainer = qs("#heart-popups");
  const popupLayer = qs("#popup-layer");
  if (!heartContainer || !popupLayer) return;

  state.heartSlots = new Array(heartPositions.length).fill(null);

  const existingPopups = state.preHeartPopups.filter(Boolean);

  existingPopups.forEach((popup, index) => {
    const position = heartPositions[index % heartPositions.length];
    popup.classList.remove("is-visible");
    popup.classList.add("popup-message--heart");
    popup.style.setProperty("--x", `${position.x}px`);
    popup.style.setProperty("--y", `${position.y}px`);
    heartContainer.appendChild(popup);
    void popup.offsetWidth;
    popup.classList.add("is-visible");
    state.heartSlots[index] = { element: popup };
  });

  popupLayer.innerHTML = "";
  popupLayer.classList.remove("is-centered");
  state.heartIndex = existingPopups.length;
  state.preHeartPopups = [];
}

document.addEventListener("DOMContentLoaded", init);

