// ==========================================
// CONFIG & STATE
// ==========================================
const API_BASE = '/api/roblox?url=';
let currentStep = 1;
let selectedUser = null;
let selectedGame = null;
let searchTimeout = null;
let paypalRendered = false; // Flag agar tidak render button 2x
let saweriaScreenshotUploaded = false;
let uploadedScreenshotData = null;

// State Data
let orderData = {
    desiredRobux: 0,
    gamePassPrice: 0,
    gameId: null,
    gameName: '',
    userId: null,
    username: '',
    displayName: '',
    idrAmount: 0,    // Primary currency - IDR
    usdAmount: 0     // Secondary - USD (for PayPal sandbox)
};

// ==========================================
// CURRENCY CONFIG
// ==========================================
const RATE_ROBUX_TO_IDR = 144;    // 1 Robux = Rp 144
const RATE_USD_TO_IDR = 15000;    // 1 USD = Rp 15.000

function formatIDR(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatUSD(amount) {
    return '$' + parseFloat(amount).toFixed(2) + ' USD';
}

// ==========================================
// STEP 1: PACKAGE SELECTION
// ==========================================
function selectPackage(amount) {
    document.querySelectorAll('.robux-card').forEach(el => el.classList.remove('selected'));
    document.getElementById('customAmount').value = '';
    document.getElementById('customInfo').classList.add('hidden');
    
    orderData.desiredRobux = amount;
    orderData.idrAmount = 0;
    orderData.usdAmount = 0;
    event.currentTarget.classList.add('selected');
    enableNext();
}

function calculateCustom() {
    const val = parseInt(document.getElementById('customAmount').value);
    const info = document.getElementById('customInfo');
    
    document.querySelectorAll('.robux-card').forEach(el => el.classList.remove('selected'));
    
    if (val && val >= 10) {
        orderData.desiredRobux = val;
        orderData.idrAmount = 0;
        orderData.usdAmount = 0;
        info.classList.remove('hidden');
        info.classList.add('flex');
        enableNext();
    } else {
        orderData.desiredRobux = 0;
        info.classList.add('hidden');
        info.classList.remove('flex');
        disableNext();
    }
}

// ==========================================
// STEP 2: SEARCH USER & GAMES
// ==========================================
const searchInput = document.getElementById('searchUsername');
const searchDropdown = document.getElementById('searchDropdown');

searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (query.length < 2) {
        searchDropdown.classList.remove('show');
        return;
    }
    searchTimeout = setTimeout(() => searchUsers(query), 300);
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-wrapper')) searchDropdown.classList.remove('show');
});

async function searchUsers(keyword) {
    document.getElementById('searchSpinner').classList.remove('hidden');
    
    try {
        const data = await apiCall(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(keyword)}&limit=10`);
        
        if (!data.data || data.data.length === 0) {
            searchDropdown.innerHTML = '<div class="p-4 text-center text-gray-500">Tidak ditemukan</div>';
            searchDropdown.classList.add('show');
            return;
        }

        const lowerKeyword = keyword.toLowerCase();
        const exactMatches = data.data.filter(u => u.name.toLowerCase() === lowerKeyword);
        let results = exactMatches.length > 0 ? exactMatches.slice(0, 1) : data.data.slice(0, 3);

        // Fetch avatars
        const userIds = results.map(u => u.id).join(',');
        const avatarData = await apiCall(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds}&size=150x150&format=Png&isCircular=true`);
        
        const avatarMap = {};
        if (avatarData.data) {
            avatarData.data.forEach(a => {
                if (a.imageUrl) avatarMap[a.targetId] = a.imageUrl;
            });
        }

        searchDropdown.innerHTML = results.map(user => `
            <div class="user-suggestion" onclick="selectUser(${user.id}, '${user.name.replace(/'/g, "\\'")}', '${(user.displayName || user.name).replace(/'/g, "\\'")}', '${avatarMap[user.id] || ''}', ${user.hasVerifiedBadge || false})">
                <img class="user-suggestion-avatar" src="${avatarMap[user.id] || ''}" onerror="this.style.background='#e5e7eb'">
                <div class="user-suggestion-info">
                    <div class="user-suggestion-name">${user.displayName || user.name} ${user.hasVerifiedBadge ? '<span style="color:#00b4d8;">✓</span>' : ''}</div>
                    <div class="user-suggestion-display">@${user.name}</div>
                </div>
            </div>
        `).join('');
        
        searchDropdown.classList.add('show');
    } catch (error) {
        console.error(error);
    } finally {
        document.getElementById('searchSpinner').classList.add('hidden');
    }
}

