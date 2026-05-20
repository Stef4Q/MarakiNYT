// Strands engine — drag through adjacent letters to spell words.
// Works on desktop (mouse) + mobile (touch). Smooth, no jank.
//
// Rules:
//   • A new word starts when you press on a cell.
//   • While the button/finger is down, dragging onto an 8-neighbor
//     cell extends the selected path. Backtracking (entering the
//     previous cell) shortens it.
//   • Release to submit. The submitted word is checked against:
//       1) the spangram, 2) theme words, 3) bonus / English words.
//   • Each non-theme valid word adds a notch to the hint meter.
//     Three notches = a hint becomes available; clicking it circles
//     the start of an unfound theme word.
//
// Notes for the mockup:
//   • A click (no drag) also enters letters — handy on desktop where
//     a single click followed by another on a neighbor extends the
//     path. Releasing OUTSIDE the board cancels.
//
(function () {
  const DATA = window.STRANDS_DATA;
  if (!DATA) { window.GAME_TIMER_SKIP = true; return; }

  const rows = DATA.size.rows;
  const cols = DATA.size.cols;

  const boardEl = document.getElementById('strBoard');
  const linesEl = document.getElementById('strLines');
  const currentEl = document.getElementById('strCurrent');
  const themeEl = document.getElementById('strTheme');
  const blurbEl = document.getElementById('strBlurb');
  const foundList = document.getElementById('strFoundList');
  const foundCountEl = document.getElementById('strFoundCount');
  const totalEl = document.getElementById('strTotal');
  const hintFill = document.getElementById('strHintFill');
  const hintBtn = document.getElementById('strHintBtn');

  themeEl.textContent = DATA.theme;
  if (blurbEl) blurbEl.textContent = DATA.blurb || '';

  // ────── State
  const allThemeWords = [{ ...DATA.spangram, isSpangram: true }, ...DATA.themeWords];
  const totalTheme = allThemeWords.length;
  totalEl.textContent = totalTheme;

  const cells = []; // 2D: cells[r][c]
  let path = [];   // current drag path of cell objects
  let dragging = false;
  let foundWords = new Set();      // theme words found
  let foundBonus = [];             // recent non-theme words
  let hintProgress = 0;            // 0..3
  let hintTargetWord = null;       // theme word whose start is currently circled
  let won = false;

  const HINT_FULL = 3;             // non-theme words required to unlock hint

  // Persisted state
  const STORE_KEY = 'maraki_strands_state';
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        found: [...foundWords],
        bonus: foundBonus,
        progress: hintProgress
      }));
    } catch (e) {}
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      (s.found || []).forEach(w => foundWords.add(w));
      foundBonus = s.bonus || [];
      hintProgress = s.progress || 0;
    } catch (e) {}
  }

  // ────── Build the board
  function buildBoard() {
    boardEl.innerHTML = '';
    // Belt-and-suspenders: set the grid layout inline so it sticks even if
    // the stylesheet hasn't applied yet (iOS Safari sometimes lays cells
    // out as block before the grid rule kicks in).
    boardEl.style.display = 'grid';
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardEl.style.gap = '6px';
    boardEl.style.width = '100%';
    for (let r = 0; r < rows; r++) {
      cells[r] = [];
      for (let c = 0; c < cols; c++) {
        const ch = DATA.grid[r][c].toUpperCase();
        const el = document.createElement('div');
        el.className = 'str-cell';
        el.dataset.r = r;
        el.dataset.c = c;
        const inner = document.createElement('span');
        inner.className = 'str-letter';
        inner.textContent = ch;
        el.appendChild(inner);
        boardEl.appendChild(el);
        cells[r][c] = { r, c, ch, el, theme: null };
      }
    }
    // Map each cell to which theme word it belongs to (for re-painting
    // when found).
    allThemeWords.forEach(tw => {
      tw.path.forEach(([r, c]) => { if (cells[r] && cells[r][c]) cells[r][c].theme = tw; });
    });
  }

  // ────── Cell hit-testing during drag
  function cellFromEvent(e) {
    const point = e.touches ? e.touches[0] : e;
    if (!point) return null;
    const el = document.elementFromPoint(point.clientX, point.clientY);
    if (!el) return null;
    const cellEl = el.closest('.str-cell');
    if (!cellEl || !boardEl.contains(cellEl)) return null;
    const r = parseInt(cellEl.dataset.r, 10);
    const c = parseInt(cellEl.dataset.c, 10);
    return cells[r][c];
  }
  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1 && !(a.r === b.r && a.c === b.c);
  }

  // ────── Drag handlers
  function beginPath(cell) {
    path = [cell];
    dragging = true;
    redraw();
  }
  function extendPath(cell) {
    if (!cell) return;
    // Backtrack: if entering the second-to-last cell, pop the last.
    if (path.length >= 2 && cell === path[path.length - 2]) {
      path.pop();
      redraw();
      return;
    }
    // Already in path: ignore.
    if (path.includes(cell)) return;
    const last = path[path.length - 1];
    if (!isAdjacent(last, cell)) return;
    path.push(cell);
    redraw();
  }
  function endPath() {
    if (!dragging) return;
    dragging = false;
    submitPath();
  }
  function cancelPath() {
    dragging = false;
    path = [];
    redraw();
  }

  // ────── Submission
  function pathWord() { return path.map(c => c.ch).join(''); }
  function pathKey(p) { return p.map(c => c.r + ',' + c.c).join('|'); }

  function submitPath() {
    if (path.length < 1) { redraw(); return; }
    const word = pathWord();
    if (path.length < 4) {
      // Too short — bounce and clear.
      flashPath('short');
      setTimeout(() => { path = []; redraw(); }, 280);
      return;
    }
    // Match against theme words (need exact path match — every cell)
    const tw = allThemeWords.find(t =>
      t.word === word &&
      t.path.length === path.length &&
      t.path.every(([r, c], i) => path[i].r === r && path[i].c === c)
    );
    if (tw) {
      if (foundWords.has(tw.word)) {
        flashPath('already');
        setTimeout(() => { path = []; redraw(); }, 280);
        return;
      }
      foundWords.add(tw.word);
      // Clear hint target if it was this word
      if (hintTargetWord === tw) hintTargetWord = null;
      paintFoundWord(tw);
      announce(tw.isSpangram ? 'Spangram! ' + tw.word : tw.word, 'theme');
      addFoundEntry(tw);
      path = [];
      redraw();
      saveState();
      maybeWin();
      return;
    }

    // Check non-theme valid word (hint progress)
    if (isBonusWord(word)) {
      if (!foundBonus.includes(word)) {
        foundBonus.push(word);
        hintProgress = Math.min(HINT_FULL, hintProgress + 1);
        announce(word + ' · +1 to hint', 'bonus');
        flashPath('bonus');
        renderMeter();
        saveState();
      } else {
        announce(word + ' · already found', 'bonus');
        flashPath('already');
      }
      setTimeout(() => { path = []; redraw(); }, 320);
      return;
    }

    // Not a word
    flashPath('miss');
    announce('Not a word', 'miss');
    setTimeout(() => { path = []; redraw(); }, 320);
  }

  function isBonusWord(word) {
    if (word.length < 4) return false;
    const list = (DATA.bonusWords || []).map(w => w.toUpperCase());
    if (list.includes(word.toUpperCase())) return true;
    // Fallback: a tiny stock list of common 4–6 letter English words for
    // demo. The user can expand DATA.bonusWords for the real puzzle.
    return COMMON_WORDS.has(word.toUpperCase());
  }

  // Tiny built-in dictionary of common 4–6 letter English words so the
  // mockup's hint mechanic feels real out of the box. (Replace with a
  // real dictionary in production.)
  const COMMON_WORDS = new Set([
    "ABLE","ACID","ACES","ACHE","ALSO","AREA","ARMS","ARMY","ATOM","AUNT","AWAY",
    "BABY","BACK","BAKE","BALL","BAND","BANK","BARE","BASE","BATH","BEAM","BEAR",
    "BEAT","BEER","BELL","BELT","BEND","BEST","BIKE","BILL","BIND","BIRD","BITE",
    "BLOB","BLOW","BLUE","BOAT","BODY","BOLD","BOLT","BOMB","BOND","BONE","BOOK",
    "BOOT","BORN","BOSS","BOTH","BOWL","BREW","BROW","BURN","BURY","BUSY",
    "CAKE","CALF","CALL","CALM","CAMP","CARD","CARE","CART","CASE","CASH","CAST",
    "CHAT","CHEW","CHIP","CITY","CLAY","CLIP","CLUB","COAL","COAT","CODE","COIN",
    "COLD","COLT","COME","COOK","COOL","COPE","COPY","CORE","CORN","COST","CREW",
    "CROP","CUFF","CULT","CURE","CURL","CYST",
    "DARK","DART","DATA","DATE","DAWN","DEAL","DEAR","DEEP","DENY","DESK","DIAL",
    "DICE","DIET","DIRT","DISH","DOOR","DOSE","DOVE","DOWN","DRAW","DRIP","DROP",
    "DRUG","DRUM","DULL","DUMP","DUSK","DUST","DUTY",
    "EACH","EARN","EASE","EAST","EASY","EDGE","EDIT","ELSE","EVEN","EVER","EVIL",
    "EYES",
    "FACE","FACT","FADE","FAIL","FAIR","FALL","FAME","FARM","FAST","FATE","FAUN",
    "FEAR","FEAT","FEED","FEEL","FEET","FELT","FILE","FILL","FILM","FIND","FINE",
    "FIRE","FIRM","FISH","FIST","FIVE","FLAG","FLAT","FLEE","FLEW","FLIP","FLOW",
    "FOOD","FOOT","FORK","FORM","FORT","FOUR","FREE","FROG","FROM","FUEL","FULL",
    "FUND","FUSE",
    "GAIN","GAME","GANG","GASP","GATE","GAVE","GEAR","GENE","GIFT","GIRL","GIVE",
    "GLAD","GLOW","GLUE","GOAL","GOES","GOLD","GOLF","GONE","GOOD","GRAB","GRAM",
    "GRAY","GREW","GRID","GRIM","GRIN","GRIP","GROW","GULF","GUNS","GURU","GUST",
    "GUTS",
    "HAIR","HALF","HALL","HALO","HAND","HANG","HARD","HARM","HASH","HATE","HAVE",
    "HEAD","HEAL","HEAP","HEAR","HEAT","HEEL","HELP","HERB","HERD","HERE","HERO",
    "HIDE","HIGH","HIKE","HILL","HINT","HOLD","HOLE","HOLY","HOME","HOOK","HOPE",
    "HORN","HOST","HOUR","HOWL","HUNG","HUNT","HURT","HUSH","HYMN",
    "IDEA","IDLE","INCH","INFO","INTO","IRON","ITEM",
    "JAZZ","JEEP","JOBS","JOIN","JOKE","JUMP","JUNK","JUST",
    "KEEN","KEEP","KEPT","KICK","KILL","KIND","KING","KISS","KITE","KNEE","KNEW",
    "KNIT","KNOB","KNOT","KNOW",
    "LACE","LACK","LADY","LAKE","LAMB","LAMP","LAND","LANE","LARK","LAST","LATE",
    "LEAD","LEAF","LEAN","LEAP","LEFT","LESS","LEVY","LIAR","LIFE","LIFT","LIKE",
    "LILY","LIME","LINE","LINK","LION","LIST","LIVE","LOAD","LOAF","LOAN","LOBE",
    "LOCK","LOFT","LONE","LONG","LOOK","LOOM","LOOP","LOSE","LOSS","LOST","LOUD",
    "LOVE","LUCK","LUMP","LUNG",
    "MADE","MAID","MAIL","MAIN","MAKE","MALE","MALL","MAMA","MANE","MANY","MARK",
    "MASK","MAST","MATE","MATH","MEAL","MEAN","MEAT","MELT","MEMO","MENU","MERE",
    "MICE","MILD","MILE","MILK","MILL","MIND","MINE","MINI","MINT","MISS","MIST",
    "MODE","MOLD","MOLE","MOMS","MOOD","MOON","MORE","MOSS","MOST","MOTH","MOVE",
    "MUCH","MUSE","MUST","MUTE",
    "NAIL","NAME","NEAR","NEAT","NECK","NEED","NEST","NEWS","NEXT","NICE","NIGH",
    "NINE","NODE","NONE","NOON","NORM","NOSE","NOTE","NOUN","NUDE","NUNS","NUTS",
    "OATH","ODDS","OILS","OKAY","OMEN","ONCE","ONLY","ONTO","OPEN","ORAL","ORCA",
    "OURS","OVAL","OVEN","OVER","OWES","OWLS","OWNS",
    "PACE","PACK","PAGE","PAID","PAIN","PAIR","PALE","PALM","PARK","PART","PASS",
    "PAST","PATH","PAVE","PAWN","PEAK","PEAR","PEAS","PEAT","PECK","PEEL","PEER",
    "PERK","PETS","PICK","PIER","PIES","PIGS","PILE","PILL","PINE","PINK","PINT",
    "PIPE","PITY","PLAN","PLAY","PLEA","PLOT","PLUG","PLUM","PLUS","POEM","POET",
    "POKE","POLE","POLL","POND","POOL","POOR","POPE","PORE","PORK","PORT","POSE",
    "POST","POUR","PRAY","PREP","PREY","PROP","PUFF","PULL","PUMP","PUNK","PURE",
    "PUSH",
    "QUAD","QUIT","QUIZ",
    "RACE","RACK","RAGE","RAID","RAIL","RAIN","RAKE","RAMP","RANG","RANK","RAPE",
    "RARE","RASH","RATE","READ","REAL","REAP","REAR","REDO","REED","REEF","REEK",
    "REIN","RELY","REND","RENT","REST","RICE","RICH","RIDE","RIFT","RING","RINK",
    "RIOT","RIPE","RISE","RISK","ROAD","ROAM","ROAR","ROBE","ROCK","RODE","ROLE",
    "ROLL","ROOF","ROOM","ROOT","ROPE","ROSE","ROSY","RUDE","RUIN","RULE","RUNG",
    "RUSH","RUST",
    "SACK","SAFE","SAGA","SAGE","SAID","SAIL","SAKE","SALE","SALT","SAME","SAND",
    "SANE","SANK","SAVE","SCAN","SCAR","SCAT","SEAL","SEAR","SEAS","SEAT","SEED",
    "SEEK","SEEM","SEEN","SELF","SELL","SEND","SENT","SHED","SHIN","SHIP","SHOE",
    "SHOP","SHOT","SHOW","SHUT","SICK","SIDE","SIGH","SIGN","SILK","SING","SINK",
    "SIRE","SITE","SIZE","SKIN","SKIP","SLAB","SLAM","SLAP","SLED","SLEW","SLID",
    "SLIM","SLIP","SLIT","SLOT","SLOW","SMOG","SNAP","SNOW","SOAP","SOFA","SOFT",
    "SOIL","SOLE","SOLO","SOME","SONG","SONS","SOON","SOOT","SORE","SORT","SOUL",
    "SOUP","SOUR","SPAN","SPAR","SPED","SPIN","SPIT","SPOT","SPUN","STAB","STAG",
    "STAR","STAY","STEM","STEP","STEW","STIR","STOP","STUB","STUD","SUCH","SUDS",
    "SUED","SUIT","SULK","SUNG","SUNK","SURE","SURF","SWAM","SWAP","SWAT","SWAY",
    "SWIM",
    "TACK","TAIL","TAKE","TALE","TALK","TALL","TAME","TANK","TAPE","TASK","TAUT",
    "TAXI","TEAM","TEAR","TEAS","TEEM","TELL","TEND","TENT","TERM","TEST","THAN",
    "THAT","THEM","THEN","THEY","THIN","THIS","THUD","THUG","TICK","TIDE","TIDY",
    "TIED","TIER","TIES","TILE","TILL","TIME","TINY","TIPS","TIRE","TOAD","TOLD",
    "TOLL","TONE","TONS","TOOK","TOOL","TOOT","TOPS","TORE","TORN","TOUR","TOWN",
    "TOYS","TRAM","TRAP","TRAY","TREE","TRIM","TRIO","TRIP","TROD","TRUE","TUBE",
    "TUNA","TUNE","TURF","TURN","TWIG","TWIN","TYPE",
    "UGLY","UNDO","UNIT","UPON","URGE","USED","USER","USES",
    "VAIN","VARY","VAST","VEIL","VEIN","VENT","VERY","VEST","VIBE","VICE","VIEW",
    "VILE","VINE","VISA","VOID","VOTE",
    "WADE","WAGE","WAIL","WAIT","WAKE","WALK","WALL","WAND","WANT","WARD","WARM",
    "WARN","WARP","WARS","WASH","WAVE","WAYS","WEAK","WEAR","WEAVE","WEED","WEEK",
    "WEEP","WELD","WELL","WENT","WERE","WEST","WHAT","WHEN","WHET","WHEW","WHEY",
    "WHIP","WHIR","WHOM","WICK","WIDE","WIFE","WILD","WILL","WILT","WIND","WINE",
    "WING","WINK","WIPE","WIRE","WISE","WISH","WITH","WOKE","WOLF","WOMB","WONT",
    "WOOD","WOOL","WORD","WORE","WORK","WORM","WORN","WRAP","WREN",
    "YARD","YARN","YAWN","YEAH","YEAR","YELL","YOGA","YOLK","YORE","YOUR","YULE",
    "ZERO","ZEST","ZONE","ZOOM"
  ]);

  // ────── Drawing
  function redraw() {
    // Letter highlights
    const inPath = new Set(path);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = cells[r][c];
        const el = cell.el;
        el.classList.toggle('selected', inPath.has(cell));
        el.classList.toggle('selected-head', path.length > 0 && path[path.length - 1] === cell);
        el.classList.remove('flash-bonus', 'flash-miss', 'flash-short', 'flash-already');
        // theme-found classes set in paintFoundWord
      }
    }
    drawSelectionLine();
    currentEl.textContent = pathWord();
  }

  function drawSelectionLine() {
    // SVG line connecting the selected cells.
    linesEl.innerHTML = '';
    if (path.length < 1) return;
    const rect = boardEl.getBoundingClientRect();
    linesEl.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    linesEl.style.width = rect.width + 'px';
    linesEl.style.height = rect.height + 'px';
    if (path.length < 2) return;
    const ptStr = path.map(cell => {
      const cr = cell.el.getBoundingClientRect();
      const x = cr.left - rect.left + cr.width / 2;
      const y = cr.top - rect.top + cr.height / 2;
      return `${x},${y}`;
    }).join(' ');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', ptStr);
    poly.setAttribute('class', 'str-select-line');
    linesEl.appendChild(poly);
  }

  function paintFoundWord(tw) {
    // Persistent SVG line for the found word's path
    const rect = boardEl.getBoundingClientRect();
    linesEl.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    linesEl.style.width = rect.width + 'px';
    linesEl.style.height = rect.height + 'px';
    const pts = tw.path.map(([r, c]) => {
      const el = cells[r][c].el;
      const cr = el.getBoundingClientRect();
      const x = cr.left - rect.left + cr.width / 2;
      const y = cr.top - rect.top + cr.height / 2;
      return `${x},${y}`;
    }).join(' ');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', pts);
    poly.setAttribute('class', tw.isSpangram ? 'str-found-line spangram' : 'str-found-line');
    linesEl.appendChild(poly);

    tw.path.forEach(([r, c]) => {
      cells[r][c].el.classList.add(tw.isSpangram ? 'found-spangram' : 'found-theme');
    });
  }

  function repaintAllFound() {
    // Clear lines and repaint everything (run on resize / re-render).
    linesEl.innerHTML = '';
    allThemeWords.forEach(tw => { if (foundWords.has(tw.word)) paintFoundWord(tw); });
    drawSelectionLine();
  }

  function flashPath(kind) {
    const cls = 'flash-' + kind;
    path.forEach(c => { c.el.classList.add(cls); });
  }

  function announce(msg, kind) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('toast-theme', 'toast-bonus', 'toast-miss');
    if (kind) toast.classList.add('toast-' + kind);
    toast.classList.add('show');
    clearTimeout(announce._t);
    announce._t = setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function addFoundEntry(tw) {
    const li = document.createElement('li');
    li.className = tw.isSpangram ? 'found-row spangram' : 'found-row';
    li.textContent = tw.word;
    foundList.appendChild(li);
    foundCountEl.textContent = foundWords.size;
  }

  function renderMeter() {
    const pct = (hintProgress / HINT_FULL) * 100;
    hintFill.style.width = pct + '%';
    hintBtn.classList.toggle('ready', hintProgress >= HINT_FULL);
    hintBtn.classList.toggle('dim', hintProgress < HINT_FULL);
  }

  function applyHint() {
    if (hintProgress < HINT_FULL) {
      announce('Find ' + (HINT_FULL - hintProgress) + ' more non-theme word' +
        (HINT_FULL - hintProgress === 1 ? '' : 's'), 'miss');
      return;
    }
    // Pick a theme word the player hasn't found and isn't currently
    // hinted. Highlight start cell.
    const candidate = allThemeWords.find(tw => !foundWords.has(tw.word) && tw !== hintTargetWord)
      || allThemeWords.find(tw => !foundWords.has(tw.word));
    if (!candidate) { announce("You've found them all!", 'theme'); return; }
    hintTargetWord = candidate;
    // Spend hint progress
    hintProgress = 0;
    renderMeter();
    saveState();
    // Highlight the start cell with a ring
    document.querySelectorAll('.str-cell.hint-start').forEach(el => el.classList.remove('hint-start'));
    const [sr, sc] = candidate.path[0];
    cells[sr][sc].el.classList.add('hint-start');
    announce('Hint placed', 'bonus');
  }

  function maybeWin() {
    if (foundWords.size === totalTheme) {
      won = true;
      const t = window.GameTimer ? window.GameTimer.stop() : null;
      const tStr = t != null ? `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}` : '';
      if (window.MarakiProgress) window.MarakiProgress.markSolved('strands');
      const modal = document.getElementById('winModal');
      if (modal) {
        modal.querySelector('h2').textContent = 'Genius 🤍';
        modal.querySelector('.modal-body').textContent =
          `All ${totalTheme} theme words found${t != null ? ' in ' + tStr : ''}.`;
        modal.classList.add('open');
      }
    }
  }

  // ────── Pointer events
  function onPointerDown(e) {
    e.preventDefault();
    const cell = cellFromEvent(e);
    if (!cell) return;
    beginPath(cell);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault();
    const cell = cellFromEvent(e);
    if (cell) extendPath(cell);
  }
  function onPointerUp(e) {
    if (!dragging) return;
    e.preventDefault();
    endPath();
  }

  boardEl.addEventListener('mousedown', onPointerDown);
  boardEl.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);
  window.addEventListener('touchcancel', cancelPath);

  // Click-anywhere hint button
  hintBtn.addEventListener('click', applyHint);

  // Reset
  document.getElementById('strReset').addEventListener('click', () => {
    if (!confirm('Reset Strands progress?')) return;
    foundWords.clear();
    foundBonus = [];
    hintProgress = 0;
    hintTargetWord = null;
    won = false;
    document.querySelectorAll('.str-cell').forEach(el => {
      el.classList.remove('found-theme', 'found-spangram', 'hint-start');
    });
    foundList.innerHTML = '';
    foundCountEl.textContent = 0;
    saveState();
    renderMeter();
    repaintAllFound();
    document.getElementById('winModal')?.classList.remove('open');
  });

  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) document.getElementById('winModal')?.classList.remove('open');
    });
  });

  // ────── Boot
  buildBoard();
  loadState();
  // Replay any found words
  foundCountEl.textContent = foundWords.size;
  allThemeWords.forEach(tw => {
    if (foundWords.has(tw.word)) {
      paintFoundWord(tw);
      addFoundEntry(tw);
    }
  });
  renderMeter();
  redraw();

  // Repaint on resize so SVG lines stay aligned to cells.
  let resizeT = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => repaintAllFound(), 80);
  });
})();
