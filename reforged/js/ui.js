import { CONFIG } from './config.js';
import { on, emit } from './events.js';
import { game } from './gameState.js';
import { toggleMusicMute, toggleSfxMute, musicMuted, sfxMuted, music, sfx, TRACKS, trackUnlocked, setMusicVolume, setSfxVolume } from './sfx.js';
import { comboTier, EMBER_ICON } from './util.js';
import { saveData, persist, persistNow, unfreezeSaves, xpToNext, todayUTC } from './save.js';
import { activeMissions } from './missions.js';
import { todaysDailyMod } from './daily.js';
import { weeklyTrials } from './weekly.js';
import { equippedTitleName } from './titles.js';
import { buildRecapHtml, wireRecap, selectNextUp } from './recap.js';
import { buildPilotHtml, wirePilot } from './pilotScreen.js';
import { claimFeat, unclaimedFeatCount } from './feats.js';
import { DRAGONS, DRAGON_STAT_CAP } from './dragons.js';
import { RIDERS } from './riders.js';
import { attachPreviews, attachPreviewCanvas, refreshPreview, setShowcaseDef, closeShowcase, setShowcaseZoom, showcaseDragStart, showcaseDragMove, showcaseDragEnd } from './preview.js';
import { attachTrailPreviews } from './trailPreview.js';
import { FLIGHTMARKS, flightmarkOwned, equippedFlightmark } from './flightmarks.js';
import { ASCENSION_TIERS, ascendedDef, ascensionTier, canAscend, radianceRank, maxTierFor } from './ascension.js';

let els = {};
let handlers = {};

// §8 — one consistent, satisfying UI sound across the whole interface. A single
// delegated capture-listener plays a soft "select" tick on any meaningful
// control, or a gentle "deny" on locked/disabled ones. Action chimes (equip,
// claim, radio, ascend) keep layering their richer sound on top of this quiet
// press, so every interaction feels responsive without double-handling.
document.addEventListener('click', (e) => {
  const el = e.target.closest('button, .skin-card, .title-row');
  if (!el) return;
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') sfx.deny();
  else sfx.select();
}, true);

const isTouch = () =>
  (globalThis.matchMedia && matchMedia('(pointer: coarse)').matches) ||
  'ontouchstart' in globalThis;

const ICONS = {
  ig:   '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.3" fill="currentColor"/></svg>',
  x:    '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.8 6.3L18.9 2z"/></svg>',
  tt:   '<svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.76 5.76 0 0 0-.77-.05 5.66 5.66 0 1 0 5.66 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.22-1.48z"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.6 13.4a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.6l-1.2 1.2"/><path d="M13.4 10.6a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.6l1.2-1.2"/></svg>',
  music:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  musicOff: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="2" y1="3" x2="22" y2="21"/></svg>',
  sfxOn:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  sfxOff:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  radio:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="20" height="12" rx="2"/><path d="M5 9l13-6"/><circle cx="8" cy="15" r="2.5"/><path d="M15 13h4M15 17h4"/></svg>',
  pause:    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  inspect:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6"/></svg>',
  prev:     '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 4h2v16H6zM20 4v16L9 12z"/></svg>',
  next:     '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 4h2v16h-2zM4 4v16l11-8z"/></svg>',
  // §14 — one consistent premium line-icon set for the section/category labels
  // (matches the music/radio/inspect SVGs above, not the old grab-bag of emoji).
  dragon:   '<svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.6c2.1 3 3.2 4.2 3.2 6.9A3.2 3.2 0 0 1 5.8 9.5c0-1.7 1-2.8 2-3.7 0 1.1.5 1.6 1 1.6-.5-2 .2-3.9.2-4.8z"/></svg>',
  rider:    '<svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5.2" r="2.5"/><path d="M3.9 15c0-2.8 2.3-4.7 5.1-4.7s5.1 1.9 5.1 4.7"/></svg>',
  style:    '<svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M9 2.2l1.7 4.7 4.7 1.6-4.7 1.6L9 14.8l-1.7-4.7L2.6 8.5l4.7-1.6z"/></svg>',
  shop:     '<svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.4 6h9.2l-.8 9.2H5.2z"/><path d="M6.6 6a2.4 2.4 0 0 1 4.8 0"/></svg>',
  settings: '<svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><circle cx="11.5" cy="6" r="1.9"/><circle cx="6.5" cy="12" r="1.9"/></svg>',
  pilot:    '<svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3.6l5 3.1-5-1-5 1z"/><path d="M9 8.7l5 3.1-5-1-5 1z"/></svg>',
  daily:    '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="12" height="10.5" rx="1.4"/><path d="M3 7.6h12M6 3v3M12 3v3"/></svg>',
  feat:     '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.4 2.2l2.6 4.1 2.6-4.1"/><circle cx="9" cy="11" r="3.9"/></svg>',
  weekly:   '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.2h7v2.6a3.5 3.5 0 0 1-7 0z"/><path d="M5.5 4.2H4a1.6 1.6 0 0 0 1.6 1.9M12.5 4.2H14a1.6 1.6 0 0 1-1.6 1.9"/><path d="M9 9.4v2.3M6.8 14.6h4.4l-.6-2.9H7.4z"/></svg>',
};

// Popup text IDs used across multiple popups
let popupTimer = null;
let lastCombo = 1;
let lastChain = 0;
let lastSurgeLit = -1;     // gems currently lit (avoid per-frame DOM churn)
let lastThreshold = -1;    // gem-slot count (feverThreshold can change)
let wasFever = false;      // fever-start edge -> ignition animation
let surgeIgniteTO = null;  // ignition one-shot cleanup timer
let reviveTimer = null;
let lastShownScore = 0;
let lastSpeedlines = -1;
let celebrateShownAt = 0;
let assistFadeTimer = null;
let lastAssistText = '';
let bestRevealTimer = null;
let lastBestReveal = '';
let ffRevealTimer = null;
let lastFFActive = false;
let lastEmbersRun = 0;
let emberDimTimer = null;

// The four forms double as a rarity ladder in the shop: Hatchling reads R and
// the apex reads SSSR, so scrubbing shows how much cooler the dragon gets.
// Per-form rarity ladders that END at a dragon's max rarity: a starter's apex
// reads SSR while premiums climb to SSSR — so evolving still feels cooler
// without letting starters masquerade as eternal legendaries.
const RARITY_LADDERS = {
  SSR:  ['R', 'SR', 'SSR'],          // starters: 3 forms, apex Radiant = SSR
  SSSR: ['R', 'SR', 'SSR', 'SSSR'],  // premiums: 4 forms, apex Eternal = SSSR
};
function formRarity(tier, maxR = 'SSSR') {
  const ladder = RARITY_LADDERS[maxR] || RARITY_LADDERS.SSSR;
  return ladder[Math.max(0, Math.min(tier, ladder.length - 1))];
}

// Shop display form. Free to scrub all four forms (owned or not) so players can
// preview the whole evolution; the FLOWN form stays clamped to what's owned in
// main.equippedDragon.
function getFormPref(key) {
  const cap = maxTierFor(key); // apex form index (3 premiums / 2 starters)
  const fp = saveData.cosmetics.formPref.find(e => e[0] === key);
  if (fp) return Math.max(0, Math.min(fp[1], cap));
  // Owned → your current form; unowned → the apex (the goal you'd grind for).
  return saveData.skins.owned.includes(key) ? ascensionTier(key) : cap;
}
function setFormPref(key, tier) {
  tier = Math.max(0, Math.min(tier, maxTierFor(key)));
  const entry = saveData.cosmetics.formPref.find(e => e[0] === key);
  if (entry) entry[1] = tier;
  else saveData.cosmetics.formPref.push([key, tier]);
  persist();
}
function formTierLabel(tier) {
  if (tier === 0) return 'Hatchling';
  return ASCENSION_TIERS[tier - 1]?.name ?? 'Eternal';
}

// Readable stat rows for the showcase: a clear label, a thick accent-tinted bar
// and a numeric rating (40–99 so even the humble starter reads as a real stat).
function inspectStatRows(d) {
  const st = d.stats;
  const spd = (st.speed - 1) / (DRAGON_STAT_CAP.speed - 1 || 1);
  const agi = (st.handling - 1) / (DRAGON_STAT_CAP.handling - 1 || 1);
  const sta = ((1 - st.drain) + (st.regen - 1)) / ((1 - DRAGON_STAT_CAP.drain) + (DRAGON_STAT_CAP.regen - 1) || 1);
  const row = (lbl, k) => {
    const p = Math.max(0, Math.min(1, k));
    const rating = Math.round(40 + 59 * p);
    return `<div class="ins-stat"><span class="ins-stat-label">${lbl}</span>`
      + `<div class="ins-stat-track"><span class="ins-stat-fill" style="width:${Math.round(10 + 90 * p)}%"></span></div>`
      + `<span class="ins-stat-val">${rating}</span></div>`;
  };
  return row('SPEED', spd) + row('AGILITY', agi) + row('STAMINA', sta);
}

// Buy (if affordable) or equip a dragon — shared by the shop card and the
// inspect modal's CTA. Returns 'equipped' | 'bought' | 'need-more'.
function buyOrEquipDragon(key) {
  const d = DRAGONS[key];
  if (saveData.skins.owned.includes(key)) {
    saveData.skins.equipped = key;
    persistNow(); // discrete purchase/equip — write immediately, never debounced
    handlers.onEquipDragon && handlers.onEquipDragon(key);
    return 'equipped';
  }
  if (saveData.embers >= d.cost) {
    saveData.embers -= d.cost;
    saveData.skins.owned.push(key);
    saveData.skins.equipped = key;
    persistNow();
    handlers.onEquipDragon && handlers.onEquipDragon(key);
    return 'bought';
  }
  return 'need-more';
}

