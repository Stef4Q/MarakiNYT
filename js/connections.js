// Connections engine
(function () {
  const DATA = window.CONNECTIONS_DATA;
  if (!DATA) return;

  const boardEl = document.getElementById('connBoard');
  const solvedEl = document.getElementById('connSolved');
  const dotsEl = document.getElementById('connDots');
  const submitBtn = document.getElementById('btnSubmit');
  const deselectBtn = document.getElementById('btnDeselect');
  const shuffleBtn = document.getElementById('btnShuffle');

  const TOTAL_MISTAKES = 4;
  let mistakes = 0;
  let selected = new Set();
  let solvedGroups = []; // array of group objects
  let tiles = []; // {word, group, el}

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function init() {
    tiles = [];
    DATA.groups.forEach(g => {
      g.words.forEach(w => {
        tiles.push({ word: w, group: g });
      });
    });
    shuffle(tiles);
    render();
  }

  function render() {
    boardEl.innerHTML = '';
    // Solved rows first
    solvedEl.innerHTML = '';
    solvedGroups.forEach(g => {
      const row = document.createElement('div');
      row.className = 'conn-solved-row';
      row.style.background = g.color;
      row.innerHTML = `<div class="sr-cat">${g.name}</div><div class="sr-words">${g.words.join(', ')}</div>`;
      solvedEl.appendChild(row);
    });

    // Remaining tiles
    const remaining = tiles.filter(t => !solvedGroups.includes(t.group));
    remaining.forEach(t => {
      const el = document.createElement('div');
      el.className = 'conn-tile' + (selected.has(t) ? ' selected' : '');
      el.textContent = t.word;
      el.addEventListener('click', () => toggleSelect(t));
      t.el = el;
      boardEl.appendChild(el);
    });

    // Dots
    dotsEl.innerHTML = '';
    for (let i = 0; i < TOTAL_MISTAKES; i++) {
      const d = document.createElement('span');
      d.className = 'conn-dot' + (i < mistakes ? ' spent' : '');
      dotsEl.appendChild(d);
    }

    submitBtn.disabled = selected.size !== 4;
    submitBtn.style.opacity = selected.size === 4 ? '1' : '0.5';
  }

  function toggleSelect(t) {
    if (selected.has(t)) selected.delete(t);
    else if (selected.size < 4) selected.add(t);
    render();
  }

  function submit() {
    if (selected.size !== 4) return;
    const groups = new Map();
    [...selected].forEach(t => groups.set(t.group, (groups.get(t.group) || 0) + 1));
    const [topGroup, topCount] = [...groups.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCount === 4) {
      solvedGroups.push(topGroup);
      selected.clear();
      render();
      if (solvedGroups.length === DATA.groups.length) {
        setTimeout(() => showModal('You got them all!', 'Four out of four. I love how your brain works.'), 400);
      }
    } else {
      // Shake
      [...selected].forEach(t => {
        if (t.el) t.el.classList.add('shake');
        setTimeout(() => t.el && t.el.classList.remove('shake'), 500);
      });
      mistakes++;
      if (topCount === 3) {
        setTimeout(() => showToast('One away…'), 600);
      }
      if (mistakes >= TOTAL_MISTAKES) {
        setTimeout(() => {
          // Reveal remaining groups
          DATA.groups.forEach(g => {
            if (!solvedGroups.includes(g)) solvedGroups.push(g);
          });
          selected.clear();
          render();
          showModal('So close!', "We'll get it next time.");
        }, 700);
      } else {
        setTimeout(render, 500);
      }
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

  submitBtn.addEventListener('click', submit);
  deselectBtn.addEventListener('click', () => { selected.clear(); render(); });
  shuffleBtn.addEventListener('click', () => { shuffle(tiles); render(); });

  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) document.getElementById('winModal')?.classList.remove('open');
    });
  });

  init();
})();
