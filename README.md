# MarakiNYT — Maraki Games

A personalised puzzle site for Maraki-mou, built for our anniversary.

## Run locally

It's pure static HTML/CSS/JS. Just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project layout

```
index.html              ← Landing page (game tiles)
css/main.css            ← All styling
js/home.js              ← Landing page niceties (date, streak)
js/crossword.js         ← Crossword engine (used by Crossword + Mini)
js/connections.js       ← Connections engine
js/wordle.js            ← Wordle engine
js/spellingbee.js       ← Spelling Bee engine

games/
  crossword.html        ← Full crossword
  mini.html             ← Mini crossword
  connections.html      ← Connections (groups of 4)
  wordle.html           ← Wordle (6 guesses)
  spellingbee.html      ← Spelling Bee
  letter.html           ← A letter for her

data/                   ← EDIT THESE to drop in your own puzzles
  crossword.js          ← Crossword grid + clues
  mini.js               ← Mini grid + clues
  connections.js        ← 4 groups of 4 words
  wordle.js             ← List of answers + accepted guesses
  spellingbee.js        ← Center letter, outer letters, valid words
```

## Customizing the puzzles

Each file in `data/` is heavily commented. Replace placeholder content
with your own. You can change the grid size in `crossword.js` / `mini.js`
freely — the engine auto-numbers cells.

## Deploying

Any static host works:
- **GitHub Pages**: push to `main`, enable Pages in repo settings
- **Vercel / Netlify**: drag-and-drop the folder, or `vercel deploy`
- **Cloudflare Pages**: connect the repo

No build step. No backend.
