// Admin dashboard logic
import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc,
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
    if (tab.dataset.tab === 'categories') loadCategories();
    if (tab.dataset.tab === 'orders') loadOrders();
    if (tab.dataset.tab === 'trash') loadTrash();
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
      card.setAttribute('data-id', docSnap.id);
      card.innerHTML = '<img src="' + (p.image || '') + '" alt="' + (p.name || '') + '" class="card-img" onerror="this.src=\'https://placehold.co/400x300/e8c8ce/6d6875?text=No+Image\'">'
        + '<div class="card-body">'
        + '<div class="card-category">' + (p.category || '') + '</div>'
        + '<h3>' + (p.name || '') + '</h3>'
        + '<div style="font-size:0.85rem;color:var(--text-light);margin-bottom:0.5rem;">&#8377;' + (p.price || 0) + '</div>'
        + '<div style="display:flex;gap:0.5rem;">'
        + '<button class="edit-btn" data-id="' + docSnap.id + '" style="flex:1;background:var(--primary);color:#fff;padding:0.35rem 0.6rem;border:none;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer;">Edit</button>'
        + '<button class="delete-btn" data-id="' + docSnap.id + '" style="background:#e74c3c;color:#fff;padding:0.35rem 0.6rem;border:none;border-radius:6px;font-size:0.75rem;cursor:pointer;">&#10005;</button>'
        + '</div>'
        + '</div>';
      grid.appendChild(card);
    });

    // Edit product buttons
    grid.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openEditModal(btn.getAttribute('data-id'));
      });
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

      const status = o.status || 'Pending';

      var statusOptions = ['Pending', 'Payment Received', 'Payment Not Received', 'Shipped'];
      var selectHTML = '<select class="status-select" data-id="' + docSnap.id + '" style="padding:0.4rem 0.6rem;border:1.5px solid var(--border);border-radius:8px;font-size:0.85rem;font-weight:600;background:var(--input-bg);color:var(--text);cursor:pointer;">';
      for (var i = 0; i < statusOptions.length; i++) {
        var opt = statusOptions[i];
        var selected = (status === opt) ? ' selected' : '';
        selectHTML += '<option value="' + opt + '"' + selected + '>' + opt + '</option>';
      }
      selectHTML += '</select>';

      var waBtnHTML = '<button class="wa-btn" data-phone="' + (o.customerPhone || '') + '" data-name="' + (o.customerName || '') + '" data-product="' + (o.productName || '') + '" data-price="' + (o.productPrice || '') + '" data-status="' + status + '" style="background:#25D366;color:#fff;padding:0.4rem 1rem;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;">WhatsApp</button>';

      card.innerHTML = '<div class="order-header">'
        + '<span class="order-id">#' + docSnap.id.slice(0, 8).toUpperCase() + '</span>'
        + '<span class="order-date">' + date + '</span>'
        + '</div>'
        + '<div class="order-customer"><strong>' + o.customerName + '</strong> — ' + o.customerPhone + '</div>'
        + '<div class="order-product">' + o.productName + ' — &#8377;' + o.productPrice + '</div>'
        + '<div style="font-size:0.82rem;color:var(--text-light);margin-top:0.3rem;">' + o.customerAddress + '</div>'
        + '<div style="display:flex;align-items:center;gap:0.8rem;margin-top:0.8rem;flex-wrap:wrap;">'
        + '<label style="font-size:0.82rem;font-weight:600;color:var(--text-light);">Status:</label>'
        + selectHTML
        + waBtnHTML
        + '<button class="trash-btn" data-id="' + docSnap.id + '" style="background:#e74c3c;color:#fff;padding:0.4rem 1rem;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;">Delete</button>'
        + '</div>';
      container.appendChild(card);
    });

    // Status dropdown change
    container.querySelectorAll('.status-select').forEach(function(sel) {
      sel.addEventListener('change', async function() {
        var orderId = this.getAttribute('data-id');
        var newStatus = this.value;
        try {
          await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
          showToast('Status updated to: ' + newStatus, 'success');
        } catch (err) {
          console.error('Status update error:', err);
          showToast('Failed to update status', 'error');
          loadOrders();
        }
      });
    });

    // WhatsApp customer buttons
    container.querySelectorAll('.wa-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var phone = btn.getAttribute('data-phone').replace(/\D/g, '');
        var name = btn.getAttribute('data-name');
        var product = btn.getAttribute('data-product');
        var price = btn.getAttribute('data-price');
        var curStatus = btn.closest('.order-card').querySelector('.status-select').value;
        var msg = '';
        if (curStatus === 'Payment Received') {
          msg = 'Hi ' + name + '! ✅\n\nYour payment for *' + product + '* (₹' + price + ') has been received!\n\nWe will share the delivery charges shortly and ship your order. Thank you for shopping with TejDipCreations! 🙏';
        } else if (curStatus === 'Shipped') {
          msg = 'Hi ' + name + '! 📦\n\nGreat news! Your order for *' + product + '* (₹' + price + ') has been *shipped*!\n\nYou will receive it soon. Thank you for shopping with TejDipCreations! 🙏';
        } else if (curStatus === 'Payment Not Received') {
          msg = 'Hi ' + name + '!\n\nWe have not yet received your payment for *' + product + '* (₹' + price + ').\n\nPlease complete the payment via UPI and let us know. Thank you!\n\n— TejDipCreations';
        } else {
          msg = 'Hi ' + name + '!\n\nRegarding your order for *' + product + '* (₹' + price + ') — we are checking your payment. We will update you shortly.\n\n— TejDipCreations';
        }
        window.open('https://wa.me/91' + phone + '?text=' + encodeURIComponent(msg), '_blank');
      });
    });
    // Delete (move to trash) buttons
    container.querySelectorAll('.trash-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Move this order to trash?')) return;
        var orderId = btn.getAttribute('data-id');
        try {
          var orderSnap = await getDocs(query(collection(db, 'orders')));
          var orderData = null;
          orderSnap.forEach(function(d) {
            if (d.id === orderId) orderData = d.data();
          });
          if (orderData) {
            orderData.deletedAt = serverTimestamp();
            await addDoc(collection(db, 'trash'), orderData);
          }
          await deleteDoc(doc(db, 'orders', orderId));
          showToast('Order moved to trash', 'success');
          loadOrders();
        } catch (err) {
          console.error('Trash error:', err);
          showToast('Failed to delete order', 'error');
        }
      });
    });

  } catch (err) {
    console.error('Error loading orders:', err);
    container.innerHTML = '<div class="empty-state"><p>Error loading orders.</p></div>';
  }
}

