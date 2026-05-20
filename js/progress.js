// Shared progress state for the whole site.
// Each puzzle game marks itself "solved" here; the home page reads it
// back to render the path, and the letter is gated on all-solved.
(function () {
  const KEY_PREFIX = 'maraki_solved_';
  // Order matters — this is the path the home page renders.
  const ORDER = ['crossword', 'mini', 'connections', 'wordle', 'strands'];

  function markSolved(id) {
    if (!id) return;
    try { localStorage.setItem(KEY_PREFIX + id, '1'); } catch (e) {}
  }
  function isSolved(id) {
    try { return localStorage.getItem(KEY_PREFIX + id) === '1'; }
    catch (e) { return false; }
  }
  function clearAll() {
    try { ORDER.forEach(id => localStorage.removeItem(KEY_PREFIX + id)); }
    catch (e) {}
  }
  function solvedCount() { return ORDER.filter(isSolved).length; }
  function total() { return ORDER.length; }
  function allSolved() { return solvedCount() === total(); }
  function nextUp() {
    return ORDER.find(id => !isSolved(id)) || null;
  }

  window.MarakiProgress = {
    ORDER, markSolved, isSolved, clearAll,
    solvedCount, total, allSolved, nextUp
  };
})();
