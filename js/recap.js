import { game } from './gameState.js';
import { saveData, xpToNext } from './save.js';
import { activeMissions } from './missions.js';
import { weeklyTrials } from './weekly.js';
import { nextMilestone } from './milestones.js';
import { DRAGONS } from './dragons.js';
import { RIDERS } from './riders.js';
import { TRACKS, trackUnlocked, sfx } from './sfx.js';
import { FLIGHTMARKS, flightmarkOwned } from './flightmarks.js';
import { ASCENSION_TIERS, ascensionTier, canAscend } from './ascension.js';

// Run Recap v2: the session's designed stopping point. One screen, strict
// hierarchy — records pop, the score counts up, the earnings ledger reveals
// line by line, then exactly ONE next goal. ui.js owns #screen and delegates
// the game-over rendering here; share buttons keep their ids and are wired
// by ui.js as before.

const REDUCED = globalThis.matchMedia &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- NEXT UP: the single nearest desirable goal -------------------------
// Priority: a nearly-done quest → a half-done weekly → a close milestone →
// the cheapest shop unlock → the next pilot level. Always returns a goal.
export function selectNextUp() {
  const quest = activeMissions()
    .map((m) => ({ ...m, frac: m.progress / m.def.target }))
    .filter((m) => m.frac >= 0.6 && m.frac < 1)
    .sort((a, b) => b.frac - a.frac)[0];
  if (quest) {
    return {
      icon: '◎', head: 'QUEST', label: quest.def.label,
      frac: quest.frac, sub: `${quest.progress} / ${quest.def.target} · ◆ ${quest.def.reward}`,
    };
  }

  const trial = weeklyTrials()
    .map((t) => ({ ...t, frac: t.progress / t.def.target }))
    .filter((t) => !t.done && t.frac >= 0.5)
    .sort((a, b) => b.frac - a.frac)[0];
  if (trial) {
    return {
      icon: '★', head: 'WEEKLY TRIAL', label: trial.def.label,
      frac: trial.frac, sub: `${trial.progress} / ${trial.def.target} · ◆ ${trial.def.reward} + title`,
    };
  }

  const ms = nextMilestone();
  if (ms && ms.runsAway <= 3) {
    return {
      icon: '▲', head: 'MILESTONE', label: `${ms.at.toLocaleString()}${ms.unit} ${ms.label}`,
      frac: ms.frac, sub: `${ms.have.toLocaleString()} / ${ms.at.toLocaleString()} · ◆ ${ms.reward}`,
    };
  }

  const shop = cheapestUnowned();
  if (shop) {
    const rate = Math.max(40, saveData.stats.totalEmbers / Math.max(saveData.stats.runs, 1));
    const need = shop.cost - saveData.embers;
    const runs = Math.max(1, Math.ceil(need / rate));
    return {
      icon: '⬡', head: 'UNLOCK', label: shop.name,
      frac: Math.min(1, saveData.embers / shop.cost),
      sub: `◆ ${need.toLocaleString()} to go — ≈${runs} run${runs > 1 ? 's' : ''} away`,
    };
  }

  if (ms) {
    return {
      icon: '▲', head: 'MILESTONE', label: `${ms.at.toLocaleString()}${ms.unit} ${ms.label}`,
      frac: ms.frac, sub: `${ms.have.toLocaleString()} / ${ms.at.toLocaleString()} · ◆ ${ms.reward}`,
    };
  }

  return {
    icon: '⬆', head: 'PILOT LEVEL', label: `Reach level ${saveData.level + 1}`,
    frac: Math.min(1, saveData.xp / xpToNext(saveData.level)),
    sub: `${saveData.xp} / ${xpToNext(saveData.level)} XP`,
  };
}

function cheapestUnowned() {
  const items = [];
  for (const [key, d] of Object.entries(DRAGONS)) {
    if (!saveData.skins.owned.includes(key)) items.push({ name: d.name, cost: d.cost });
  }
  for (const [key, r] of Object.entries(RIDERS)) {
    if (!saveData.riders.owned.includes(key)) items.push({ name: r.name, cost: r.cost });
  }
  TRACKS.forEach((t, i) => {
    if (!trackUnlocked(i)) items.push({ name: `”${t.name}” station`, cost: t.cost });
  });
  // Gate-met ascension steps (mastery metres earned; just needs embers)
  for (const [key, d] of Object.entries(DRAGONS)) {
    if (!saveData.skins.owned.includes(key)) continue;
    const check = canAscend(key, d.cost);
    if (!check.cost) continue; // tier >= 5
    if (check.flown >= check.gateMetres) {
      items.push({ name: `Ascend ${d.name} to ${ASCENSION_TIERS[ascensionTier(key)].name}`, cost: check.cost });
    }
  }
  // Cheapest unowned flightmark
  for (const mark of FLIGHTMARKS) {
    if (!flightmarkOwned(mark.id)) {
      items.push({ name: `${mark.name} trail`, cost: mark.cost });
      break;
    }
  }
  items.sort((a, b) => a.cost - b.cost);
  return items[0] || null;
}

