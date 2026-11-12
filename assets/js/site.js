const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.dataset.open = String(open);
  });
  nav.addEventListener('click', event => {
    if (event.target instanceof HTMLAnchorElement) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.dataset.open = 'false';
    }
  });
}

const tilt = document.querySelector('[data-tilt]');
if (tilt && window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
  const inner = tilt.firstElementChild;
  tilt.addEventListener('pointermove', event => {
    const box = tilt.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    inner.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
    inner.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`);
  });
  tilt.addEventListener('pointerleave', () => {
    inner.style.setProperty('--rx', '0deg');
    inner.style.setProperty('--ry', '0deg');
  });
}