function selectUser(userId, username, displayName, avatarUrl, isVerified) {
    selectedUser = { id: userId, name: username, displayName, avatar: avatarUrl, verified: isVerified };
    orderData.userId = userId;
    orderData.username = username;
    orderData.displayName = displayName;
    
    searchDropdown.classList.remove('show');
    searchInput.value = username;

    const card = document.getElementById('profileCard');
    document.getElementById('profileAvatar').src = avatarUrl;
    document.getElementById('profileDisplayName').innerText = displayName;
    document.getElementById('profileUsername').innerText = '@' + username;
    document.getElementById('profileUserId').innerText = 'ID: ' + userId;
    document.getElementById('profileVerified').innerHTML = isVerified ? '<span class="verified-badge-inline">✓ Verified</span>' : '';
    
    card.classList.add('show');
    document.getElementById('gamesPanel').classList.remove('show');
}

async function loadGames() {
    if (!selectedUser) return;
    
    const panel = document.getElementById('gamesPanel');
    const list = document.getElementById('gamesList');
    
    panel.classList.add('show');
    list.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;margin:10px auto;"></div>';

    try {
        const games = await fetchUserGames(selectedUser.id);
        document.getElementById('gamesCount').innerText = games.length + ' game';
        
        if (games.length === 0) {
            list.innerHTML = '<div class="text-sm text-gray-400 text-center py-3">Tidak ada game places</div>';
            return;
        }

        list.innerHTML = games.map((game, index) => `
            <div class="game-item" id="game-${index}" onclick="selectGameItem(${index}, ${game.id}, '${game.name.replace(/'/g, "\\'")}')">
                <img class="game-thumb" src="${game.thumbnail || ''}" onerror="this.style.display='none'">
                <div style="display:none;width:60px;height:60px;background:rgba(255,255,255,0.1);border-radius:10px;align-items:center;justify-content:center;font-size:1.5em;">🎮</div>
                <div class="game-info">
                    <div class="game-name">${game.name}</div>
                    <div class="game-stats">👥 ${game.playing || 0} playing • 🏗️ ${game.placeVisits || 0} visits</div>
                </div>
                <div class="game-check"><i class="fas fa-check"></i></div>
            </div>
        `).join('');

    } catch (error) {
        list.innerHTML = '<div class="text-sm text-red-400 text-center py-3">Gagal memuat game</div>';
    }
}

