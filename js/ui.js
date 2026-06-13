import { CONFIG } from './config.js';
import { on } from './events.js';
import { game } from './gameState.js';
import { toggleMusicMute, toggleSfxMute, musicMuted, sfxMuted, music, sfx, TRACKS, trackUnlocked, setMusicVolume, setSfxVolume } from './sfx.js';
import { comboTier } from './util.js';
import { saveData, persist, xpToNext, todayUTC } from './save.js';
import { activeMissions } from './missions.js';
import { weeklyTrials } from './weekly.js';
import { equippedTitleName } from './titles.js';
import { buildRecapHtml, wireRecap, selectNextUp } from './recap.js';
import { buildPilotHtml, wirePilot } from './pilotScreen.js';
import { DRAGONS, DRAGON_STAT_CAP } from './dragons.js';
import { RIDERS } from './riders.js';
import { attachPreviews, attachPreviewCanvas } from './preview.js';
import { FLIGHTMARKS, flightmarkOwned, equippedFlightmark } from './flightmarks.js';
import { ASCENSION_TIERS, ascendedDef, ascensionTier, canAscend, radianceRank, radianceCost } from './ascension.js';

let els = {};
let handlers = {};

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
  prev:     '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 4h2v16H6zM20 4v16L9 12z"/></svg>',
  next:     '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 4h2v16h-2zM4 4v16l11-8z"/></svg>',
};

// Popup text IDs used across multiple popups
let popupTimer = null;
let lastCombo = 1;
let lastChain = 0;
let reviveTimer = null;
let lastShownScore = 0;
let lastSpeedlines = -1;
let celebrateShownAt = 0;
let assistFadeTimer = null;
let lastAssistText = '';
let lastEmbersRun = 0;
let emberDimTimer = null;

function getFormPref(key) {
  const fp = saveData.cosmetics.formPref.find(e => e[0] === key);
  const maxTier = ascensionTier(key);
  return fp ? Math.min(fp[1], maxTier) : maxTier;
}
function setFormPref(key, tier) {
  const maxTier = ascensionTier(key);
  tier = Math.max(0, Math.min(tier, maxTier));
  const entry = saveData.cosmetics.formPref.find(e => e[0] === key);
  if (entry) entry[1] = tier;
  else saveData.cosmetics.formPref.push([key, tier]);
  persist();
}
function formTierLabel(tier) {
  if (tier === 0) return 'Hatchling';
  return ASCENSION_TIERS[tier - 1]?.name ?? 'Eternal';
}

