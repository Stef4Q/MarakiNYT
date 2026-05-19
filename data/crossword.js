// Anniversary Crossword — PLACEHOLDER (4x4 word square).
// Replace this object with your real crossword later.
//
// Notes for replacing:
//   size.rows / size.cols can be any dimensions.
//   grid: 2D array — "." = black square, single uppercase letter = answer cell.
//   clues.across / clues.down keyed by clue number, auto-assigned by engine
//     (top-to-bottom, left-to-right; a cell gets a number if it starts a word).
window.CROSSWORD_DATA = {
  title: "The Crossword · Anniversary Edition",
  author: "Stef",
  size: { rows: 4, cols: 4 },
  grid: [
    ["L", "O", "V", "E"],
    ["O", "P", "E", "N"],
    ["V", "E", "N", "T"],
    ["E", "N", "D", "S"]
  ],
  clues: {
    across: {
      1: "What this whole site is about",
      5: "Welcoming, like your smile",
      6: "Let off some steam",
      7: "Finishes — or split ___ (hairstyle)"
    },
    down: {
      1: "Same as 1-Across — that's the theme",
      2: "Not closed",
      3: "Sell at a stall",
      4: "Tolkien's tree-folk"
    }
  }
};
