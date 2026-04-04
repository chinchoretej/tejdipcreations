// Product listing page logic
import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, createProductCard, getQueryParam } from './utils.js';

initNavbar();

const grid = document.getElementById('productsGrid');
const filterBar = document.getElementById('filterBar');

let allProducts = [];

const CATEGORY_GROUPS = {
  'Jewelry': ['Earrings', 'Necklaces', 'Bracelets', 'Bangles', 'Hair Accessories'],
  'Pooja Essentials': ['Decorative Plates', 'Kalash', 'Saptapadi Supari'],
  'Handmade Crafts': ['Sticks Decor', 'Wall Art', 'Mini Crafts']
};

// Pre-select category from URL if present
const urlCategory = getQueryParam('category');
if (urlCategory && filterBar) {
  const groupSubs = CATEGORY_GROUPS[urlCategory];
  if (groupSubs) {
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', groupSubs.includes(btn.dataset.category));
    });
    filterBar.querySelector('[data-category="all"]').classList.remove('active');
  } else {
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === urlCategory);
    });
  }
}

// Load all products once
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
  } else if (CATEGORY_GROUPS[category]) {
    var subs = CATEGORY_GROUPS[category];
    filtered = allProducts.filter(p => subs.includes(p.category));
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

// Filter button clicks
if (filterBar) {
  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(btn.dataset.category);
  });
}

loadProducts();