// §3 — full-screen premium dragon showcase. A blurred, vignetted backdrop behind
// a large high-res render (preview.js DragonShowcase). Two axes of navigation:
//   • DRAGON  — swipe / drag, big edge chevrons, or the carousel dots (wraps).
//   • FORM    — the big ◀ ▶ ladder arrows below the model (Hatchling→apex).
// Themed live by the scrubbed form's rarity (--accent). Disposed on close.
const FR_ACCENT = { R: '#7fd49a', SR: '#62a8ff', SSR: '#c489ff', SSSR: '#ffd24d' };
let inspectOpen = false;
function openInspect(startKey) {
  if (inspectOpen) return;
  const keys = Object.keys(DRAGONS);
  let di = keys.indexOf(startKey);
  if (di < 0) return;
  inspectOpen = true;
  let changed = false;   // did we equip / buy / re-form? → refresh the shop on close
  let animating = false;

  // Current dragon's state (recomputed whenever we slide to a new dragon).
  let key, d, owned, cap, tier;
  const loadDragon = () => {
    key = keys[di];
    d = DRAGONS[key];
    owned = saveData.skins.owned.includes(key);
    cap = maxTierFor(key);
    tier = owned ? getFormPref(key) : cap;
  };
  loadDragon();

  const overlay = document.createElement('div');
  overlay.className = 'inspect-overlay';
  overlay.innerHTML = `
    <div class="inspect-modal">
      <button class="inspect-close" id="inspect-close" title="Close" aria-label="Close">✕</button>
      <div class="rarity-gem inspect-gem" id="inspect-gem"></div>
      <div class="inspect-viewport" id="inspect-viewport">
        <button class="inspect-nav prev" id="inspect-dragon-prev" aria-label="Previous dragon">‹</button>
        <button class="inspect-nav next" id="inspect-dragon-next" aria-label="Next dragon">›</button>
        <div class="inspect-content" id="inspect-content">
          <div class="inspect-stage">
            <div class="inspect-glow"></div>
            <canvas class="inspect-canvas" width="640" height="640"></canvas>
            <div class="inspect-pedestal"></div>
            <div class="inspect-rothint">⟲ drag to rotate</div>
          </div>
          <div class="inspect-name" id="inspect-name"></div>
          <div class="inspect-title" id="inspect-title"></div>
        </div>
      </div>
      <div class="inspect-lower" id="inspect-lower">
        <div class="inspect-formbar">
          <button class="form-btn" id="inspect-prev" aria-label="Previous form">◀</button>
          <div class="form-meta">
            <span class="form-name" id="inspect-formlabel"></span>
            <span class="form-rarity" id="inspect-formrarity"></span>
          </div>
          <button class="form-btn" id="inspect-next" aria-label="Next form">▶</button>
        </div>
        <div class="form-pips" id="inspect-formpips"></div>
        <div class="inspect-stats" id="inspect-stats"></div>
        <div class="inspect-cta" id="inspect-cta"></div>
      </div>
      <div class="inspect-dots" id="inspect-dots"></div>
    </div>`;
  document.body.appendChild(overlay);

  const q = (sel) => overlay.querySelector(sel);
  const modal = q('.inspect-modal');
  const canvas = q('.inspect-canvas');
  const content = q('#inspect-content');
  const lower = q('#inspect-lower');
  const gem = q('#inspect-gem');
  const nameEl = q('#inspect-name');
  const titleEl = q('#inspect-title');
  const formLabel = q('#inspect-formlabel');
  const formRarityEl = q('#inspect-formrarity');
  const formPips = q('#inspect-formpips');
  const statsEl = q('#inspect-stats');
  const ctaEl = q('#inspect-cta');
  const dotsEl = q('#inspect-dots');
  const prevForm = q('#inspect-prev');
  const nextForm = q('#inspect-next');
  dotsEl.innerHTML = keys.map((_, i) => `<i data-di="${i}"></i>`).join('');

  const renderCta = () => {
    const equipped = saveData.skins.equipped === key;
    if (owned && equipped) {
      ctaEl.innerHTML = `<span class="ins-owned">✓ EQUIPPED</span>`;
      return;
    }
    if (owned) {
      ctaEl.innerHTML = `<button class="ins-equip" id="ins-equip">EQUIP</button>`;
    } else {
      const can = saveData.embers >= d.cost;
      ctaEl.innerHTML = `<button class="ins-equip buy${can ? '' : ' cant'}" id="ins-equip"`
        + `${can ? '' : ' aria-disabled="true"'}>${EMBER_ICON} ${d.cost}${can ? ' · UNLOCK' : ''}</button>`
        + `${can ? '' : `<span class="ins-hint" id="ins-hint"></span>`}`;
    }
    q('#ins-equip').onclick = (e) => {
      e.stopPropagation();
      const res = buyOrEquipDragon(key);
      if (res === 'need-more') {
        const hint = q('#ins-hint');
        if (hint) hint.textContent = `Need ${EMBER_ICON} ${d.cost - saveData.embers} more`;
        return;
      }
      changed = true; owned = true;
      renderCta();
    };
  };

  const render = () => {
    setShowcaseDef(canvas, ascendedDef(d, tier, owned ? radianceRank(key) : 0));
    const fr = formRarity(tier, d.maxRarity);
    modal.style.setProperty('--accent', FR_ACCENT[fr] || FR_ACCENT.SSSR);
    // Spotlight tint = the dragon's own signature when it sets one (so Obsidian
    // stays cyan despite its gold SSSR badge), else the rarity accent.
    modal.style.setProperty('--glow', d.previewAccent
      ? '#' + d.previewAccent.toString(16).padStart(6, '0')
      : (FR_ACCENT[fr] || FR_ACCENT.SSSR));
    gem.textContent = fr; gem.dataset.fr = fr;
    nameEl.textContent = d.name;
    titleEl.textContent = d.title;
    formLabel.textContent = formTierLabel(tier);
    formRarityEl.textContent = fr;
    prevForm.disabled = tier <= 0;
    nextForm.disabled = tier >= cap;
    formPips.innerHTML = Array.from({ length: cap + 1 }, (_, i) => `<i class="${i <= tier ? 'on' : ''}"></i>`).join('');
    statsEl.innerHTML = inspectStatRows(d);
    renderCta();
    for (const dot of dotsEl.children) dot.classList.toggle('on', Number(dot.dataset.di) === di);
  };
  render();

  // Slide to another dragon (delta may be ±1 from a chevron/swipe, or a larger
  // jump from a dot). The hero slides out, we swap, then it slides back in.
  const goTo = (delta) => {
    if (animating || !delta) return;
    animating = true;
    const dir = delta > 0 ? -1 : 1; // exit left when advancing
    content.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
    content.style.transform = `translateX(${dir * 70}px)`;
    content.style.opacity = '0';
    lower.style.transition = 'opacity 0.15s ease';
    lower.style.opacity = '0';
    setTimeout(() => {
      di = (di + delta + keys.length) % keys.length;
      loadDragon();
      render();
      content.style.transition = 'none';
      content.style.transform = `translateX(${-dir * 70}px)`;
      void content.offsetWidth; // commit the off-screen start before animating in
      content.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.24s ease';
      content.style.transform = 'translateX(0)';
      content.style.opacity = '1';
      lower.style.opacity = '1';
      setTimeout(() => { animating = false; }, 250);
    }, 150);
  };

  const changeForm = (delta) => {
    const nt = Math.max(0, Math.min(cap, tier + delta));
    if (nt === tier) return;
    tier = nt;
    if (owned) {
      setFormPref(key, tier);
      changed = true;
      if (saveData.skins.equipped === key && handlers.onEquipDragon) handlers.onEquipDragon();
    }
    render();
  };

  // Gestures on the hero: ONE finger drag = spin the dragon 360° (turntable);
  // TWO-finger pinch (or the mouse wheel) = zoom in for detail. Switch dragons with
  // the ‹ › chevrons, the carousel dots, or the ← → arrow keys.
  const vp = q('#inspect-viewport');
  const stage = q('.inspect-stage');
  const pointers = new Map();
  let dragId = null, lastX = 0, rotated = false;
  let pinching = false, pinchStartDist = 0, pinchStartZoom = 1, zoom = 1;
  const clampZoom = (z) => Math.max(0.55, Math.min(z, 2.4));
  const pinchDist = () => {
    const p = [...pointers.values()];
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  };
  vp.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('button')) return;
    try { vp.setPointerCapture(e.pointerId); } catch { /* ok */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      // Promote to a pinch — end any single-finger turntable drag mid-stroke.
      pinching = true; dragId = null; showcaseDragEnd();
      pinchStartDist = pinchDist(); pinchStartZoom = zoom;
    } else if (pointers.size === 1) {
      dragId = e.pointerId; lastX = e.clientX;
      showcaseDragStart();
      if (!rotated) { rotated = true; stage.classList.add('rotated'); } // fade the hint
    }
  });
  vp.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinching && pointers.size >= 2) {
      zoom = clampZoom(pinchStartZoom * (pinchDist() / (pinchStartDist || 1)));
      setShowcaseZoom(zoom);
      return;
    }
    if (e.pointerId !== dragId) return;
    const step = e.clientX - lastX; lastX = e.clientX;
    showcaseDragMove(step);   // spin the turntable
  });
  const endPointer = (e) => {
    try { vp.releasePointerCapture(e.pointerId); } catch { /* ok */ }
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinching = false;
    if (e.pointerId !== dragId) return;
    dragId = null;
    showcaseDragEnd();         // release → inertia
  };
  vp.addEventListener('pointerup', endPointer);
  vp.addEventListener('pointercancel', endPointer);
  vp.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom = clampZoom(zoom * (e.deltaY < 0 ? 1.12 : 0.89));
    setShowcaseZoom(zoom);
  }, { passive: false });

  // Capture-phase so Escape closes the modal before the game's own Esc handler.
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    else if (e.key === 'ArrowLeft') { e.stopPropagation(); goTo(-1); }
    else if (e.key === 'ArrowRight') { e.stopPropagation(); goTo(1); }
  };
  const close = () => {
    if (!inspectOpen) return;
    inspectOpen = false;
    document.removeEventListener('keydown', onKey, true);
    closeShowcase();
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 240);
    if (changed) ui.showScreen('shop');
  };
  document.addEventListener('keydown', onKey, true);
  overlay.addEventListener('pointerdown', (e) => e.stopPropagation()); // never fall through to tap-to-fly
  q('#inspect-close').onclick = (e) => { e.stopPropagation(); close(); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  prevForm.onclick = (e) => { e.stopPropagation(); changeForm(-1); };
  nextForm.onclick = (e) => { e.stopPropagation(); changeForm(1); };
  q('#inspect-dragon-prev').onclick = (e) => { e.stopPropagation(); goTo(-1); };
  q('#inspect-dragon-next').onclick = (e) => { e.stopPropagation(); goTo(1); };
  dotsEl.onclick = (e) => {
    const dot = e.target.closest('i[data-di]');
    if (!dot) return;
    goTo(Number(dot.dataset.di) - di);
  };
  requestAnimationFrame(() => overlay.classList.add('open'));
}

