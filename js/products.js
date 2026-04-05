// Product listing page logic
import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, createProductCard, getQueryParam } from './utils.js';

initNavbar();

const grid = document.getElementById('productsGrid');
const filterBar = document.getElementById('filterBar');

let allProducts = [];
let allCategories = [];
let activeCategory = 'all';
let activeSubcategory = 'all';
let searchTerm = '';
let sortMode = 'default';

const urlCategory = getQueryParam('category');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

if (searchInput) {
  searchInput.addEventListener('input', function() {
    searchTerm = this.value.trim().toLowerCase();
    renderProducts();
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', function() {
    sortMode = this.value;
    renderProducts();
  });
}

async function buildFilterButtons() {
  if (!filterBar) return;

  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    allCategories = [];
    snapshot.forEach(d => allCategories.push({ id: d.id, ...d.data() }));
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (err) {
    console.error('Error loading categories for filters:', err);
  }

  filterBar.innerHTML = '';

  // Main category row
  var catRow = document.createElement('div');
  catRow.id = 'catFilterRow';
  catRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;';

  var allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.dataset.category = 'all';
  allBtn.textContent = 'All';
  catRow.appendChild(allBtn);

  allCategories.forEach(function(cat) {
    var btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat.name;
    btn.textContent = cat.name;
    catRow.appendChild(btn);
  });

  filterBar.appendChild(catRow);

  // Subcategory row (hidden until a category is picked)
  var subRow = document.createElement('div');
  subRow.id = 'subFilterRow';
  subRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem;';
  filterBar.appendChild(subRow);

  // Pre-select from URL
  if (urlCategory) {
    activeCategory = urlCategory;
    catRow.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.classList.remove('active');
      if (btn.dataset.category === urlCategory) btn.classList.add('active');
    });
    buildSubcategoryButtons(urlCategory);
  }

  // Category click handler
  catRow.addEventListener('click', function(e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    catRow.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    activeSubcategory = 'all';
    buildSubcategoryButtons(activeCategory);
    renderProducts();
  });
}

function buildSubcategoryButtons(categoryName) {
  var subRow = document.getElementById('subFilterRow');
  if (!subRow) return;
  subRow.innerHTML = '';

  if (categoryName === 'all') return;

  var cat = allCategories.find(function(c) { return c.name === categoryName; });
  if (!cat || !cat.subcategories || cat.subcategories.length === 0) return;

  var allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.dataset.subcategory = 'all';
  allBtn.textContent = 'All ' + categoryName;
  allBtn.style.fontSize = '0.82rem';
  subRow.appendChild(allBtn);

  cat.subcategories.forEach(function(sub) {
    var btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.subcategory = sub;
    btn.textContent = sub;
    btn.style.fontSize = '0.82rem';
    subRow.appendChild(btn);
  });

  subRow.addEventListener('click', function(e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    subRow.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    activeSubcategory = btn.dataset.subcategory;
    renderProducts();
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
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">&#9888;</div>
        <p>Could not load products. Please check Firebase configuration.</p>
      </div>`;
  }
}

function renderProducts() {
  var filtered = allProducts;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(function(p) { return p.category === activeCategory; });
    if (activeSubcategory !== 'all') {
      filtered = filtered.filter(function(p) { return p.subcategory === activeSubcategory; });
    }
  }

  if (searchTerm) {
    filtered = filtered.filter(function(p) {
      return (p.name || '').toLowerCase().includes(searchTerm)
        || (p.description || '').toLowerCase().includes(searchTerm);
    });
  }

  if (sortMode === 'low-high') {
    filtered = filtered.slice().sort(function(a, b) { return (a.price || 0) - (b.price || 0); });
  } else if (sortMode === 'high-low') {
    filtered = filtered.slice().sort(function(a, b) { return (b.price || 0) - (a.price || 0); });
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

  filtered.forEach(function(product) {
    grid.appendChild(createProductCard(product));
  });
}

await buildFilterButtons();
loadProducts();
