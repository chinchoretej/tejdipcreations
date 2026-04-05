// Home page logic
import { db } from './firebase-config.js';
import { collection, getDocs, query, limit, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, createProductCard } from './utils.js';

initNavbar();

const FALLBACK_CATEGORIES = [
  { name: 'Jewelry', image: 'assets/Jwelery.jpg', description: 'Earrings, Necklaces, Bracelets, Bangles & Hair Accessories', subcategories: ['Earrings', 'Necklaces', 'Bracelets', 'Bangles', 'Hair Accessories'] },
  { name: 'Pooja Essentials', image: 'assets/Pooja Essential.jpg', description: 'Decorative Plates, Kalash & Saptapadi Supari', subcategories: ['Decorative Plates', 'Kalash', 'Saptapadi Supari'] },
  { name: 'Handmade Crafts', image: 'assets/Handmade arts.jpg', description: 'Sticks Decor, Wall Art & Mini Crafts', subcategories: ['Sticks Decor', 'Wall Art', 'Mini Crafts'] }
];

async function loadCategories() {
  const catGrid = document.getElementById('categoriesGrid');
  if (!catGrid) return;

  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    let cats = [];
    snapshot.forEach(d => cats.push(d.data()));
    cats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (cats.length === 0) cats = FALLBACK_CATEGORIES;

    catGrid.innerHTML = '';
    cats.forEach(cat => {
      const card = document.createElement('a');
      card.href = `products.html?category=${encodeURIComponent(cat.name)}`;
      card.className = 'category-card';
      const img = cat.image || `https://placehold.co/400x300/e8c8ce/6d6875?text=${encodeURIComponent(cat.name)}`;
      const desc = cat.description || (cat.subcategories ? cat.subcategories.join(', ') : '');
      card.innerHTML = `
        <img src="${img}" alt="${cat.name}" class="card-img"
             onerror="this.src='https://placehold.co/400x300/e8c8ce/6d6875?text=${encodeURIComponent(cat.name)}'">
        <div class="card-body">
          <h3>${cat.name}</h3>
          <p>${desc}</p>
        </div>
      `;
      catGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading categories:', err);
    catGrid.innerHTML = '';
    FALLBACK_CATEGORIES.forEach(cat => {
      const card = document.createElement('a');
      card.href = `products.html?category=${encodeURIComponent(cat.name)}`;
      card.className = 'category-card';
      card.innerHTML = `
        <img src="${cat.image}" alt="${cat.name}" class="card-img"
             onerror="this.src='https://placehold.co/400x300/e8c8ce/6d6875?text=${encodeURIComponent(cat.name)}'">
        <div class="card-body">
          <h3>${cat.name}</h3>
          <p>${cat.description}</p>
        </div>
      `;
      catGrid.appendChild(card);
    });
  }
}

loadCategories();

// Render featured products (latest 4)
async function loadFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4));
    const snapshot = await getDocs(q);

    grid.innerHTML = '';

    if (snapshot.empty) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="icon">&#128722;</div>
          <p>No products yet. Add some from the admin panel!</p>
        </div>`;
      return;
    }

    snapshot.forEach(doc => {
      const product = { id: doc.id, ...doc.data() };
      grid.appendChild(createProductCard(product));
    });
  } catch (err) {
    console.error('Error loading products:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">&#9888;</div>
        <p>Could not load products. Please check Firebase configuration.</p>
      </div>`;
  }
}

loadFeatured();