export const ui = {
  init(h = {}) {
    handlers = h;
    const root = document.createElement('div');
    root.id = 'hud';
    root.innerHTML = `
      <div class="hud-top-left">
        <button class="mute-btn" id="pause-btn" title="Pause (Esc) — audio &amp; radio live here">${ICONS.pause}</button>
      </div>
      <div class="hud-top-center">
        <div class="dist" id="dist">0 m</div>
        <div class="best" id="best"></div>
      </div>
      <div class="hud-top-right">
        <div class="score" id="score">0</div>
        <div class="embers-hud" id="embers-hud"></div>
        <div class="race-bar" id="race-bar"><span class="race-fill" id="race-fill"></span><span class="race-target" id="race-target"></span></div>
        <div class="combo" id="combo" data-tier="0"><span class="combo-x" id="combo-x">×1.00</span><span class="combo-word">COMBO</span></div>
        <div class="chain" id="chain"><span class="chain-n" id="chain-n">0</span><span class="chain-word">CHAIN</span></div>
        <div class="ff-chip" id="ff-chip"></div>
        <div class="assist-chip" id="assist-chip"></div>
        <div class="surge-widget" id="surge-widget" data-tier="0">
          <svg viewBox="0 0 84 84">
            <defs>
              <linearGradient id="surge-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#22f7ff"/>
                <stop offset="0.6" stop-color="#ffd86a"/>
                <stop offset="1" stop-color="#ff9f00"/>
              </linearGradient>
            </defs>
            <circle class="surge-track" cx="42" cy="42" r="35"/>
            <circle class="surge-arc" id="surge-arc" cx="42" cy="42" r="35"/>
          </svg>
          <div class="surge-center">
            <div class="surge-x" id="surge-x">×1.00</div>
            <div class="surge-lbl" id="surge-lbl">SURGE 0/8</div>
          </div>
        </div>
      </div>
      <div class="hud-bottom-left">
        <div class="bb-row"><span class="bb-ico">♥</span><div class="bar"><div class="bar-fill health" id="health-fill"></div></div></div>
      </div>
      <div class="hud-bottom-right">
        <div class="bb-row"><span class="bb-ico">⚡</span><div class="bar"><div class="bar-fill stamina" id="stamina-fill"></div></div></div>
      </div>
      <div class="milestone-banner" id="milestone-banner"></div>
      <div class="popup" id="popup"></div>
      <div class="popup popup2" id="popup2"></div>
      <div class="feat-toast" id="feat-toast"></div>
      <div class="hint" id="hint"></div>
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
      health:       root.querySelector('#health-fill'),
      stamina:      root.querySelector('#stamina-fill'),
      score:        root.querySelector('#score'),
      combo:        root.querySelector('#combo'),
      comboX:       root.querySelector('#combo-x'),
      chain:        root.querySelector('#chain'),
      chainN:       root.querySelector('#chain-n'),
      goldFlash:    root.querySelector('#gold-flash'),
      surgeWidget:  root.querySelector('#surge-widget'),
      surgeArc:     root.querySelector('#surge-arc'),
      surgeX:       root.querySelector('#surge-x'),
      surgeLbl:     root.querySelector('#surge-lbl'),
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

    // Surge arc geometry (set once; per-frame writes only move dashoffset)
    const C = 2 * Math.PI * 35;
    els.surgeArc.style.strokeDasharray = C;
    els.surgeArc.style.strokeDashoffset = C;

    // Live feat unlocks toast over the event bus (feats.js stays ui-free).
    on('featUnlocked', (p) => {
      if (p && p.live) {
        this.featToast(p.def.name, p.def.reward);
        sfx.featUnlock();
      }
    });
  },

  update(player) {
    els.health.style.width  = `${(game.health / CONFIG.healthMax) * 100}%`;
    els.stamina.style.width = `${(game.stamina / CONFIG.staminaMax) * 100}%`;
    els.stamina.classList.toggle('depleted', game.stamina <= 0.5);
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

    // Combo: intensity tiers escalate the styling; fever overrides everything
    els.comboX.textContent = `×${game.combo.toFixed(2)}`;
    els.combo.dataset.tier = tier;

    // Circular surge widget: arc fills toward Dragon Surge, then counts the
    // fever down. Replaces both the old top strip and the in-world sprite.
    const C = 2 * Math.PI * 35;
    const surgeProgress = Math.min(game.consecutiveRings, game.feverThreshold);
    const frac = game.feverActive
      ? game.feverTimer / CONFIG.feverDuration
      : surgeProgress / game.feverThreshold;
    els.surgeArc.style.strokeDashoffset = C * (1 - frac);
    els.surgeWidget.dataset.tier = tier;
    els.surgeWidget.classList.toggle('fever', game.feverActive);
    els.surgeWidget.classList.toggle('active', game.combo > 1.001 || game.consecutiveRings > 0 || game.feverActive);
    els.surgeX.textContent = `×${game.combo.toFixed(2)}`;
    els.surgeLbl.textContent = game.feverActive
      ? `SURGE ${Math.ceil(game.feverTimer)}s`
      : `SURGE ${surgeProgress}/${game.feverThreshold}`;
    if (game.combo > lastCombo + 0.001) restartAnim(els.comboX, 'combo-pop');
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

    // C1: BEST chip — only surface when closing in on the record (≥70%)
    els.best.textContent = game.highScore > 0 && game.score >= 0.7 * game.highScore
      ? `BEST ${game.highScore}` : '';

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

    // C2: Assist chip — fades after 4s when value hasn't changed
    const hcBonus = Math.round((game.scoreMult - 1) * 100);
    const newAssistText = hcBonus > 0 ? `⚔ ASSISTS OFF +${hcBonus}%` : '';
    if (newAssistText !== lastAssistText) {
      els.assistChip.textContent = newAssistText;
      els.assistChip.classList.remove('faded');
      clearTimeout(assistFadeTimer);
      if (newAssistText) assistFadeTimer = setTimeout(() => els.assistChip.classList.add('faded'), 4000);
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

    // First flight of the day: the ×1.5 chip shows until the bonus banks.
    els.ffChip.textContent =
      saveData.firstFlightDay !== todayUTC()
        ? `☀ FIRST FLIGHT ◆×${CONFIG.firstFlightMult}` : '';

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

  // Feat toast: its own element so gameplay popups are never eaten.
  featToast(name, reward) {
    els.featToast.innerHTML = `⬢ FEAT — ${name} <b>+◆${reward}</b>`;
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
    const score = Math.floor(game.score);
    const dist  = Math.floor(game.distance);
    let html = '';
    // Freshness: animate the screen in only on genuine navigation — tab
    // switches re-render the SAME type and must not re-flash.
    const fresh = !els.screen.classList.contains('visible') || lastScreen !== type;
    lastScreen = type;

    if (type === 'start') {
      const touch = isTouch();
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
      const weeklyStrip = `
        <div class="weekly-strip">
          <div class="weekly-head">WEEKLY TRIALS${feather ? ' <span class="feather" title="Phoenix Feather — bridges one missed streak day">🪶</span>' : ''}</div>
          ${trials.map((t) => `
            <div class="weekly-row${t.done ? ' done' : ''}">
              <span class="weekly-label">${t.done ? '★ ' : ''}${t.def.label}</span>
              ${barHtml(t.progress / t.def.target)}
              <span class="weekly-reward">◆${t.def.reward}</span>
            </div>`).join('')}
        </div>`;
      const nextUp = selectNextUp();
      const title = equippedTitleName();
      const daily = saveData.daily;
      const dailyDone = daily.date === todayUTC() && daily.played;
      html = `
        <h1>DRAGON DRIFT</h1>
        ${game.challengeScore ? `<p class="challenge">CHALLENGE — beat ${game.challengeScore} points!</p>` : ''}
        ${startNotice ? `<p class="start-notice">${startNotice}</p>` : ''}
        <div class="meta-row">
          <div class="meta-chip">PILOT <b>LV ${saveData.level}</b></div>
          ${title ? `<div class="meta-chip title-chip" id="chip-title">«${title}»</div>` : ''}
          <div class="meta-chip"><span class="ember-ico">◆</span> <b>${saveData.embers}</b></div>
          ${game.highScore ? `<div class="meta-chip">BEST <b>${game.highScore}</b></div>` : ''}
        </div>
        <p class="sub">${touch ? 'Drag to steer · hold a second finger to boost · swipe it sideways to barrel roll' : 'WASD/Arrows to steer · SPACE to boost · double-tap a direction to barrel roll'}</p>
        <div class="mission-list">${missions}</div>
        ${weeklyStrip}
        <p class="nextup-line">${nextUp.icon} NEXT UP — ${nextUp.label} <span class="nextup-line-sub">${nextUp.sub}</span></p>
        <div class="daily-card">
          <div class="daily-info">
            <div class="daily-title">DAILY CHALLENGE</div>
            <div class="daily-sub">${dailyDone ? `Done today — best ${daily.bestScore}. New course at UTC midnight.` : 'One course, the whole world, every day.'}</div>
          </div>
          ${daily.streak > 1 ? `<div class="daily-streak">🔥 ${daily.streak} day streak</div>` : ''}
          <button class="btn-secondary btn-daily${dailyDone ? '' : ' glow'}" id="btn-daily">FLY DAILY</button>
        </div>
        <div class="action-row">
          <button class="btn-primary breathe" id="btn-start">TAKE OFF</button>
          <button class="btn-tertiary" id="btn-pilot">⬢ PILOT${badgeHtml(pilotBadgeDue())}</button>
          <button class="btn-tertiary" id="btn-shop">⬡ SHOP${badgeHtml(shopBadgeDue())}</button>
          <button class="btn-tertiary" id="btn-settings">⚙ SETTINGS</button>
        </div>
        <p class="action-key">${touch ? 'or tap anywhere to take off' : 'or press ENTER to take off'}</p>
        ${iosInstallHint()}`;

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
        // Stat bars normalised against the flagship (DRAGON_STAT_CAP).
        const bar = (lbl, k) => `
          <div class="stat-bar-row"><span>${lbl}</span>
            <div class="stat-bar"><span style="width:${Math.round(12 + 88 * Math.max(0, Math.min(1, k)))}%"></span></div>
          </div>`;
        const tierPips = (key) => {
          const t = ascensionTier(key);
          return Array.from({ length: 5 }, (_, i) =>
            `<span class="tier-pip${i < t ? ' filled' : ''}">◆</span>`).join('');
        };
        const tierAction = (key, cost) => {
          const t = ascensionTier(key);
          if (t >= ASCENSION_TIERS.length) {
            const rc = radianceCost(key);
            const rr = radianceRank(key);
            return `<button class="btn-ascend${saveData.embers >= rc ? '' : ' dim'}" data-ascend-radiance="${key}">✦ R${rr + 1} ◆${rc}</button>`;
          }
          const check = canAscend(key, cost);
          const gateMet = check.flown >= check.gateMetres;
          if (!gateMet) return `<span class="tier-gate">${(check.gateMetres / 1000).toFixed(0)}k m to unlock</span>`;
          return `<button class="btn-ascend${saveData.embers >= check.cost ? '' : ' dim'}" data-ascend="${key}">▲ ${ASCENSION_TIERS[t].name} ◆${check.cost}</button>`;
        };
        const cards = Object.entries(DRAGONS).map(([key, d]) => {
          const owned = saveData.skins.owned.includes(key);
          const equipped = saveData.skins.equipped === key;
          const maxTier = ascensionTier(key);
          const displayTier = owned ? getFormPref(key) : ASCENSION_TIERS.length;
          const st = d.stats;
          const spd = (st.speed - 1) / (DRAGON_STAT_CAP.speed - 1 || 1);
          const agi = (st.handling - 1) / (DRAGON_STAT_CAP.handling - 1 || 1);
          const sta = ((1 - st.drain) + (st.regen - 1)) / ((1 - DRAGON_STAT_CAP.drain) + (DRAGON_STAT_CAP.regen - 1) || 1);
          // Premium dragons radiate on the card too (aura tint via CSS var)
          const lux = d.fx.auraIdle > 0 ? ` lux" style="--aura: rgba(${d.fx.auraColor},0.45)` : '';
          const scrub = owned && maxTier > 0 ? `
              <div class="form-scrub">
                <button class="form-arrow" data-form-prev="${key}">◀</button>
                <span class="form-tier-label" data-form-label="${key}">${formTierLabel(displayTier)}</span>
                <button class="form-arrow" data-form-next="${key}">▶</button>
              </div>` : '';
          return `
            <div class="skin-card${equipped ? ' equipped' : ''}${owned ? '' : ' locked'}${lux}" data-dragon="${key}" data-rarity="${d.rarity}">
              <div class="preview-wrap">
                <canvas class="skin-preview" data-kind="dragon" data-key="${key}" width="180" height="180"></canvas>
                ${equipped ? '<div class="equipped-badge">✓ EQUIPPED</div>' : ''}
                <div class="rarity-gem">${d.rarity}</div>
              </div>${scrub}
              <div class="skin-name">${d.name}</div>
              <div class="skin-title">${d.title}</div>
              <div class="stat-bars">${bar('SPD', spd)}${bar('AGI', agi)}${bar('STA', sta)}</div>
              ${owned ? `<div class="skin-tier">${tierPips(key)} ${tierAction(key, d.cost)}</div>` : ''}
              <div class="skin-cost ${owned ? 'owned' : ''}">${owned ? (equipped ? '' : 'TAP TO EQUIP') : `◆ ${d.cost}`}</div>
            </div>`;
        }).join('');
        body = `<div class="shop-grid">${cards}
          <div class="skin-card" id="buy-revive">
            <div class="skin-swatch" style="background: radial-gradient(circle at 35% 30%, #ffe8a0, #c87010)"></div>
            <div class="skin-name">Revive Token</div>
            <div class="skin-title">One more chance per run</div>
            <div class="skin-cost">◆ 250 — you have ${saveData.revives}</div>
          </div>
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
            <div class="trail-swatch" style="background: radial-gradient(circle at 35% 30%, #ffd070, #ff8020)"></div>
            <div class="skin-name">Dragon's Colors</div>
            <div class="skin-title">Default trail</div>
            <div class="skin-cost owned">${defaultActive ? 'ACTIVE' : 'TAP TO EQUIP'}</div>
          </div>`;
        const markCards = FLIGHTMARKS.map(mark => {
          const owned = flightmarkOwned(mark.id);
          const active = activeId === mark.id;
          return `
            <div class="skin-card${active ? ' equipped' : ''}${owned ? '' : ' locked'}" data-flightmark="${mark.id}">
              <div class="trail-swatch" style="background: radial-gradient(circle at 35% 30%, ${hex(mark.boostTrail)}, ${hex(mark.trail)})"></div>
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
          <div class="meta-chip"><span class="ember-ico">◆</span> <b>${saveData.embers}</b></div>
          <button class="topbar-close" id="btn-back" title="Back">✕</button>
        </div>
        <div class="seg-row shop-tabs" style="margin-top:12px">${tabBtn('dragons', '🐉 DRAGONS')}${tabBtn('riders', '🛡 RIDERS')}${tabBtn('music', '♪ MUSIC')}${tabBtn('style', '✦ STYLE')}</div>
        ${body}
        <p class="share-hint" id="shop-hint"></p>`;

    } else if (type === 'settings') {
      const q = saveData.settings.qualityOverride;
      const seg = (val, label) =>
        `<button class="seg-btn${q === val ? ' sel' : ''}" data-q="${val === null ? 'auto' : val}">${label}</button>`;
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
          <div class="settings-label">TARGET RETICLE — the tracking square on the next ring</div>
          ${assistSeg('reticle', saveData.settings.reticle, Math.round(CONFIG.reticleOffBonus * 100))}
        </div>
        <div class="settings-group">
          <div class="settings-label">LAST-CHANCE SLOW-MO — time dilation before a lethal hit</div>
          ${assistSeg('slowMo', saveData.settings.slowMo, Math.round(CONFIG.slowMoOffBonus * 100))}
        </div>
        <div class="settings-group">
          <div class="settings-label">DRAGON RADIO ${isTouch() ? '' : '(N to cycle in flight)'} — buy more stations in the shop</div>
          <div class="seg-row radio-segs">${TRACKS.map((t, i) => trackUnlocked(i)
            ? `<button class="seg-btn${music.trackIndex === i ? ' sel' : ''}" data-track="${i}">${t.name.toUpperCase()}</button>`
            : `<button class="seg-btn locked" disabled title="Buy in the shop">🔒 ${t.name.toUpperCase()}</button>`).join('')}</div>
        </div>
        <div class="settings-group">
          <div class="settings-label">AUDIO</div>
          <p class="sub" style="font-size:13px; opacity:0.75">Music &amp; sound volume live in the pause menu (Esc during flight).</p>
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

    els.screen.innerHTML = html;
    els.screen.classList.add('visible');
    document.body.classList.add('screen-open');
    els.screen.classList.toggle('stagger', fresh && type === 'start');
    if (fresh) restartAnim(els.screen, 'screen-anim');
    pauseSubscreen = returnScreen === 'pause' && (type === 'shop' || type === 'settings' || type === 'pilot');
    // Live 3D turntables on the dragon/rider cards
    if (type === 'shop') {
      attachPreviews(els.screen, (kind, key) => {
        if (kind !== 'dragon') return RIDERS[key];
        const def = DRAGONS[key];
        if (!def) return null;
        const owned = saveData.skins.owned.includes(key);
        const tier = owned ? getFormPref(key) : ASCENSION_TIERS.length;
        return ascendedDef(def, tier, radianceRank(key));
      });
    }
    // Tapping a blank spot on the shop/settings/pilot screen goes back — the
    // screen container itself is the only target blank space resolves to.
    els.screen.onclick = (e) => {
      if (e.target !== els.screen) return;
      if (type === 'shop' || type === 'settings' || type === 'pilot') {
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
      body = `
        <div class="toggle-row"><span class="toggle-lbl">TARGET RETICLE</span>${segOnOff('reticle', saveData.settings.reticle, Math.round(CONFIG.reticleOffBonus * 100))}</div>
        <div class="toggle-row"><span class="toggle-lbl">LAST-CHANCE SLOW-MO</span>${segOnOff('slowMo', saveData.settings.slowMo, Math.round(CONFIG.slowMoOffBonus * 100))}</div>
        <p class="pm-hint">Fly without assists and every point pays more.</p>`;
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
          <span class="pm-wallet"><span class="ember-ico">◆</span> <b>${saveData.embers}</b> · LV <b>${saveData.level}</b></span>
          <button class="btn-secondary pm-shop-btn" id="pm-shop">SHOP${badgeHtml(shopBadgeDue())}</button>
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
    els.screen.querySelector('#pm-shop').onclick = stop(() => {
      returnScreen = 'pause';
      ui.showScreen('shop');
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
    return lastScreen === 'shop' || lastScreen === 'settings' || lastScreen === 'pilot';
  },
};

// --- Appointment UI: honest badges -----------------------------------
// A badge NEVER points at nothing, clears the moment its surface opens, and
// the clear persists. Watermarks live in saveData.ui (numbers only).
function pilotBadgeDue() {
  return saveData.feats.unlocked.length > saveData.ui.seenFeats ||
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
    const daily = q('#btn-daily');
    if (daily) daily.onclick = stop(() => handlers.onStart && handlers.onStart('daily'));
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

    // Dragons: buy/equip — equipping swaps the model AND the flight stats.
    for (const card of els.screen.querySelectorAll('.skin-card[data-dragon]')) {
      card.onclick = stop(() => {
        const key = card.dataset.dragon;
        const d = DRAGONS[key];
        if (saveData.skins.owned.includes(key)) {
          saveData.skins.equipped = key;
          persist();
          handlers.onEquipDragon && handlers.onEquipDragon(key);
          ui.showScreen('shop');
        } else if (saveData.embers >= d.cost) {
          saveData.embers -= d.cost;
          saveData.skins.owned.push(key);
          saveData.skins.equipped = key;
          persist();
          handlers.onEquipDragon && handlers.onEquipDragon(key);
          ui.showScreen('shop');
          ui.celebrate({
            kind: 'dragon', tier: 'big', title: d.name, subtitle: d.title,
            renderPreview: (c) => attachPreviewCanvas(c, 'dragon', d),
          });
        } else {
          needMore(d.cost, d.name);
        }
      });
    }

    // Riders: buy/equip
    for (const card of els.screen.querySelectorAll('.skin-card[data-rider]')) {
      card.onclick = stop(() => {
        const key = card.dataset.rider;
        const r = RIDERS[key];
        if (saveData.riders.owned.includes(key)) {
          saveData.riders.equipped = key;
          persist();
          handlers.onEquipRider && handlers.onEquipRider(key);
          ui.showScreen('shop');
        } else if (saveData.embers >= r.cost) {
          saveData.embers -= r.cost;
          saveData.riders.owned.push(key);
          saveData.riders.equipped = key;
          persist();
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
          persist();
          music.setTrack(i);
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
        persist();
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

    // Form-preview scrub: ◀▶ arrows change the displayed tier without re-equipping
    for (const btn of els.screen.querySelectorAll('[data-form-prev],[data-form-next]')) {
      btn.onclick = stop(() => {
        const key = btn.dataset.formPrev || btn.dataset.formNext;
        const delta = btn.dataset.formPrev ? -1 : 1;
        setFormPref(key, getFormPref(key) + delta);
        shopTab = 'dragons';
        ui.showScreen('shop');
      });
    }

    // Ascension: ▲ tier button inside dragon card
    for (const btn of els.screen.querySelectorAll('[data-ascend]')) {
      btn.onclick = stop(() => {
        const key = btn.dataset.ascend;
        const d = DRAGONS[key];
        const newTier = handlers.onAscend && handlers.onAscend(key);
        if (newTier) {
          ui.showScreen('shop');
          const resolvedDef = ascendedDef(d, newTier, radianceRank(key));
          ui.celebrate({
            kind: 'ascension', tier: 'big',
            title: `${d.name} Ascended`,
            subtitle: ASCENSION_TIERS[newTier - 1].name,
            renderPreview: (c) => attachPreviewCanvas(c, 'dragon', resolvedDef),
          });
        } else {
          const check = canAscend(key, d.cost);
          if (check.cost) needMore(check.cost, `${d.name} ascension`);
        }
      });
    }

    // Radiance: ✦ rank button inside dragon card
    for (const btn of els.screen.querySelectorAll('[data-ascend-radiance]')) {
      btn.onclick = stop(() => {
        const key = btn.dataset.ascendRadiance;
        const d = DRAGONS[key];
        const newRank = handlers.onBuyRadiance && handlers.onBuyRadiance(key);
        if (newRank) {
          ui.showScreen('shop');
          ui.celebrate({
            kind: 'radiance', tier: 'small', glyph: '✦',
            title: `Radiance Rank ${newRank}`,
            subtitle: d ? d.name : key,
          });
        } else {
          needMore(radianceCost(key), `${d ? d.name : key} radiance`);
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
    // Assist toggles (reticle / slow-mo): instant effect + score bonus
    for (const btn of els.screen.querySelectorAll('.seg-btn[data-assist]')) {
      btn.onclick = stop(() => {
        saveData.settings[btn.dataset.assist] = btn.dataset.val === '1';
        persist();
        ui.showScreen('settings');
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
