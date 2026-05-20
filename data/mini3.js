// The Mini — Level 3 · Decade of Chaos
// 6x6 with 4 corner black squares. Theme: 2020s.
// Across answers are real, themed words — clues are deliberately
// misleading (the obvious meaning is the wrong one). Down answers are
// placeholder fill so the engine has something to grade against. Swap
// them out when you send the real puzzle.
window.MINI_LEVEL_3 = {
  id: 3,
  title: "Level 3 · Decade of Chaos",
  author: "Stef",
  difficulty: "Wicked",
  blurb: "Six by six. The 2020s. Every clue is a trap.",
  size: { rows: 6, cols: 6 },
  // 6 rows × 6 cols. "." = block. Four corner blocks only (3/4 max budget).
  grid: [
    ".MASK.",
    "ZOOMED",
    "ARCANE",
    "PESTLE",
    "PIETAS",
    ".ELON."
  ],
  answers: {
    across: {
      1: "MASK",
      5: "ZOOMED",
      6: "ARCANE",
      7: "PESTLE",
      8: "PIETAS",
      9: "ELON"
    }
    // Down answers fall back to grid letters automatically.
  },
  clues: {
    across: {
      1: "Halloween prop, surely?  (4)",
      5: "Caught snacking on a work call  (6)",
      6: "Mysterious — also a Netflix hit from this decade  (6)",
      7: "Tool for crushing herbs — also a verb made famous on TikTok  (6)",
      8: "Sculptural laments — the most-Instagrammed Michelangelo  (6)",
      9: "Tech billionaire whose tweets crashed a stock  (4)"
    },
    down: {
      // PLACEHOLDER clues — replace when the real puzzle drops.
      // Letters are derived from the grid above so the puzzle still grades.
      1: "(placeholder · MOREIE)",
      2: "(placeholder · AOCSEL)",
      3: "(placeholder · SMATTO)",
      4: "(placeholder · KENLAN)",
      5: "(placeholder · ZAPP)",
      6: "(placeholder · DEES)"
    }
  }
};