export const ui = {
  init(h = {}) {
    handlers = h;
    const root = document.createElement('div');
    root.id = 'hud';
    root.innerHTML = `
      <div class="hud-top-left">
        <button class="mute-btn" id="pause-btn" title="Pause (Esc) — audio &amp; radio live here">${ICONS.pause}</button>
        <div class="health-hearts" id="health-hearts"><span></span><span></span><span></span><span></span></div>
      </div>
      <div class="hud-top-center">
        <div class="dist" id="dist">0 m</div>
        <div class="best" id="best"></div>
      </div>
      <div class="hud-top-right">
        <div class="score" id="score">0</div>
        <div class="embers-hud" id="embers-hud"></div>
        <div class="race-bar" id="race-bar"><span class="race-fill" id="race-fill"></span><span class="race-target" id="race-target"></span></div>
        <div class="chain" id="chain"><span class="chain-n" id="chain-n">0</span><span class="chain-word">CHAIN</span></div>
        <div class="ff-chip" id="ff-chip"></div>
        <div class="assist-chip" id="assist-chip"></div>
      </div>
      <!-- Stamina: an arc cradling the dragon (beauty-first, near the gaze) -->
      <div class="stamina-arc" id="stamina-arc">
        <svg viewBox="0 0 250 92" preserveAspectRatio="none">
          <defs>
            <linearGradient id="stam-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#2bb6c9"/><stop offset="1" stop-color="#9affe6"/>
            </linearGradient>
          </defs>
          <!-- 3 EQUAL notched cells (one Surge phase each). Faint track always
               shows all three; a cell fills teal when its phase is affordable and
               glows hard when also in a Surge. -->
          <path class="arc-trk" pathLength="100" stroke-dasharray="28 8 28 8 28" d="M 22 14 Q 125 74 228 14"/>
          <path class="arc-cell" id="stam-seg-0" pathLength="100" stroke-dasharray="28 72" d="M 22 14 Q 125 74 228 14"/>
          <path class="arc-cell" id="stam-seg-1" pathLength="100" stroke-dasharray="0 36 28 36" d="M 22 14 Q 125 74 228 14"/>
          <path class="arc-cell" id="stam-seg-2" pathLength="100" stroke-dasharray="0 72 28 0" d="M 22 14 Q 125 74 228 14"/>
        </svg>
      </div>
      <!-- Surge: a bare gem row (no label/box) + a quiet multiplier -->
      <div class="surge-min" id="surge-widget" data-tier="0">
        <div class="surge-fx" id="surge-fx"><span class="flash"></span><span class="ember e1"></span><span class="ember e2"></span><span class="ember e3"></span><span class="ember e4"></span><span class="ember e5"></span></div>
        <div class="surge-x" id="surge-x">×1.00</div>
        <div class="surge-gems" id="surge-gems"></div>
      </div>
      <div class="milestone-banner" id="milestone-banner"></div>
      <div class="popup" id="popup"></div>
      <div class="popup popup2" id="popup2"></div>
      <div class="feat-toast" id="feat-toast"></div>
      <div class="hint" id="hint"></div>
      <div class="gesture-overlay" id="gesture-overlay"></div>
      <div class="vignette" id="vignette"></div>
      <div class="blue-flash" id="blue-flash"></div>
      <div class="gold-flash" id="gold-flash"></div>
      <div class="fever-overlay" id="fever-overlay"></div>
      <div class="speedlines" id="speedlines"></div>
      <div class="revive-offer" id="revive-offer">
        <div class="revive-count" id="revive-count">3</div>
        <div class="revive-title">SECOND WIND?</div>
        <div class="revive-sub">Spend a revive token to keep flying</div>
        <div class="action-row">
          <button class="btn-primary" id="btn-revive">USE REVIVE</button>
          <button class="btn-secondary" id="btn-giveup">GIVE UP</button>
        </div>
      </div>
      <div class="screen" id="screen"></div>
      <div class="menu-motes" id="menu-motes"></div>
      <div class="celebrate" id="celebrate"></div>
    `;
    document.body.appendChild(root);
    els = {
      staminaArc:   root.querySelector('#stamina-arc'),
      stamSegs:     [root.querySelector('#stam-seg-0'), root.querySelector('#stam-seg-1'), root.querySelector('#stam-seg-2')],
      score:        root.querySelector('#score'),
      chain:        root.querySelector('#chain'),
      chainN:       root.querySelector('#chain-n'),
      goldFlash:    root.querySelector('#gold-flash'),
      surgeWidget:  root.querySelector('#surge-widget'),
      surgeX:       root.querySelector('#surge-x'),
      surgeGems:    root.querySelector('#surge-gems'),
      surgeFx:      root.querySelector('#surge-fx'),
      healthHearts: root.querySelector('#health-hearts'),
      embersHud:    root.querySelector('#embers-hud'),
      ffChip:       root.querySelector('#ff-chip'),
      raceBar:      root.querySelector('#race-bar'),
      raceFill:     root.querySelector('#race-fill'),
      raceTarget:   root.querySelector('#race-target'),
      assistChip:   root.querySelector('#assist-chip'),
      dist:         root.querySelector('#dist'),
      best:         root.querySelector('#best'),
      popup:        root.querySelector('#popup'),
      popup2:       root.querySelector('#popup2'),
      featToast:    root.querySelector('#feat-toast'),
      hint:         root.querySelector('#hint'),
      gestureOverlay: root.querySelector('#gesture-overlay'),
      vignette:     root.querySelector('#vignette'),
      blueFlash:    root.querySelector('#blue-flash'),
      feverOverlay: root.querySelector('#fever-overlay'),
      speedlines:   root.querySelector('#speedlines'),
      milestoneBanner: root.querySelector('#milestone-banner'),
      screen:       root.querySelector('#screen'),
      celebrate:    root.querySelector('#celebrate'),
      revive:       root.querySelector('#revive-offer'),
      reviveCount:  root.querySelector('#revive-count'),
    };

    // Celebration overlay tap-shield: the global pointerdown listener in
    // main.js starts/restarts/resumes on blank taps — propagation must die
    // HERE so a celebration can never fall through into a takeoff.
    els.celebrate.addEventListener('pointerdown', (e) => e.stopPropagation());
    els.celebrate.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismissCelebrate();
    });

    // Revive offer buttons
    root.querySelector('#btn-revive').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideReviveOffer();
      handlers.onRevive && handlers.onRevive();
    });
    root.querySelector('#btn-giveup').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideReviveOffer();
      handlers.onGiveUp && handlers.onGiveUp();
    });

    // Audio controls live in the pause menu; the HUD keeps only pause.
    root.querySelector('#pause-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onPause && handlers.onPause();
    });

    // Live feat unlocks toast over the event bus (feats.js stays ui-free).
    on('featUnlocked', (p) => {
      if (p && p.live) {
        this.featToast(p.def.name, p.def.reward);
        sfx.featUnlock();
      }
    });
  },

  update(player) {
    // Health = discrete hearts (healthMax 100 / obstacleDamage 25 = 4 hearts)
    const heartUnit = CONFIG.obstacleDamage; // 25 -> 4 hearts
    const hearts = els.healthHearts.children;
    for (let i = 0; i < hearts.length; i++)
      hearts[i].classList.toggle('full', game.health > i * heartUnit + 0.01);
    // Stamina = 3 EQUAL notched cells, each one Dragon-Surge phase-through (a third
    // of the bar). Each cell fills LIVE (proportional to the stamina inside its
    // third), so boosting drains the bar smoothly right-to-left instead of snapping
    // in thirds. A filled cell is dimly lit teal; during a Surge it glows hard, so
    // you see at a glance how many windows you can phase through.
    const third = CONFIG.staminaMax / 3;
    const inSurge = !!game.feverActive;
    const SEG_START = [0, 36, 72];   // pathLength offset where each cell begins (8-wide notch gaps)
    const SEG_LEN = [28, 28, 28];    // each cell's drawable length
    for (let i = 0; i < 3; i++) {
      const fill = Math.max(0, Math.min(1, (game.stamina - i * third) / third));
      const drawn = fill * SEG_LEN[i];
      // Draw `drawn` of this cell starting at its offset; the rest is gap.
      els.stamSegs[i].setAttribute('stroke-dasharray',
        `0 ${SEG_START[i].toFixed(2)} ${drawn.toFixed(2)} ${(100 - SEG_START[i] - drawn).toFixed(2)}`);
      els.stamSegs[i].classList.toggle('on', fill > 0.001);
      els.stamSegs[i].classList.toggle('lit', inSurge && fill > 0.001);
    }
    const shownScore = Math.floor(game.score);
    els.score.textContent = shownScore;
    // Earn pop: big single-frame jumps (rings/gates/bonuses) tick the score
    // up visibly. transform-origin:right keeps the right-aligned digits firm.
    if (shownScore - lastShownScore >= CONFIG.JUICE.earnPopThreshold) {
      restartAnim(els.score, 'score-earn-pop');
    }
    lastShownScore = shownScore;

    // Anime speed-lines: fade in with speed (boost/orb), CSS-only.
    const sn = Math.min(Math.max((player.speed - CONFIG.baseSpeed) / (CONFIG.orbSpeed - CONFIG.baseSpeed), 0), 1);
    const slOpacity = Math.min(Math.max((sn - 0.45) * 1.4, 0), 0.8);
    if (Math.abs(slOpacity - lastSpeedlines) > 0.02) {
      els.speedlines.style.opacity = slOpacity;
      lastSpeedlines = slOpacity;
    }

    // Score pulses while boosting, warms with combo, glows pink during fever
    els.score.classList.toggle('boost-pulse', player.boosting);
    els.score.classList.toggle('fever', game.feverActive);
    const tier = game.feverActive ? 5 : comboTier(game.combo);
    els.score.dataset.tier = tier;

    // Dragon Surge: a row of gem pips fills as you chain rings. Hit the
    // threshold and fever IGNITES (flash + shockwave); all gems then blaze
    // and the timer counts the fever down. (Gem count = feverThreshold,
    // which can change — e.g. the first-flight assist lowers it.)
    const threshold = game.feverThreshold;
    const surgeProgress = Math.min(game.consecutiveRings, threshold);
    if (threshold !== lastThreshold) {
      els.surgeGems.innerHTML = '';
      for (let i = 0; i < threshold; i++) els.surgeGems.appendChild(document.createElement('i'));
      lastThreshold = threshold; lastSurgeLit = -1;
    }
    const lit = game.feverActive ? threshold : surgeProgress;
    if (lit !== lastSurgeLit) {
      const gems = els.surgeGems.children;
      for (let i = 0; i < gems.length; i++) gems[i].classList.toggle('lit', i < lit);
      if (lit > lastSurgeLit && lit > 0 && lit <= gems.length) restartAnim(gems[lit - 1], 'gem-pop');
      lastSurgeLit = lit;
    }
    els.surgeWidget.dataset.tier = tier;
    els.surgeWidget.classList.toggle('fever', game.feverActive);
    els.surgeWidget.classList.toggle('active', game.combo > 1.001 || game.consecutiveRings > 0 || game.feverActive);
    els.surgeX.textContent = `×${game.combo.toFixed(2)}`;
    if (game.feverActive && !wasFever) {           // the ignition moment
      els.surgeWidget.classList.remove('igniting');
      void els.surgeWidget.offsetWidth;            // reflow -> restart the one-shot
      els.surgeWidget.classList.add('igniting');
      clearTimeout(surgeIgniteTO);
      surgeIgniteTO = setTimeout(() => els.surgeWidget.classList.remove('igniting'), 750);
    }
    wasFever = game.feverActive;
    if (game.combo > lastCombo + 0.001) restartAnim(els.surgeX, 'combo-pop');
    lastCombo = game.combo;

    // Chain counter: consecutive rings/windows without a miss. Appears from
    // 2 and pops on every link — the visible streak you don't want to drop.
    const chain = game.consecutiveRings;
    els.chain.classList.toggle('on', chain >= 2);
    if (chain !== lastChain) {
      els.chainN.textContent = chain;
      if (chain > lastChain && chain >= 2) restartAnim(els.chain, 'chain-pop');
      lastChain = chain;
    }

    els.dist.textContent = `${Math.floor(player.dist)} m`;

    // C1: BEST is a brief encouragement reveal near the record, not a
    // persistent HUD stat. Full record context belongs in recap.
    const nearBest = game.highScore > 0 && game.score >= 0.7 * game.highScore;
    const bestText = nearBest ? '★ PB' : '';
    if (bestText && bestText !== lastBestReveal) {
      els.best.textContent = bestText;
      els.best.classList.add('hud-reveal');
      clearTimeout(bestRevealTimer);
      bestRevealTimer = setTimeout(() => {
        els.best.classList.remove('hud-reveal');
        els.best.textContent = '';
      }, 3000);
      lastBestReveal = bestText;
    } else if (!nearBest) {
      clearTimeout(bestRevealTimer);
      els.best.classList.remove('hud-reveal');
      els.best.textContent = '';
      lastBestReveal = '';
    }

    // C3: Ember HUD — pop bright on pickup, dim after 2.5s idle
    const curEmbers = game.embersRun;
    els.embersHud.textContent = curEmbers > 0 ? `◆ ${curEmbers}` : '';
    if (curEmbers > lastEmbersRun) {
      els.embersHud.classList.remove('dim');
      restartAnim(els.embersHud, 'ember-pickup');
      clearTimeout(emberDimTimer);
      emberDimTimer = setTimeout(() => els.embersHud.classList.add('dim'), 2500);
    }
    lastEmbersRun = curEmbers;

    // C2: Assist chip — short icon/value reveal only; pause/recap explain scoring.
    const hcBonus = Math.round((game.scoreMult - 1) * 100);
    let newAssistText = '';
    if (saveData.settings.glideAssist) {
      newAssistText = `🪶 −${Math.round((1 - CONFIG.glideAssistScoreMult) * 100)}%`;
    } else if (hcBonus > 0) {
      newAssistText = `⚔ +${hcBonus}%`;
    }
    if (newAssistText !== lastAssistText) {
      els.assistChip.textContent = newAssistText;
      els.assistChip.classList.remove('faded');
      clearTimeout(assistFadeTimer);
      if (newAssistText) assistFadeTimer = setTimeout(() => els.assistChip.classList.add('faded'), 3000);
      lastAssistText = newAssistText;
    }

    // Challenge race bar: live progress against the friend's score, gold
    // once beaten. Today's comparison shouldn't wait for the crash screen.
    const racing = game.challengeScore > 0;
    els.raceBar.classList.toggle('on', racing);
    if (racing) {
      const frac = Math.min(1, game.score / game.challengeScore);
      els.raceFill.style.width = `${frac * 100}%`;
      els.raceTarget.textContent = game.challengeBeaten ? 'BEATEN!' : `vs ${game.challengeScore}`;
      els.raceBar.classList.toggle('won', game.challengeBeaten);
      if (!game.challengeBeaten && game.score > game.challengeScore) {
        game.challengeBeaten = true;
        this._popup('CHALLENGE BEATEN — KEEP FLYING!', 'gold');
        sfx.record();
      }
    }

    // First flight of the day: one short reveal; recap ledger explains/banks it.
    const ffActive = saveData.firstFlightDay !== todayUTC();
    if (ffActive && !lastFFActive) {
      els.ffChip.textContent = `☀ ×${CONFIG.firstFlightMult}`;
      els.ffChip.classList.add('hud-reveal');
      clearTimeout(ffRevealTimer);
      ffRevealTimer = setTimeout(() => {
        els.ffChip.classList.remove('hud-reveal');
        els.ffChip.textContent = '';
      }, 3500);
    } else if (!ffActive) {
      clearTimeout(ffRevealTimer);
      els.ffChip.classList.remove('hud-reveal');
      els.ffChip.textContent = '';
    }
    lastFFActive = ffActive;

    // Fever overlay pulse
    els.feverOverlay.classList.toggle('active', game.feverActive);
  },

  ringPopup(points, perfect, streak = 0) {
    if (perfect) {
      this._popup(streak > 1 ? `+${points} PERFECT ×${streak}!` : `+${points} PERFECT!`, 'gold');
    } else {
      this._popup(`+${points}`, 'green');
    }
  },

  // Gold radial flash on a perfect-center ring.
  perfectFlash() {
    restartAnim(els.goldFlash, 'flash-anim');
  },

  // Crystal-flash for a perfect phase (reuses the radial flash overlay).
  phaseFlash() {
    restartAnim(els.blueFlash, 'flash-anim');
  },

  // Surge phase popup. Perfect = big violet banner (climbs with the streak);
  // minor = a smaller "PHASE" tag; assisted = the one-time teaching coach line.
  phasePopup(points, perfect, streak = 0, assisted = false) {
    if (assisted) { this._popup2('Like that! — roll to phase', 'orange'); return; }
    if (perfect) {
      this._popup(streak > 1 ? `PERFECT PHASE ×${streak}! +${points}` : `PERFECT PHASE! +${points}`, 'phase');
    } else {
      this._popup2(`PHASE +${points}`, 'orange');
    }
  },

  nearMissPopup(points) {
    this._popup2(`NEAR MISS +${points}`, 'orange');
  },

  rollPopup(points) {
    this._popup2(`BARREL ROLL +${points}`, 'gold');
  },

  gatePopup(points) {
    this._popup(`THREADED +${points}`, 'cyan');
  },

  milestonePopup(metres) {
    const b = els.milestoneBanner;
    if (!b) { this._popup2(`${metres} m!`, 'gold'); return; }
    b.textContent = `${metres} m!`;
    b.classList.remove('ms-anim');
    void b.offsetWidth;
    b.classList.add('ms-anim');
  },

  recordPopup() {
    this._popup('★ NEW RECORD ★', 'gold');
  },

  // First-ever Dragon Surge: a one-shot, non-blocking flourish (the run never
  // pauses). Reuses the milestone banner's pop; the surge hint line and the
  // sky-fire (feverStart) carry the rest, and recap.js names it at run end.
  surgeFlourish() {
    const b = els.milestoneBanner;
    if (!b) { this._popup('⚡ DRAGON SURGE ⚡', 'gold'); return; }
    b.textContent = '⚡ DRAGON SURGE ⚡';
    b.classList.remove('ms-anim');
    void b.offsetWidth;
    b.classList.add('ms-anim');
  },

  biomePopup(name) {
    this._popup(`— ${name} —`, 'cyan');
  },

  radioPopup(name) {
    this._popup2(`♪ Now playing: ${name}`, 'gold');
  },

  // Live personal-record break (throttled by records.js)
  newBestPopup(label, value) {
    this._popup2(`★ NEW BEST ${label}: ${value} ★`, 'gold');
    sfx.record();
  },

  goldEmberPopup(value) {
    this._popup2(`✦ GOLDEN EMBER +◆${value} ✦`, 'gold');
  },

  pbMarkerPopup(bonus) {
    this._popup(`⟡ PAST YOUR BEST FLIGHT +◆${bonus} ⟡`, 'gold');
  },

  // Feat toast: short in-flight unlock; Pilot and recap carry the details.
  featToast(name, reward) {
    els.featToast.innerHTML = `${ICONS.feat} FEAT UNLOCKED <b>◆${reward}</b>`;
    restartAnim(els.featToast, 'feat-toast-anim');
  },

  // Onboarding hint line (hints.js drives show/hide)
  showHint(text) {
    els.hint.textContent = text;
    els.hint.classList.add('on');
  },

  hideHint() {
    els.hint.classList.remove('on');
  },

  // Paused gesture tutorial overlay (gestureTutorial.js drives show/hide while
  // the run is frozen). A dim backdrop keeps the frozen scene visible; an
  // animated finger (touch) or key-caps (desktop) demonstrate the move, with one
  // instruction line. Non-blocking to input — the gesture itself resumes play.
  // spec: { gesture: 'steer'|'boost'|'roll', touch, text, onSkip }
  showGesture(spec) {
    const g = spec.gesture;
    // Premium hand: warm gradient fill + soft glow (CSS), with a luminous
    // contact orb + ripple rings at the fingertip.
    const FINGER = '<svg class="gx-finger" viewBox="0 0 44 60" width="48" height="64" aria-hidden="true">' +
      '<defs><linearGradient id="gxf" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#fff7ea"/><stop offset="1" stop-color="#ffd9a0"/></linearGradient></defs>' +
      '<path d="M18 9a4.5 4.5 0 019 0v20l5.6 1c4.4.8 7.6 4.2 7.6 9.4v9.1a5.4 5.4 0 01-5.4 5.4H19.2c-3.2 0-5.7-1.1-7.7-4.2L4.2 48c-2.1-3.1-1-6.3 2.2-7.5 2.2-.8 4.3.1 6.2 2.2l3 3.2V9z" ' +
      'fill="url(#gxf)" stroke="rgba(90,48,18,0.5)" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    const TOUCH = '<span class="gx-touch"><i></i><i></i></span>';
    const KEY = (k) => `<span class="gx-key">${k}</span>`;
    let demo;
    if (spec.touch) {
      // One finger for steer; a held "anchor" orb + the acting finger for the
      // second-finger boost/roll moves.
      const anchor = (g === 'boost' || g === 'roll') ? '<span class="gx-anchor"></span>' : '';
      demo = `<div class="gx-stage gx-${g}">${anchor}<span class="gx-hand">${TOUCH}${FINGER}</span>` +
        (g === 'boost' ? '<span class="gx-ring"></span>' : '') +
        (g === 'roll' ? '<span class="gx-trail"></span>' : '') + '</div>';
    } else {
      const keys = g === 'steer' ? `${KEY('A')}${KEY('D')}`
        : g === 'boost' ? KEY('SPACE')
        : `${KEY('A')}${KEY('A')}`; // double-tap
      demo = `<div class="gx-stage gx-keys gx-${g}">${keys}</div>`;
    }
    els.gestureOverlay.innerHTML = `<div class="gx-card">${demo}<div class="gx-text">${spec.text}</div>` +
      `<button class="gx-skip" id="gx-skip">SKIP TUTORIAL ›</button></div>`;
    els.gestureOverlay.classList.add('on');
    const skip = els.gestureOverlay.querySelector('#gx-skip');
    if (skip && spec.onSkip) {
      const fire = (e) => { e.preventDefault(); e.stopPropagation(); spec.onSkip(); };
      skip.addEventListener('click', fire);
      skip.addEventListener('pointerup', fire); // iOS reliability
    }
  },

  hideGesture() {
    els.gestureOverlay.classList.remove('on');
    els.gestureOverlay.innerHTML = '';
  },

  // Purchase/unlock celebration: the four-phase staging (dim+spotlight →
  // overshoot reveal → confetti+stamp → afterglow). One reusable overlay,
  // built as a SIBLING of #screen so shop re-renders can't destroy it.
  // spec: { kind, tier: 'big'|'small', title, subtitle, glyph, renderPreview }
  celebrate(spec) {
    const big = spec.tier !== 'small';
    celebrateShownAt = performance.now();
    const kicker = {
      dragon: 'NEW DRAGON', rider: 'NEW RIDER',
      track: 'NEW STATION', generic: 'UNLOCKED',
      ascension: 'ASCENDED', flightmark: 'NEW TRAIL', radiance: 'RADIANCE',
    }[spec.kind] || 'UNLOCKED';
    els.celebrate.innerHTML = `
      ${big ? '<div class="celebrate-burst"></div>' : ''}
      <div class="celebrate-card${big ? '' : ' small'}">
        <div class="celebrate-kicker">${kicker}</div>
        ${spec.renderPreview
          ? '<canvas class="celebrate-canvas" width="150" height="150"></canvas>'
          : `<div class="celebrate-glyph">${spec.glyph || '◆'}</div>`}
        <div class="celebrate-name">${spec.title}</div>
        ${spec.subtitle ? `<div class="celebrate-sub">${spec.subtitle}</div>` : ''}
        <button class="btn-primary" id="celebrate-continue">CONTINUE</button>
      </div>
      <div class="celebrate-confetti"></div>`;
    const confetti = els.celebrate.querySelector('.celebrate-confetti');
    const COLORS = ['#ffe27a', '#ffb84d', '#7fe0ff', '#ff9540', '#fff6dd'];
    const n = big ? 24 : 12;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 90 + Math.random() * 160;
      p.style.setProperty('--dx', `${Math.round(Math.cos(ang) * dist)}px`);
      p.style.setProperty('--dy', `${Math.round(Math.sin(ang) * dist - 70)}px`);
      p.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
      p.style.animationDelay = `${320 + Math.round(Math.random() * 140)}ms`;
      p.style.background = COLORS[i % COLORS.length];
      confetti.appendChild(p);
    }
    if (spec.renderPreview) spec.renderPreview(els.celebrate.querySelector('.celebrate-canvas'));
    els.celebrate.classList.add('visible');
    if (big) sfx.levelUp(); else sfx.missionComplete();
    els.celebrate.querySelector('#celebrate-continue').onclick = (e) => {
      e.stopPropagation();
      this.dismissCelebrate();
    };
  },

  // Returns true while the overlay owns input (dismissed OR tap eaten by the
  // min-show window) — main.js's keydown handler checks this first so Enter
  // can't launch a run underneath the overlay.
  dismissCelebrate() {
    if (!els.celebrate.classList.contains('visible')) return false;
    if (performance.now() - celebrateShownAt < 600) return true; // eaten, not dismissed
    els.celebrate.classList.remove('visible');
    // Clear after the fade so the canvas leaves the DOM (preview.js's
    // isConnected sweep auto-disposes the turntable).
    setTimeout(() => {
      if (!els.celebrate.classList.contains('visible')) els.celebrate.innerHTML = '';
    }, 220);
    return true;
  },

  showReviveOffer() {
    els.revive.classList.add('visible');
    let remaining = 3;
    els.reviveCount.textContent = remaining;
    clearInterval(reviveTimer);
    reviveTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        this.hideReviveOffer();
        handlers.onGiveUp && handlers.onGiveUp();
      } else {
        els.reviveCount.textContent = remaining;
      }
    }, 1000);
  },

  hideReviveOffer() {
    clearInterval(reviveTimer);
    reviveTimer = null;
    els.revive.classList.remove('visible');
  },

  comboBreak() {
    this._popup('COMBO LOST', 'red');
    // Soft red edge pulse — the damage vignette at lower stakes.
    els.vignette.classList.remove('lethal');
    restartAnim(els.vignette, 'flash-anim');
  },

  orbFlash() {
    this._popup('SPEED SURGE!', 'cyan');
    restartAnim(els.blueFlash, 'flash-anim');
  },

  feverStart() {
    this._popup('DRAGON SURGE!', 'fever');
  },

  damageFlash(lethal = false) {
    els.vignette.classList.toggle('lethal', lethal);
    restartAnim(els.vignette, 'flash-anim');
  },

  _popup(text, color) {
    els.popup.textContent = text;
    els.popup.dataset.color = color;
    restartAnim(els.popup, 'popup-anim');
  },

  _popup2(text, color) {
    els.popup2.textContent = text;
    els.popup2.dataset.color = color;
    restartAnim(els.popup2, 'popup2-anim');
  },

  showScreen(type) {
    closeShowcase(); // stop any inline hero-stage turntable from the previous screen
    const score = Math.floor(game.score);
    const dist  = Math.floor(game.distance);
    let html = '';
    // Freshness: animate the screen in only on genuine navigation — tab
    // switches re-render the SAME type and must not re-flash.
    const fresh = !els.screen.classList.contains('visible') || lastScreen !== type;
    // Leaving the shop: restore the equipped dragon to the live menu scene (browsing
    // swapped the inspected dragon into it).
    if (lastScreen === 'shop' && type !== 'shop' && handlers.onRestoreMenuDragon) handlers.onRestoreMenuDragon();
    lastScreen = type;

    if (type === 'start') {
      // The hero menu: a clean stage for the live dragon. One primary action
      // (TAKE OFF) over the wordmark; the meta lives behind a compact top bar +
      // bottom icon rail, revealed progressively so a brand-new pilot sees only
      // the one decision they need to make.
      const touch = isTouch();
      const runs = saveData.stats.runs;
      const cold = runs === 0;            // brand-new pilot — strip to one choice
      const showQuests = runs >= 2;       // missions / weekly objectives
      const showDeep = runs >= 3;         // DAILY + PILOT long-horizon meta
      const title = equippedTitleName();

      // Drifting ember motes behind the hero — pure decoration (transform/opacity
      // only, GPU-cheap), regenerated each time the screen mounts.
      const motes = cold ? 10 : 16;
      const embers = Array.from({ length: motes }, () => {
        const gold = Math.random() > 0.4;
        return `<span style="left:${(Math.random() * 100).toFixed(1)}%;` +
          `--d:${(Math.random() * 9).toFixed(2)}s;--dur:${(7 + Math.random() * 8).toFixed(2)}s;` +
          `--sz:${(2 + Math.random() * 4).toFixed(1)}px;--dx:${(Math.random() * 44 - 22).toFixed(0)}px;` +
          `--c:${gold ? '#ffce6a' : '#7fe6ff'}"></span>`;
      }).join('');

      // Top bar (wallet + settings gear) — absent on the cold first screen.
      const topbar = cold ? '' : `
        <div class="hero-topbar">
          <div class="hero-wallet">
            <div class="meta-chip"><span class="ember-ico">${EMBER_ICON}</span> <b>${saveData.embers}</b></div>
            ${game.highScore ? `<div class="meta-chip">BEST <b>${game.highScore}</b></div>` : ''}
          </div>
          <button class="hero-gear" id="btn-settings" title="Settings" aria-label="Settings">${ICONS.settings}</button>
        </div>`;

      // Bottom icon rail — one stable frame whose slots reveal in place. A newly
      // unlocked system animates in and wears a NEW pill until first opened, so
      // the reveal is announced, not a silent reflow (WS0).
      const newPilot  = !saveData.flags.seenPilotIntro;
      const newQuests = !saveData.flags.seenQuestsIntro;
      const newShop   = !saveData.flags.seenShopIntro;
      const newDaily  = !saveData.flags.seenDailyIntro;
      const railBtn = (id, icon, label, due, isNew) =>
        `<button class="hero-rail-btn${isNew ? ' rail-new' : ''}" id="${id}">${icon}<span>${label}</span>${
          isNew ? '<span class="rail-new-pill">NEW</span>' : badgeHtml(due)}</button>`;
      let rail = '';
      if (!cold) {
        let items = '';
        if (showDeep)   items += railBtn('btn-pilot',  ICONS.pilot,  'PILOT',  pilotBadgeDue(), newPilot);
        if (showQuests) items += railBtn('btn-quests', ICONS.weekly, 'QUESTS', questsBadgeDue(), newQuests);
        items += railBtn('btn-shop', ICONS.shop, 'SHOP', shopBadgeDue(), newShop);
        if (showDeep)   items += railBtn('btn-daily',  ICONS.daily,  'DAILY',  dailyBadgeDue(), newDaily);
        rail = `<nav class="hero-rail">${items}</nav>`;
      }

      const sub = cold
        ? 'Thread rings. Chase the surge.'
        : (touch ? 'Drag to steer · hold a second finger to boost · swipe it sideways to barrel roll'
                 : 'WASD/Arrows to steer · SPACE to boost · double-tap a direction to barrel roll');

      html = `
        ${topbar}
        <div class="hero-embers" aria-hidden="true">${embers}</div>
        <div class="hero-core">
          ${game.challengeScore ? `<p class="challenge">CHALLENGE — beat ${game.challengeScore} points!</p>` : ''}
          ${startNotice ? `<p class="start-notice">${startNotice}</p>` : ''}
          ${(!cold && title) ? `<button class="hero-title-chip" id="chip-title">«${title}»</button>` : ''}
          <h1 class="wordmark hero-wordmark">DRAGON DRIFT</h1>
          <button class="btn-primary hero-cta breathe" id="btn-start"><span class="cta-glyph" aria-hidden="true">➤</span>TAKE OFF</button>
          <p class="hero-sub">${sub}</p>
          <p class="action-key">${touch ? 'or tap anywhere to fly' : 'or press ENTER to fly'}</p>
        </div>
        ${rail}
        ${iosInstallHint()}`;

    } else if (type === 'quests') {
      // Objectives panel (reached from the QUESTS rail icon): the missions,
      // weekly trials and NEXT UP goal that used to crowd the start screen.
      const missions = activeMissions().map((m) => `
        <div class="mission-card${m.progress >= m.def.target ? ' done' : ''}">
          <div class="mission-info">
            <div class="mission-label">${m.def.label}</div>
            ${barHtml(m.progress / m.def.target)}
            <div class="mission-prog">${Math.min(m.progress, m.def.target)} / ${m.def.target}</div>
          </div>
          <div class="mission-reward">◆ ${m.def.reward}</div>
        </div>`).join('');
      const trials = weeklyTrials();
      const feather = saveData.weekly.feather;
      const doneCount = trials.filter((t) => t.done).length;
      const nextUp = selectNextUp();
      html = `
        <div class="screen-topbar">
          <span class="topbar-title">QUESTS</span>
          <button class="topbar-close" id="btn-back" title="Back">✕</button>
        </div>
        <p class="nextup-line">${nextUp.icon} NEXT UP — ${nextUp.label} <span class="nextup-line-sub">${nextUp.sub}</span></p>
        <div class="mission-list">${missions}</div>
        <div class="weekly-strip expanded">
          <div class="weekly-head">${ICONS.weekly} WEEKLY TRIALS <span class="weekly-count${doneCount ? ' some' : ''}">${doneCount}/${trials.length} ✓</span>${feather ? ' <span class="feather" title="Phoenix Feather — bridges one missed streak day">🪶</span>' : ''}</div>
          <div class="weekly-rows">
          ${trials.map((t) => `
            <div class="weekly-row${t.done ? ' done' : ''}">
              <span class="weekly-label">${t.def.label}</span>
              ${t.done ? '<span class="weekly-done-badge">✓ COMPLETE</span>' : barHtml(t.progress / t.def.target)}
              <span class="weekly-reward${t.done ? ' earned' : ''}">${t.done ? '✓ ' : ''}◆${t.def.reward}</span>
            </div>`).join('')}
          </div>
        </div>
        <p class="share-hint">Quests pay out when a run ends · weeklies reset Monday (UTC).</p>`;

    } else if (type === 'daily') {
      // Daily Challenge panel (reached from the DAILY rail icon).
      const daily = saveData.daily;
      const dailyDone = daily.date === todayUTC() && daily.played;
      const dmod = todaysDailyMod();
      html = `
        <div class="screen-topbar">
          <span class="topbar-title">DAILY CHALLENGE</span>
          <button class="topbar-close" id="btn-back" title="Back">✕</button>
        </div>
        <div class="daily-card daily-panel">
          <div class="daily-info">
            <div class="daily-title">${ICONS.daily} TODAY'S TWIST</div>
            <div class="daily-mod"><span class="daily-mod-glyph">${dmod.glyph}</span> ${dmod.name}</div>
            <div class="daily-sub">${dmod.brief}</div>
            ${dailyDone ? `<div class="daily-done">✓ Cleared today — best ${daily.bestScore}. New twist at UTC midnight.</div>` : ''}
          </div>
          ${daily.streak > 1 ? `<div class="daily-streak">🔥 ${daily.streak}</div>` : ''}
          <button class="btn-secondary btn-daily${dailyDone ? '' : ' glow'}" id="btn-fly-daily">FLY DAILY</button>
        </div>
        <p class="share-hint">A fresh modifier every day · your daily score stays out of your main best.</p>`;

    } else if (type === 'shop') {
      // Opening the shop clears its badge: the wallet watermark records what
      // you could see was affordable RIGHT NOW (honesty invariant).
      if (saveData.ui.shopSeenEmbers !== saveData.embers) {
        saveData.ui.shopSeenEmbers = saveData.embers;
        persist();
      }
      const hex = (n) => '#' + n.toString(16).padStart(6, '0');
      const tabBtn = (key, label) =>
        `<button class="seg-btn${shopTab === key ? ' sel' : ''}" data-shoptab="${key}">${label}</button>`;
      let body = '';

      if (shopTab === 'dragons') {
        // Hero character-select — a big rotatable hero, a thumbnail RAIL to switch
        // dragon, a segmented form selector, lean stats + one CTA. The identity /
        // forms / stats / CTA are filled in by wireHeroSelect once the screen builds.
        const keysAll = Object.keys(DRAGONS);
        if (!heroKey || !DRAGONS[heroKey]) heroKey = saveData.skins.equipped || keysAll[0];
        const rail = keysAll.map((k) => {
          const d = DRAGONS[k];
          const owned = saveData.skins.owned.includes(k);
          const equipped = saveData.skins.equipped === k;
          const tier = owned ? getFormPref(k) : maxTierFor(k);
          const fr = formRarity(tier, d.maxRarity);
          return `<div class="hero-thumb${k === heroKey ? ' on' : ''}${owned ? '' : ' locked'}${equipped ? ' equip-dot' : ''}" data-hero="${k}" style="--hthumb:${hex(d.apexSeam ?? d.eye)};--tr:${FR_ACCENT[fr] || '#fff'}">
              <canvas class="hero-thumb-canvas" data-key="${k}" data-tier="${tier}" width="120" height="120"></canvas>
              <span class="tgem"></span></div>`;
        }).join('');
        body = `<div class="hero-select" id="hero-select">
          <div class="hero-stage" id="hero-stage">
            <div class="hero-gem" id="hero-gem"></div>
            <canvas class="hero-canvas" id="hero-canvas" width="640" height="640"></canvas>
            <div class="hero-pedestal"></div>
            <div class="hero-rothint">⟲ drag to rotate</div>
          </div>
          <div class="hero-ident"><div class="hero-name" id="hero-name"></div><div class="dpick-sub" id="hero-sub"></div></div>
          <div class="hero-forms" id="hero-forms"></div>
          <div class="hero-stats" id="hero-stats"></div>
          <div class="dpick-cta" id="hero-cta"></div>
          <div class="dpick-rail" id="hero-rail">${rail}</div>
          <button class="revive-chip" id="buy-revive"><b>✦ Revive Token</b><span>◆ 250 · you have ${saveData.revives}</span></button>
        </div>`;

      } else if (shopTab === 'riders') {
        const cards = Object.entries(RIDERS).map(([key, r]) => {
          const owned = saveData.riders.owned.includes(key);
          const equipped = saveData.riders.equipped === key;
          const lux = r.glowColor ? ` lux" style="--aura: rgba(${r.glowColor},0.4)` : '';
          return `
            <div class="skin-card${equipped ? ' equipped' : ''}${owned ? '' : ' locked'}${lux}" data-rider="${key}">
              <canvas class="skin-preview" data-kind="rider" data-key="${key}" width="150" height="150"></canvas>
              <div class="skin-name">${r.name}</div>
              <div class="skin-title">${r.title}</div>
              <div class="skin-perk">${r.emberBonus > 0 ? `◆ +${Math.round(r.emberBonus * 100)}% EMBERS EARNED` : 'STANDARD PAYOUT'}</div>
              <div class="skin-cost ${owned ? 'owned' : ''}">${equipped ? 'EQUIPPED' : owned ? 'TAP TO EQUIP' : `◆ ${r.cost}`}</div>
            </div>`;
        }).join('');
        body = `<div class="shop-grid">${cards}</div>
          <p class="share-hint">Riders pay a bonus on every ember banked at the end of a run.</p>`;

      } else if (shopTab === 'music') {
        // One accent color per station — drives disc border + ON AIR badge tint
        const TRACK_ACCENTS = [
          '#4ab8ff', '#00d4cc', '#ff8800', '#c880ff', '#ff00cc',
          '#0088ff', '#ffd800', '#ff4488', '#8800ff', '#00ffff',
          '#ff2222', '#ffaa00', '#aa66ff', '#88ff88', '#00eeff',
          '#ffcc00', '#00ccff', '#ff5500', '#ffdd00', '#44cc88',
          '#ff6600', '#ffaaff',
        ];
        const eqBars = '<div class="eq-bars"><span></span><span></span><span></span><span></span></div>';
        const cards = TRACKS.map((t, i) => {
          const owned = trackUnlocked(i);
          const playing = music.trackIndex === i;
          const accent = TRACK_ACCENTS[i] || '#ffd86a';
          return `
            <div class="skin-card track-card${playing ? ' equipped' : ''}${owned ? '' : ' locked'}"
                 data-track-i="${i}" style="--accent:${accent}">
              <div class="track-disc${playing ? ' spin' : ''}">♪</div>
              <div class="skin-name">${t.name}</div>
              <div class="skin-title">${t.desc} · ${t.bpm} BPM</div>
              <div class="skin-cost ${owned ? 'owned' : ''}">${playing ? `${eqBars} ON AIR` : owned ? 'TAP TO PLAY' : `◆ ${t.cost}`}</div>
            </div>`;
        }).join('');
        body = `<div class="shop-grid">${cards}</div>
          <p class="share-hint">New stations join the radio rotation everywhere — pause menu, N / [ ] keys.</p>`;

      } else { // style — flightmark trail cosmetics
        const activeId = equippedFlightmark();
        const defaultActive = activeId === '';
        const defaultCard = `
          <div class="skin-card${defaultActive ? ' equipped' : ''}" data-flightmark="">
            <canvas class="trail-preview" data-mark="" width="140" height="104"></canvas>
            <div class="skin-name">Dragon's Colors</div>
            <div class="skin-title">Default trail</div>
            <div class="skin-cost owned">${defaultActive ? 'ACTIVE' : 'TAP TO EQUIP'}</div>
          </div>`;
        const markCards = FLIGHTMARKS.map(mark => {
          const owned = flightmarkOwned(mark.id);
          const active = activeId === mark.id;
          return `
            <div class="skin-card${active ? ' equipped' : ''}${owned ? '' : ' locked'}" data-flightmark="${mark.id}">
              <canvas class="trail-preview" data-mark="${mark.id}" width="140" height="104"></canvas>
              <div class="skin-name">${mark.name}</div>
              <div class="skin-title">Trail cosmetic</div>
              <div class="skin-cost ${owned ? 'owned' : ''}">${active ? 'ACTIVE' : owned ? 'TAP TO EQUIP' : `◆ ${mark.cost}`}</div>
            </div>`;
        }).join('');
        body = `<div class="shop-grid">${defaultCard}${markCards}</div>
          <p class="share-hint">Trail marks are purely cosmetic — fly any color you like.</p>`;
      }

      html = `
        <div class="screen-topbar">
          <span class="topbar-title">SHOP</span>
          <div class="meta-chip"><span class="ember-ico">${EMBER_ICON}</span> <b>${saveData.embers}</b></div>
          <button class="topbar-close" id="btn-back" title="Back">✕</button>
        </div>
        <div class="shop-scroll">
          <div class="seg-row shop-tabs" style="margin-top:12px">${tabBtn('dragons', `${ICONS.dragon} DRAGONS`)}${tabBtn('riders', `${ICONS.rider} RIDERS`)}${tabBtn('music', `${ICONS.music} MUSIC`)}${tabBtn('style', `${ICONS.style} STYLE`)}</div>
          ${body}
          <p class="share-hint" id="shop-hint"></p>
        </div>`;

    } else if (type === 'settings') {
      const q = saveData.settings.qualityOverride;
      const seg = (val, label) =>
        `<button class="seg-btn${q === val ? ' sel' : ''}" data-q="${val === null ? 'auto' : val}">${label}</button>`;
      const md = saveData.settings.modelDetail;
      const mdSeg = (val, label) =>
        `<button class="seg-btn${md === val ? ' sel' : ''}" data-md="${val === null ? 'auto' : val}">${label}</button>`;
      const assistSeg = (id, on, bonusPct) => `
        <div class="seg-row">
          <button class="seg-btn${on ? ' sel' : ''}" data-assist="${id}" data-val="1">ON</button>
          <button class="seg-btn${on ? '' : ' sel'}" data-assist="${id}" data-val="0">OFF — SCORE +${bonusPct}%</button>
        </div>`;
      html = `
        <h1>SETTINGS</h1>
        <div class="settings-group">
          <div class="settings-label">GRAPHICS QUALITY</div>
          <div class="seg-row">${seg(null, 'AUTO')}${seg(0, 'HIGH')}${seg(1, 'MEDIUM')}${seg(2, 'LOW')}</div>
        </div>
        <div class="settings-group">
          <div class="settings-label">MODEL DETAIL</div>
          <p class="sub">Dragon geometry density. AUTO matches your graphics tier.</p>
          <div class="seg-row">${mdSeg(null, 'AUTO')}${mdSeg('high', 'HIGH')}${mdSeg('ultra', 'ULTRA')}</div>
        </div>
        <div class="settings-group">
          <div class="settings-label">TARGET RETICLE</div>
          ${assistSeg('reticle', saveData.settings.reticle, Math.round(CONFIG.reticleOffBonus * 100))}
        </div>
        <div class="settings-group">
          <div class="settings-label">LAST-CHANCE SLOW-MO</div>
          ${assistSeg('slowMo', saveData.settings.slowMo, Math.round(CONFIG.slowMoOffBonus * 100))}
        </div>
        <div class="settings-group">
          <div class="settings-label">GLIDE ASSIST</div>
          <p class="sub">Auto-flies to each ring and collects embers.</p>
          <div class="seg-row">
            <button class="seg-btn${saveData.settings.glideAssist ? ' sel' : ''}" data-assist="glideAssist" data-val="1">ON — SCORE −${Math.round((1 - CONFIG.glideAssistScoreMult) * 100)}%</button>
            <button class="seg-btn${saveData.settings.glideAssist ? '' : ' sel'}" data-assist="glideAssist" data-val="0">OFF</button>
          </div>
        </div>
        ${isTouch() ? '' : `<div class="settings-group">
          <div class="settings-label">MOUSE STEERING</div>
          <p class="sub">Hold left-click to steer; right-click or Space boosts.</p>
          <div class="seg-row">
            <button class="seg-btn${saveData.settings.mouseSteer ? ' sel' : ''}" data-assist="mouseSteer" data-val="1">ON</button>
            <button class="seg-btn${saveData.settings.mouseSteer ? '' : ' sel'}" data-assist="mouseSteer" data-val="0">OFF</button>
          </div>
        </div>`}
        <div class="settings-group">
          <div class="settings-label">DRAGON RADIO</div>
          <p class="sub">${isTouch() ? 'Buy more stations in the shop.' : 'Press N in flight to cycle stations. Buy more in the shop.'}</p>
          <div class="seg-row radio-segs">${TRACKS.map((t, i) => trackUnlocked(i)
            ? `<button class="seg-btn${music.trackIndex === i ? ' sel' : ''}" data-track="${i}">${t.name.toUpperCase()}</button>`
            : `<button class="seg-btn locked" disabled title="Buy in the shop">🔒 ${t.name.toUpperCase()}</button>`).join('')}</div>
        </div>
        <div class="settings-group">
          <div class="settings-label">AUDIO</div>
          <p class="sub" style="font-size:13px; opacity:0.75">Music &amp; sound volume live in the pause menu (Esc during flight).</p>
        </div>
        <div class="settings-group">
          <div class="settings-label">DEV MODE</div>
          <p class="sub">Unlock every dragon, rider, and style at max form for testing. Turn off to restore your real save.</p>
          <div class="seg-row">
            <button class="seg-btn${saveData.settings.dev ? ' sel' : ''}" data-dev="1">ON</button>
            <button class="seg-btn${saveData.settings.dev ? '' : ' sel'}" data-dev="0">OFF</button>
          </div>
        </div>
        <div class="settings-group">
          <div class="settings-label">DATA</div>
          <div class="seg-row"><button class="seg-btn" id="btn-reset-save">RESET ALL PROGRESS</button></div>
        </div>
        <div class="action-row"><button class="btn-secondary" id="btn-back">← BACK</button></div>`;

    } else if (type === 'gameover') {
      // Run Recap v2 lives in recap.js (count-up, record chips, earnings
      // ledger, NEXT UP) — ui.js keeps screen ownership.
      html = buildRecapHtml(score, dist, { isTouch: isTouch(), ICONS });

    } else if (type === 'pilot') {
      // Opening PILOT clears its badge: watermark = everything now seen.
      if (saveData.ui.seenFeats !== saveData.feats.unlocked.length ||
          saveData.ui.seenTitles !== saveData.titles.owned.length) {
        saveData.ui.seenFeats = saveData.feats.unlocked.length;
        saveData.ui.seenTitles = saveData.titles.owned.length;
        persist();
      }
      html = buildPilotHtml(pilotTab);
    }

    // First-open coachmark: the first time a revealed meta system is opened,
    // a one-line explainer slides in under its top bar, then never again (WS0).
    const coachText = {
      shop:   'Spend embers here — new dragons, riders, trails and radio stations.',
      quests: 'Quests and weekly trials pay out when a run ends. No extra effort.',
      daily:  'A fresh modifier every day. Your daily score stays out of your main best.',
      pilot:  'Level up, claim the feats you’ve earned, and equip a title.',
    }[type];
    if (coachText) {
      const flagKey = 'seen' + type[0].toUpperCase() + type.slice(1) + 'Intro';
      if (!saveData.flags[flagKey]) {
        saveData.flags[flagKey] = true;
        persist();
        emit('systemOpened', { system: type });
        const coach = `<p class="screen-coach">${coachText}</p>`;
        html = html.includes('</div>') ? html.replace('</div>', '</div>' + coach) : coach + html;
      }
    }

    els.screen.innerHTML = html;
    els.screen.classList.add('visible');
    document.body.classList.add('screen-open');
    // The hero start screen runs its own bespoke entrance (see .hero-* CSS), so
    // the generic per-child stagger is reserved for other dense screens.
    els.screen.classList.remove('stagger');
    els.screen.classList.toggle('hero-screen', type === 'start');
    // The whole shop (every tab) shows the live astral biome behind it, so de-dim it.
    els.screen.classList.toggle('shop-screen', type === 'shop');
    // The shop scrolls inside a dedicated container (not the screen itself), so a
    // tall hero layout can't turn the whole screen into a janky scroll surface
    // that mis-fires taps as "close" on mobile.
    els.screen.classList.toggle('scroll-screen', type === 'shop');
    els.screen.classList.toggle('hero-intro', type === 'start' && fresh && !saveData.flags.seenIntro);
    if (fresh) restartAnim(els.screen, 'screen-anim');
    // Title screen → the catchy menu theme (no-ops until audio is unlocked, and
    // bows out once the player has picked a Dragon Radio station).
    if (type === 'start') music.startMenuTheme();
    pauseSubscreen = returnScreen === 'pause' && (type === 'shop' || type === 'settings' || type === 'pilot');
    // Live 3D turntables on the dragon/rider cards; animated 2D trail previews
    if (type === 'shop') {
      // Previews must never block button wiring below — a failure here used to
      // leave the tabs and ✕ dead. Guard so wireScreenButtons always runs.
      try {
        attachTrailPreviews(els.screen, FLIGHTMARKS);
        attachPreviews(els.screen, (kind, key) => {
          if (kind !== 'dragon') return RIDERS[key];
          const def = DRAGONS[key];
          if (!def) return null;
          const owned = saveData.skins.owned.includes(key);
          const tier = owned ? getFormPref(key) : maxTierFor(key);
          return ascendedDef(def, tier, radianceRank(key));
        });
      } catch (e) {
        console.error('shop preview attach failed', e);
      }
    }
    // Tapping a blank spot on the shop/settings/pilot screen goes back — blank
    // Tapping a blank spot goes back. ONLY the true screen backdrop counts —
    // NOT the shop's scroll container: iOS retargets a tap's synthesized `click`
    // onto the momentum scroller (`-webkit-overflow-scrolling: touch`), so
    // including `.shop-scroll` here made every form/dragon tap close the shop.
    // Hero-select taps are handled on pointerup (below), which doesn't retarget.
    let backDownX = 0, backDownY = 0;
    els.screen.addEventListener('pointerdown', (e) => { backDownX = e.clientX; backDownY = e.clientY; }, true);
    els.screen.onclick = (e) => {
      if (e.target !== els.screen) return;
      if (Math.hypot(e.clientX - backDownX, e.clientY - backDownY) > 10) return; // a scroll/drag, not a tap
      if (type === 'shop' || type === 'settings' || type === 'pilot' ||
          type === 'quests' || type === 'daily') {
        if (returnScreen === 'pause') ui.showPauseOverlay();
        else ui.showScreen(returnScreen);
      }
    };
    if (type === 'gameover') {
      wireShareButtons(score, dist);
      this.recapRevealMs = wireRecap(els.screen, handlers);
    }
    if (type === 'pilot') {
      wirePilot(els.screen, {
        onTab: (tab) => { pilotTab = tab; ui.showScreen('pilot'); },
        onClaim: (id, btn) => {
          const reward = claimFeat(id);
          if (reward <= 0) return;
          sfx.featUnlock(); // satisfying proud claim chime
          // A small "+◆" floats up off the button (Web Animations — no CSS dep),
          // then the screen refreshes so the row flips to claimed + wallet updates.
          if (btn) {
            const fly = document.createElement('div');
            fly.textContent = `+◆${reward}`;
            fly.style.cssText = 'position:absolute;left:50%;top:0;transform:translateX(-50%);color:#ffd86a;font-weight:800;pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,.6);z-index:5';
            btn.style.position = 'relative';
            btn.appendChild(fly);
            fly.animate([
              { transform: 'translate(-50%, 4px)', opacity: 0 },
              { transform: 'translate(-50%, -6px)', opacity: 1, offset: 0.25 },
              { transform: 'translate(-50%, -30px)', opacity: 0 },
            ], { duration: 650, easing: 'ease-out' });
          }
          setTimeout(() => { if (lastScreen === 'pilot') ui.showScreen('pilot'); }, 480);
        },
        onEquipTitle: (id) => {
          saveData.titles.equipped = id;
          persist();
          ui.showScreen('pilot');
          // Quiet celebration: a shine sweep across the newly worn title.
          const sel = els.screen.querySelector('.title-row.sel');
          if (sel) sel.classList.add('title-shine');
          sfx.ember(3);
        },
      });
    }
    wireScreenButtons(type);
  },

  // Duration of the recap's reveal queue (main.js delays blank-tap arming).
  recapRevealMs: 0,

  // One-shot notice on the next start screen (welcome-back gift, refund).
  // Cleared after first render.
  setStartNotice(text) {
    startNotice = text;
  },

  hideScreen() {
    pauseSubscreen = false;
    els.screen.classList.remove('visible');
    document.body.classList.remove('screen-open');
  },

  // Pause hub, AAA-clean: resume up top, an at-a-glance stats strip, then
  // one panel with three tabs (AUDIO / ASSISTS / QUESTS) so nothing fights
  // for attention, and the shop on a single footer row.
  showPauseOverlay() {
    pauseSubscreen = false;
    // Same freshness rule as showScreen: pause-tab clicks re-render without
    // re-animating ('pause' is routing-inert in inSubscreen()).
    const fresh = !els.screen.classList.contains('visible') || lastScreen !== 'pause';
    lastScreen = 'pause';
    const a = saveData.audio;
    const hcBonus = Math.round((game.scoreMult - 1) * 100);
    const tabBtn = (key, label) =>
      `<button class="seg-btn${pauseTab === key ? ' sel' : ''}" data-pmtab="${key}">${label}</button>`;

    let body = '';
    if (pauseTab === 'audio') {
      body = `
        <div class="radio-row">
          <button class="mute-btn" id="pm-prev" title="Previous station">${ICONS.prev}</button>
          <div class="radio-name" id="pm-track">♪ ${music.trackName}</div>
          <button class="mute-btn" id="pm-next" title="Next station">${ICONS.next}</button>
        </div>
        <div class="vol-row">
          <button class="mute-btn${musicMuted ? ' off' : ''}" id="pm-music-mute">${musicMuted ? ICONS.musicOff : ICONS.music}</button>
          <span class="vol-lbl">MUSIC</span>
          <input type="range" id="pm-music-vol" min="0" max="100" value="${Math.round(a.musicVol * 100)}">
        </div>
        <div class="vol-row">
          <button class="mute-btn${sfxMuted ? ' off' : ''}" id="pm-sfx-mute">${sfxMuted ? ICONS.sfxOff : ICONS.sfxOn}</button>
          <span class="vol-lbl">SOUND</span>
          <input type="range" id="pm-sfx-vol" min="0" max="100" value="${Math.round(a.sfxVol * 100)}">
        </div>`;
    } else if (pauseTab === 'assists') {
      const segOnOff = (id, on, bonusPct) => `
        <div class="seg-row toggle-seg">
          <button class="seg-btn${on ? ' sel' : ''}" data-assist="${id}" data-val="1">ON</button>
          <button class="seg-btn${on ? '' : ' sel'}" data-assist="${id}" data-val="0">OFF +${bonusPct}%</button>
        </div>`;
      const toggleOnOff = (id, on) => `
        <div class="seg-row toggle-seg">
          <button class="seg-btn${on ? ' sel' : ''}" data-assist="${id}" data-val="1">ON</button>
          <button class="seg-btn${on ? '' : ' sel'}" data-assist="${id}" data-val="0">OFF</button>
        </div>`;
      body = `
        <div class="toggle-row"><span class="toggle-lbl">TARGET RETICLE</span>${segOnOff('reticle', saveData.settings.reticle, Math.round(CONFIG.reticleOffBonus * 100))}</div>
        <div class="toggle-row"><span class="toggle-lbl">LAST-CHANCE SLOW-MO</span>${segOnOff('slowMo', saveData.settings.slowMo, Math.round(CONFIG.slowMoOffBonus * 100))}</div>
        <div class="toggle-row"><span class="toggle-lbl">GLIDE ASSIST <small>−${Math.round((1 - CONFIG.glideAssistScoreMult) * 100)}%</small></span>${toggleOnOff('glideAssist', saveData.settings.glideAssist)}</div>
        ${isTouch() ? '' : `<div class="toggle-row"><span class="toggle-lbl">MOUSE STEERING</span>${toggleOnOff('mouseSteer', saveData.settings.mouseSteer)}</div>`}
        <p class="pm-hint">Glide Assist auto-flies for you · turn the others off and every point pays more.</p>`;
    } else { // quests
      const rows = activeMissions().map((m) => `
        <div class="pm-quest${m.progress >= m.def.target ? ' done' : ''}">
          <div class="pm-quest-info">
            <div class="pm-quest-label">${m.def.label}</div>
            ${barHtml(m.progress / m.def.target)}
          </div>
          <div class="pm-quest-meta"><b>${Math.min(m.progress, m.def.target)}/${m.def.target}</b><span>◆ ${m.def.reward}</span></div>
        </div>`).join('');
      const weekly = weeklyTrials().map((t) => `
        <div class="pm-quest weekly${t.done ? ' done' : ''}">
          <div class="pm-quest-info">
            <div class="pm-quest-label">${t.done ? '★ ' : ''}${t.def.label}</div>
            ${barHtml(t.progress / t.def.target)}
          </div>
          <div class="pm-quest-meta"><b>${Math.min(t.progress, t.def.target)}/${t.def.target}</b><span>◆ ${t.def.reward}</span></div>
        </div>`).join('');
      body = `${rows}
        <div class="pm-weekly-head">WEEKLY TRIALS${saveData.weekly.feather ? ' 🪶' : ''}</div>
        ${weekly}
        <p class="pm-hint">Quests pay when the run ends · weeklies reset Mondays (UTC).</p>`;
    }

    els.screen.innerHTML = `
      <h1 class="pause-title">PAUSED</h1>
      <div class="pause-menu pm2">
        <button class="btn-primary pm-resume breathe" id="pm-resume">RESUME FLIGHT</button>
        <div class="pm-strip">
          <div class="pm-cell"><b>${Math.floor(game.score)}</b><span>SCORE</span></div>
          <div class="pm-cell"><b>${Math.floor(game.distance)}m</b><span>DIST</span></div>
          <div class="pm-cell"><b>×${game.maxCombo.toFixed(1)}</b><span>COMBO</span></div>
          <div class="pm-cell"><b>◆${game.embersRun}</b><span>EMBERS</span></div>
        </div>
        ${hcBonus > 0 ? `<div class="pm-hc-line">⚔ ASSISTS OFF — SCORING +${hcBonus}%</div>` : ''}
        <div class="seg-row pm-tabs">${tabBtn('audio', 'AUDIO')}${tabBtn('assists', 'ASSISTS')}${tabBtn('quests', 'QUESTS')}</div>
        <div class="pm-body">${body}</div>
        <div class="pm-footer">
          <span class="pm-wallet"><span class="ember-ico">${EMBER_ICON}</span> <b>${saveData.embers}</b> · LV <b>${saveData.level}</b></span>
          <div class="pm-nav" style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end">
            ${saveData.stats.runs === 0 ? '' : `<button class="btn-secondary pm-nav-btn" id="pm-pilot">PILOT${badgeHtml(pilotBadgeDue())}</button>`}
            <button class="btn-secondary pm-nav-btn" id="pm-settings">SETTINGS</button>
            ${saveData.stats.runs === 0 ? '' : `<button class="btn-secondary pm-shop-btn" id="pm-shop">SHOP${badgeHtml(shopBadgeDue())}</button>`}
          </div>
        </div>
      </div>
      <p class="action-key">${isTouch() ? 'tap outside the menu to resume' : 'Esc or click outside the menu to resume'}</p>`;
    els.screen.classList.add('visible');
    document.body.classList.add('screen-open');
    els.screen.classList.remove('stagger');
    if (fresh) restartAnim(els.screen, 'screen-anim');
    els.screen.onclick = null; // pause uses the global outside-tap-to-resume

    const stop = (fn) => (e) => { e.stopPropagation(); fn(e); };
    els.screen.querySelector('#pm-resume').onclick = stop(() => handlers.onResume && handlers.onResume());
    // Shop + Pilot are hidden during the first flight (tutorial) — guard wiring.
    const pmShop = els.screen.querySelector('#pm-shop');
    if (pmShop) pmShop.onclick = stop(() => {
      returnScreen = 'pause';
      ui.showScreen('shop');
    });
    // Pilot + Settings are now reachable mid-run from the pause menu, not just
    // from the start screen (back routes to the pause overlay via pauseSubscreen).
    const pmPilot = els.screen.querySelector('#pm-pilot');
    if (pmPilot) pmPilot.onclick = stop(() => {
      returnScreen = 'pause';
      ui.showScreen('pilot');
    });
    els.screen.querySelector('#pm-settings').onclick = stop(() => {
      returnScreen = 'pause';
      ui.showScreen('settings');
    });
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-pmtab]')) {
      btn.onclick = stop(() => {
        pauseTab = btn.dataset.pmtab;
        ui.showPauseOverlay();
      });
    }

    if (pauseTab === 'audio') {
      // Radio: skip back / forward (skips stations not yet bought)
      const trackEl = els.screen.querySelector('#pm-track');
      const retune = (dir) => {
        const name = music.nextTrack(dir);
        sfx.radio();
        trackEl.textContent = `♪ ${name}`;
      };
      els.screen.querySelector('#pm-prev').onclick = stop(() => retune(-1));
      els.screen.querySelector('#pm-next').onclick = stop(() => retune(1));

      const mBtn = els.screen.querySelector('#pm-music-mute');
      const sBtn = els.screen.querySelector('#pm-sfx-mute');
      mBtn.onclick = stop(() => {
        const muted = toggleMusicMute();
        mBtn.innerHTML = muted ? ICONS.musicOff : ICONS.music;
        mBtn.classList.toggle('off', muted);
      });
      sBtn.onclick = stop(() => {
        const muted = toggleSfxMute();
        sBtn.innerHTML = muted ? ICONS.sfxOff : ICONS.sfxOn;
        sBtn.classList.toggle('off', muted);
      });

      // Sliders: live volume; pointerdown must not bubble into tap-to-resume
      const mVol = els.screen.querySelector('#pm-music-vol');
      const sVol = els.screen.querySelector('#pm-sfx-vol');
      for (const el of [mVol, sVol]) {
        el.addEventListener('pointerdown', (e) => e.stopPropagation());
      }
      mVol.addEventListener('input', () => setMusicVolume(mVol.value / 100));
      sVol.addEventListener('input', () => setSfxVolume(sVol.value / 100));
      sVol.addEventListener('change', () => sfx.ember(1)); // feedback blip on release
    }

    // Assist toggles: take effect immediately (and repaint the menu)
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-assist]')) {
      btn.onclick = stop(() => {
        saveData.settings[btn.dataset.assist] = btn.dataset.val === '1';
        persist();
        ui.showPauseOverlay();
      });
    }
  },

  // True while the shop/settings screen was opened FROM the pause menu —
  // main.js routes outside-taps back to the pause overlay instead of resuming.
  inPauseSubscreen() {
    return pauseSubscreen;
  },

  // True while a shop/settings/pilot subscreen is showing (any origin) —
  // main.js suppresses the crash-screen tap-to-restart while browsing.
  inSubscreen() {
    return lastScreen === 'shop' || lastScreen === 'settings' || lastScreen === 'pilot' ||
           lastScreen === 'quests' || lastScreen === 'daily';
  },
  atShop() { return lastScreen === 'shop' && els.screen.classList.contains('visible'); },
};

