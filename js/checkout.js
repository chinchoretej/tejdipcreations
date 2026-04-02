// Checkout page logic
import { db } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, getQueryParam, showToast } from './utils.js';

initNavbar();

const itemContainer = document.getElementById('orderItemContainer');
const qrSection = document.getElementById('qrSection');
const qrAmount = document.getElementById('qrAmount');
const qrImage = document.getElementById('qrImage');
const checkoutForm = document.getElementById('checkoutForm');
const confirmationMsg = document.getElementById('confirmationMsg');
const checkoutContent = document.getElementById('checkoutContent');

let currentProduct = null;

async function loadOrderProduct() {
  const productId = getQueryParam('id');
  if (!productId) {
    itemContainer.innerHTML = '<p>No product selected.</p>';
    return;
  }

  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) {
      itemContainer.innerHTML = '<p>Product not found.</p>';
      return;
    }

    currentProduct = { id: snap.id, ...snap.data() };

    itemContainer.innerHTML = `
      <div class="order-item">
        <img src="${currentProduct.image}" alt="${currentProduct.name}"
             onerror="this.src='https://placehold.co/80x80/e8c8ce/6d6875?text=No+Image'">
        <div class="order-item-info">
          <h3>${currentProduct.name}</h3>
          <div class="price">&#8377;${currentProduct.price}</div>
        </div>
      </div>
    `;

    // Show QR code with amount
    const upiLink = `upi://pay?pa=9168140277@ybl&pn=TejDipCreations&am=${currentProduct.price}&cu=INR`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;
    qrAmount.textContent = currentProduct.price;
    qrSection.style.display = 'block';
  } catch (err) {
    console.error('Error loading product:', err);
    itemContainer.innerHTML = '<p>Error loading product details.</p>';
  }
}

// Handle form submission
if (checkoutForm) {
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentProduct) {
      showToast('No product selected', 'error');
      return;
    }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if (!name || !phone || !address) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'orders'), {
        productId: currentProduct.id,
        productName: currentProduct.name,
        productPrice: currentProduct.price,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      checkoutContent.style.display = 'none';
      confirmationMsg.classList.add('show');
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      console.error('Error placing order:', err);
      showToast('Failed to place order. Try again.', 'error');
    }
  });
}

loadOrderProduct();
