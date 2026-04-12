// Product listing page logic
import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, createProductCard, getQueryParam } from './utils.js';

initNavbar();

const grid = document.getElementById('productsGrid');
const catSelect = document.getElementById('filterCategory');
const subSelect = document.getElementById('filterSubcategory');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

let allProducts = [];
let allCategories = [];
let activeCategory = 'all';
let activeSubcategory = 'all';
let searchTerm = '';
let sortMode = 'default';

const urlCategory = getQueryParam('category');

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

if (catSelect) {
  catSelect.addEventListener('change', function() {
    activeCategory = this.value;
    activeSubcategory = 'all';
    populateSubcategories(activeCategory);
    renderProducts();
  });
}

if (subSelect) {
  subSelect.addEventListener('change', function() {
    activeSubcategory = this.value;
    renderProducts();
  });
}

async function buildFilterDropdowns() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    allCategories = [];
    snapshot.forEach(d => allCategories.push({ id: d.id, ...d.data() }));
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (err) {
    console.error('Error loading categories for filters:', err);
  }

  if (!catSelect) return;

  catSelect.innerHTML = '<option value="all">All Categories</option>';
  allCategories.forEach(function(cat) {
    var opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    catSelect.appendChild(opt);
  });

  if (urlCategory) {
    activeCategory = urlCategory;
    catSelect.value = urlCategory;
    populateSubcategories(urlCategory);
  }
}

function populateSubcategories(categoryName) {
  if (!subSelect) return;

  subSelect.innerHTML = '<option value="all">All Subcategories</option>';

  if (categoryName === 'all') {
    subSelect.style.display = 'none';
    return;
  }

  var cat = allCategories.find(function(c) { return c.name === categoryName; });
  if (!cat || !cat.subcategories || cat.subcategories.length === 0) {
    subSelect.style.display = 'none';
    return;
  }

  cat.subcategories.forEach(function(sub) {
    var opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = sub;
    subSelect.appendChild(opt);
  });

  subSelect.style.display = '';
  subSelect.value = 'all';
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

await buildFilterDropdowns();
loadProducts();
