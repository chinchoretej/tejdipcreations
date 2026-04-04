// Home page logic
import { db } from './firebase-config.js';
import { collection, getDocs, query, limit, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, createProductCard } from './utils.js';

initNavbar();

const CATEGORIES = [
  {
    name: 'Jewelry',
    image: 'assets/Jwelery.jpg',
    desc: 'Earrings, Necklaces, Bracelets, Bangles & Hair Accessories'
  },
  {
    name: 'Pooja Essentials',
    image: 'assets/Pooja Essential.jpg',
    desc: 'Decorative Plates, Kalash & Saptapadi Supari'
  },
  {
    name: 'Handmade Crafts',
    image: 'assets/Handmade arts.jpg',
    desc: 'Sticks Decor, Wall Art & Mini Crafts'
  }
];

// Render categories
const catGrid = document.getElementById('categoriesGrid');
if (catGrid) {
  CATEGORIES.forEach(cat => {
    const card = document.createElement('a');
    card.href = `products.html?category=${encodeURIComponent(cat.name)}`;
    card.className = 'category-card';
    card.innerHTML = `
      <img src="${cat.image}" alt="${cat.name}" class="card-img"
           onerror="this.src='https://placehold.co/400x300/e8c8ce/6d6875?text=${encodeURIComponent(cat.name)}'">
      <div class="card-body">
        <h3>${cat.name}</h3>
        <p>${cat.desc}</p>
      </div>
    `;
    catGrid.appendChild(card);
  });
}

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
