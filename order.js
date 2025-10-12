// File: order.js

// Pastikan firebase sudah di-init di HTML sebelum ini
// const db = firebase.firestore();

// Fungsi untuk submit order
function submitOrder(orderData) {
  // Standardisasi data
  const data = {
    tipeLayanan: orderData.tipeLayanan || "Fast Robux",
    username: orderData.username || "User",
    robux: orderData.nominalRobux || orderData.nominalPembelian || 0,
    metodePembayaran: orderData.metodePembayaran || "QRIS",
    emailPelanggan: orderData.email || "",
    nomorTelepon: orderData.telepon || "",
    tanggalOrder: firebase.firestore.FieldValue.serverTimestamp(),
    status: "MENUNGGU PEMBAYARAN",
  };

  // Simpan ke Firestore 'orders'
  db.collection("orders")
    .add(data)
    .then((docRef) => {
      console.log("Order berhasil disubmit:", docRef.id);

      // Jika berhasil, tambahkan juga ke 'transactions' untuk carousel
      db.collection("transactions")
        .add(data)
        .then(() => {
          console.log("Transaksi ditambahkan ke carousel");
        })
        .catch((err) => console.error("Error tambah transaksi:", err));

      alert("Order berhasil dikirim!");
    })
    .catch((error) => {
      console.error("Error submit order:", error);
      alert("Gagal submit order, silakan coba lagi.");
    });
}

// Contoh penggunaan
// Misal tombol submit di halaman Fast Robux
const fastRobuxForm = document.getElementById("fastRobuxForm");
if (fastRobuxForm) {
  fastRobuxForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = fastRobuxForm.username.value;
    const nominalRobux = parseInt(fastRobuxForm.nominalRobux.value);

    submitOrder({
      tipeLayanan: "Fast Robux",
      username,
      nominalRobux,
      metodePembayaran: "QRIS",
    });

    fastRobuxForm.reset();
  });
}

// Misal tombol submit Gamepass
const gamepassForm = document.getElementById("gamepassForm");
if (gamepassForm) {
  gamepassForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = gamepassForm.username.value;
    const nominalPembelian = parseInt(gamepassForm.nominal.value);

    submitOrder({
      tipeLayanan: "Gamepass",
      username,
      nominalPembelian,
      metodePembayaran: "QRIS",
    });

    gamepassForm.reset();
  });
}
