// Admin dashboard logic
import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc,
  query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initNavbar, showToast } from './utils.js';

initNavbar();

// Auth guard — redirect if not logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'index.html';
  }
});

// ---------- Tab switching ----------
const tabs = document.querySelectorAll('.admin-tab');
const panels = document.querySelectorAll('.admin-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');

    if (tab.dataset.tab === 'manage-products') loadAdminProducts();
    if (tab.dataset.tab === 'orders') loadOrders();
  });
});

// ---------- Logout ----------
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

// ---------- Add Product ----------
const addForm = document.getElementById('addProductForm');
if (addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const price = Number(document.getElementById('prodPrice').value);
    const image = document.getElementById('prodImage').value.trim();
    const imagesRaw = document.getElementById('prodImages').value.trim();
    const video = document.getElementById('prodVideo').value.trim();
    const description = document.getElementById('prodDesc').value.trim();

    const images = imagesRaw
      ? imagesRaw.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    try {
      await addDoc(collection(db, 'products'), {
        name,
        category,
        price,
        image,
        images,
        video: video || null,
        description,
        rating: 4.5,
        reviewCount: 0,
        createdAt: serverTimestamp()
      });

      showToast('Product added successfully!', 'success');
      addForm.reset();
    } catch (err) {
      console.error('Error adding product:', err);
      showToast('Failed to add product', 'error');
    }
  });
}

// ---------- Load admin products ----------
async function loadAdminProducts() {
  const grid = document.getElementById('adminProductsGrid');
  grid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    grid.innerHTML = '';

    if (snapshot.empty) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>No products yet.</p></div>';
      return;
    }

    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" class="card-img"
             onerror="this.src='https://placehold.co/400x300/e8c8ce/6d6875?text=No+Image'">
        <div class="card-body">
          <div class="card-category">${p.category}</div>
          <h3>${p.name}</h3>
          <div class="card-footer">
            <span class="price">&#8377;${p.price}</span>
            <button class="btn-secondary btn-sm delete-btn" data-id="${docSnap.id}">Delete</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this product?')) return;
        try {
          await deleteDoc(doc(db, 'products', btn.dataset.id));
          showToast('Product deleted', 'success');
          loadAdminProducts();
        } catch (err) {
          console.error('Delete error:', err);
          showToast('Failed to delete', 'error');
        }
      });
    });
  } catch (err) {
    console.error('Error loading products:', err);
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Error loading products.</p></div>';
  }
}

// ---------- Load orders ----------
async function loadOrders() {
  const container = document.getElementById('ordersContainer');
  container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state"><div class="icon">&#128230;</div><p>No orders yet.</p></div>';
      return;
    }

    snapshot.forEach(docSnap => {
      const o = docSnap.data();
      const date = o.createdAt?.toDate?.()
        ? o.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Just now';

      const card = document.createElement('div');
      card.className = 'order-card';

      const isPending = o.status === 'pending';
      card.innerHTML = `
        <div class="order-header">
          <span class="order-id">#${docSnap.id.slice(0, 8).toUpperCase()}</span>
          <span class="order-date">${date}</span>
        </div>
        <div class="order-customer"><strong>${o.customerName}</strong> — ${o.customerPhone}</div>
        <div class="order-product">${o.productName} — &#8377;${o.productPrice}</div>
        <div class="order-customer" style="font-size:0.82rem;color:var(--text-light);margin-top:0.3rem;">
          ${o.customerAddress}
        </div>
        <div style="display:flex;align-items:center;gap:0.8rem;margin-top:0.6rem;flex-wrap:wrap;">
          <span class="order-status ${o.status}" style="margin:0;">${o.status}</span>
          ${isPending ? `<button class="btn-primary btn-sm confirm-btn" data-id="${docSnap.id}">Confirm</button>` : ''}
          <button class="btn-sm wa-btn" data-phone="${o.customerPhone}" data-name="${o.customerName}"
                  data-product="${o.productName}" data-price="${o.productPrice}" data-status="${o.status}"
                  style="background:#25D366;color:#fff;border-radius:var(--radius-sm);font-weight:600;">
            WhatsApp
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    // Confirm order buttons
    container.querySelectorAll('.confirm-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await updateDoc(doc(db, 'orders', btn.dataset.id), { status: 'confirmed' });
          showToast('Order confirmed!', 'success');
          loadOrders();
        } catch (err) {
          console.error('Confirm error:', err);
          showToast('Failed to confirm', 'error');
        }
      });
    });

    // WhatsApp customer buttons
    container.querySelectorAll('.wa-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.dataset.phone.replace(/\D/g, '');
        const isConfirmed = btn.dataset.status === 'confirmed';
        const msg = isConfirmed
          ? `Hi ${btn.dataset.name}! ✅\n\nYour order for *${btn.dataset.product}* (₹${btn.dataset.price}) has been *confirmed*!\n\nWe'll ship it soon. Thank you for shopping with TejDipCreations! 🙏`
          : `Hi ${btn.dataset.name}!\n\nRegarding your order for *${btn.dataset.product}* (₹${btn.dataset.price}) — we're checking your payment. We'll update you shortly.\n\n— TejDipCreations`;
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      });
    });
  } catch (err) {
    console.error('Error loading orders:', err);
    container.innerHTML = '<div class="empty-state"><p>Error loading orders.</p></div>';
  }
}
