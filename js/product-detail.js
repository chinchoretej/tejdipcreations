// Product detail page logic
import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { initNavbar, getQueryParam, renderStars } from './utils.js';

initNavbar();

const container = document.getElementById('productDetail');
const breadcrumbName = document.getElementById('breadcrumbName');

async function loadProduct() {
  const productId = getQueryParam('id');
  if (!productId) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Product not found.</p></div>';
    return;
  }

  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (!snap.exists()) {
      container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Product not found.</p></div>';
      return;
    }

    const product = { id: snap.id, ...snap.data() };
    document.title = `${product.name} — TejDipCreations`;
    if (breadcrumbName) breadcrumbName.textContent = product.name;

    const images = [product.image, ...(product.images || [])].filter(Boolean);
    const rating = product.rating || 4.5;
    const reviewCount = product.reviewCount || 12;

    container.innerHTML = `
      <!-- Gallery -->
      <div class="gallery">
        <img src="${images[0]}" alt="${product.name}" class="gallery-main" id="mainImage"
             onerror="this.src='https://placehold.co/600x400/e8c8ce/6d6875?text=No+Image'">
        ${images.length > 1 ? `
          <div class="gallery-thumbs">
            ${images.map((img, i) => `
              <img src="${img}" alt="Thumbnail ${i + 1}" class="${i === 0 ? 'active' : ''}"
                   onclick="document.getElementById('mainImage').src=this.src;
                   document.querySelectorAll('.gallery-thumbs img').forEach(t=>t.classList.remove('active'));
                   this.classList.add('active');"
                   onerror="this.style.display='none'">
            `).join('')}
          </div>
        ` : ''}
        ${product.video ? `
          <div class="video-container">
            ${product.video.includes('youtube') || product.video.includes('youtu.be')
              ? `<iframe src="${product.video}" frameborder="0" allowfullscreen></iframe>`
              : `<video controls src="${product.video}"></video>`
            }
          </div>
        ` : ''}
      </div>

      <!-- Info -->
      <div class="product-info">
        <span class="category-tag">${product.category}</span>
        <h1>${product.name}</h1>
        <div class="rating">
          <span class="stars">${renderStars(rating)}</span>
          <span class="count">${rating} (${reviewCount} reviews)</span>
        </div>
        <div class="price">&#8377;${product.price}</div>
        <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:1rem;">Price Is Excluding Delivery Charges. Delivery Charges Will Be Shared Via WhatsApp After Order Placement.</p>
        <p class="description">${product.description || 'No description available.'}</p>
        <a href="checkout.html?id=${product.id}" class="btn-primary">Buy Now &rarr;</a>
      </div>
    `;
  } catch (err) {
    console.error('Error loading product:', err);
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">&#9888;</div>
        <p>Error loading product details.</p>
      </div>`;
  }
}

loadProduct();
