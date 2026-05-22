// Strands — NYT-style word-hunt.
// Custom puzzle. Theme + spangram + theme words, every cell tiled.
// Engine drags through 8-direction neighbors; matching a theme-word
// path locks that word in; matching a real (non-theme) ≥4-letter word
// counts toward the hint meter.
window.STRANDS_DATA = {
  title: "Strands",
  theme: "In the not so distant future",
  blurb: "Find the theme words. Drag through adjacent letters.",
  size: { rows: 8, cols: 6 },
  // Grid letters — each row is exactly `cols` chars wide.
  // (Designed so every cell belongs to exactly one theme word.)
  grid: [
    "VGSTAA",
    "OUBIBD",
    "URYHAK",
    "LJAABU",
    "ISPERS",
    "AAIANI",
    "GCHALT",
    "MENINE"
  ],
  // The "spangram" — the puzzle's centerpiece. Touches both vertical
  // edges (or both horizontal edges) of the grid.
  spangram: {
    word: "VOULIAGMENI",
    path: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[7,1],[7,2],[7,3]]
  },
  // The theme words. Order doesn't matter — engine matches any.
  themeWords: [
    { word: "GSTAAD",  path: [[0,1],[0,2],[0,3],[0,4],[0,5],[1,5]] },
    { word: "BIBURY",  path: [[1,4],[1,3],[1,2],[1,1],[2,1],[2,2]] },
    { word: "HAKUBA",  path: [[2,3],[2,4],[2,5],[3,5],[3,4],[3,3]] },
    { word: "JASPER",  path: [[3,1],[3,2],[4,1],[4,2],[4,3],[4,4]] },
    { word: "SINAIA",  path: [[4,5],[5,5],[5,4],[5,3],[5,2],[5,1]] },
    { word: "CHALTEN", path: [[6,1],[6,2],[6,3],[6,4],[6,5],[7,5],[7,4]] }
  ],
  // Optional whitelist of common English ≥4-letter words to count as
  // "hint-eligible non-theme finds". Engine also accepts any word in
  // the built-in fallback dictionary (see strands.js).
  bonusWords: [
    "BEAR","BEAT","BEND","BIRD","BITE","BOND","BURN","EARN",
    "GAIN","GATE","GEAR","HAIR","HAND","HARD","HEAR","HEAT","IDEA",
    "JADE","LAND","LINE","MAIN","NAME","NEAR","RAIN","RISE","ROAD",
    "SAND","SANE","SING","STAR","TIDE","TURN","YEAR"
  ]
};
