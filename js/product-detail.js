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
        <div class="gallery-slider" id="gallerySlider">
          <div class="gallery-track" id="galleryTrack">
            ${images.map((img, i) => `
              <div class="gallery-slide">
                <img src="${img}" alt="${product.name} - Image ${i + 1}"
                     onerror="this.src='https://placehold.co/600x400/e8c8ce/6d6875?text=No+Image'">
              </div>
            `).join('')}
          </div>
          ${images.length > 1 ? `
            <button class="gallery-arrow gallery-prev" id="galleryPrev" aria-label="Previous image">&#10094;</button>
            <button class="gallery-arrow gallery-next" id="galleryNext" aria-label="Next image">&#10095;</button>
            <div class="gallery-dots" id="galleryDots">
              ${images.map((_, i) => `<span class="gallery-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`).join('')}
            </div>
          ` : ''}
        </div>
        ${images.length > 1 ? `
          <div class="gallery-thumbs" id="galleryThumbs">
            ${images.map((img, i) => `
              <img src="${img}" alt="Thumbnail ${i + 1}" class="${i === 0 ? 'active' : ''}" data-index="${i}"
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

    // --- Swipeable gallery logic ---
    if (images.length > 1) {
      const track = document.getElementById('galleryTrack');
      const slider = document.getElementById('gallerySlider');
      const dots = document.querySelectorAll('.gallery-dot');
      const thumbs = document.querySelectorAll('#galleryThumbs img');
      const prevBtn = document.getElementById('galleryPrev');
      const nextBtn = document.getElementById('galleryNext');
      let current = 0;
      const total = images.length;

      function goToSlide(index) {
        current = (index + total) % total;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
        thumbs.forEach((t, i) => t.classList.toggle('active', i === current));
        thumbs[current]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }

      prevBtn.addEventListener('click', () => goToSlide(current - 1));
      nextBtn.addEventListener('click', () => goToSlide(current + 1));
      dots.forEach(dot => dot.addEventListener('click', () => goToSlide(+dot.dataset.index)));
      thumbs.forEach(thumb => thumb.addEventListener('click', () => goToSlide(+thumb.dataset.index)));

      // Touch swipe
      let startX = 0, startY = 0, diffX = 0, swiping = false;
      slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        swiping = true;
        track.style.transition = 'none';
      }, { passive: true });

      slider.addEventListener('touchmove', (e) => {
        if (!swiping) return;
        diffX = e.touches[0].clientX - startX;
        const diffY = e.touches[0].clientY - startY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
          track.style.transform = `translateX(calc(-${current * 100}% + ${diffX}px))`;
        }
      }, { passive: true });

      slider.addEventListener('touchend', () => {
        if (!swiping) return;
        swiping = false;
        track.style.transition = '';
        if (diffX > 50) goToSlide(current - 1);
        else if (diffX < -50) goToSlide(current + 1);
        else goToSlide(current);
        diffX = 0;
      });

      // Mouse drag for desktop
      let mouseDown = false, mouseStartX = 0, mouseDiff = 0;
      slider.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseStartX = e.clientX;
        track.style.transition = 'none';
        slider.style.cursor = 'grabbing';
        e.preventDefault();
      });
      slider.addEventListener('mousemove', (e) => {
        if (!mouseDown) return;
        mouseDiff = e.clientX - mouseStartX;
        track.style.transform = `translateX(calc(-${current * 100}% + ${mouseDiff}px))`;
      });
      const endDrag = () => {
        if (!mouseDown) return;
        mouseDown = false;
        track.style.transition = '';
        slider.style.cursor = '';
        if (mouseDiff > 50) goToSlide(current - 1);
        else if (mouseDiff < -50) goToSlide(current + 1);
        else goToSlide(current);
        mouseDiff = 0;
      };
      slider.addEventListener('mouseup', endDrag);
      slider.addEventListener('mouseleave', endDrag);
    }
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
