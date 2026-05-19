// Crossword engine — works for any rectangular grid with "." (black) and letters.
// Loads data from window.CROSSWORD_DATA or window.MINI_DATA (via dataKey).

(function () {
  const dataKey = window.CW_DATA_KEY || 'CROSSWORD_DATA';
  const DATA = window[dataKey];
  if (!DATA) {
    console.error('Missing puzzle data:', dataKey);
    return;
  }

  const boardEl = document.getElementById('cwBoard');
  const clueBarEl = document.getElementById('cwClueBar');
  const acrossListEl = document.getElementById('acrossList');
  const downListEl = document.getElementById('downList');
  const titleEl = document.getElementById('puzzleTitle');
  const authorEl = document.getElementById('puzzleAuthor');

  if (titleEl) titleEl.textContent = DATA.title;
  if (authorEl) authorEl.textContent = 'By ' + DATA.author;

  const rows = DATA.size.rows;
  const cols = DATA.size.cols;
  const grid = DATA.grid;

  // Build cell metadata
  const cells = []; // { r, c, letter, isBlock, num, acrossNum, downNum, input, el }
  let counter = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      const isBlock = ch === '.';
      cells.push({
        r, c,
        letter: isBlock ? null : ch.toUpperCase(),
        isBlock,
        num: null,
        acrossNum: null,
        downNum: null,
        input: '',
        revealed: false,
        wrong: false
      });
    }
  }

  function at(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return null;
    return cells[r * cols + c];
  }

  // Assign clue numbers
  const acrossStarts = {}; // num -> [cells in word]
  const downStarts = {};

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = at(r, c);
      if (cell.isBlock) continue;
      const left = at(r, c - 1);
      const up = at(r - 1, c);
      const startsAcross = (!left || left.isBlock) && at(r, c + 1) && !at(r, c + 1).isBlock;
      const startsDown = (!up || up.isBlock) && at(r + 1, c) && !at(r + 1, c).isBlock;
      if (startsAcross || startsDown) {
        cell.num = counter;
        if (startsAcross) {
          const word = [];
          let cc = c;
          while (cc < cols && !at(r, cc).isBlock) { word.push(at(r, cc)); cc++; }
          acrossStarts[counter] = word;
          word.forEach(w => { w.acrossNum = counter; });
        }
        if (startsDown) {
          const word = [];
          let rr = r;
          while (rr < rows && !at(rr, c).isBlock) { word.push(at(rr, c)); rr++; }
          downStarts[counter] = word;
          word.forEach(w => { w.downNum = counter; });
        }
        counter++;
      }
    }
  }

  // Render board
  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  // Cap board size based on rows/cols
  const maxBoardSize = Math.min(560, window.innerWidth - 40);
  boardEl.style.maxWidth = maxBoardSize + 'px';
  boardEl.style.width = '100%';

  cells.forEach((cell) => {
    const el = document.createElement('div');
    el.className = 'cw-cell' + (cell.isBlock ? ' block' : '');
    if (!cell.isBlock) {
      if (cell.num) {
        const numEl = document.createElement('span');
        numEl.className = 'cell-num';
        numEl.textContent = cell.num;
        el.appendChild(numEl);
      }
      const letterEl = document.createElement('span');
      letterEl.className = 'cell-letter';
      el.appendChild(letterEl);
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onCellClick(cell);
      });
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onCellClick(cell);
      }, { passive: false });
    }
    cell.el = el;
    boardEl.appendChild(el);
  });

  // Render clue lists
  function renderClueList(listEl, startsMap, clueObj, dir) {
    listEl.innerHTML = '';
    const nums = Object.keys(startsMap).map(n => parseInt(n)).sort((a, b) => a - b);
    nums.forEach(num => {
      const li = document.createElement('li');
      li.dataset.num = num;
      li.dataset.dir = dir;
      const numSpan = document.createElement('span');
      numSpan.className = 'clue-num';
      numSpan.textContent = num;
      const text = document.createElement('span');
      text.className = 'clue-text';
      text.textContent = (clueObj && clueObj[num]) || '(clue missing)';
      li.appendChild(numSpan);
      li.appendChild(text);
      li.addEventListener('click', () => {
        const firstCell = startsMap[num][0];
        active = { dir, cell: firstCell };
        render();
      });
      listEl.appendChild(li);
    });
  }
  renderClueList(acrossListEl, acrossStarts, DATA.clues.across, 'across');
  renderClueList(downListEl, downStarts, DATA.clues.down, 'down');

  // Active selection state
  let active = null;
  // Find first non-block cell to start
  for (const cell of cells) {
    if (!cell.isBlock && cell.acrossNum) {
      active = { dir: 'across', cell };
      break;
    }
  }

  function onCellClick(cell) {
    if (cell.isBlock) return;
    if (active && active.cell === cell) {
      const other = active.dir === 'across' ? 'down' : 'across';
      if ((other === 'across' && cell.acrossNum) || (other === 'down' && cell.downNum)) {
        active.dir = other;
      }
    } else {
      let dir = active ? active.dir : 'across';
      if (dir === 'across' && !cell.acrossNum) dir = 'down';
      if (dir === 'down' && !cell.downNum) dir = 'across';
      active = { dir, cell };
    }
    render();
  }

  function currentWord() {
    if (!active) return [];
    const num = active.dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
    if (!num) return [active.cell];
    return active.dir === 'across' ? acrossStarts[num] : downStarts[num];
  }

  function render() {
    const word = currentWord();
    const wordSet = new Set(word);

    cells.forEach(cell => {
      if (cell.isBlock) return;
      const letterEl = cell.el.querySelector('.cell-letter');
      letterEl.textContent = cell.input || '';
      cell.el.classList.toggle('active', active && cell === active.cell);
      cell.el.classList.toggle('highlight', wordSet.has(cell) && cell !== (active && active.cell));
      cell.el.classList.toggle('wrong', cell.wrong);
      cell.el.classList.toggle('revealed', cell.revealed);
    });

    // Clue bar
    if (active) {
      const num = active.dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
      const clueText = num ? (DATA.clues[active.dir] && DATA.clues[active.dir][num]) : '';
      clueBarEl.querySelector('.clue-text').textContent =
        num ? `${num}${active.dir === 'across' ? 'A' : 'D'}. ${clueText || '(clue missing)'}` : '';
    }

    // Clue list highlight
    document.querySelectorAll('.cw-clue-list li').forEach(li => {
      li.classList.remove('active-clue', 'parallel-clue');
    });
    if (active) {
      const num = active.dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
      if (num) {
        const li = document.querySelector(`.cw-clue-list li[data-dir="${active.dir}"][data-num="${num}"]`);
        if (li) {
          li.classList.add('active-clue');
          li.scrollIntoView({ block: 'nearest' });
        }
      }
      const otherDir = active.dir === 'across' ? 'down' : 'across';
      const otherNum = otherDir === 'across' ? active.cell.acrossNum : active.cell.downNum;
      if (otherNum) {
        const li = document.querySelector(`.cw-clue-list li[data-dir="${otherDir}"][data-num="${otherNum}"]`);
        if (li) li.classList.add('parallel-clue');
      }
    }
  }

  function moveActive(dr, dc) {
    if (!active) return;
    let r = active.cell.r + dr;
    let c = active.cell.c + dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols) {
      const cell = at(r, c);
      if (!cell.isBlock) {
        active.cell = cell;
        active.dir = (dr === 0) ? 'across' : 'down';
        if (active.dir === 'across' && !cell.acrossNum) active.dir = 'down';
        if (active.dir === 'down' && !cell.downNum) active.dir = 'across';
        render();
        return;
      }
      r += dr; c += dc;
    }
  }

  function advance() {
    if (!active) return;
    const word = currentWord();
    const idx = word.indexOf(active.cell);
    // Move to next empty in word, else next cell in word, else stay
    for (let i = idx + 1; i < word.length; i++) {
      if (!word[i].input) {
        active.cell = word[i];
        render();
        return;
      }
    }
    if (idx + 1 < word.length) {
      active.cell = word[idx + 1];
      render();
    }
  }

  function backspaceCell() {
    if (!active) return;
    if (active.cell.input) {
      active.cell.input = '';
      active.cell.wrong = false;
      active.cell.revealed = false;
      render();
      checkComplete();
      return;
    }
    const word = currentWord();
    const idx = word.indexOf(active.cell);
    if (idx > 0) {
      active.cell = word[idx - 1];
      active.cell.input = '';
      active.cell.wrong = false;
      active.cell.revealed = false;
      render();
      checkComplete();
    }
  }

  function typeLetter(ch) {
    if (!active || active.cell.isBlock) return;
    active.cell.input = ch.toUpperCase();
    active.cell.wrong = false;
    active.cell.revealed = false;
    render();
    save();
    checkComplete();
    advance();
  }

  function save() {
    try {
      const key = 'maraki_cw_' + dataKey;
      const state = cells.map(c => c.isBlock ? '#' : (c.input || ''));
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {}
  }

  function load() {
    try {
      const key = 'maraki_cw_' + dataKey;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const state = JSON.parse(raw);
      state.forEach((v, i) => {
        if (v && v !== '#' && cells[i] && !cells[i].isBlock) cells[i].input = v;
      });
    } catch (e) {}
  }

  function checkComplete() {
    const done = cells.every(c => c.isBlock || (c.input && c.input === c.letter));
    if (done) {
      setTimeout(() => showWinModal(), 100);
    }
  }

  function showWinModal() {
    const modal = document.getElementById('winModal');
    if (modal) modal.classList.add('open');
  }

  // Toolbar actions
  document.getElementById('btnCheck')?.addEventListener('click', () => {
    cells.forEach(c => {
      if (c.isBlock || !c.input) return;
      c.wrong = c.input !== c.letter;
    });
    render();
    showToast('Checked');
  });
  document.getElementById('btnReveal')?.addEventListener('click', () => {
    if (!confirm('Reveal entire puzzle?')) return;
    cells.forEach(c => {
      if (c.isBlock) return;
      c.input = c.letter;
      c.revealed = true;
      c.wrong = false;
    });
    render();
    save();
    checkComplete();
  });
  document.getElementById('btnRevealWord')?.addEventListener('click', () => {
    currentWord().forEach(c => {
      c.input = c.letter;
      c.revealed = true;
      c.wrong = false;
    });
    render();
    save();
    checkComplete();
  });
  document.getElementById('btnClear')?.addEventListener('click', () => {
    if (!confirm('Clear all entries?')) return;
    cells.forEach(c => { c.input = ''; c.wrong = false; c.revealed = false; });
    render();
    save();
  });

  // Clue bar nav
  clueBarEl.querySelector('.clue-prev')?.addEventListener('click', () => prevWord());
  clueBarEl.querySelector('.clue-next')?.addEventListener('click', () => nextWord());

  function nextWord() {
    if (!active) return;
    const dir = active.dir;
    const map = dir === 'across' ? acrossStarts : downStarts;
    const nums = Object.keys(map).map(Number).sort((a,b)=>a-b);
    const curNum = dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
    const i = nums.indexOf(curNum);
    const nxt = nums[(i + 1) % nums.length];
    active.cell = map[nxt][0];
    render();
  }
  function prevWord() {
    if (!active) return;
    const dir = active.dir;
    const map = dir === 'across' ? acrossStarts : downStarts;
    const nums = Object.keys(map).map(Number).sort((a,b)=>a-b);
    const curNum = dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
    const i = nums.indexOf(curNum);
    const nxt = nums[(i - 1 + nums.length) % nums.length];
    active.cell = map[nxt][0];
    render();
  }

  // Keyboard input
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (/^[a-zA-Z]$/.test(k)) { typeLetter(k); e.preventDefault(); }
    else if (k === 'Backspace') { backspaceCell(); e.preventDefault(); }
    else if (k === 'ArrowRight') { moveActive(0, 1); e.preventDefault(); }
    else if (k === 'ArrowLeft') { moveActive(0, -1); e.preventDefault(); }
    else if (k === 'ArrowDown') { moveActive(1, 0); e.preventDefault(); }
    else if (k === 'ArrowUp') { moveActive(-1, 0); e.preventDefault(); }
    else if (k === ' ' || k === 'Tab') {
      if (active) {
        const other = active.dir === 'across' ? 'down' : 'across';
        if ((other === 'across' && active.cell.acrossNum) || (other === 'down' && active.cell.downNum)) {
          active.dir = other;
          render();
        }
      }
      e.preventDefault();
    } else if (k === 'Enter') {
      nextWord();
      e.preventDefault();
    }
  });

  // On-screen keyboard for touch
  const kbd = document.getElementById('cwKeyboard');
  if (kbd) {
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
    rows.forEach(rowStr => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kbd-row';
      for (const ch of rowStr) {
        const key = document.createElement('button');
        key.className = 'kbd-key' + (ch === '↵' || ch === '⌫' ? ' wide' : '');
        key.textContent = ch;
        key.addEventListener('click', (e) => {
          e.preventDefault();
          if (ch === '⌫') backspaceCell();
          else if (ch === '↵') nextWord();
          else typeLetter(ch);
        });
        rowEl.appendChild(key);
      }
      kbd.appendChild(rowEl);
    });
  }

  // Toast
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

  // Modal close
  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        document.getElementById('winModal')?.classList.remove('open');
      }
    });
  });

  // Init
  load();
  render();
})();