export function nextUpCardHtml(n) {
  return `
    <div class="nextup-card">
      <div class="nextup-head">${n.icon} NEXT UP — ${n.head}</div>
      <div class="nextup-label">${n.label}</div>
      <div class="mission-bar${n.frac >= 0.85 && n.frac < 1 ? ' near' : ''}"><span style="width:${Math.round(Math.min(1, n.frac) * 100)}%"></span></div>
      <div class="nextup-sub">${n.sub}</div>
    </div>`;
}

// --- Recap HTML ----------------------------------------------------------

const CAUSE_TEXT = {
  wall:   'FLEW INTO THE CANYON WALL',
  gate:   'CLIPPED THE CRYSTAL WINDOW',
  shard:  'SHATTERED BY AN ICE SHARD',
  pillar: 'IMPALED ON AN ICE SPIKE',
  bar:    'SMASHED INTO AN ICE BEAM',
  ground: 'DRAGGED INTO THE WAVES',
};

function recordChips(sum, maxVisible = 3) {
  const chips = [];
  if (game.isNewHighScore) chips.push('★ HIGH SCORE');
  if (game.isNewBestDistance) chips.push('★ LONGEST FLIGHT');
  for (const r of sum.newRecords) {
    const v = r.key === 'longestCleanDist' ? `${r.value} m`
      : r.key === 'bestCombo' ? `×${r.value}` : r.value;
    chips.push(`★ ${r.label} ${v}`);
  }
  if (!chips.length) return '';
  const visible = chips.slice(0, maxVisible);
  const overflow = chips.length - maxVisible;
  const extra = overflow > 0
    ? `<span class="record-chip more-chip">+${overflow} MORE RECORDS</span>` : '';
  return `<div class="record-chips">${visible.map((c, i) =>
    `<span class="record-chip" style="animation-delay:${REDUCED ? 0 : i * 0.08}s">${c}</span>`).join('')}${extra}</div>`;
}

// The earnings ledger: ordered reveal items. Returns array of html strings.
// compact=true drops low-signal quest unlock rows (used on narrow screens).
function ledgerItems(sum, compact = false) {
  const items = [];
  const eb = sum.emberBreakdown;
  if (eb && eb.total > 0) {
    const bits = [`run ${eb.base}`];
    if (eb.gold) bits.push(`golden ${eb.gold}`);
    if (eb.rider) bits.push(`rider +${eb.rider}`);
    if (eb.firstFlight) bits.push(`first flight +${eb.firstFlight}`);
    if (eb.ascend) bits.push(`ascended +${eb.ascend}`);
    items.push(`<div class="earn-line ember-tally">◆ <b>+${eb.total}</b> embers
      <span class="earn-detail">${bits.join(' · ')}</span>
      <span class="earn-dim">(${saveData.embers.toLocaleString()} total)</span></div>`);
  }
  for (const r of sum.missionResults || []) {
    items.push(`<div class="earn-line mission-done-line">✓ ${r.def.label} <b>+◆${r.reward}</b></div>`);
  }
  if (!compact) {
    for (const u of sum.questUnlocks || []) {
      items.push(`<div class="earn-line quest-unlock">⊕ NEW QUEST — ${u.label}</div>`);
    }
  }
  for (const w of sum.weeklyResults || []) {
    items.push(`<div class="earn-line weekly-done">★ WEEKLY TRIAL — ${w.def.label} <b>+◆${w.reward}</b>${w.titleName ? ` <span class="title-won">«${w.titleName}»</span>` : ''}</div>`);
  }
  for (const m of sum.milestoneResults || []) {
    items.push(`<div class="earn-line milestone-line">▲ ${m.at.toLocaleString()}${m.unit} ${m.label} <b>+◆${m.reward}</b></div>`);
  }
  for (const f of sum.featResults || []) {
    items.push(`<div class="earn-line feat-line">⬢ FEAT — ${f.def.name} <b>+◆${f.def.reward}</b>${f.titleName ? ` <span class="title-won">«${f.titleName}»</span>` : ''}</div>`);
  }
  if (sum.levelUps > 0) {
    items.push(`<div class="earn-line levelup-badge">⬆ PILOT LEVEL ${saveData.level} <b>+◆${sum.levelEmbers}</b></div>`);
  }
  const d = sum.dailyResult;
  if (d && d.streakBonus > 0) {
    const flames = Math.min(saveData.daily.streak, 7);
    const row = Array.from({ length: flames }, (_, i) =>
      `<span class="flame" style="animation-delay:${i * 60}ms">🔥</span>`).join('');
    items.push(`<div class="earn-line streak-line">${saveData.daily.streak}-day streak <b>+◆${d.streakBonus}</b>${d.featherUsed ? ' <span class="earn-detail">— a Phoenix Feather carried your streak</span>' : ''}
      <span class="streak-flames">${row}</span></div>`);
  }
  return items;
}

