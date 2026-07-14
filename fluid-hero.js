// fluid-hero.js — WebGL fluid background for the ZXY /websites hero.
//
// Library: webgl-fluid-enhanced@0.6.1 (PINNED). Its static API is config()/splat()/simulation()/pause().
// NOTE: 0.6.1 exposes config(), NOT setConfig() — calling setConfig() silently no-ops, which leaves every
// splat at the initial SPLAT_RADIUS and blows the cursor core out to white. Per-splat radius MUST go through
// config({ SPLAT_RADIUS }).
//
// Ported from the approved Claude Design source, with fluid BEHAVIOUR rebuilt to the acceptance criteria
// (the design's look is preserved verbatim; only the logic below was corrected):
//   • 60fps — capped sim/dye resolution, throttled splats, sim paused on hidden tab
//   • intro — full-width red top band + blue bottom band that physically OVERLAP → purple emerges additively
//     (no seeded purple line); dissipates to ambient in ~2–3s, headline readable on settle
//   • cursor — ~28–30px halo + a small grey core capped below the bloom-flare threshold; inject only after
//     >10px of travel (the blinding fix); halo auto-shifts red↔blue at 3s/transition; purple every 5th
//     collision (debounced, counted once per band entry)
//   • ambient — continuous breathing; each splat fully randomized 0–360° direction, straight OR curvy,
//     no repeated paths; red/blue overlaps go purple additively
//   • fallback — reduced-motion / mobile / no-WebGL → static low-intensity CSS bloom, no canvas, no timers

import webGLFluidEnhanced from 'webgl-fluid-enhanced';

const RED  = ['#FF3B30', '#FF6B5E'];
const BLUE = ['#2E6BFF', '#4DA3FF'];

// LOOK config — copied from the approved design. PERF caps (SIM/DYE resolution) added per acceptance criteria.
const CONFIG = {
  SIM_RESOLUTION: 128,        // perf cap
  DYE_RESOLUTION: 512,        // perf cap — design used the lib default (1024); 512 holds the bloomed look at 60fps
  BACK_COLOR: '#000000',
  TRANSPARENT: false,
  COLOR_PALETTE: [...RED, ...BLUE],
  COLORFUL: false,            // palette only — no rainbow cycling
  BLOOM: true,
  BLOOM_INTENSITY: 0.8,
  CURL: 32,                   // vorticity → billowing tendrils
  DENSITY_DISSIPATION: 1.0,   // dye fades between bursts → the breathing
  VELOCITY_DISSIPATION: 0.25,
  SPLAT_RADIUS: 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  HOVER: false,              // cursor handled manually below
  BRIGHTNESS: 0.6,
  INITIAL: false,
  SUNRAYS: true,
};

let started = false;
let stopped = false;
let simPaused = false;
let breathTimer = null;

// cursor state
let lastPt = null, lastInjPt = null, lastMove = 0, purpleUntil = 0, colCount = 0, wasInBand = false;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) { return false; }
}

