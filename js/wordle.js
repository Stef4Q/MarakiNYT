// Wordle engine — with hard mode toggle.
(function () {
  const DATA = window.WORDLE_DATA;
  if (!DATA) return;

  const ROWS = 6;
  const COLS = 5;

  const boardEl = document.getElementById('wordleBoard');
  const kbdEl = document.getElementById('wordleKbd');
  const hardToggle = document.getElementById('hardModeToggle');

  // Today's word — index by date so it's stable per day
  const start = new Date('2026-01-01').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - start) / 86400000);
  const ANSWER = DATA.answers[((daysSince % DATA.answers.length) + DATA.answers.length) % DATA.answers.length].toUpperCase();

  let guesses = [];
  let current = '';
  let done = false;
  const keyStatus = {};

  // Hard mode — persist preference
  let hardMode = false;
  try { hardMode = localStorage.getItem('maraki_wordle_hard') === '1'; } catch(e){}
  if (hardToggle) {
    hardToggle.checked = hardMode;
    hardToggle.addEventListener('change', () => {
      // Only allow flipping ON before first guess; can always flip OFF
      if (hardToggle.checked && guesses.length > 0) {
        showToast('Hard mode can only be enabled before your first guess');
        hardToggle.checked = false;
        return;
      }
      hardMode = hardToggle.checked;
      try { localStorage.setItem('maraki_wordle_hard', hardMode ? '1' : '0'); } catch(e){}
    });
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('div');
      row.className = 'w-row';
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'w-cell';
        row.appendChild(cell);
      }
      boardEl.appendChild(row);
    }
  }

  function buildKbd() {
    const layout = ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
    kbdEl.innerHTML = '';
    layout.forEach(rowStr => {
      const rowEl = document.createElement('div');
      rowEl.className = 'w-row';
      for (const ch of rowStr) {
        const key = document.createElement('button');
        key.className = 'w-key' + (ch === '↵' || ch === '⌫' ? ' wide' : '');
        key.textContent = ch === '↵' ? 'Enter' : ch === '⌫' ? '⌫' : ch;
        key.dataset.key = ch;
        key.addEventListener('mousedown', (e) => e.preventDefault());
        key.addEventListener('click', () => handleKey(ch));
        rowEl.appendChild(key);
      }
      kbdEl.appendChild(rowEl);
    });
  }

  function scoreGuess(guess) {
    const target = ANSWER;
    const counts = {};
    for (const ch of target) counts[ch] = (counts[ch] || 0) + 1;
    const status = new Array(COLS).fill('absent');
    for (let i = 0; i < COLS; i++) {
      if (guess[i] === target[i]) { status[i] = 'correct'; counts[guess[i]]--; }
    }
    for (let i = 0; i < COLS; i++) {
      if (status[i] === 'correct') continue;
      if (counts[guess[i]] > 0) { status[i] = 'present'; counts[guess[i]]--; }
    }
    return status;
  }

  function render() {
    for (let r = 0; r < ROWS; r++) {
      const guess = guesses[r] || (r === guesses.length ? current : '');
      const status = r < guesses.length ? scoreGuess(guesses[r]) : null;
      for (let c = 0; c < COLS; c++) {
        const cell = boardEl.children[r].children[c];
        const ch = guess[c] || '';
        cell.textContent = ch;
        cell.classList.toggle('filled', !!ch);
        cell.classList.remove('correct', 'present', 'absent');
        if (status) cell.classList.add(status[c]);
      }
    }
    Object.entries(keyStatus).forEach(([k, st]) => {
      const btn = kbdEl.querySelector(`[data-key="${k}"]`);
      if (btn) {
        btn.classList.remove('correct', 'present', 'absent');
        btn.classList.add(st);
      }
    });
  }

  function updateKeyStatus(guess) {
    const status = scoreGuess(guess);
    for (let i = 0; i < COLS; i++) {
      const ch = guess[i];
      const s = status[i];
      const cur = keyStatus[ch];
      const rank = { correct: 3, present: 2, absent: 1 };
      if (!cur || rank[s] > rank[cur]) keyStatus[ch] = s;
    }
  }

  // Hard mode validation: any green letter must remain in same spot,
  // any yellow letter must appear somewhere in the new guess.
  function violatesHardMode(guess) {
    for (const prev of guesses) {
      const status = scoreGuess(prev);
      // Track yellow letter counts that still need to appear
      const need = {};
      for (let i = 0; i < COLS; i++) {
        if (status[i] === 'correct') {
          if (guess[i] !== prev[i]) {
            return `${ordinal(i + 1)} letter must be ${prev[i]}`;
          }
        }
      }
      // Now count present (yellow) letters that aren't covered by greens
      const guessCount = {};
      for (let i = 0; i < COLS; i++) guessCount[guess[i]] = (guessCount[guess[i]] || 0) + 1;
      for (let i = 0; i < COLS; i++) {
        if (status[i] === 'present') {
          need[prev[i]] = (need[prev[i]] || 0) + 1;
        }
      }
      for (const [ch, n] of Object.entries(need)) {
        if ((guessCount[ch] || 0) < n) {
          return `Guess must contain ${ch}`;
        }
      }
    }
    return null;
  }

  function ordinal(n) {
    return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th';
  }

  function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function showModal(title, body) {
    const modal = document.getElementById('winModal');
    if (!modal) return;
    modal.querySelector('h2').textContent = title;
    modal.querySelector('.modal-body').textContent = body;
    modal.classList.add('open');
  }

  function shakeRow(r) {
    const row = boardEl.children[r];
    if (!row) return;
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 500);
  }

  function handleKey(ch) {
    if (done) return;
    if (ch === '⌫' || ch === 'Backspace') {
      current = current.slice(0, -1);
      render();
    } else if (ch === '↵' || ch === 'Enter') {
      if (current.length !== COLS) { shakeRow(guesses.length); showToast('Not enough letters'); return; }
      const upper = current.toUpperCase();
      const validList = new Set([
        ...DATA.validGuesses.map(w => w.toUpperCase()),
        ...DATA.answers.map(w => w.toUpperCase())
      ]);
      if (!validList.has(upper)) { shakeRow(guesses.length); showToast('Not in word list'); return; }
      if (hardMode) {
        const violation = violatesHardMode(upper);
        if (violation) { shakeRow(guesses.length); showToast(violation); return; }
      }
      guesses.push(upper);
      updateKeyStatus(upper);
      const won = upper === ANSWER;
      current = '';
      render();
      if (won) {
        done = true;
        const t = window.GameTimer ? window.GameTimer.stop() : null;
        const tStr = t != null ? ` · ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}` : '';
        setTimeout(() => showModal('Got it! 🤍', `${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}${tStr}`), 350);
      } else if (guesses.length >= ROWS) {
        done = true;
        if (window.GameTimer) window.GameTimer.stop();
        setTimeout(() => showModal('So close', `The word was ${ANSWER}.`), 350);
      }
    } else if (/^[A-Z]$/.test(ch.toUpperCase()) && ch.length === 1) {
      if (current.length < COLS) {
        current += ch.toUpperCase();
        render();
      }
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Backspace') { handleKey('⌫'); e.preventDefault(); }
    else if (e.key === 'Enter') { handleKey('↵'); e.preventDefault(); }
    else if (/^[a-zA-Z]$/.test(e.key)) { handleKey(e.key); e.preventDefault(); }
  });

  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) document.getElementById('winModal')?.classList.remove('open');
    });
  });

  buildBoard();
  buildKbd();
  render();
})();
