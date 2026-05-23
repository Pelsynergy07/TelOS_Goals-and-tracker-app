// ============================================================
//  🚀 Life OS — Entry Point
//  ============================================================
//  Initialization, tab switching, and global app state references.
//  This is the thin coordinator — all domain logic lives in js/.
// ============================================================

// ─── Global State ─────────────────────────────────────────

let activeTab = "today";
let trackerDate = "";
let reviewTab = "weekly", reviewMode = "weekly";
let reviewWeekId = "";
let reviewMonth = 0;
let reviewYear = 2026;

// ─── Init ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  applyConfig();
  applyPageCopy();
  trackerDate = getLocalDateString();
  const today = new Date(trackerDate);
  reviewMonth = today.getMonth();
  reviewYear = today.getFullYear();
  reviewWeekId = getWeekID(trackerDate);
  loadLocalData();
  initSupabase();
  renderAll();
  lucide.createIcons();
});

function applyConfig() {
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText("sidebar-title", APP_CONFIG.appName);
  setText("sidebar-subtitle", APP_CONFIG.appSubtitle.toUpperCase());
  setText("sidebar-avatar", APP_CONFIG.userInitials);
  setText("sidebar-name", APP_CONFIG.userName);
  setText("sidebar-tagline", APP_CONFIG.userTagline);
  setText("mobile-header-title", APP_CONFIG.appName);
  document.title = APP_CONFIG.appName;
}

function applyPageCopy() {
  const careerIntro = document.querySelector("#tab-career .min-w-0 p");
  if (careerIntro) {
    careerIntro.textContent = "Configure your goal cascade: North Star, checkpoints, and daily habits.";
  }
}

// ─── Tab Switching ────────────────────────────────────────

function switchTab(tabName) {
  activeTab = tabName;
  const tabs = ["today", "review", "career", "settings"];
  tabs.forEach(t => {
    const sec = document.getElementById(`tab-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);
    const mobNavBtn = document.getElementById(`mob-nav-${t}`);
    if (sec) sec.classList.add("hidden");
    if (navBtn) navBtn.classList.remove("nav-active");
    if (mobNavBtn) mobNavBtn.className = "flex flex-col items-center gap-0.5 text-text-dim text-[9px] font-bold flex-1 py-1";
  });

  const activeSec = document.getElementById(`tab-${tabName}`);
  const activeNav = document.getElementById(`nav-${tabName}`);
  const activeMobNav = document.getElementById(`mob-nav-${tabName}`);
  if (activeSec) activeSec.classList.remove("hidden");
  if (activeNav) activeNav.classList.add("nav-active");
  if (activeMobNav) activeMobNav.className = "flex flex-col items-center gap-0.5 text-green text-[9px] font-bold flex-1 py-1";

  if (tabName === "today") renderToday();
  else if (tabName === "review") renderReview();
  else if (tabName === "career") renderGoalsHub();
  else if (tabName === "settings") renderSettings();

  window.scrollTo(0, 0);
  lucide.createIcons();
}

function renderAll() {
  updateTodayDateHeader();
  calculateStreaks();
  renderToday();
  renderReview();
  renderGoalsHub();
  renderSettings();
}

function celebrate() {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const cx = canvas.width / 2;

  const palette = ["#ffd700","#22d3a0","#60a5fa","#f472b6","#f87171","#f59e0b","#a78bfa","#34d399","#fbbf24"];
  const particles = [];

  for (let i = 200; i--;) {
    const angle = Math.random() * Math.PI * 2;
    const vel = 4 + Math.random() * 12;
    const size = 4 + Math.random() * 8;
    particles.push({
      x: cx + (Math.random() - 0.5) * 80,
      y: canvas.height * 0.4 + (Math.random() - 0.5) * 60,
      vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel - 3,
      w: size, h: size * (0.4 + Math.random() * 0.4),
      color: palette[Math.floor(Math.random() * palette.length)],
      rot: Math.random() * 360, rs: (Math.random() - 0.5) * 15,
      op: 1, grav: 0.08 + Math.random() * 0.06
    });
  }

  let frame = 0;
  const maxFrames = 150;
  function anim() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.vy += p.grav;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rs;
      p.op = Math.max(0, 1 - frame / maxFrames);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = p.op;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (frame < maxFrames) requestAnimationFrame(anim);
    else canvas.remove();
  }
  anim();
}
