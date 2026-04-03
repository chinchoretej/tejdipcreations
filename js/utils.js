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
        <div>
          <span class="price">&#8377;${product.price}</span>
          <div style="font-size:0.7rem;color:var(--text-light);">+ delivery charges</div>
        </div>
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
