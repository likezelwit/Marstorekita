// File: order-carousel.js

// Pastikan firebase sudah di-init di HTML sebelum ini
// const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
  const carousel = document.getElementById('purchaseCarousel');
  const emptyState = document.getElementById('emptyState');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  let purchaseData = [];
  let currentPosition = 0;
  let autoSlideInterval;
  let isAutoSliding = true;

  // Fungsi untuk sensor username
  function maskUsername(username) {
    if (!username || username.length <= 3) return username || 'User';
    const firstChar = username.charAt(0);
    const lastChar = username.charAt(username.length - 1);
    const maskedLength = username.length - 2;
    return firstChar + '*'.repeat(maskedLength) + lastChar;
  }

  // Fungsi membuat card pembelian
  function createPurchaseCard(data) {
    const card = document.createElement('div');
    card.className = 'purchase-card';

    const maskedUsername = maskUsername(data.username);
    const robuxAmount = data.robux || '0';

    card.innerHTML = `
      <div class="flex items-center mb-4">
        <div class="purchase-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div>
          <h4 class="font-bold text-lg text-gray-800">${maskedUsername}</h4>
          <p class="text-gray-500 text-sm">Baru saja</p>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas fa-coins text-yellow-500 mr-2"></i>
          <span class="font-semibold text-gray-800">${robuxAmount} R$</span>
        </div>
        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Berhasil</span>
      </div>
    `;

    return card;
  }

  // Update carousel
  function updateCarousel() {
    carousel.innerHTML = '';

    if (purchaseData.length === 0) {
      carousel.style.display = 'none';
      emptyState.style.display = 'block';
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      return;
    }

    carousel.style.display = 'flex';
    emptyState.style.display = 'none';
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';

    const duplicatedData = [...purchaseData, ...purchaseData];

    duplicatedData.forEach(data => {
      const card = createPurchaseCard(data);
      carousel.appendChild(card);
    });

    currentPosition = 0;
    updateCarouselPosition();
    startAutoSlide();
  }

  function updateCarouselPosition() {
    const cardWidth = 280 + 16; // lebar card + margin
    carousel.style.transform = `translateX(-${currentPosition * cardWidth}px)`;
  }

  function navigateToPosition(position) {
    const maxPosition = purchaseData.length - 1;
    if (position < 0) currentPosition = maxPosition;
    else if (position > maxPosition) currentPosition = 0;
    else currentPosition = position;
    updateCarouselPosition();
  }

  function startAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(() => {
      if (isAutoSliding) navigateToPosition(currentPosition + 1);
    }, 3000);
  }

  // Load data dari Firestore
  function loadPurchaseData() {
    db.collection('transactions')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .onSnapshot(snapshot => {
        purchaseData = [];
        snapshot.forEach(doc => purchaseData.push(doc.data()));
        updateCarousel();
      }, error => {
        console.error("Error getting transactions: ", error);
        carousel.style.display = 'none';
        emptyState.style.display = 'block';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      });
  }

  // Event tombol navigasi
  prevBtn.addEventListener('click', () => {
    isAutoSliding = false;
    navigateToPosition(currentPosition - 1);
    setTimeout(() => { isAutoSliding = true; }, 5000);
  });

  nextBtn.addEventListener('click', () => {
    isAutoSliding = false;
    navigateToPosition(currentPosition + 1);
    setTimeout(() => { isAutoSliding = true; }, 5000);
  });

  carousel.addEventListener('mouseenter', () => { isAutoSliding = false; });
  carousel.addEventListener('mouseleave', () => { isAutoSliding = true; });

  loadPurchaseData();
});
