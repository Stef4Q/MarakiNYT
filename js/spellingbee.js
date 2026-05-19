// Spelling Bee engine
(function () {
  const DATA = window.SB_DATA;
  if (!DATA) return;

  const center = DATA.center.toUpperCase();
  const outerOrig = DATA.outer.map(s => s.toUpperCase());
  let outer = [...outerOrig];
  const validSet = new Set(DATA.validWords.map(w => w.toUpperCase()));
  const pangramSet = new Set((DATA.pangrams || []).map(w => w.toUpperCase()));

  const inputEl = document.getElementById('sbInput');
  const hiveEl = document.getElementById('sbHive');
  const foundEl = document.getElementById('sbFound');
  const scoreEl = document.getElementById('sbScore');
  const rankEl = document.getElementById('sbRank');
  const barFillEl = document.getElementById('sbBarFill');
  const deleteBtn = document.getElementById('sbDelete');
  const shuffleBtn = document.getElementById('sbShuffle');
  const enterBtn = document.getElementById('sbEnter');

  let typed = '';
  let found = new Set();

  const maxScore = [...validSet].reduce((s, w) => s + scoreWord(w), 0);
  const ranks = [
    ['Beginner', 0],
    ['Good Start', 0.02],
    ['Moving Up', 0.05],
    ['Good', 0.08],
    ['Solid', 0.15],
    ['Nice', 0.25],
    ['Great', 0.40],
    ['Amazing', 0.50],
    ['Genius', 0.70],
    ['Queen Bee', 1.0]
  ];

  function scoreWord(w) {
    if (w.length === 4) return 1;
    let s = w.length;
    if (pangramSet.has(w)) s += 7;
    return s;
  }

  function totalScore() {
    return [...found].reduce((s, w) => s + scoreWord(w), 0);
  }

  function currentRank() {
    const pct = totalScore() / Math.max(1, maxScore);
    let r = ranks[0][0];
    for (const [name, thresh] of ranks) {
      if (pct >= thresh) r = name;
    }
    return r;
  }

  function renderInput() {
    inputEl.innerHTML = '';
    for (const ch of typed) {
      const s = document.createElement('span');
      s.className = 'typed' + (ch === center ? ' center' : '');
      s.textContent = ch;
      inputEl.appendChild(s);
    }
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    inputEl.appendChild(cursor);
  }

  function renderHive() {
    hiveEl.innerHTML = '';
    const positions = [
      { left: 35, top: -5 },
      { left: 130, top: -5 },
      { left: -10, top: 80 },
      { left: 175, top: 80 },
      { left: 35, top: 165 },
      { left: 130, top: 165 }
    ];
    outer.forEach((ch, i) => {
      const hex = document.createElement('div');
      hex.className = 'sb-hex';
      hex.style.left = positions[i].left + 'px';
      hex.style.top = positions[i].top + 'px';
      hex.textContent = ch;
      hex.addEventListener('click', () => addChar(ch));
      hiveEl.appendChild(hex);
    });
    const c = document.createElement('div');
    c.className = 'sb-hex center';
    c.style.left = '85px';
    c.style.top = '80px';
    c.textContent = center;
    c.addEventListener('click', () => addChar(center));
    hiveEl.appendChild(c);
  }

  function renderFound() {
    foundEl.innerHTML = '';
    const sorted = [...found].sort();
    sorted.forEach(w => {
      const li = document.createElement('li');
      li.textContent = w.toLowerCase() + (pangramSet.has(w) ? ' ✨' : '');
      foundEl.appendChild(li);
    });
    scoreEl.textContent = totalScore();
    rankEl.textContent = currentRank();
    barFillEl.style.width = Math.min(100, (totalScore() / Math.max(1, maxScore)) * 100) + '%';
  }

  function addChar(ch) {
    typed += ch;
    renderInput();
  }

  function backspace() {
    typed = typed.slice(0, -1);
    renderInput();
  }

  function submit() {
    const w = typed.toUpperCase();
    typed = '';
    renderInput();
    if (w.length < 4) return showToast('Too short');
    if (!w.includes(center)) return showToast('Missing center letter');
    const allowed = new Set([center, ...outer]);
    for (const ch of w) {
      if (!allowed.has(ch)) return showToast('Bad letters');
    }
    if (found.has(w)) return showToast('Already found');
    if (!validSet.has(w)) return showToast('Not in word list');
    found.add(w);
    if (pangramSet.has(w)) showToast('Pangram! ✨');
    else showToast('+' + scoreWord(w));
    save();
    renderFound();
  }

  function save() {
    try { localStorage.setItem('maraki_sb_found', JSON.stringify([...found])); } catch(e){}
  }
  function load() {
    try {
      const raw = localStorage.getItem('maraki_sb_found');
      if (raw) JSON.parse(raw).forEach(w => found.add(w));
    } catch(e){}
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
    setTimeout(() => toast.classList.remove('show'), 1200);
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'Backspace') { backspace(); e.preventDefault(); }
    else if (k === 'Enter') { submit(); e.preventDefault(); }
    else if (/^[a-zA-Z]$/.test(k)) { addChar(k.toUpperCase()); e.preventDefault(); }
  });

  deleteBtn.addEventListener('click', backspace);
  enterBtn.addEventListener('click', submit);
  shuffleBtn.addEventListener('click', () => {
    for (let i = outer.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [outer[i], outer[j]] = [outer[j], outer[i]];
    }
    renderHive();
  });

  load();
  renderInput();
  renderHive();
  renderFound();
})();
