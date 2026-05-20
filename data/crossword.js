// The Crossword — anniversary edition.
//
// CLUES are final. GRID still TODO — paste the grid in `grid` below
// as one string per row, with "." for black squares and a letter for
// each filled cell. Engine auto-numbers from grid + matches to clues.
//
// answers: optional. If supplied, used by Submit to score the puzzle
// even before the grid is in. (Lets you start solving right away.)
//
window.CROSSWORD_DATA = {
  title: "The Crossword · Anniversary Edition",
  author: "Stef",

  // ───── GRID — replace these placeholder rows with the real 30-wide × 36-tall grid ─────
  // Each row is a string. "." = black square, A–Z = filled cell.
  // Length of every row must equal size.cols.
  size: { rows: 4, cols: 4 },
  grid: [
    "LOVE",
    "OPEN",
    "VENT",
    "ENDS"
  ],

  // ───── ANSWERS — used to grade Submit even before the full grid lands. ─────
  answers: {
    across: {
      5:  "CLUJ",
      8:  "INCEPTION",
      13: "ANDREI",
      14: "PEONY",
      17: "SIFNOS",
      18: "GALAKTOBOUREKO",
      20: "PUPIC",
      27: "BACAU",
      29: "TOOTING",
      30: "VIVALAVIDA",
      31: "GREASY",
      35: "BLUEBELL",
      37: "PRET",
      38: "PARIS",
      39: "EYE",
      42: "KALIMERA",
      43: "VANGELIS",
      46: "GREECE",
      48: "LATENESS",
      50: "GREEK",
      53: "SANTA",
      54: "GRAPES",
      56: "CLAUDIU",
      58: "WARWICK",
      59: "DACHSHUND",
      61: "STEFANAKO",
      63: "VASSO",
      65: "VODKA",
      69: "WAKEMEUP",
      71: "KARDIA",
      73: "PAROS",
      74: "GEORGE",
      75: "ZERO",
      77: "JUNE",
      78: "TEIUBESC",
      79: "DARK"
    },
    down: {
      // Down answers will be inferred from the grid once you paste it in.
      // If you also want to lock specific down answers for Submit grading
      // before the grid arrives, drop them here as { 1: "SAGAPO", ... }.
    }
  },

  // ───── CLUES — finalized ─────
  clues: {
    across: {
      5:  "Where Andrei and Fabi nearly woke up  (4)",
      8:  "Their cinema debut: is it still spinning?  (9)",
      13: "Close in name to an apostle; a friend indeed  (6)",
      14: "Round, romantic, around in May  (5)",
      17: "Pottery, capers, and especially good thoughts  (6)",
      18: "Arrives in her bag unannounced  (14)",
      20: "Romanian; small, sweet, frequent  (5)",
      27: "Where his roots took hold  (5)",
      29: "South of the river  (7)",
      30: "Three word anthem; one word in the grid  (10)",
      31: "First word of the burger that ruined all others  (6)",
      35: "Named for a flower; where the penny — and the petal — dropped  (8)",
      37: "Just hits  (4)",
      38: "Despite the mood swings, they loved it  (5)",
      39: "First word of the handle that opened it all  (3)",
      42: "First words in Athens  (8)",
      43: "An Athenian who never needed words to say goodnight  (8)",
      46: "Where her handle ends and her heart lives  (6)",
      48: "The one offence that nearly started a war  (8)",
      50: "___ to me  (5)",
      53: "The festive name that sealed her embarrassment  (5)",
      54: "Hangs in bunches; disappears between two  (6)",
      56: "Between his first and last, this one hides  (7)",
      58: "Small place, big people; where he went to uni  (7)",
      59: "First fur baby: long in body, short in leg  (9)",
      61: "What she shrinks him into when she wants him close  (9)",
      63: "Stefan's bestie  (5)",
      65: "Our first ever clink  (5)",
      69: "Brings him back from the dead when it drops  (8)",
      71: "The Greek thing that beats faster around him  (6)",
      73: "Cycladic stalwart; cradle of the harbour burger  (5)",
      74: "Common name, specialist heart  (6)",
      75: "How many calories her loyal beverage has  (4)",
      77: "When they became a They  (4)",
      78: "Three syllables, one declaration  (8)",
      79: "Required maxing out the iPad brightness  (4)"
    },
    down: {
      1:  "What he says in her tongue  (6)",
      2:  "One of the inner circle  (4)",
      3:  "It quieted everything during their first cold spell  (4)",
      4:  "Past sundown  (6)",
      6:  "When the L-word fell  (4)",
      7:  "Cretan in literature, dancer in life  (5)",
      9:  "Theater currency  (7)",
      10: "Greek airmail  (7)",
      11: "Useful only when it's cold enough  (5)",
      12: "In pink and white  (6)",
      15: "Shouted at every shatter  (3)",
      16: "Her childhood's leafy edge  (8)",
      19: "It really was special  (9)",
      21: "One word for coming and going  (4)",
      22: "What makes the pastry perfect  (7)",
      23: "Tail of the islands' lifeline  (4)",
      24: "Pressed and spun: his opening move  (5)",
      25: "Where Stefan played hero  (7)",
      26: "Friend in her circle; name shared by many  (4)",
      28: "Next year?  (6)",
      32: "A lot of hills  (6)",
      33: "Is this our code language?  (4)",
      34: "Victory  (4)",
      36: "Hinge of that compliment (as previously mentioned)  (4)",
      40: "Pulse of the handle; love in pictogram form  (5)",
      41: "Nudist?  (6)",
      44: "Linked, but never forgotten  (4)",
      45: "His Greek road  (7)",
      47: "English (?) road  (8)",
      49: "Sign-lit scene of the inaugural kiss  (4)",
      50: "Head of the islands' lifeline  (6)",
      51: "___ mou  (5)",
      52: "The Greeks made a goddess for his appetite  (6)",
      55: "Hillside sign that borrowed from the west  (6)",
      57: "Carrot cake or tiramisu?  (4)",
      60: "The closest one (but it was nice)  (6)",
      62: "It always makes her cry  (6)",
      64: "Second word above that dinner  (5)",
      66: "Where arms and cushions conspired best  (4)",
      67: "Petal-sounding name  (6)",
      68: "🐐  (4)",
      70: "Where two years quietly arrived  (6)",
      72: "The unambiguous one  (5)",
      76: "Disappointing because she won't share  (4)"
    }
  }
};
