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
