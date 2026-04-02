// Shared utility functions

export function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show' + (type ? ` ${type}` : '');
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

export function initNavbar() {
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
      }
    });
  }
  initTheme();
}

function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');

  applyTheme(theme, btn);

  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next, btn);
    localStorage.setItem('theme', next);
  });
}

function applyTheme(theme, btn) {
  document.documentElement.setAttribute('data-theme', theme);
  btn.innerHTML = theme === 'dark' ? '&#9788;' : '&#9790;';
  btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

export function createProductCard(product, basePath = '') {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" class="card-img"
         onerror="this.src='https://placehold.co/400x300/e8c8ce/6d6875?text=No+Image'">
    <div class="card-body">
      <div class="card-category">${product.category}</div>
      <h3>${product.name}</h3>
      <p class="card-desc">${product.description || ''}</p>
      <div class="card-footer">
        <span class="price">&#8377;${product.price}</span>
        <a href="${basePath}product.html?id=${product.id}" class="btn-primary btn-sm btn-view">View</a>
      </div>
    </div>
  `;
  return card;
}

export function renderStars(rating = 4.5) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '&#9733;'.repeat(full) + (half ? '&#9734;' : '') + '&#9734;'.repeat(empty);
}

export function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}