// --- Appointment UI: honest badges -----------------------------------
// A badge NEVER points at nothing, clears the moment its surface opens, and
// the clear persists. Watermarks live in saveData.ui (numbers only).
function pilotBadgeDue() {
  return unclaimedFeatCount() > 0 ||
         saveData.feats.unlocked.length > saveData.ui.seenFeats ||
         saveData.titles.owned.length > saveData.ui.seenTitles;
}

// "Newly affordable": an unowned item costs ≤ embers AND more than the
// wallet had when the shop was last opened — so browsing and choosing not
// to buy silences the badge until the wallet grows past a new price line.
function shopBadgeDue() {
  const embers = saveData.embers;
  const seen = saveData.ui.shopSeenEmbers;
  const due = (cost) => cost <= embers && cost > seen;
  for (const [key, d] of Object.entries(DRAGONS)) {
    if (!saveData.skins.owned.includes(key) && due(d.cost)) return true;
  }
  for (const [key, r] of Object.entries(RIDERS)) {
    if (!saveData.riders.owned.includes(key) && due(r.cost)) return true;
  }
  for (let i = 0; i < TRACKS.length; i++) {
    if (!trackUnlocked(i) && due(TRACKS[i].cost)) return true;
  }
  return false;
}

// DAILY rail badge: today's challenge is still waiting to be flown. Honest —
// it points at a real action and clears the moment the run is recorded.
function dailyBadgeDue() {
  return !(saveData.daily.date === todayUTC() && saveData.daily.played);
}