// ---------- Load trash ----------
async function loadTrash() {
  var container = document.getElementById('trashContainer');
  container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  try {
    var snapshot = await getDocs(query(collection(db, 'trash'), orderBy('deletedAt', 'desc')));

    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state"><div class="icon">&#128465;</div><p>Trash is empty.</p></div>';
      return;
    }

    var thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    var hasItems = false;

    snapshot.forEach(function(docSnap) {
      var o = docSnap.data();
      var deletedDate = o.deletedAt?.toDate ? o.deletedAt.toDate() : new Date();

      // Auto-remove items older than 30 days
      if (deletedDate < thirtyDaysAgo) {
        deleteDoc(doc(db, 'trash', docSnap.id));
        return;
      }

      hasItems = true;

      var deletedStr = deletedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      var orderDate = o.createdAt?.toDate?.()
        ? o.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

      var card = document.createElement('div');
      card.className = 'order-card';
      card.style.opacity = '0.75';
      card.innerHTML = '<div class="order-header">'
        + '<span class="order-id" style="color:#e74c3c;">Deleted</span>'
        + '<span class="order-date">Deleted: ' + deletedStr + '</span>'
        + '</div>'
        + '<div class="order-customer"><strong>' + (o.customerName || '') + '</strong> — ' + (o.customerPhone || '') + '</div>'
        + '<div class="order-product">' + (o.productName || '') + ' — &#8377;' + (o.productPrice || '') + '</div>'
        + '<div style="font-size:0.82rem;color:var(--text-light);margin-top:0.3rem;">' + (o.customerAddress || '') + '</div>'
        + (orderDate ? '<div style="font-size:0.78rem;color:var(--text-light);margin-top:0.2rem;">Ordered: ' + orderDate + '</div>' : '')
        + '<div style="display:flex;align-items:center;gap:0.8rem;margin-top:0.8rem;flex-wrap:wrap;">'
        + '<button class="restore-btn" data-id="' + docSnap.id + '" style="background:var(--success);color:#fff;padding:0.4rem 1rem;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;">Restore</button>'
        + '<button class="perm-delete-btn" data-id="' + docSnap.id + '" style="background:#e74c3c;color:#fff;padding:0.4rem 1rem;border:none;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer;">Delete Forever</button>'
        + '</div>';
      container.appendChild(card);
    });

    if (!hasItems) {
      container.innerHTML = '<div class="empty-state"><div class="icon">&#128465;</div><p>Trash is empty.</p></div>';
      return;
    }

    // Restore buttons
    container.querySelectorAll('.restore-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var trashId = btn.getAttribute('data-id');
        try {
          var trashSnap = await getDocs(collection(db, 'trash'));
          var trashData = null;
          trashSnap.forEach(function(d) {
            if (d.id === trashId) trashData = d.data();
          });
          if (trashData) {
            delete trashData.deletedAt;
            await addDoc(collection(db, 'orders'), trashData);
          }
          await deleteDoc(doc(db, 'trash', trashId));
          showToast('Order restored!', 'success');
          loadTrash();
        } catch (err) {
          console.error('Restore error:', err);
          showToast('Failed to restore', 'error');
        }
      });
    });

    // Permanent delete buttons
    container.querySelectorAll('.perm-delete-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Permanently delete this order? This cannot be undone.')) return;
        try {
          await deleteDoc(doc(db, 'trash', btn.getAttribute('data-id')));
          showToast('Order permanently deleted', 'success');
          loadTrash();
        } catch (err) {
          console.error('Permanent delete error:', err);
          showToast('Failed to delete', 'error');
        }
      });
    });

  } catch (err) {
    console.error('Error loading trash:', err);
    container.innerHTML = '<div class="empty-state"><p>Error loading trash.</p></div>';
  }
}

