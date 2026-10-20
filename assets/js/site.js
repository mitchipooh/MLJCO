const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

const yearNode = document.querySelector("[data-year]");
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