// QUESTS rail badge: a mission has hit its target and is ready to pay out at the
// next run's end (a genuine "you've earned this" nudge), or a weekly is done.
function questsBadgeDue() {
  if (activeMissions().some((m) => m.progress >= m.def.target)) return true;
  return weeklyTrials().some((t) => t.done);
}

const badgeHtml = (due) => (due ? '<span class="badge"></span>' : '');

// C7: One-time iOS "Add to Home Screen" nudge for Safari users not yet in standalone
function iosInstallHint() {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!isIOS || navigator.standalone || saveData.flags.seenIOSHint) return '';
  saveData.flags.seenIOSHint = true;
  persist();
  return '<p class="ios-hint">Tip: tap <b>Share ⬆</b> → <b>Add to Home Screen</b> for the full-screen experience</p>';
}

// Goal-gradient bars: the final stretch glows + shimmers (motivation peaks
// near completion — make the bar feel it).
const barHtml = (frac) =>
  `<div class="mission-bar${frac >= 0.85 && frac < 1 ? ' near' : ''}"><span style="width:${Math.min(100, frac * 100)}%"></span></div>`;

// Where BACK should land from shop/settings/pilot (start, gameover or pause).
let lastScreen = 'start';
let returnScreen = 'start';
let pauseSubscreen = false; // shop/settings opened from the pause menu
let shopTab = 'dragons';    // dragons | riders | music | style
let heroKey = null;         // the dragon shown in the hero character-select stage
let pauseTab = 'audio';     // audio | assists | quests
let pilotTab = 'feats';     // feats | log | titles
let startNotice = '';       // one-shot line on the start screen

