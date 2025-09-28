// File: order.js - Menangani Pengiriman Pesanan Pelanggan

if (typeof db !== "undefined") {
  // A. Fungsi untuk Menangani Submission FAST ROBUX
  const fastForm = document.getElementById("fastOrderForm");
  if (fastForm) {
    fastForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitButton = document.getElementById("submitFastOrderBtn");
      submitButton.textContent = "Memproses...";
      submitButton.disabled = true;

      const dataPesanan = {
        tipeLayanan: "Fast Robux",
        username: document.getElementById("usernameFast").value,
        password: document.getElementById("passwordFast").value,
        nominalRobux: document.getElementById("nominalFast").value,
        metodePembayaran: document.getElementById("pembayaranFast").value,
        emailPelanggan: document.getElementById("emailFast").value,
        nomorTelepon: document.getElementById("notelpFast").value,

        tanggalOrder: firebase.firestore.FieldValue.serverTimestamp(),
        status: "MENUNGGU PEMBAYARAN",
      };

      db.collection("orders")
        .add(dataPesanan)
        .then(() => {
          alert(
            "Pesanan Fast Robux berhasil dibuat! Mohon tunggu konfirmasi pembayaran dari kami."
          );
          fastForm.reset();
        })
        .catch((error) => {
          console.error("Error Fast Robux: ", error);
          alert(
            "Terjadi kesalahan saat mengirim pesanan Fast Robux. Silakan coba lagi."
          );
        })
        .finally(() => {
          submitButton.textContent = "Kirim Pesanan Fast Robux";
          submitButton.disabled = false;
        });
    });
  }

  // B. Fungsi untuk Menangani Submission GAMEPASS ROBUX
  const gamepassForm = document.getElementById("gamepassOrderForm");
  if (gamepassForm) {
    gamepassForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const submitButton = document.getElementById("submitGamepassOrderBtn");
      submitButton.textContent = "Memproses...";
      submitButton.disabled = true;

      const dataPesanan = {
        tipeLayanan: "Gamepass Robux",
        username: document.getElementById("usernameGamepass").value,
        nomorTelepon: document.getElementById("notelpGamepass").value,
        nominalPembelian: document.getElementById("nominalGamepass").value,
        linkGamepass: document.getElementById("linkGamepass").value,
        metodePembayaran: document.getElementById("pembayaranGamepass").value,

        tanggalOrder: firebase.firestore.FieldValue.serverTimestamp(),
        status: "MENUNGGU PEMBAYARAN",
      };

      db.collection("orders")
        .add(dataPesanan)
        .then(() => {
          alert(
            "Pesanan Gamepass Robux berhasil dibuat! Mohon tunggu konfirmasi pembayaran dari kami."
          );
          gamepassForm.reset();
        })
        .catch((error) => {
          console.error("Error Gamepass Robux: ", error);
          alert(
            "Terjadi kesalahan saat mengirim pesanan Gamepass Robux. Silakan coba lagi."
          );
        })
        .finally(() => {
          submitButton.textContent = "Kirim Pesanan Gamepass";
          submitButton.disabled = false;
        });
    });
  }
} else {
  console.error(
    "Firebase Firestore (db) tidak terinisialisasi. Cek firebase-init.js."
  );
}
