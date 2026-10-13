// Reviewed presentation code. Workflow content supplies text only.
for (const flow of document.querySelectorAll('.workflow')) {
  const steps = [...flow.querySelectorAll('.steps > li')];
  const controls = flow.querySelector('.controls');
  const play = flow.querySelector('[data-play]');
  const status = flow.querySelector('.flow-status');
  let current = 0;
  let timer = null;
  function paint() {
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === current);
      if (index === current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    status.textContent = `Step ${current + 1} of ${steps.length}`;
    flow.querySelector('[data-previous]').disabled = current === 0;
    flow.querySelector('[data-next]').disabled = current === steps.length - 1;
  }
  function pause() { clearInterval(timer); timer = null; play.textContent = 'Play'; play.setAttribute('aria-pressed', 'false'); }
  function move(delta) { pause(); current = Math.max(0, Math.min(steps.length - 1, current + delta)); paint(); }
  play.addEventListener('click', () => {
    if (timer !== null) return pause();
    if (current === steps.length - 1) current = 0;
    play.textContent = 'Pause'; play.setAttribute('aria-pressed', 'true'); paint();
    timer = setInterval(() => { if (current < steps.length - 1) { current += 1; paint(); } if (current === steps.length - 1) pause(); }, 2200);
  });
  flow.querySelector('[data-previous]').addEventListener('click', () => move(-1));
  flow.querySelector('[data-next]').addEventListener('click', () => move(1));
  flow.querySelector('[data-reset]').addEventListener('click', () => { pause(); current = 0; paint(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  controls.hidden = false;
  pause(); paint();
}
