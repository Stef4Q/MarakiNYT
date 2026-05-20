// The Mini — Level 1 · Warm Up
// 5x5 with 5 black squares. Based on a real NYT Mini (May 19 2026).
// Moderate difficulty. Three- to five-letter answers, plain clues.
window.MINI_LEVEL_1 = {
  id: 1,
  title: "Level 1 · Warm Up",
  author: "Stef",
  difficulty: "Moderate",
  blurb: "Five clues across, five down. Plain talk.",
  size: { rows: 5, cols: 5 },
  // "." = block. Each row is exactly cols wide.
  grid: [
    "DAILY",
    "RANGE",
    "ARUBA",
    "COST.",
    "ONE.."
  ],
  answers: {
    across: {
      1: "DAILY",
      6: "RANGE",
      7: "ARUBA",
      8: "COST",
      9: "ONE"
    },
    down: {
      1: "DRACO",
      2: "AARON",
      3: "INUSE",
      4: "LGBT",
      5: "YEA"
    }
  },
  clues: {
    across: {
      1: "How often the Mini comes out",
      6: "Difference between the highest and lowest values in a data set",
      7: "Caribbean island near Venezuela",
      8: "Price to pay",
      9: "Loneliest number, in song"
    },
    down: {
      1: "Constellation whose name comes from the Latin for \"dragon\"",
      2: "\"___ Burr, Sir\" (Hamilton number)",
      3: "Currently occupied, as a restroom",
      4: "Community honored by the GLAAD Media Awards, for short",
      5: "\"___ or nay?\""
    }
  }
};