export function buildRecapHtml(score, dist, { isTouch, ICONS }) {
  const sum = game.runSummary || {};
  const isCompact = window.innerWidth <= 700;
  const causeText = CAUSE_TEXT[game.deathCause] || '';
  const pb  = game.highScore;
  const gap = pb > score ? pb - score : 0;
  const pct = pb > 0 && gap > 0 ? Math.round((1 - gap / pb) * 100) : null;
  const maxSpd = Math.round(game.maxSpeed);

  // Pre-render all ledger items into the DOM before first paint so iOS WebKit's
  // backdrop-filter never sees post-paint DOM growth (ghosting bug).
  const items = ledgerItems(sum, isCompact);
  const interval = REDUCED ? 0 : Math.min(220, items.length ? 2000 / items.length : 0);
  const earnListHtml = `<div class="earn-list revealing" id="earn-list">${
    items.map((html, i) =>
      html.replace(/class="earn-line/, `class="earn-line" style="--d:${i * interval}ms"`)
    ).join('')
  }</div>`;

  return `
    <h1 class="bad">CRASHED!</h1>
    ${causeText ? `<p class="death-cause">${causeText}</p>` : ''}
    ${recordChips(sum)}
    <p class="sub big"><b class="count-up" id="score-countup" data-target="${score}">0</b> points</p>
    ${pb > 0 && !game.isNewHighScore ? `<p class="sub">Personal best: <b>${pb}</b></p>` : ''}
    ${gap > 0 ? `<p class="sub gap">Only <b>${gap}</b> pts away from your best${pct !== null && pct >= 60 ? ` (${pct}% there!)` : ''}</p>` : ''}
    ${challengeResultHtml(score)}
    ${game.scoreMult > 1.001 ? `<p class="hc-line">⚔ ASSISTS OFF — every point earned at +${Math.round((game.scoreMult - 1) * 100)}%</p>` : ''}
    ${earnListHtml}
    <div class="xp-wrap">
      <div class="xp-row"><span class="lvl">LV ${saveData.level}</span><span>+${sum.xpGained || 0} XP</span><span class="lvl">LV ${saveData.level + 1}</span></div>
      <div class="xp-bar"><span id="xp-fill"></span></div>
    </div>
    <div id="nextup-wrap">${nextUpCardHtml(sum.nextUp || selectNextUp())}</div>
    <div class="run-stats" id="run-stats">
      <div class="stat key-stat"><span class="stat-val">${dist} m</span><span class="stat-lbl">distance</span></div>
      <div class="stat key-stat"><span class="stat-val">${maxSpd}</span><span class="stat-lbl">top speed</span></div>
      <div class="stat key-stat"><span class="stat-val">${game.maxCombo.toFixed(2)}x</span><span class="stat-lbl">best combo</span></div>
      <div class="stat key-stat"><span class="stat-val">${game.ringsCollected}</span><span class="stat-lbl">rings</span></div>
      <div class="stat sec-stat"><span class="stat-val">${game.perfectRings}</span><span class="stat-lbl">perfect</span></div>
      <div class="stat sec-stat"><span class="stat-val">${game.nearMisses}</span><span class="stat-lbl">near misses</span></div>
      <div class="stat sec-stat"><span class="stat-val">${game.gauntletsClearedRun}</span><span class="stat-lbl">gauntlets</span></div>
      <div class="stat sec-stat"><span class="stat-val">${game.time.toFixed(1)}s</span><span class="stat-lbl">time</span></div>
      ${isCompact ? '<button class="stats-more-btn btn-tertiary" id="stats-more-btn">MORE ▾</button>' : ''}
    </div>
    <div class="action-row">
      <button id="btn-again" class="btn-primary">FLY AGAIN</button>
      <button id="btn-share" class="btn-secondary">SHARE &amp; CHALLENGE</button>
      <button id="btn-shop" class="btn-tertiary">⬡ SHOP</button>
    </div>
    <div class="share-menu" id="share-menu" hidden>
      <button id="share-ig"   title="Instagram">${ICONS.ig}</button>
      <button id="share-x"    title="X">${ICONS.x}</button>
      <button id="share-tt"   title="TikTok">${ICONS.tt}</button>
      <button id="share-link" title="Copy challenge link">${ICONS.link}</button>
    </div>
    <p class="share-hint" id="share-hint"></p>
    ${isTouch ? '' : '<p class="action-key">or press R to retry</p>'}`;
}

