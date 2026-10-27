const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  nav.id = 'site-navigation';
  toggle.setAttribute('aria-controls', nav.id);
  const setMenu = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    toggle.textContent = open ? 'Close ✕' : 'Menu ☰';
  };
  setMenu(false);
  toggle.addEventListener("click", () => {
    setMenu(!nav.classList.contains('open'));
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.nav-wrap')) setMenu(false); });
  matchMedia('(min-width: 941px)').addEventListener('change', () => setMenu(false));
}

const yearNode = document.querySelector("[data-year]");
const serviceChoice = document.querySelector('select[name="service"]');
if (serviceChoice) {
  const requestType = new URLSearchParams(location.search).get('service');
  if (requestType === 'catering') serviceChoice.value = 'Catering Services';
  if (requestType === 'equipment') serviceChoice.value = 'Equipment & Rental Enquiry';
}
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

document.querySelectorAll('[data-media-src]').forEach(button => {
  button.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.className = 'journal-video';
    frame.src = button.dataset.mediaSrc;
    frame.title = button.dataset.mediaTitle;
    frame.allowFullscreen = true;
    frame.allow = 'encrypted-media; picture-in-picture';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    button.closest('.media-placeholder').replaceWith(frame);
  });
});