async function fetchUserGames(userId) {
    try {
        const data = await apiCall(`https://games.roblox.com/v2/users/${userId}/games?sortOrder=Asc&limit=10`);
        
        if (data.data && data.data.length > 0) {
            const universeIds = data.data.map(g => g.id).join(',');
            try {
                const thumbData = await apiCall(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeIds}&size=150x150&format=Png&isCircular=false`);
                const thumbMap = {};
                if (thumbData.data) {
                    thumbData.data.forEach(t => {
                        if (t.thumbnails && t.thumbnails[0]) thumbMap[t.universeId] = t.thumbnails[0].imageUrl;
                    });
                }
                data.data.forEach(g => g.thumbnail = thumbMap[g.id]);
            } catch (e) {}
        }
        return data.data || [];
    } catch (error) {
        return [];
    }
}

function selectGameItem(index, gameId, gameName) {
    document.querySelectorAll('.game-item').forEach(el => el.classList.remove('selected'));
    
    document.getElementById(`game-${index}`).classList.add('selected');
    
    selectedGame = { id: gameId, name: gameName };
    orderData.gameId = gameId;
    orderData.gameName = gameName;
    
    // Math: Game Pass Price (Robux)
    orderData.gamePassPrice = Math.ceil(orderData.desiredRobux / 0.7);
    
    // Math: IDR Calculation (Primary)
    orderData.idrAmount = orderData.gamePassPrice * RATE_ROBUX_TO_IDR;
    
    // Math: USD Calculation (Secondary - for PayPal sandbox)
    orderData.usdAmount = (orderData.idrAmount / RATE_USD_TO_IDR).toFixed(2);
    
    showDisclaimer();
}

// ==========================================
// DISCLAIMER MODAL (Game Pass)
// ==========================================
function showDisclaimer() {
    document.getElementById('calcDesired').innerText = orderData.desiredRobux + ' R$';
    document.getElementById('calcGamePass').innerText = orderData.gamePassPrice + ' R$';
    document.getElementById('calcEarnings').innerText = orderData.desiredRobux + ' R$';
    document.getElementById('instrGame').innerText = orderData.gameName;
    document.getElementById('instrPrice').innerText = orderData.gamePassPrice + ' R$';
    
    document.getElementById('disclaimerModal').classList.add('show');
}

function closeDisclaimer() {
    document.getElementById('disclaimerModal').classList.remove('show');
    document.querySelectorAll('.game-item').forEach(el => el.classList.remove('selected'));
    selectedGame = null;
}

function confirmDisclaimer() {
    document.getElementById('disclaimerModal').classList.remove('show');
    
    hideStep(2);
    currentStep = 3;
    showStep(3);
    updateNavButtons();
    
    document.getElementById('verifyGame').innerText = orderData.gameName;
    document.getElementById('verifyPrice').innerText = orderData.gamePassPrice + ' R$';
    document.getElementById('verifyRobux').innerText = orderData.desiredRobux + ' R$';
}

// ==========================================
// STEP 3: VERIFY GAME PASS
// ==========================================
async function checkGamePass() {
    const btn = document.getElementById('btnCheck');
    const icon = document.getElementById('verifyIcon');
    const text = document.getElementById('verifyText');
    const subtext = document.getElementById('verifySubtext');
    
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner w-4 h-4 border-2 inline mr-2"></div> Mengecek...';
    
    setTimeout(() => {
        const isSuccess = Math.random() > 0.2;
        
        if (isSuccess) {
            icon.className = 'verify-status success';
            icon.innerHTML = '<i class="fas fa-check"></i>';
            text.innerText = 'Game Pass Ditemukan!';
            text.style.color = '#51cf66';
            subtext.innerText = 'Game Pass dengan harga ' + orderData.gamePassPrice + ' R$ sudah terdeteksi. Silakan lanjutkan pembayaran.';
            
            btn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i> Lanjut ke Pembayaran';
            btn.onclick = () => {
                goToStep4();
            };
            btn.disabled = false;
        } else {
            icon.className = 'verify-status error';
            icon.innerHTML = '<i class="fas fa-times"></i>';
            text.innerText = 'Game Pass Tidak Ditemukan';
            text.style.color = '#ff4444';
            subtext.innerText = 'Belum ada Game Pass dengan harga ' + orderData.gamePassPrice + ' R$ di game ini.';
            
            btn.innerHTML = '<i class="fas fa-redo mr-2"></i> Cek Lagi';
            btn.disabled = false;
        }
    }, 2000);
}

function goToStep4() {
    hideStep(3);
    currentStep = 4;
    showStep(4);
    updateNavButtons();
    
    // Populate Payment Summary - IDR Primary, USD Secondary
    document.getElementById('payUsername').innerText = '@' + orderData.username;
    document.getElementById('payRobux').innerText = orderData.desiredRobux + ' Robux';
    document.getElementById('payTotalIDR').innerText = formatIDR(orderData.idrAmount);
    document.getElementById('payTotalUSD').innerText = '≈ ' + formatUSD(orderData.usdAmount);
    
    // Render PayPal Button (Sandbox)
    renderPayPalButtons();
}

// ==========================================
// STEP 4: PAYPAL SANDBOX INTEGRATION
// ==========================================
function renderPayPalButtons() {
    // Prevent multiple renders
    if (paypalRendered) return;

    // Clear container first
    const container = document.getElementById('paypal-button-container');
    container.innerHTML = '';

    paypal.Buttons({
        // Sandbox mode configuration
        createOrder: function(data, actions) {
            return actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [{
                    description: `Top Up ${orderData.desiredRobux} Robux for @${orderData.username}`,
                    amount: {
                        currency_code: 'USD',
                        value: orderData.usdAmount
                    }
                }],
                application_context: {
                    shipping_preference: 'NO_SHIPPING'
                }
            });
        },
        onApprove: function(data, actions) {
            // Show processing overlay
            document.getElementById('paymentProcessing').classList.add('show');

            return actions.order.capture().then(function(details) {
                // Simulate server processing delay
                setTimeout(() => {
                    document.getElementById('paymentProcessing').classList.remove('show');
                    
                    // Move to Success Step
                    hideStep(4);
                    currentStep = 5;
                    showStep(5);
                    updateNavButtons();
                    
                    // Show Success Content
                    document.getElementById('paymentLoading').classList.remove('block');
                    document.getElementById('paymentSuccess').classList.remove('hidden');
                    
                    document.getElementById('trxIdDisplay').textContent = data.orderID || ('TRX-' + Date.now());
                    document.getElementById('paymentTotalFinalIDR').textContent = formatIDR(orderData.idrAmount);
                    document.getElementById('paymentTotalFinalUSD').textContent = '≈ ' + formatUSD(orderData.usdAmount);
                    
                    // Save to Firebase (optional)
                    saveTransaction(data.orderID, 'paypal', details);
                }, 2000);
            });
        },
        onCancel: function(data) {
            console.log('PayPal payment cancelled by user');
            alert('Pembayaran dibatalkan. Silakan coba lagi.');
        },
        onError: function(err) {
            console.error('PayPal Error:', err);
            alert('Terjadi kesalahan saat pembayaran PayPal (Sandbox). Silakan coba lagi.\n\nCatatan: Pastikan Anda menggunakan akun PayPal Sandbox untuk testing.');
            document.getElementById('paymentProcessing').classList.remove('show');
        },
        style: {
            layout: 'vertical',
            color:  'blue',
            shape:  'rect',
            label:  'pay'
        }
    }).render('#paypal-button-container');
    
    paypalRendered = true;
}

// ==========================================
// SAWERIA DISCLAIMER & FLOW
// ==========================================
function showSaweriaDisclaimer() {
    // Update modal with current order data
    document.getElementById('saweriaAmount').innerText = formatIDR(orderData.idrAmount);
    document.getElementById('saweriaUsername').innerText = '@' + orderData.username;
    document.getElementById('saweriaInstrAmount').innerText = formatIDR(orderData.idrAmount);
    document.getElementById('saweriaInstrName').innerText = '@' + orderData.username;
    
    // Reset upload section
    saweriaScreenshotUploaded = false;
    uploadedScreenshotData = null;
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('btnConfirmSaweria').disabled = true;
    
    document.getElementById('saweriaModal').classList.add('show');
}

function closeSaweriaModal() {
    document.getElementById('saweriaModal').classList.remove('show');
}

function openSaweriaLink() {
    // Show upload section after clicking Saweria link
    setTimeout(() => {
        document.getElementById('uploadSection').classList.remove('hidden');
        document.getElementById('uploadSection').scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

// Screenshot Upload Handling
function handleScreenshotUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
        alert('File terlalu besar! Maksimal 5MB.');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedScreenshotData = e.target.result;
        saweriaScreenshotUploaded = true;
        
        // Show preview
        document.getElementById('previewImg').src = e.target.result;
        document.querySelector('.upload-placeholder').classList.add('hidden');
        document.getElementById('uploadPreview').classList.remove('hidden');
        
        // Enable confirm button
        document.getElementById('btnConfirmSaweria').disabled = false;
    };
    reader.readAsDataURL(file);
}

function removeScreenshot() {
    uploadedScreenshotData = null;
    saweriaScreenshotUploaded = false;
    document.getElementById('screenshotInput').value = '';
    document.querySelector('.upload-placeholder').classList.remove('hidden');
    document.getElementById('uploadPreview').classList.add('hidden');
    document.getElementById('btnConfirmSaweria').disabled = true;
}

function confirmSaweriaPayment() {
    if (!saweriaScreenshotUploaded) {
        alert('Silakan upload screenshot bukti pembayaran terlebih dahulu!');
        return;
    }
    
    // Close modal
    closeSaweriaModal();
    
    // Show processing
    document.getElementById('paymentProcessing').classList.add('show');
    
    // Simulate verification
    setTimeout(() => {
        document.getElementById('paymentProcessing').classList.remove('show');
        
        // Move to Success Step
        hideStep(4);
        currentStep = 5;
        showStep(5);
        updateNavButtons();
        
        // Show Success Content
        document.getElementById('paymentLoading').classList.remove('block');
        document.getElementById('paymentSuccess').classList.remove('hidden');
        
        const trxId = 'SWR-' + Date.now();
        document.getElementById('trxIdDisplay').textContent = trxId;
        document.getElementById('paymentTotalFinalIDR').textContent = formatIDR(orderData.idrAmount);
        document.getElementById('paymentTotalFinalUSD').textContent = '≈ ' + formatUSD(orderData.usdAmount);
        
        // Save to Firebase (optional)
        saveTransaction(trxId, 'saweria', { screenshot: uploadedScreenshotData });
    }, 3000);
}

// ==========================================
// FIREBASE: SAVE TRANSACTION
// ==========================================
function saveTransaction(trxId, method, details) {
    // Firebase config should be initialized in your main app
    // This is a placeholder for the save function
    console.log('Saving transaction:', {
        trxId,
        method,
        username: orderData.username,
        robux: orderData.desiredRobux,
        idrAmount: orderData.idrAmount,
        usdAmount: orderData.usdAmount,
        timestamp: new Date().toISOString(),
        details
    });
}

// ==========================================
// STEP 5: SUCCESS (Handled inside payment callbacks)
// ==========================================

// ==========================================
// NAVIGATION
// ==========================================
function nextStep() {
    if (currentStep === 1 && orderData.desiredRobux > 0) {
        hideStep(1);
        currentStep = 2;
        showStep(2);
        updateNavButtons();
        document.getElementById('packageInfo').innerText = orderData.desiredRobux + ' Robux';
    }
}

function prevStep() {
    if (currentStep > 1) {
        if(currentStep === 4) {
             // Reset PayPal render flag when going back
             paypalRendered = false;
             document.getElementById('paypal-button-container').innerHTML = '';
        }

        hideStep(currentStep);
        currentStep--;
        showStep(currentStep);
        updateNavButtons();
    }
}

function showStep(step) {
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    // Update Dots
    for(let i=1; i<=5; i++) {
        const dot = document.getElementById(`dot-${i}`);
        dot.classList.remove('active', 'completed');
        if (i === step) dot.classList.add('active');
        if (i < step) dot.classList.add('completed');
    }
}

function hideStep(step) {
    document.getElementById(`step-${step}`).classList.add('hidden');
}

function updateNavButtons() {
    const backBtn = document.getElementById('btnBack');
    const nextBtn = document.getElementById('btnNext');
    const navContainer = document.getElementById('navButtons');

    backBtn.classList.toggle('hidden', currentStep === 1);
    
    // Hide default navigation in Payment and Success steps
    if (currentStep === 4 || currentStep === 5) {
        navContainer.classList.add('hidden');
    } else {
        navContainer.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
    }
}

function enableNext() {
    const btn = document.getElementById('btnNext');
    btn.disabled = false;
    btn.classList.replace('bg-gray-300', 'bg-blue-600');
    btn.classList.replace('cursor-not-allowed', 'hover:bg-blue-700');
}

function disableNext() {
    const btn = document.getElementById('btnNext');
    btn.disabled = true;
    btn.classList.replace('bg-blue-600', 'bg-gray-300');
    btn.classList.replace('hover:bg-blue-700', 'cursor-not-allowed');
}

// ==========================================
// API HELPER
// ==========================================
async function apiCall(url) {
    const response = await fetch(API_BASE + encodeURIComponent(url), {
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

// Modal click outside to close
document.getElementById('disclaimerModal').addEventListener('click', function(e) {
    if (e.target === this) closeDisclaimer();
});

document.getElementById('saweriaModal').addEventListener('click', function(e) {
    if (e.target === this) closeSaweriaModal();
});
