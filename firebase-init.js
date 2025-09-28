// File: firebase-init.js

// GANTI SEMUA NILAI DI SINI dengan konfigurasi dari Firebase Console Anda
const firebaseConfig = {
  apiKey: "AIzaSyBP-BfH2y4PnhDR4x0WZceIcu_AA2EKSO4", // GANTI INI
  authDomain: "marstorekita-storebase.firebaseapp.com", // GANTI INI
  projectId: "marstorekita-storebase", // GANTI INI
  storageBucket: "marstorekita-storebase.firebasestorage.app", // GANTI INI
  messagingSenderId: "655700298665", // GANTI INI
  appId: "1:655700298665:web:ae6c703ba545283c2152b8", // GANTI INI
  measurementId: "G-LERLQVVGRF", // GANTI INI (opsional)
};

// Inisialisasi Firebase App
const app = firebase.initializeApp(firebaseConfig);

// Inisialisasi Layanan yang Wajib Ada
// Variabel 'db' untuk database (digunakan order.js & order-admin.js)
const db = firebase.firestore();
// Variabel 'auth' untuk login admin (digunakan admin-auth.js)
const auth = firebase.auth();
