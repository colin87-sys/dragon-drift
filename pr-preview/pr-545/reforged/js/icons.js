// icons.js — the EMBERLINE line-icon set (U7: the one icon system; emoji and
// platform-variable dingbats are evicted from the DOM UI). Inline SVG only —
// 100% procedural, currentColor-driven, sized per call-site via CSS.
export const ICONS = {
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
  rush:     '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2L4 10h4l-1 6 6-8h-4l1-6z"/></svg>',
  weekly:   '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.2h7v2.6a3.5 3.5 0 0 1-7 0z"/><path d="M5.5 4.2H4a1.6 1.6 0 0 0 1.6 1.9M12.5 4.2H14a1.6 1.6 0 0 1-1.6 1.9"/><path d="M9 9.4v2.3M6.8 14.6h4.4l-.6-2.9H7.4z"/></svg>',
  // PILOT tab glyphs (menu-header consistency pass): the ✈/«» dingbats get
  // line-icon replacements — an open logbook for FLIGHT LOG, a medal rosette
  // for TITLES (FEATS reuses `feat` above). Same 18-grid, 1.6 stroke style.
  log:      '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4.4C7.8 3.3 6 3 3.4 3.2v10.4c2.6-.2 4.4.1 5.6 1.2 1.2-1.1 3-1.4 5.6-1.2V3.2C12 3 10.2 3.3 9 4.4z"/><path d="M9 4.4v10.4"/></svg>',
  laurel:   '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="6.8" r="4"/><path d="M6.7 10.2l-1.3 5 3.6-2 3.6 2-1.3-5"/></svg>',
  play:     '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 4.8c0-1 1.1-1.6 2-1.1l11 6.3c.9.5.9 1.8 0 2.3L9 18.6c-.9.5-2-.1-2-1.1z"/></svg>',
  // U7 — emoji eviction: the platform-variable glyphs (🔒 ♪ 🪶 🔥 ☀ ⟲ ◀▶‹›✕)
  // get consistent line-icon replacements in the established style.
  lock:     '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="10" height="7.5" rx="1.6"/><path d="M6 8V6a3 3 0 0 1 6 0v2"/></svg>',
  close:    '<svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9"/></svg>',
  // EMBERSIGHT H5 — the stroked WARNING triangle (§B.9): retires the ⚠ emoji on
  // the boss WARNING + spell card. Bang inside a rounded triangle, currentColor.
  warn:     '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2 22 20.2H2z"/><path d="M12 9.5v4.4"/><path d="M12 17.2h.01"/></svg>',
  chevL:    '<svg viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 3.5L5.5 9l5.5 5.5"/></svg>',
  chevR:    '<svg viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5L12.5 9 7 14.5"/></svg>',
  chevD:    '<svg viewBox="0 0 18 18" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7L9 12.5 14.5 7"/></svg>',
  chevU:    '<svg viewBox="0 0 18 18" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11L9 5.5 14.5 11"/></svg>',
  rotate:   '<svg viewBox="0 0 18 18" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 9a5.5 5.5 0 1 1-1.8-4.1"/><path d="M14.7 1.8v3.4h-3.4"/></svg>',
  flame:    '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2.4c1.6 2.5 4.6 4.1 4.6 7.4A4.6 4.6 0 0 1 4.4 9.8c0-1.5.7-2.7 1.6-3.8 0 1.3.7 2 1.5 2C6.8 5.6 8.6 4.4 9 2.4z"/></svg>',
  feather:  '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.6 3.4c-3.8-.6-8.2 1.6-9.6 5.6-.8 2.2-.6 4.6-.6 4.6s2.4.3 4.6-.6c4-1.4 6.2-5.8 5.6-9.6z"/><path d="M3.4 14.6L11 7"/></svg>',
  sun:      '<svg viewBox="0 0 18 18" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="3.4"/><path d="M9 1.6v2M9 14.4v2M1.6 9h2M14.4 9h2M3.8 3.8l1.4 1.4M12.8 12.8l1.4 1.4M14.2 3.8l-1.4 1.4M5.2 12.8l-1.4 1.4"/></svg>',
  // EMBERSIGHT H2 — the ember gem (◆ text glyph evicted from the HUD Tally):
  // a faceted lozenge, currentColor, sized per call-site.
  ember:    '<svg viewBox="0 0 18 18" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M9 1.8L15.4 9 9 16.2 2.6 9z"/><path d="M5.4 9L9 5.2 12.6 9 9 12.8z" fill="currentColor" stroke="none" opacity="0.55"/></svg>',
};
