// Wordle engine
(function () {
  const DATA = window.WORDLE_DATA;
  if (!DATA) return;

  const ROWS = 6;
  const COLS = 5;

  const boardEl = document.getElementById('wordleBoard');
  const kbdEl = document.getElementById('wordleKbd');

  // Today's word — index by date so it's stable per day
  const start = new Date('2026-01-01').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today.getTime() - start) / 86400000);
  const ANSWER = DATA.answers[((daysSince % DATA.answers.length) + DATA.answers.length) % DATA.answers.length].toUpperCase();

  let guesses = []; // array of strings
  let current = '';
  let done = false;
  const keyStatus = {}; // letter -> 'correct' | 'present' | 'absent'

  function buildBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('div');
      row.className = 'w-row';
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'w-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        row.appendChild(cell);
      }
      boardEl.appendChild(row);
    }
  }

  function buildKbd() {
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
    kbdEl.innerHTML = '';
    rows.forEach(rowStr => {
      const rowEl = document.createElement('div');
      rowEl.className = 'w-row';
      for (const ch of rowStr) {
        const key = document.createElement('button');
        key.className = 'w-key' + (ch === '↵' || ch === '⌫' ? ' wide' : '');
        key.textContent = ch === '↵' ? 'Enter' : ch === '⌫' ? 'Back' : ch;
        key.dataset.key = ch;
        key.addEventListener('click', () => handleKey(ch));
        rowEl.appendChild(key);
      }
      kbdEl.appendChild(rowEl);
    });
  }

  function render() {
    for (let r = 0; r < ROWS; r++) {
      const guess = guesses[r] || (r === guesses.length ? current : '');
      for (let c = 0; c < COLS; c++) {
        const cell = boardEl.children[r].children[c];
        const ch = guess[c] || '';
        cell.textContent = ch;
        cell.classList.toggle('filled', !!ch);
        cell.classList.remove('correct', 'present', 'absent');
        if (r < guesses.length) {
          const status = scoreLetter(guesses[r], c);
          if (status) cell.classList.add(status);
        }
      }
    }
    // Keyboard colors
    Object.entries(keyStatus).forEach(([k, st]) => {
      const btn = kbdEl.querySelector(`[data-key="${k}"]`);
      if (btn) {
        btn.classList.remove('correct', 'present', 'absent');
        btn.classList.add(st);
      }
    });
  }

  function scoreLetter(guess, idx) {
    const target = ANSWER;
    const counts = {};
    for (const ch of target) counts[ch] = (counts[ch] || 0) + 1;
    const status = new Array(COLS).fill('absent');
    // First pass: correct
    for (let i = 0; i < COLS; i++) {
      if (guess[i] === target[i]) {
        status[i] = 'correct';
        counts[guess[i]]--;
      }
    }
    // Second pass: present
    for (let i = 0; i < COLS; i++) {
      if (status[i] === 'correct') continue;
      if (counts[guess[i]] > 0) {
        status[i] = 'present';
        counts[guess[i]]--;
      }
    }
    return status[idx];
  }

  function updateKeyStatus(guess) {
    for (let i = 0; i < COLS; i++) {
      const ch = guess[i];
      const s = scoreLetter(guess, i);
      const cur = keyStatus[ch];
      // Priority: correct > present > absent
      const rank = { correct: 3, present: 2, absent: 1 };
      if (!cur || rank[s] > rank[cur]) keyStatus[ch] = s;
    }
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
    setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function showModal(title, body) {
    const modal = document.getElementById('winModal');
    if (!modal) return;
    modal.querySelector('h2').textContent = title;
    modal.querySelector('.modal-body').textContent = body;
    modal.classList.add('open');
  }

  function handleKey(ch) {
    if (done) return;
    if (ch === '⌫' || ch === 'Backspace') {
      current = current.slice(0, -1);
      render();
    } else if (ch === '↵' || ch === 'Enter') {
      if (current.length !== COLS) { showToast('Not enough letters'); return; }
      const valid = DATA.validGuesses.map(w => w.toUpperCase()).includes(current) || DATA.answers.map(w => w.toUpperCase()).includes(current);
      if (!valid) { showToast('Not in word list'); return; }
      guesses.push(current);
      updateKeyStatus(current);
      const won = current === ANSWER;
      current = '';
      render();
      if (won) {
        done = true;
        setTimeout(() => showModal('Got it! 🤍', `${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}. You're brilliant.`), 400);
      } else if (guesses.length >= ROWS) {
        done = true;
        setTimeout(() => showModal('So close', `The word was ${ANSWER}.`), 400);
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