function challengeResultHtml(score) {
  if (!game.challengeScore) return '';
  return score > game.challengeScore
    ? `<p class="challenge won">CHALLENGE BEATEN! (beat ${game.challengeScore})</p>`
    : `<p class="challenge">Challenge: ${game.challengeScore} — not this time!</p>`;
}

// Wire the recap's animated parts. Returns the reveal duration in ms so the
// caller can delay arming blank-tap-to-restart until the queue settles.
export function wireRecap(screenEl, handlers) {
  // Score count-up — the slot-machine rollup: rising ticks while it climbs,
  // a settle pop + puff when the final number lands.
  const scoreEl = screenEl.querySelector('#score-countup');
  let revealMs = 0;
  if (scoreEl) {
    const target = Number(scoreEl.dataset.target) || 0;
    // Reserve the final width so the line never reflows while counting.
    scoreEl.style.minWidth = `${String(target).length}ch`;
    if (REDUCED || target < 200) {
      scoreEl.textContent = target;
    } else {
      const t0 = performance.now();
      const DUR = 800;
      let lastTick = 0;
      const step = (now) => {
        const k = Math.min((now - t0) / DUR, 1);
        scoreEl.textContent = Math.floor(target * (1 - Math.pow(1 - k, 3)));
        if (now - lastTick > 80) { lastTick = now; sfx.tick(k); }
        if (k < 1) {
          requestAnimationFrame(step);
        } else if (scoreEl.isConnected) {
          sfx.settle();
          scoreEl.classList.add('count-settle');
          const puff = document.createElement('span');
          puff.className = 'count-puff';
          scoreEl.parentElement.style.position = 'relative';
          scoreEl.parentElement.appendChild(puff);
          puff.addEventListener('animationend', () => puff.remove());
        }
      };
      requestAnimationFrame(step);
    }
  }

  // Earnings ledger: items are already in the DOM (pre-rendered in buildRecapHtml).
  // We schedule sound-only ticks to match the CSS animation-delay reveal timing.
  const list = screenEl.querySelector('#earn-list');
  if (list && !REDUCED) {
    const lines = list.querySelectorAll('.earn-line');
    if (lines.length > 0) {
      const interval = Math.min(220, 2000 / lines.length);
      lines.forEach((_, i) => {
        setTimeout(() => {
          if (!list.isConnected) return;
          sfx.tick(0.3);
        }, i * interval);
      });
      revealMs = lines.length * interval;
    }
  }

  // XP bar fill (paint at 0, then transition)
  const fill = screenEl.querySelector('#xp-fill');
  if (fill) {
    const xpFrac = Math.min(1, saveData.xp / xpToNext(saveData.level));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.width = `${xpFrac * 100}%`;
    }));
  }

  // MORE STATS toggle (compact screens only)
  const moreBtn = screenEl.querySelector('#stats-more-btn');
  const statsGrid = screenEl.querySelector('#run-stats');
  if (moreBtn && statsGrid) {
    moreBtn.onclick = (e) => {
      e.stopPropagation();
      const expanded = statsGrid.classList.toggle('expanded');
      moreBtn.textContent = expanded ? 'LESS ▴' : 'MORE ▾';
    };
  }

  return revealMs;
}

