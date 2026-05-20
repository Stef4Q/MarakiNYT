// Strands — NYT-style word-hunt.
// MOCKUP puzzle. Theme + spangram + theme words, every cell tiled.
// Engine drags through 8-direction neighbors; matching a theme-word
// path locks that word in; matching a real (non-theme) ≥4-letter word
// counts toward the hint meter.
window.STRANDS_DATA = {
  title: "Strands",
  theme: "Coffee shop",
  blurb: "Find the theme words. Drag through adjacent letters.",
  size: { rows: 8, cols: 6 },
  // Grid letters — each row is exactly `cols` chars wide.
  // (Designed so every cell belongs to exactly one theme word.)
  grid: [
    "ELATTE",
    "SMOCHA",
    "PMUFFI",
    "RCOOKN",
    "ESUGIE",
    "SBRACR",
    "SEMIKE",
    "OANLMA"
  ],
  // The "spangram" — the puzzle's centerpiece. Touches both vertical
  // edges (or both horizontal edges) of the grid.
  spangram: {
    word: "ESPRESSO",
    path: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0]]
  },
  // The theme words. Order doesn't matter — engine matches any.
  themeWords: [
    { word: "LATTE",  path: [[0,1],[0,2],[0,3],[0,4],[0,5]] },
    { word: "MOCHA",  path: [[1,1],[1,2],[1,3],[1,4],[1,5]] },
    { word: "MUFFIN", path: [[2,1],[2,2],[2,3],[2,4],[2,5],[3,5]] },
    { word: "COOKIE", path: [[3,1],[3,2],[3,3],[3,4],[4,4],[4,5]] },
    { word: "SUGAR",  path: [[4,1],[4,2],[4,3],[5,3],[5,2]] },
    { word: "BEAN",   path: [[5,1],[6,1],[7,1],[7,2]] },
    { word: "CREAM",  path: [[5,4],[5,5],[6,5],[7,5],[7,4]] },
    { word: "MILK",   path: [[6,2],[6,3],[7,3],[6,4]] }
  ],
  // Optional whitelist of common English ≥4-letter words to count as
  // "hint-eligible non-theme finds". Engine also accepts any word in
  // the built-in fallback dictionary (see strands.js).
  bonusWords: [
    "TEAS","HEAT","CHAT","MOAN","NAME","NAGS","MANE","NAPE","ROAM",
    "MILE","KILN","MAIN","RACE","CARE","CARS","COKE","LIME","RANK",
    "GOES","SAGE","REAP","REAR","SEAS","SETS","BARS","SCAR","SCAB"
  ]
};
