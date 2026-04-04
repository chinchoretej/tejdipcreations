// Product listing page logic
import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, createProductCard, getQueryParam } from './utils.js';

initNavbar();

const grid = document.getElementById('productsGrid');
const filterBar = document.getElementById('filterBar');

let allProducts = [];
let categoryNames = [];

const urlCategory = getQueryParam('category');

async function buildFilterButtons() {
  if (!filterBar) return;

  try {
    const snapshot = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
    categoryNames = [];
    snapshot.forEach(d => categoryNames.push(d.data().name));
  } catch (err) {
    console.error('Error loading categories for filters:', err);
  }

  filterBar.innerHTML = '<button class="filter-btn active" data-category="all">All</button>';
  categoryNames.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = name;
    btn.textContent = name;
    filterBar.appendChild(btn);
  });

  if (urlCategory) {
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.category === urlCategory) {
        btn.classList.add('active');
        filterBar.querySelector('[data-category="all"]').classList.remove('active');
      }
    });
  }

  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(btn.dataset.category);
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

    renderProducts(urlCategory || 'all');
  } catch (err) {
    console.error('Error loading products:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">&#9888;</div>
        <p>Could not load products. Please check Firebase configuration.</p>
      </div>`;
  }
}

function renderProducts(category) {
  var filtered;
  if (category === 'all') {
    filtered = allProducts;
  } else {
    filtered = allProducts.filter(p => p.category === category);
  }

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">&#128722;</div>
        <p>No products found in this category.</p>
      </div>`;
    return;
  }

  filtered.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
}

await buildFilterButtons();
loadProducts();
