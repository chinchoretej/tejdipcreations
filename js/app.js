import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, createProductCard } from './utils.js';

initNavbar();

const grid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const mirrorBtn = document.getElementById('mirrorBtn');
const aboutBtn = document.getElementById('aboutUsBtn');
const aboutModal = document.getElementById('aboutModal');
const aboutClose = document.getElementById('aboutClose');

if (aboutBtn && aboutModal) {
  aboutBtn.addEventListener('click', () => aboutModal.classList.add('show'));
  aboutClose.addEventListener('click', () => aboutModal.classList.remove('show'));
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.classList.remove('show');
  });
}

let allProducts = [];
let searchTerm = '';
let sortMode = 'default';

if (searchInput) {
  searchInput.addEventListener('input', function () {
    searchTerm = this.value.trim().toLowerCase();
    renderProducts();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', function () {
    sortMode = this.value;
    renderProducts();
  });
}

if (mirrorBtn) {
  mirrorBtn.addEventListener('click', function () {
    if (searchInput) {
      searchInput.focus();
      searchInput.value = '';
      searchTerm = '';
      renderProducts();
    }
  });
}

async function loadProducts() {
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    allProducts = [];
    snapshot.forEach(doc => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });

    renderProducts();
  } catch (err) {
    console.error('Error loading products:', err);
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="icon">&#9888;</div>
          <p>Could not load products. Please check Firebase configuration.</p>
        </div>`;
    }
  }
}

function renderProducts() {
  if (!grid) return;

  let filtered = allProducts;

  if (searchTerm) {
    filtered = filtered.filter(function (p) {
      return (p.name || '').toLowerCase().includes(searchTerm)
        || (p.description || '').toLowerCase().includes(searchTerm)
        || (p.category || '').toLowerCase().includes(searchTerm)
        || (p.subcategory || '').toLowerCase().includes(searchTerm);
    });
  }

  switch (sortMode) {
    case 'low-high':
      filtered = filtered.slice().sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'high-low':
      filtered = filtered.slice().sort((a, b) => (b.price || 0) - (a.price || 0));
      break;
    case 'category-az':
      filtered = filtered.slice().sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      break;
    case 'category-za':
      filtered = filtered.slice().sort((a, b) => (b.category || '').localeCompare(a.category || ''));
      break;
    case 'subcategory-az':
      filtered = filtered.slice().sort((a, b) => (a.subcategory || '').localeCompare(b.subcategory || ''));
      break;
    case 'subcategory-za':
      filtered = filtered.slice().sort((a, b) => (b.subcategory || '').localeCompare(a.subcategory || ''));
      break;
  }

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">&#128722;</div>
        <p>No products found.</p>
      </div>`;
    return;
  }

  filtered.forEach(function (product) {
    grid.appendChild(createProductCard(product));
  });
}

loadProducts();
