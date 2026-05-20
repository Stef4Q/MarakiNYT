// Crossword engine — submit-only mode (no live grading).
// Loads data from window.CROSSWORD_DATA or window.MINI_DATA (via CW_DATA_KEY).

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
  const wordPreviewEl = document.getElementById('cwWordPreview');

  if (titleEl) titleEl.textContent = DATA.title;
  if (authorEl) authorEl.textContent = 'By ' + DATA.author;

  const rows = DATA.size.rows;
  const cols = DATA.size.cols;
  const grid = DATA.grid;

  const cells = [];
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
        wrong: false
      });
    }
  }

  function at(r, c) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return null;
    return cells[r * cols + c];
  }

  const acrossStarts = {};
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

  boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  const sideMax = Math.min(560, window.innerWidth - 40);
  const colMax = Math.min(sideMax, cols * 44);
  boardEl.style.maxWidth = colMax + 'px';
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
      el.addEventListener('mousedown', (e) => { e.preventDefault(); onCellClick(cell); });
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onCellClick(cell); }, { passive: false });
    }
    cell.el = el;
    boardEl.appendChild(el);
  });

  function renderClueList(listEl, startsMap, clueObj, dir) {
    if (!listEl) return;
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
        active = { dir, cell: startsMap[num][0] };
        render();
      });
      listEl.appendChild(li);
    });
  }
  renderClueList(acrossListEl, acrossStarts, DATA.clues.across, 'across');
  renderClueList(downListEl, downStarts, DATA.clues.down, 'down');

  let active = null;
  for (const cell of cells) {
    if (!cell.isBlock && cell.acrossNum) { active = { dir: 'across', cell }; break; }
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
    });

    if (active) {
      const num = active.dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
      const clueText = num ? (DATA.clues[active.dir] && DATA.clues[active.dir][num]) : '';
      clueBarEl.querySelector('.clue-text').textContent =
        num ? `${num}${active.dir === 'across' ? 'A' : 'D'}. ${clueText || '(clue missing)'}` : '';
    }

    document.querySelectorAll('.cw-clue-list li').forEach(li => {
      li.classList.remove('active-clue', 'parallel-clue');
    });
    if (active) {
      const num = active.dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
      if (num) {
        const li = document.querySelector(`.cw-clue-list li[data-dir="${active.dir}"][data-num="${num}"]`);
        if (li) { li.classList.add('active-clue'); scrollIntoList(li); }
      }
      const otherDir = active.dir === 'across' ? 'down' : 'across';
      const otherNum = otherDir === 'across' ? active.cell.acrossNum : active.cell.downNum;
      if (otherNum) {
        const li = document.querySelector(`.cw-clue-list li[data-dir="${otherDir}"][data-num="${otherNum}"]`);
        if (li) li.classList.add('parallel-clue');
      }
    }

    renderWordPreview(word);
  }

  // Scroll the active clue inside its own <ol> only — never the page.
  // This stops cell-taps from teleporting the viewport to the clue list.
  function scrollIntoList(li) {
    const ol = li.parentElement;
    if (!ol) return;
    const olRect = ol.getBoundingClientRect();
    const liRect = li.getBoundingClientRect();
    if (liRect.top < olRect.top) {
      ol.scrollTop += liRect.top - olRect.top - 4;
    } else if (liRect.bottom > olRect.bottom) {
      ol.scrollTop += liRect.bottom - olRect.bottom + 4;
    }
  }

  // Magnified strip showing the current word's letters — pinned above the
  // on-screen keyboard so users can see what they're typing without
  // squinting at the tiny grid cells.
  function renderWordPreview(word) {
    if (!wordPreviewEl) return;
    if (!active || !word || word.length <= 1) {
      wordPreviewEl.innerHTML = '';
      wordPreviewEl.classList.remove('visible');
      return;
    }
    wordPreviewEl.classList.add('visible');
    const num = active.dir === 'across' ? active.cell.acrossNum : active.cell.downNum;
    const labelText = num ? `${num}${active.dir === 'across' ? 'A' : 'D'}` : '';
    // Reuse existing DOM where possible to keep CSS transitions stable.
    const desiredLen = word.length + (labelText ? 1 : 0);
    while (wordPreviewEl.children.length > desiredLen) {
      wordPreviewEl.removeChild(wordPreviewEl.lastChild);
    }
    while (wordPreviewEl.children.length < desiredLen) {
      const span = document.createElement('span');
      wordPreviewEl.appendChild(span);
    }
    let i = 0;
    if (labelText) {
      const lbl = wordPreviewEl.children[i++];
      lbl.className = 'wp-label';
      lbl.textContent = labelText;
    }
    word.forEach((cell, idx) => {
      const box = wordPreviewEl.children[i++];
      const isActive = cell === active.cell;
      box.className = 'wp-box' + (isActive ? ' active' : '') + (cell.wrong ? ' wrong' : '');
      box.textContent = cell.input || '';
      box.dataset.idx = idx;
      box.onclick = () => { active.cell = cell; render(); };
    });
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
    for (let i = idx + 1; i < word.length; i++) {
      if (!word[i].input) { active.cell = word[i]; render(); return; }
    }
    if (idx + 1 < word.length) { active.cell = word[idx + 1]; render(); }
  }

  function backspaceCell() {
    if (!active) return;
    if (active.cell.input) {
      active.cell.input = '';
      active.cell.wrong = false;
      render();
      save();
      return;
    }
    const word = currentWord();
    const idx = word.indexOf(active.cell);
    if (idx > 0) {
      active.cell = word[idx - 1];
      active.cell.input = '';
      active.cell.wrong = false;
      render();
      save();
    }
  }

  function typeLetter(ch) {
    if (!active || active.cell.isBlock) return;
    active.cell.input = ch.toUpperCase();
    active.cell.wrong = false;
    render();
    save();
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
      const raw = localStorage.getItem('maraki_cw_' + dataKey);
      if (!raw) return;
      const state = JSON.parse(raw);
      state.forEach((v, i) => {
        if (v && v !== '#' && cells[i] && !cells[i].isBlock) cells[i].input = v;
      });
    } catch (e) {}
  }

  // Submit grading
  function gradeFromAnswers() {
    // Use DATA.answers.across/down where supplied; fall back to grid letters.
    const errors = [];
    cells.forEach(c => { c.wrong = false; });

    function gradeWord(dirCells, expected) {
      if (!expected) return;
      expected = expected.toUpperCase();
      for (let i = 0; i < dirCells.length; i++) {
        const cell = dirCells[i];
        const want = expected[i];
        if (!want) continue;
        if ((cell.input || '') !== want) {
          cell.wrong = true;
          errors.push(cell);
        }
      }
    }

    Object.entries(acrossStarts).forEach(([num, w]) => {
      const ans = (DATA.answers && DATA.answers.across && DATA.answers.across[num]) ||
                  w.map(c => c.letter).join('');
      gradeWord(w, ans);
    });
    Object.entries(downStarts).forEach(([num, w]) => {
      const ans = (DATA.answers && DATA.answers.down && DATA.answers.down[num]) ||
                  w.map(c => c.letter).join('');
      gradeWord(w, ans);
    });

    return errors.length;
  }

  document.getElementById('btnSubmit')?.addEventListener('click', () => {
    // Need a complete grid
    const empty = cells.some(c => !c.isBlock && !c.input);
    if (empty) {
      if (!confirm('Some squares are empty. Submit anyway?')) return;
    }
    const errors = gradeFromAnswers();
    render();
    if (errors === 0) {
      const t = window.GameTimer ? window.GameTimer.stop() : null;
      const tStr = t != null ? ` in ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}` : '';
      showWinModal(`You solved it${tStr} 🤍`, "Beautiful work.");
    } else {
      showToast(`${errors} ${errors === 1 ? 'square is' : 'squares are'} wrong`);
    }
  });

  document.getElementById('btnClear')?.addEventListener('click', () => {
    if (!confirm('Clear all entries?')) return;
    cells.forEach(c => { c.input = ''; c.wrong = false; });
    render();
    save();
  });

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
          active.dir = other; render();
        }
      }
      e.preventDefault();
    } else if (k === 'Enter') { nextWord(); e.preventDefault(); }
  });

  const kbd = document.getElementById('cwKeyboard');
  if (kbd) {
    const layout = ['QWERTYUIOP', 'ASDFGHJKL', '↵ZXCVBNM⌫'];
    layout.forEach(rowStr => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kbd-row';
      for (const ch of rowStr) {
        const key = document.createElement('button');
        key.className = 'kbd-key' + (ch === '↵' || ch === '⌫' ? ' wide' : '');
        key.textContent = ch;
        key.addEventListener('mousedown', (e) => e.preventDefault());
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

  function showWinModal(title, body) {
    const modal = document.getElementById('winModal');
    if (!modal) return;
    modal.querySelector('h2').textContent = title;
    const bodyEl = modal.querySelector('.modal-body');
    if (bodyEl) bodyEl.textContent = body;
    modal.classList.add('open');
  }

  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) document.getElementById('winModal')?.classList.remove('open');
    });
  });

  load();
  render();
})();