function wireScreenButtons(type) {
  const q = (sel) => els.screen.querySelector(sel);
  const stop = (fn) => (e) => { e.stopPropagation(); fn(e); };

  if (type === 'start') {
    returnScreen = 'start';
    const start = q('#btn-start');
    if (start) start.onclick = stop(() => handlers.onStart && handlers.onStart('normal'));
    // Rail icons open their panels (never launch a run directly).
    const quests = q('#btn-quests');
    if (quests) quests.onclick = stop(() => ui.showScreen('quests'));
    const dailyBtn = q('#btn-daily');
    if (dailyBtn) dailyBtn.onclick = stop(() => ui.showScreen('daily'));
  }
  // QUESTS / DAILY panels are only ever opened from the start screen.
  if (type === 'quests' || type === 'daily') {
    returnScreen = 'start';
    const fly = q('#btn-fly-daily');
    if (fly) fly.onclick = stop(() => handlers.onStart && handlers.onStart('daily'));
  }
  if (type === 'gameover') returnScreen = 'gameover';

  const shop = q('#btn-shop');
  if (shop) shop.onclick = stop(() => ui.showScreen('shop'));
  const settings = q('#btn-settings');
  if (settings) settings.onclick = stop(() => ui.showScreen('settings'));
  const pilot = q('#btn-pilot');
  if (pilot) pilot.onclick = stop(() => ui.showScreen('pilot'));
  const chipTitle = q('#chip-title');
  if (chipTitle) chipTitle.onclick = stop(() => { pilotTab = 'titles'; ui.showScreen('pilot'); });
  const back = q('#btn-back');
  if (back) back.onclick = stop(() => {
    // BACK from a pause-opened subscreen returns to the pause overlay.
    if (returnScreen === 'pause') ui.showPauseOverlay();
    else ui.showScreen(returnScreen);
  });

  if (type === 'shop') {
    const hint = q('#shop-hint');
    const needMore = (cost, what) => {
      if (hint) hint.textContent = `Need ◆ ${cost - saveData.embers} more embers for ${what} — fly and collect!`;
    };

    for (const btn of els.screen.querySelectorAll('.seg-btn[data-shoptab]')) {
      btn.onclick = stop(() => {
        shopTab = btn.dataset.shoptab;
        ui.showScreen('shop');
      });
    }

    // Dragons: the hero character-select. Drag the stage to rotate (and ONLY that);
    // the rail switches dragon; the segments switch form; one CTA equips/buys/ascends.
    function wireHeroSelect() {
      const hx = (n) => '#' + n.toString(16).padStart(6, '0');
      const rarAccent = { R: '#7fd49a', SR: '#62a8ff', SSR: '#c489ff', SSSR: '#ffd24d' };
      const sel = q('#hero-select');
      const stage = q('#hero-stage');
      const heroCanvas = q('#hero-canvas');
      const railEl = q('#hero-rail');
      const segEl = q('#hero-forms');
      const ctaEl = q('#hero-cta');
      const ownedOf = (k) => saveData.skins.owned.includes(k);
      let hTier = ownedOf(heroKey) ? getFormPref(heroKey) : maxTierFor(heroKey);

      const ctaHtml = () => {
        const d = DRAGONS[heroKey];
        if (!ownedOf(heroKey)) {
          const can = saveData.embers >= d.cost;
          return `<button class="locked${can ? '' : ' dim'}" data-cta="buy">◆ ${d.cost} · UNLOCK</button>`;
        }
        if (saveData.skins.equipped !== heroKey) return `<button data-cta="equip">EQUIP</button>`;
        const t = ascensionTier(heroKey), cap = maxTierFor(heroKey);
        if (t < cap) {
          const check = canAscend(heroKey, d.cost);
          if (check.flown >= check.gateMetres)
            return `<button class="ascend${saveData.embers >= check.cost ? '' : ' dim'}" data-cta="ascend">▲ ASCEND · ${ASCENSION_TIERS[t].name} ◆${check.cost}</button>`;
          return `<button class="equipped" data-cta="none">✓ EQUIPPED · ${(check.gateMetres / 1000).toFixed(0)}k m to ascend</button>`;
        }
        return `<button class="equipped" data-cta="none">✓ EQUIPPED · MAX</button>`;
      };

      const wireCta = () => {
        const btn = ctaEl.querySelector('button[data-cta]');
        if (!btn || btn.dataset.cta === 'none') return;
        btn.onclick = stop(() => {
          const d = DRAGONS[heroKey];
          if (btn.dataset.cta === 'ascend') {
            const newTier = handlers.onAscend && handlers.onAscend(heroKey);
            if (newTier) {
              setFormPref(heroKey, newTier);
              ui.showScreen('shop');
              ui.celebrate({ kind: 'ascension', tier: 'big', title: `${d.name} Ascended`, subtitle: ASCENSION_TIERS[newTier - 1].name,
                renderPreview: (c) => attachPreviewCanvas(c, 'dragon', ascendedDef(d, newTier, radianceRank(heroKey))) });
            } else { const ch = canAscend(heroKey, d.cost); if (ch.cost) needMore(ch.cost, `${d.name} ascension`); }
            return;
          }
          const res = buyOrEquipDragon(heroKey);
          if (res === 'need-more') { needMore(d.cost, d.name); return; }
          ui.showScreen('shop');
          if (res === 'bought') ui.celebrate({ kind: 'dragon', tier: 'big', title: d.name, subtitle: d.title,
            renderPreview: (c) => attachPreviewCanvas(c, 'dragon', ascendedDef(d, maxTierFor(heroKey), 0)) });
        });
      };

      const refresh = () => {
        const d = DRAGONS[heroKey];
        const owned = ownedOf(heroKey);
        const cap = maxTierFor(heroKey);
        hTier = Math.min(hTier, cap);
        const fr = formRarity(hTier, d.maxRarity);
        sel.style.setProperty('--haccent', hx(d.apexSeam ?? d.eye));
        sel.style.setProperty('--hrar', rarAccent[fr] || rarAccent.SSSR);
        const gem = q('#hero-gem'); gem.textContent = fr; gem.dataset.fr = fr;
        q('#hero-name').textContent = d.name;
        q('#hero-sub').textContent = d.title;
        segEl.innerHTML = Array.from({ length: cap + 1 }, (_, i) =>
          `<div class="hero-seg${i === hTier ? ' on' : ''}" data-form="${i}">${formTierLabel(i)}</div>`).join('');
        const st = d.stats;
        const spd = (st.speed - 1) / (DRAGON_STAT_CAP.speed - 1 || 1);
        const agi = (st.handling - 1) / (DRAGON_STAT_CAP.handling - 1 || 1);
        const sta = ((1 - st.drain) + (st.regen - 1)) / ((1 - DRAGON_STAT_CAP.drain) + (DRAGON_STAT_CAP.regen - 1) || 1);
        const srow = (lbl, kf) => { const v = Math.max(0.06, Math.min(1, kf));
          return `<div class="hsrow"><div class="hslabel">${lbl}</div><div class="hstrack"><div class="hsfill" style="width:${Math.round(12 + 88 * v)}%"></div></div><div class="hsval">${Math.round(40 + 59 * v)}</div></div>`; };
        q('#hero-stats').innerHTML = srow('SPEED', spd) + srow('AGILITY', agi) + srow('STAMINA', sta);
        ctaEl.innerHTML = ctaHtml(); wireCta();
        for (const t2 of railEl.querySelectorAll('.hero-thumb')) t2.classList.toggle('on', t2.dataset.hero === heroKey);
        // Show the inspected dragon in the LIVE menu scene (the real environment behind
        // the shop) — swaps only the dragon mesh, never the run.
        if (handlers.onPreviewDragon) handlers.onPreviewDragon(ascendedDef(d, hTier, owned ? radianceRank(heroKey) : 0));
        stage.classList.remove('rotated');
      };

      // Rail → switch dragon · Form segments → switch form.
      // Wired on POINTERUP (not click): inside the shop's momentum scroller iOS
      // retargets the synthesized `click` to the scroller, so click handlers on
      // these non-button divs never fire (and the stray click used to close the
      // shop). Pointer events target the real element. A movement guard rejects
      // scrolls so a swipe-to-scroll isn't mistaken for a tap.
      const onTap = (el, handler) => {
        let dx = 0, dy = 0, moved = false, handledAt = 0;
        const fire = (e) => { handledAt = Date.now(); handler(e); };
        el.addEventListener('pointerdown', (e) => { dx = e.clientX; dy = e.clientY; moved = false; });
        el.addEventListener('pointermove', (e) => {
          if (Math.hypot(e.clientX - dx, e.clientY - dy) > 10) moved = true;
        });
        el.addEventListener('pointerup', (e) => {
          if (moved || Math.hypot(e.clientX - dx, e.clientY - dy) > 10) return;
          fire(e);
        });
        // Desktop fallback: a plain click is reliable even if pointerup gets
        // swallowed. Deduped against the pointerup path; on iOS the synthesized
        // click can retarget to the scroller, where the handler's closest()
        // returns null and it harmlessly no-ops.
        el.addEventListener('click', (e) => { if (Date.now() - handledAt < 400) return; handler(e); });
      };
      onTap(railEl, (e) => {
        const thumb = e.target.closest('.hero-thumb'); if (!thumb) return;
        if (thumb.dataset.hero === heroKey) return;
        heroKey = thumb.dataset.hero;
        hTier = ownedOf(heroKey) ? getFormPref(heroKey) : maxTierFor(heroKey);
        refresh();
      });
      // Drag-to-scroll the dragon rail for NON-touch pointers (mouse/pen): a native
      // overflow-x scroller with a hidden scrollbar has no click-drag, so desktop
      // users couldn't move Azure → Bull at all. Touch keeps its native pan-x momentum
      // (no double-scroll). The 10px gate matches onTap, so a gesture is either a tap
      // (< 10px → selects) or a drag (≥ 10px → scrolls), never both.
      let rId = null, rStartX = 0, rStartScroll = 0, rDrag = false;
      railEl.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        rId = e.pointerId; rStartX = e.clientX; rStartScroll = railEl.scrollLeft; rDrag = false;
      });
      railEl.addEventListener('pointermove', (e) => {
        if (e.pointerId !== rId) return;
        const dx = e.clientX - rStartX;
        if (!rDrag) {
          if (Math.abs(dx) < 10) return;
          rDrag = true;
          try { railEl.setPointerCapture(e.pointerId); } catch { /* ok */ }
          railEl.classList.add('dragging');
        }
        railEl.scrollLeft = rStartScroll - dx;
      });
      const rEnd = (e) => {
        if (e.pointerId !== rId) return;
        rId = null; rDrag = false;
        try { railEl.releasePointerCapture(e.pointerId); } catch { /* ok */ }
        railEl.classList.remove('dragging');
      };
      railEl.addEventListener('pointerup', rEnd);
      railEl.addEventListener('pointercancel', rEnd);
      onTap(segEl, (e) => {
        const seg = e.target.closest('.hero-seg'); if (!seg) return;
        const t = Number(seg.dataset.form);
        if (t === hTier) return;
        hTier = t;
        if (ownedOf(heroKey)) {
          setFormPref(heroKey, t);
          if (saveData.skins.equipped === heroKey && handlers.onEquipDragon) handlers.onEquipDragon();
        }
        refresh();
      });
      // Drag the stage → rotate the hero, and only that. The rotate is DEFERRED until
      // the gesture is confirmed HORIZONTAL: capturing the pointer on pointerdown (as
      // it used to) stole vertical swipes that START on the turntable from the shop
      // scroll container, so the dragon list felt unscrollable in spots. Now a vertical
      // intent bails out and the browser scrolls natively (the canvas is touch-action:
      // pan-y), while a horizontal intent captures + rotates as before.
      let dragId = null, lastX = 0, startX = 0, startY = 0, dragging = false;
      heroCanvas.addEventListener('pointerdown', (e) => {
        dragId = e.pointerId; startX = lastX = e.clientX; startY = e.clientY; dragging = false;
      });
      heroCanvas.addEventListener('pointermove', (e) => {
        if (e.pointerId !== dragId) return;
        if (!dragging) {
          const dx = e.clientX - startX, dy = e.clientY - startY;
          if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
            dragging = true; lastX = e.clientX;
            try { heroCanvas.setPointerCapture(e.pointerId); } catch { /* ok */ }
            showcaseDragStart(); stage.classList.add('rotated');
          } else if (Math.abs(dy) > 12) {
            dragId = null; return;   // vertical → let the shop scroll, don't rotate
          } else {
            return;                  // not enough movement to decide yet
          }
        }
        const step = e.clientX - lastX; lastX = e.clientX; showcaseDragMove(step);
      });
      const endDrag = (e) => {
        if (e.pointerId !== dragId) return;
        dragId = null;
        if (dragging) {
          dragging = false; showcaseDragEnd();
          try { heroCanvas.releasePointerCapture(e.pointerId); } catch { /* ok */ }
        }
      };
      heroCanvas.addEventListener('pointerup', endDrag);
      heroCanvas.addEventListener('pointercancel', endDrag);
      // Rail thumbnails = live mini turntables.
      for (const cv of railEl.querySelectorAll('.hero-thumb-canvas')) {
        const k = cv.dataset.key;
        attachPreviewCanvas(cv, 'dragon', ascendedDef(DRAGONS[k], Number(cv.dataset.tier), radianceRank(k)));
      }
      refresh();
    }
    if (q('#hero-select')) wireHeroSelect();

    // Riders: buy/equip
    for (const card of els.screen.querySelectorAll('.skin-card[data-rider]')) {
      card.onclick = stop(() => {
        const key = card.dataset.rider;
        const r = RIDERS[key];
        if (saveData.riders.owned.includes(key)) {
          saveData.riders.equipped = key;
          persistNow();
          handlers.onEquipRider && handlers.onEquipRider(key);
          ui.showScreen('shop');
        } else if (saveData.embers >= r.cost) {
          saveData.embers -= r.cost;
          saveData.riders.owned.push(key);
          saveData.riders.equipped = key;
          persistNow();
          handlers.onEquipRider && handlers.onEquipRider(key);
          ui.showScreen('shop');
          ui.celebrate({
            kind: 'rider', tier: 'big', title: r.name, subtitle: r.title,
            renderPreview: (c) => attachPreviewCanvas(c, 'rider', r),
          });
        } else {
          needMore(r.cost, r.name);
        }
      });
    }

    // Music: buy/equip stations (buying tunes straight in)
    for (const card of els.screen.querySelectorAll('.skin-card[data-track-i]')) {
      card.onclick = stop(() => {
        const i = Number(card.dataset.trackI);
        const t = TRACKS[i];
        if (trackUnlocked(i)) {
          music.setTrack(i);
          sfx.radio();
          ui.showScreen('shop');
        } else if (saveData.embers >= t.cost) {
          saveData.embers -= t.cost;
          saveData.audio.ownedTracks.push(t.id);
          persistNow(); // write the purchase synchronously so it survives an
          music.setTrack(i); // immediate app close (mobile lifecycle can drop debounced writes)
          sfx.radio();
          ui.showScreen('shop');
          ui.celebrate({
            kind: 'track', tier: 'small', glyph: '♪',
            title: t.name, subtitle: `${t.desc} · now on air`,
          });
        } else {
          needMore(t.cost, `“${t.name}”`);
        }
      });
    }

    const buyRevive = q('#buy-revive');
    if (buyRevive) buyRevive.onclick = stop(() => {
      if (saveData.embers >= 250) {
        saveData.embers -= 250;
        saveData.revives++;
        persistNow();
        ui.showScreen('shop');
        ui.celebrate({
          kind: 'generic', tier: 'small', glyph: '✦',
          title: 'Revive Token', subtitle: `One more chance per run — you hold ${saveData.revives}`,
        });
      } else {
        needMore(250, 'a revive token');
      }
    });

    // Flightmarks: equip free default or buy/equip a mark
    for (const card of els.screen.querySelectorAll('.skin-card[data-flightmark]')) {
      card.onclick = stop(() => {
        const id = card.dataset.flightmark;
        if (id === '') {
          handlers.onEquipFlightmark && handlers.onEquipFlightmark('');
          ui.showScreen('shop');
          return;
        }
        const mark = FLIGHTMARKS.find(m => m.id === id);
        if (flightmarkOwned(id)) {
          handlers.onEquipFlightmark && handlers.onEquipFlightmark(id);
          ui.showScreen('shop');
        } else if (saveData.embers >= mark.cost) {
          if (handlers.onBuyFlightmark && handlers.onBuyFlightmark(id)) {
            handlers.onEquipFlightmark && handlers.onEquipFlightmark(id);
            ui.showScreen('shop');
            ui.celebrate({
              kind: 'flightmark', tier: 'small', glyph: '✦',
              title: mark.name, subtitle: 'Trail equipped',
            });
          }
        } else {
          needMore(mark.cost, `${mark.name} trail`);
        }
      });
    }

  }

  if (type === 'settings') {
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-track]')) {
      btn.onclick = stop(() => {
        music.setTrack(Number(btn.dataset.track));
        sfx.radio();
        ui.showScreen('settings');
      });
    }
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-q]')) {
      btn.onclick = stop(() => {
        const v = btn.dataset.q === 'auto' ? null : Number(btn.dataset.q);
        saveData.settings.qualityOverride = v;
        persist();
        handlers.onQualityChange && handlers.onQualityChange(v);
        ui.showScreen('settings');
      });
    }
    // MODEL DETAIL (geometry LOD): null = AUTO (track graphics tier), else 'high'/'ultra'.
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-md]')) {
      btn.onclick = stop(() => {
        const v = btn.dataset.md === 'auto' ? null : btn.dataset.md;
        saveData.settings.modelDetail = v;
        persist();
        handlers.onModelDetailChange && handlers.onModelDetailChange(v);
        ui.showScreen('settings');
      });
    }
    // Assist toggles (reticle / slow-mo): instant effect + score bonus
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-assist]')) {
      btn.onclick = stop(() => {
        saveData.settings[btn.dataset.assist] = btn.dataset.val === '1';
        persist();
        ui.showScreen('settings');
      });
    }
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-dev]')) {
      btn.onclick = stop(() => {
        const on = btn.dataset.dev === '1';
        if (on === !!saveData.settings.dev) return;
        saveData.settings.dev = on;
        // Persist the preference even if dev froze writes, then reload so boot
        // applies (or removes) the unlock from a clean save state.
        unfreezeSaves();
        persistNow();
        location.reload();
      });
    }
    const reset = q('#btn-reset-save');
    if (reset) reset.onclick = stop(() => {
      if (confirm('Reset ALL progress (embers, dragons, riders, music, missions, records)?')) {
        localStorage.removeItem('dragonDriftSave');
        localStorage.removeItem('dragonDriftHighScore');
        localStorage.removeItem('dragonDriftBestDist');
        location.reload();
      }
    });
  }
}

