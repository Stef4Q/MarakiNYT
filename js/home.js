// Home page — show progress through the path, gate the letter on completion.
(function () {
  const P = window.MarakiProgress;
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (!P) return;

  const cards = document.querySelectorAll('.game-card[data-game]');
  const next = P.nextUp();
  cards.forEach(card => {
    const id = card.dataset.game;
    card.classList.remove('done', 'next', 'locked');
    if (id === 'letter') {
      if (P.allSolved()) {
        card.classList.add('unlocked');
        const tag = document.getElementById('letterTag');
        if (tag) tag.textContent = 'Ready when you are';
      } else {
        card.classList.add('locked');
        // Block navigation so she actually finishes everything first.
        card.addEventListener('click', (e) => {
          e.preventDefault();
          const remaining = P.total() - P.solvedCount();
          const sub = document.getElementById('progressSub');
          if (sub) sub.textContent = `Finish ${remaining} more puzzle${remaining === 1 ? '' : 's'} and the letter opens.`;
        });
      }
      return;
    }
    if (P.isSolved(id)) {
      card.classList.add('done');
    } else if (id === next) {
      card.classList.add('next');
    }
  });

  const done = P.solvedCount();
  const total = P.total();
  document.getElementById('progressDone').textContent = done;
  document.getElementById('progressTotal').textContent = total;
  const fill = document.getElementById('progressBarFill');
  if (fill) fill.style.width = (done / total * 100) + '%';

  const sub = document.getElementById('progressSub');
  if (sub) {
    if (done === 0) {
      sub.textContent = 'Start anywhere you like — the order’s just a suggestion.';
    } else if (P.allSolved()) {
      sub.textContent = 'Every puzzle solved. Your letter is unlocked. 🤍';
    } else {
      const remaining = total - done;
      sub.textContent = `${remaining} to go before the letter opens.`;
    }
  }
})();
