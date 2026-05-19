// Home page niceties
(function () {
  const dateEl = document.getElementById('todayDate');
  const greetEl = document.getElementById('greetingTime');
  const yearEl = document.getElementById('footerYear');
  const streakEl = document.getElementById('streakDays');

  const now = new Date();
  const opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', opts);

  if (greetEl) {
    const h = now.getHours();
    if (h < 5) greetEl.textContent = 'night';
    else if (h < 12) greetEl.textContent = 'morning';
    else if (h < 18) greetEl.textContent = 'afternoon';
    else greetEl.textContent = 'evening';
  }

  if (yearEl) yearEl.textContent = now.getFullYear();

  if (streakEl) {
    // Computed from localStorage — show days since first visit
    const FIRST = 'maraki_first_visit';
    let first = localStorage.getItem(FIRST);
    if (!first) {
      first = now.toISOString();
      localStorage.setItem(FIRST, first);
    }
    const diff = Math.max(1, Math.floor((now - new Date(first)) / 86400000) + 1);
    streakEl.textContent = diff;
  }
})();