function challengeUrl(score) {
  // Seed travels with the link so the challenger races the exact same course.
  return `${location.origin}${location.pathname}?challenge=${score}&seed=${game.runSeed}`;
}

function wireShareButtons(score, dist) {
  const share = els.screen.querySelector('#btn-share');
  const menu  = els.screen.querySelector('#share-menu');
  const hint  = els.screen.querySelector('#share-hint');

  const shareText = buildShareText(score, dist);
  const setHint = (t) => (hint.textContent = t);

  const downloadCard = () => {
    const card = handlers.getCard && handlers.getCard();
    if (!card) return false;
    const a = document.createElement('a');
    a.download = `dragon-drift-${score}.png`;
    a.href = card.toDataURL('image/png');
    a.click();
    return true;
  };

  const copyLink = () => {
    const url = challengeUrl(score);
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(url).then(
        () => true,
        () => (window.prompt('Copy this link:', url), true)
      );
    }
    window.prompt('Copy this link:', url);
    return Promise.resolve(true);
  };

  const tryNativeShare = async () => {
    try {
      const card = handlers.getCard && handlers.getCard();
      if (!card || !navigator.canShare) return false;
      const blob = await new Promise(res => card.toBlob(res, 'image/png'));
      const file = new File([blob], 'dragon-drift.png', { type: 'image/png' });
      const data = { files: [file], text: `${shareText}\n${challengeUrl(score)}` };
      if (!navigator.canShare(data)) return false;
      await navigator.share(data);
      return true;
    } catch { return false; }
  };

  const appFallback = async (label, site) => {
    downloadCard();
    await copyLink();
    setHint(`Screenshot saved & challenge link copied — paste into your ${label} post!`);
    window.open(site, '_blank', 'noopener');
  };

  const again = els.screen.querySelector('#btn-again');
  if (again) again.onclick = () => handlers.onRestart && handlers.onRestart();

  share.onclick = () => { menu.hidden = !menu.hidden; };

  els.screen.querySelector('#share-ig').onclick   = async () => { if (!(await tryNativeShare())) appFallback('Instagram', 'https://www.instagram.com'); };
  els.screen.querySelector('#share-tt').onclick   = async () => { if (!(await tryNativeShare())) appFallback('TikTok', 'https://www.tiktok.com'); };
  els.screen.querySelector('#share-x').onclick    = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(challengeUrl(score))}`;
    window.open(url, '_blank', 'noopener');
  };
  els.screen.querySelector('#share-link').onclick = async () => {
    await copyLink();
    setHint('Challenge link copied — send it to a friend!');
  };
}

function buildShareText(score, dist) {
  // Beating a friend's challenge turns the share into a riposte.
  const opening = game.challengeScore && score > game.challengeScore
    ? [`I beat your ${game.challengeScore.toLocaleString()} with ${score.toLocaleString()} in Dragon Drift 🐉`,
       `Your move.`]
    : [`I scored ${score.toLocaleString()} in Dragon Drift 🐉`,
       `Can you beat my run?`];
  const title = equippedTitleName();
  const streak = saveData.daily.streak;
  const identity = [
    title ? `«${title}»` : '',
    streak > 1 ? `🔥 ${streak}-day streak` : '',
  ].filter(Boolean).join(' · ');
  return [
    ...opening,
    ``,
    ...(identity ? [identity] : []),
    `Course: ${game.runSeed.toString(36).toUpperCase()}`,
    `Combo: ${game.maxCombo.toFixed(2)}x · Perfect Rings: ${game.perfectRings} · Near Misses: ${game.nearMisses}`,
  ].join('\n');
}

function restartAnim(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