function lerpHex(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Every splat declares its own radius — config() (the real 0.6.1 method) sets it atomically just before the
// splat, so the small cursor core stays small and never blooms to white.
function splat(x, y, dx, dy, color, radius) {
  try {
    webGLFluidEnhanced.config({ SPLAT_RADIUS: radius });
    webGLFluidEnhanced.splat(x, y, dx, dy, color);
  } catch (e) { /* sim not ready — drop this splat */ }
}

// Keep ambient splats out of the headline / CTA channel (left-center) so the copy stays readable.
function avoidText(xf, yf) {
  if (xf < 0.46 && yf > 0.26 && yf < 0.84) {
    yf = (Math.random() < 0.5) ? Math.random() * 0.20 : 0.86 + Math.random() * 0.12;
  }
  return yf;
}

// INTRO — a full-width red band across the TOP (pushed DOWN) and a full-width blue band across the BOTTOM
// (pushed UP). The inner rows cross the centre line, so red and blue dye physically overlap and bloom PURPLE
// on their own — emergent, not a seeded line.
function intro() {
  const W = window.innerWidth, H = window.innerHeight;
  const COLS = 14;     // dense enough that a row reads as one continuous edge-to-edge band
  const R = 0.42;      // large radius → thick bands that reach into the middle and overlap
  const row = (yf, pal, vy) => {
    for (let i = 0; i < COLS; i++) {
      const xf = (i + 0.5) / COLS + (Math.random() * 0.03 - 0.015);
      const dx = (Math.random() * 2 - 1) * 160;   // slight horizontal wander → organic wavy edge
      splat(W * xf, H * yf, dx, vy, pal[i % pal.length], R);
    }
  };
  const fire = () => {
    if (stopped) return;
    row(0.16, RED, 520);
    row(0.30, RED, 460);
    row(0.44, RED, 360);    // red pushed down into the middle…
    row(0.56, BLUE, -360);  // …blue pushed up to meet it → the overlap blooms purple
    row(0.70, BLUE, -460);
    row(0.84, BLUE, -520);
  };
  fire();
  setTimeout(fire, 300);    // second pass thickens every band into a solid edge-to-edge fill
}

// AMBIENT — one breathing streak: red biased left-center, blue biased right-center (their overlap → purple),
// full 0–360° direction, randomly straight OR a chained curvy bend. Never the same path twice.
function ambientSplat(isRed) {
  const W = window.innerWidth, H = window.innerHeight;
  const pal = isRed ? RED : BLUE;
  const color = pal[(Math.random() * pal.length) | 0];
  const xf = isRed ? (0.06 + Math.pow(Math.random(), 1.6) * 0.50)
                   : (0.96 - Math.pow(Math.random(), 1.6) * 0.52);
  let px = W * xf, py = H * avoidText(xf, Math.random());
  const force = 800 + Math.random() * 1800;
  const a = Math.random() * Math.PI * 2;
  if (Math.random() < 0.5) {
    splat(px, py, Math.cos(a) * force, Math.sin(a) * force, color, 0.25);   // STRAIGHT
  } else {
    const steps = 2 + (Math.random() < 0.5 ? 1 : 0);                        // CURVY — chained, rotating
    const da = (Math.random() < 0.5 ? 1 : -1) * (0.35 + Math.random() * 0.45);
    const stepLen = (0.04 + Math.random() * 0.05) * W;
    let ang = a;
    for (let k = 0; k < steps; k++) {
      splat(px, py, Math.cos(ang) * force, Math.sin(ang) * force, color, 0.18);
      ang += da;
      px += Math.cos(ang) * stepLen;
      py = H * avoidText(px / W, (py + Math.sin(ang) * stepLen) / H);
    }
  }
}

function ambientLoop() {
  if (stopped) return;
  if (!document.hidden) {
    const n = 2 + (Math.random() < 0.5 ? 1 : 0);   // 2–3 splats / tick
    for (let i = 0; i < n; i++) ambientSplat(Math.random() < 0.5);
  }
  breathTimer = setTimeout(ambientLoop, 1200 + Math.random() * 400);  // ~1200–1600ms
}

// CURSOR — coloured halo (~28–30px) + small grey core (capped at #999 = mid-grey, below the bloom-flare
// threshold). Inject ONLY after >10px of travel since the last injection, so a resting or slow pointer
// injects nothing and white can never pile up (the blinding fix).
function onPointerMove(e) {
  if (stopped) return;
  const now = performance.now();
  if (now - lastMove < 16) return;     // light throttle (~60fps)
  lastMove = now;

  const W = window.innerWidth, H = window.innerHeight;
  const x = e.clientX, y = e.clientY;  // canvas is fixed full-viewport → client coords map 1:1
  const xf = x / W;

  // collision = a debounced ENTRY into the central mixed band; every 5th entry → purple for ~1.5s
  const inBand = (xf > 0.42 && xf < 0.58);
  if (inBand && !wasInBand) {
    colCount++;
    if (colCount % 5 === 0) purpleUntil = now + 1500;
  }
  wasInBand = inBand;

  let dx = 0, dy = 0;
  if (lastPt) { dx = (x - lastPt.x) * 8; dy = (y - lastPt.y) * 8; }
  lastPt = { x, y };

  // distance gate — the whole blinding fix
  if (lastInjPt && Math.hypot(x - lastInjPt.x, y - lastInjPt.y) < 10) return;
  lastInjPt = { x, y };

  let halo;
  if (now < purpleUntil) {
    halo = '#C77DFF';
  } else {
    const t = (1 - Math.cos((now / 3000) * Math.PI)) / 2;   // 0..1..0, ~3s per one-way transition
    halo = lerpHex('#FF6B5E', '#4DA3FF', t);
  }
  splat(x, y, dx, dy, halo, 0.030);                 // coloured halo (~28–30px)
  splat(x, y, dx * 0.4, dy * 0.4, '#999999', 0.012); // small grey core — never a white blowout
}

function onVisibility() {
  if (stopped || !started) return;
  if (document.hidden) {
    if (!simPaused) { try { webGLFluidEnhanced.pause(); } catch (e) {} simPaused = true; }
    if (breathTimer) { clearTimeout(breathTimer); breathTimer = null; }   // no timers while hidden
  } else {
    if (simPaused) { try { webGLFluidEnhanced.pause(); } catch (e) {} simPaused = false; }
    if (!breathTimer) ambientLoop();   // resume breathing (re-seeds promptly)
  }
}

function startFluid(canvas) {
  if (started || stopped) return false;
  try {
    webGLFluidEnhanced.simulation(canvas, CONFIG);
  } catch (e) { return false; }
  // self-verify: simulation() resizes the canvas synchronously; if still at default it didn't take.
  if (canvas.width === 300 || canvas.width === 0) return false;
  started = true;

  document.body.classList.add('fluid-active');   // crossfade: canvas in, CSS fallback out

  intro();
  breathTimer = setTimeout(ambientLoop, 2400);   // dissipate to ambient in ~2–3s

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  return true;
}

function init() {
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 820px)').matches || window.matchMedia('(pointer: coarse)').matches;

  // reduced-motion / mobile / no-WebGL → static low-intensity CSS bloom (no canvas, no timers)
  if (reduce || mobile || !hasWebGL()) {
    canvas.remove();
    return;
  }

  // Poll until the canvas has laid out, then start. startFluid() is idempotent.
  let attempts = 0;
  const poll = setInterval(() => {
    if (started || stopped || attempts++ > 140) { clearInterval(poll); return; }
    if (canvas.getBoundingClientRect().width < 1) return;   // wait for layout
    if (startFluid(canvas)) clearInterval(poll);
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(init));
} else {
  requestAnimationFrame(init);
}
