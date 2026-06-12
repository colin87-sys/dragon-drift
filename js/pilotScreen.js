import { saveData } from './save.js';
import { FEAT_DEFS, featUnlockedAlready } from './feats.js';
import { TITLES, titleById } from './titles.js';
import { MILESTONES, masteryStarsFor, MASTERY_STARS } from './milestones.js';
import { DRAGONS } from './dragons.js';

// The PILOT screen: who you are in this game. Three tabs —
//   FEATS  : the achievement wall (locked ones show exactly what to do)
//   LOG    : lifetime flight log, personal records, dragon mastery stars
//   TITLES : equip the identity you've earned
// ui.js owns #screen and navigation; this module just renders + wires.

const CATS = [
  ['skill', 'SKILL'],
  ['journey', 'JOURNEY'],
  ['collection', 'COLLECTION'],
];

function featsBody() {
  return CATS.map(([cat, label]) => {
    const cards = FEAT_DEFS.filter((d) => d.cat === cat).map((d) => {
      const got = featUnlockedAlready(d.id);
      const title = d.title && titleById(d.title);
      return `
        <div class="feat-card${got ? ' got' : ''}">
          <div class="feat-mark">${got ? '⬢' : '⬡'}</div>
          <div class="feat-info">
            <div class="feat-name">${d.name}</div>
            <div class="feat-desc">${d.desc}</div>
          </div>
          <div class="feat-reward">◆ ${d.reward}${title ? `<span class="feat-title-tag">«${title.name}»</span>` : ''}</div>
        </div>`;
    }).join('');
    return `<div class="pilot-cat">${label}</div><div class="feat-grid">${cards}</div>`;
  }).join('');
}

function logBody() {
  const s = saveData.stats;
  const r = saveData.records;
  const stat = (val, lbl) =>
    `<div class="stat"><span class="stat-val">${val}</span><span class="stat-lbl">${lbl}</span></div>`;
  const km = (m) => (m / 1000).toFixed(1) + ' km';

  const lifetime = `
    <div class="pilot-cat">LIFETIME</div>
    <div class="run-stats pilot-stats">
      ${stat(s.runs, 'flights')}${stat(km(s.totalDist), 'flown')}
      ${stat(s.totalRings.toLocaleString(), 'rings')}${stat(s.totalPerfects.toLocaleString(), 'perfects')}
      ${stat(s.totalGates.toLocaleString(), 'windows')}${stat(s.totalNearMisses.toLocaleString(), 'near misses')}
      ${stat(s.gauntletsCleared, 'gauntlets')}${stat(s.totalGoldEmbers, 'golden embers')}
      ${stat(s.totalSurges, 'surges')}${stat(s.totalRolls, 'barrel rolls')}
      ${stat(s.totalEmbers.toLocaleString(), 'embers banked')}${stat(s.dailiesCompleted, 'dailies')}
    </div>`;

  const records = `
    <div class="pilot-cat">PERSONAL RECORDS</div>
    <div class="run-stats pilot-stats">
      ${stat(saveData.best.score.toLocaleString(), 'best score')}${stat(`${saveData.best.dist} m`, 'best flight')}
      ${stat(r.bestChain, 'best chain')}${stat(r.bestPerfectStreak, 'perfect streak')}
      ${stat(r.mostRingsRun, 'rings in a run')}${stat(r.bestCombo ? `×${r.bestCombo}` : '—', 'best combo')}
      ${stat(r.longestCleanDist ? `${r.longestCleanDist} m` : '—', 'clean flight')}${stat(r.bestDailyScore ? r.bestDailyScore.toLocaleString() : '—', 'best daily')}
    </div>`;

  const flownOf = (key) => {
    const e = saveData.mastery.flown.find((f) => f[0] === key);
    return e ? e[1] : 0;
  };
  const masteryRows = Object.entries(DRAGONS)
    .filter(([key]) => saveData.skins.owned.includes(key))
    .map(([key, d]) => {
      const m = flownOf(key);
      const stars = masteryStarsFor(m);
      const next = MASTERY_STARS[stars];
      const starStr = '★'.repeat(stars) + '☆'.repeat(MASTERY_STARS.length - stars);
      return `
        <div class="mastery-row">
          <span class="mastery-name">${d.name}</span>
          <span class="mastery-stars">${starStr}</span>
          <span class="mastery-dist">${km(m)}${next ? ` · next ★ at ${km(next[0])} (+◆${next[1]})` : ' · mastered'}</span>
        </div>`;
    }).join('');

  return lifetime + records + `
    <div class="pilot-cat">DRAGON MASTERY</div>
    <div class="mastery-list">${masteryRows}</div>
    <p class="pm-hint">Stars pay embers — every dragon remembers the miles you fly it.</p>`;
}

function titlesBody() {
  const equipped = saveData.titles.equipped;
  const rows = TITLES.map((t) => {
    const owned = saveData.titles.owned.includes(t.id);
    const sel = equipped === t.id;
    return `
      <div class="title-row${owned ? '' : ' locked'}${sel ? ' sel' : ''}" ${owned ? `data-title="${t.id}"` : ''}>
        <span class="title-name">«${t.name}»</span>
        <span class="title-src">${owned ? t.source : '🔒 ' + t.source}</span>
        <span class="title-state">${sel ? 'WORN' : owned ? 'TAP TO WEAR' : ''}</span>
      </div>`;
  }).join('');
  const none = `
      <div class="title-row${equipped ? '' : ' sel'}" data-title="">
        <span class="title-name">— no title —</span><span class="title-src"></span>
        <span class="title-state">${equipped ? 'TAP TO WEAR' : 'WORN'}</span>
      </div>`;
  return `<div class="title-list">${none}${rows}</div>
    <p class="pm-hint">Your title rides on the start screen and every share card.</p>`;
}

export function buildPilotHtml(tab) {
  const tabBtn = (key, label) =>
    `<button class="seg-btn${tab === key ? ' sel' : ''}" data-pilottab="${key}">${label}</button>`;
  const featCount = saveData.feats.unlocked.length;
  const body = tab === 'log' ? logBody() : tab === 'titles' ? titlesBody() : featsBody();
  return `
    <h1>PILOT</h1>
    <div class="meta-row">
      <div class="meta-chip">LV <b>${saveData.level}</b></div>
      ${saveData.titles.equipped ? `<div class="meta-chip title-chip">«${(titleById(saveData.titles.equipped) || {}).name || ''}»</div>` : ''}
      <div class="meta-chip">⬢ <b>${featCount}</b>/${FEAT_DEFS.length} feats</div>
      <div class="meta-chip"><span class="ember-ico">◆</span> <b>${saveData.embers.toLocaleString()}</b></div>
    </div>
    <div class="seg-row shop-tabs">${tabBtn('feats', '⬢ FEATS')}${tabBtn('log', '✈ FLIGHT LOG')}${tabBtn('titles', '« TITLES »')}</div>
    <div class="pilot-body">${body}</div>
    <div class="action-row"><button class="btn-secondary" id="btn-back">← BACK</button></div>`;
}

// Returns true if a re-render is needed (tab switch / title equip).
export function wirePilot(screenEl, { onTab, onEquipTitle }) {
  for (const btn of screenEl.querySelectorAll('.seg-btn[data-pilottab]')) {
    btn.onclick = (e) => { e.stopPropagation(); onTab(btn.dataset.pilottab); };
  }
  for (const row of screenEl.querySelectorAll('.title-row[data-title]')) {
    row.onclick = (e) => { e.stopPropagation(); onEquipTitle(row.dataset.title); };
  }
}