// ---------- Edit product modal ----------
async function openEditModal(productId) {
  try {
    var snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) { showToast('Product not found', 'error'); return; }
    var p = snap.data();

    var overlay = document.createElement('div');
    overlay.id = 'editOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;';

    var catSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
    var catOpts = '<option value="">Select category</option>';
    catSnapshot.forEach(function(d) {
      var cName = d.data().name;
      catOpts += '<option value="' + cName + '"' + (p.category === cName ? ' selected' : '') + '>' + cName + '</option>';
    });

    var inputStyle = 'width:100%;padding:0.6rem 0.8rem;border:1.5px solid var(--border);border-radius:8px;font-size:0.9rem;background:var(--input-bg);color:var(--text);';

    overlay.innerHTML = '<div style="background:var(--bg-card);border-radius:12px;padding:1.5rem;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 30px rgba(0,0,0,0.2);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h2 style="font-size:1.2rem;">Edit Product</h2><button id="editClose" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text);">&#10005;</button></div>'
      + '<div style="margin-bottom:0.8rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Name</label><input id="editName" value="' + (p.name || '').replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>'
      + '<div style="margin-bottom:0.8rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Category</label><select id="editCategory" style="' + inputStyle + '">' + catOpts + '</select></div>'
      + '<div style="margin-bottom:0.8rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Price</label><input id="editPrice" type="number" value="' + (p.price || '') + '" style="' + inputStyle + '"></div>'
      + '<div style="margin-bottom:0.8rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Image URL</label><input id="editImage" value="' + (p.image || '').replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>'
      + '<div style="margin-bottom:0.8rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Video URL</label><input id="editVideo" value="' + (p.video || '').replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>'
      + '<div style="margin-bottom:1rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Description</label><textarea id="editDesc" rows="3" style="' + inputStyle + 'resize:vertical;">' + (p.description || '') + '</textarea></div>'
      + '<button id="editSave" style="width:100%;background:var(--primary);color:#fff;padding:0.7rem;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;">Save Changes</button>'
      + '</div>';

    document.body.appendChild(overlay);

    document.getElementById('editClose').addEventListener('click', function() { overlay.remove(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    document.getElementById('editSave').addEventListener('click', async function() {
      try {
        await updateDoc(doc(db, 'products', productId), {
          name: document.getElementById('editName').value.trim(),
          category: document.getElementById('editCategory').value,
          price: Number(document.getElementById('editPrice').value),
          image: document.getElementById('editImage').value.trim(),
          video: document.getElementById('editVideo').value.trim() || null,
          description: document.getElementById('editDesc').value.trim()
        });
        showToast('Product updated!', 'success');
        overlay.remove();
        loadAdminProducts();
      } catch (err) {
        console.error('Update error:', err);
        showToast('Failed to update product', 'error');
      }
    });
  } catch (err) {
    console.error('Edit load error:', err);
    showToast('Failed to load product', 'error');
  }
}

// ---------- Categories CRUD ----------
async function loadCategoryDropdowns() {
  try {
    var snapshot = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
    var select = document.getElementById('prodCategory');
    if (select) {
      var current = select.value;
      select.innerHTML = '<option value="">Select category</option>';
      snapshot.forEach(function(d) {
        var opt = document.createElement('option');
        opt.value = d.data().name;
        opt.textContent = d.data().name;
        select.appendChild(opt);
      });
      if (current) select.value = current;
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

// Load categories into dropdown on page load
loadCategoryDropdowns();

async function loadCategories() {
  var container = document.getElementById('categoriesList');
  container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  try {
    var snapshot = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state"><p>No categories yet. Add one above.</p></div>';
      return;
    }

    snapshot.forEach(function(docSnap) {
      var c = docSnap.data();
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.8rem;padding:0.8rem 1rem;background:var(--bg-card);border-radius:8px;box-shadow:var(--shadow);margin-bottom:0.6rem;';

      var imgThumb = c.image ? '<img src="' + c.image + '" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">' : '';
      var descText = c.description ? '<span style="font-size:0.8rem;color:var(--text-light);display:block;">' + c.description + '</span>' : '';

      row.innerHTML = imgThumb
        + '<div style="flex:1;"><span style="font-weight:600;font-size:0.95rem;">' + c.name + '</span>' + descText + '</div>'
        + '<button class="cat-edit" data-id="' + docSnap.id + '" style="background:var(--primary);color:#fff;padding:0.3rem 0.8rem;border:none;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer;">Edit</button>'
        + '<button class="cat-delete" data-id="' + docSnap.id + '" style="background:#e74c3c;color:#fff;padding:0.3rem 0.6rem;border:none;border-radius:6px;font-size:0.8rem;cursor:pointer;">&#10005;</button>';
      container.appendChild(row);
    });

    // Edit category — opens a small modal
    container.querySelectorAll('.cat-edit').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var catId = btn.getAttribute('data-id');
        try {
          var catDoc = await getDoc(doc(db, 'categories', catId));
          if (!catDoc.exists()) return;
          var c = catDoc.data();

          var overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem;';
          var inputStyle = 'width:100%;padding:0.6rem 0.8rem;border:1.5px solid var(--border);border-radius:8px;font-size:0.9rem;background:var(--input-bg);color:var(--text);';

          overlay.innerHTML = '<div style="background:var(--bg-card);border-radius:12px;padding:1.5rem;width:100%;max-width:400px;box-shadow:0 8px 30px rgba(0,0,0,0.2);">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;"><h2 style="font-size:1.1rem;">Edit Category</h2><button id="catEditClose" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text);">&#10005;</button></div>'
            + '<div style="margin-bottom:0.8rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Name</label><input id="editCatName" value="' + (c.name || '').replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>'
            + '<div style="margin-bottom:0.8rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Image URL</label><input id="editCatImage" value="' + (c.image || '').replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>'
            + '<div style="margin-bottom:1rem;"><label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:0.3rem;">Description</label><input id="editCatDesc" value="' + (c.description || '').replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>'
            + '<button id="catEditSave" style="width:100%;padding:0.7rem;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;">Save Changes</button>'
            + '</div>';

          document.body.appendChild(overlay);

          overlay.querySelector('#catEditClose').addEventListener('click', function() { overlay.remove(); });
          overlay.addEventListener('click', function(ev) { if (ev.target === overlay) overlay.remove(); });

          overlay.querySelector('#catEditSave').addEventListener('click', async function() {
            var updatedData = {
              name: document.getElementById('editCatName').value.trim(),
              image: document.getElementById('editCatImage').value.trim(),
              description: document.getElementById('editCatDesc').value.trim()
            };
            if (!updatedData.name) { showToast('Name is required', 'error'); return; }
            try {
              await updateDoc(doc(db, 'categories', catId), updatedData);
              showToast('Category updated!', 'success');
              overlay.remove();
              loadCategories();
              loadCategoryDropdowns();
            } catch (err) {
              console.error('Category update error:', err);
              showToast('Failed to update', 'error');
            }
          });
        } catch (err) {
          console.error('Error loading category:', err);
          showToast('Failed to load category', 'error');
        }
      });
    });

    // Delete category
    container.querySelectorAll('.cat-delete').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Delete this category?')) return;
        try {
          await deleteDoc(doc(db, 'categories', btn.getAttribute('data-id')));
          showToast('Category deleted', 'success');
          loadCategories();
          loadCategoryDropdowns();
        } catch (err) {
          console.error('Category delete error:', err);
          showToast('Failed to delete', 'error');
        }
      });
    });

  } catch (err) {
    console.error('Error loading categories:', err);
    container.innerHTML = '<div class="empty-state"><p>Error loading categories.</p></div>';
  }
}

// Add category form
var catForm = document.getElementById('addCategoryForm');
if (catForm) {
  catForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var name = document.getElementById('catName').value.trim();
    var image = document.getElementById('catImage').value.trim();
    var description = document.getElementById('catDesc').value.trim();
    if (!name) return;
    try {
      var data = { name: name, createdAt: serverTimestamp() };
      if (image) data.image = image;
      if (description) data.description = description;
      await addDoc(collection(db, 'categories'), data);
      showToast('Category added!', 'success');
      document.getElementById('catName').value = '';
      document.getElementById('catImage').value = '';
      document.getElementById('catDesc').value = '';
      loadCategories();
      loadCategoryDropdowns();
    } catch (err) {
      console.error('Add category error:', err);
      showToast('Failed to add category', 'error');
    }
  });
}
