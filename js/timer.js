// Universal game timer.
// Renders into #gameTimer if present. Pauses when the tab is hidden.
// Stops when window.GameTimer.stop() is called (use on win).
//
// Persists per-game so closing & reopening continues where you left off.
(function () {
  const key = 'maraki_timer_' + (window.GAME_TIMER_KEY || location.pathname);
  const el = document.getElementById('gameTimer');

  let elapsedMs = 0;
  try {
    const saved = parseInt(localStorage.getItem(key) || '0', 10);
    if (!isNaN(saved) && saved > 0) elapsedMs = saved;
  } catch (e) {}

  let lastTick = null;
  let running = true;
  let stopped = false;

  function render() {
    if (!el) return;
    const s = Math.floor(elapsedMs / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    el.textContent = `${m}:${String(sec).padStart(2, '0')}`;
    el.classList.toggle('paused', !running && !stopped);
  }

  function tick() {
    if (stopped) return;
    const now = performance.now();
    if (running) {
      if (lastTick !== null) elapsedMs += now - lastTick;
      lastTick = now;
      try { localStorage.setItem(key, String(Math.floor(elapsedMs))); } catch(e){}
    } else {
      lastTick = null;
    }
    render();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      lastTick = null;
    } else if (!stopped) {
      running = true;
    }
  });
  window.addEventListener('blur', () => { if (!stopped) { running = false; lastTick = null; } });
  window.addEventListener('focus', () => { if (!stopped) running = true; });

  setInterval(tick, 250);

  window.GameTimer = {
    stop() {
      stopped = true;
      running = false;
      lastTick = null;
      render();
      return Math.floor(elapsedMs / 1000);
    },
    reset() {
      elapsedMs = 0;
      try { localStorage.removeItem(key); } catch(e){}
      render();
    },
    elapsedSeconds() { return Math.floor(elapsedMs / 1000); },
    format() {
      const s = Math.floor(elapsedMs / 1000);
      const m = Math.floor(s / 60);
      return `${m}:${String(s % 60).padStart(2, '0')}`;
    }
  };

  render();
})();
