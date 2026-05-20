// Mini Hub — three-level picker with persistent unlock.
// URL flow:
//   mini.html              → shows the picker
//   mini.html?level=1|2|3  → boots the crossword engine for that level
//
// Level 2 unlocks once Level 1 is solved; Level 3 once Level 2 is solved.
// Best times + solved state persisted in localStorage.
(function () {
  const PROGRESS_KEY = 'maraki_mini_progress';

  const LEVELS = [
    { id: 1, key: 'MINI_LEVEL_1', data: window.MINI_LEVEL_1 },
    { id: 2, key: 'MINI_LEVEL_2', data: window.MINI_LEVEL_2 },
    { id: 3, key: 'MINI_LEVEL_3', data: window.MINI_LEVEL_3 }
  ];

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function isUnlocked(id, prog) { return id === 1 || !!prog[id - 1]; }
  function bestTime(id) {
    try {
      const raw = localStorage.getItem('maraki_mini_best_' + id);
      return raw ? parseInt(raw, 10) : null;
    } catch (e) { return null; }
  }
  function setBestTime(id, seconds) {
    try {
      const cur = bestTime(id);
      if (cur == null || seconds < cur) localStorage.setItem('maraki_mini_best_' + id, String(seconds));
    } catch (e) {}
  }
  function formatTime(s) {
    if (s == null) return '—';
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  // Called by the crossword engine when the player solves the puzzle.
  window.__markMiniSolved = function (id, seconds) {
    if (!id) return;
    const prog = loadProgress();
    prog[id] = true;
    saveProgress(prog);
    if (seconds != null) setBestTime(id, seconds);
  };

  // URL helpers
  function getLevelParam() {
    const m = location.search.match(/[?&]level=([123])/);
    return m ? parseInt(m[1], 10) : null;
  }

  function renderHub() {
    const prog = loadProgress();
    const hub = document.getElementById('miniHub');
    if (!hub) return;
    hub.innerHTML = '';

    const intro = document.createElement('div');
    intro.className = 'mini-hub-intro';
    intro.innerHTML = `
      <h2>The Mini · Three Levels</h2>
      <p class="mini-hub-sub">Clear each one to unlock the next. Tap a level to begin.</p>
    `;
    hub.appendChild(intro);

    const grid = document.createElement('div');
    grid.className = 'mini-hub-grid';
    LEVELS.forEach(({ id, data }) => {
      const unlocked = isUnlocked(id, prog);
      const solved = !!prog[id];
      const card = document.createElement(unlocked ? 'a' : 'div');
      card.className = 'mini-level-card' + (unlocked ? '' : ' locked') + (solved ? ' solved' : '');
      if (unlocked) card.href = '?level=' + id;
      const best = bestTime(id);
      card.innerHTML = `
        <div class="mlc-rank">${id}</div>
        <div class="mlc-body">
          <h3>${data ? data.title : 'Level ' + id}</h3>
          <p class="mlc-diff">${data ? data.difficulty : ''}</p>
          <p class="mlc-blurb">${data ? (data.blurb || '') : ''}</p>
          <div class="mlc-meta">
            ${solved
              ? '<span class="mlc-tag solved">✓ Solved</span>'
              : (unlocked ? '<span class="mlc-tag open">Open</span>' : '<span class="mlc-tag locked">Locked</span>')}
            <span class="mlc-best">Best: ${formatTime(best)}</span>
          </div>
        </div>
        <div class="mlc-arrow">${unlocked ? '→' : '🔒'}</div>
      `;
      grid.appendChild(card);
    });
    hub.appendChild(grid);

    const footer = document.createElement('div');
    footer.className = 'mini-hub-footer';
    footer.innerHTML = `<button class="btn btn-ghost" id="resetMiniProgress">Reset progress</button>`;
    hub.appendChild(footer);
    document.getElementById('resetMiniProgress').addEventListener('click', () => {
      if (!confirm('Reset Mini progress (unlocks, best times, saved entries)?')) return;
      try {
        localStorage.removeItem(PROGRESS_KEY);
        LEVELS.forEach(({ id, key }) => {
          localStorage.removeItem('maraki_cw_' + key);
          localStorage.removeItem('maraki_timer_mini_' + id);
          localStorage.removeItem('maraki_mini_best_' + id);
        });
      } catch (e) {}
      renderHub();
    });
  }

  // Boot
  const level = getLevelParam();
  if (level) {
    // Load the chosen level into the globals the crossword engine expects,
    // then add the engine script tag. Hub stays hidden.
    const lvl = LEVELS.find(l => l.id === level);
    if (lvl && lvl.data) {
      window.CW_DATA_KEY = lvl.key;
      window[lvl.key] = lvl.data;
      window.CROSSWORD_DATA = lvl.data;
      window.GAME_TIMER_KEY = 'mini_' + level;
      window.MINI_ACTIVE_LEVEL = level;

      // Hide the picker UI, show the game UI.
      document.addEventListener('DOMContentLoaded', () => {
        const hub = document.getElementById('miniHub');
        const game = document.getElementById('miniGame');
        if (hub) hub.style.display = 'none';
        if (game) game.style.display = '';
        // Update title pill
        const pill = document.getElementById('miniLevelPill');
        if (pill) pill.textContent = `Level ${level} · ${lvl.data.difficulty}`;
        // Wire "back to levels" button
        const back = document.getElementById('miniBackToHub');
        if (back) back.addEventListener('click', () => { location.href = 'mini.html'; });
      });
    }
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const game = document.getElementById('miniGame');
      if (game) game.style.display = 'none';
      renderHub();
    });
  }
})();
