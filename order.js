// File: order.js - Menangani Pengiriman Pesanan Pelanggan ke koleksi transactions

if (typeof db !== "undefined") {
  // === A. Fungsi untuk Submission FAST ROBUX ===
  const fastForm = document.getElementById("fastOrderForm");
  if (fastForm) {
    fastForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitButton = document.getElementById("submitFastOrderBtn");
      submitButton.textContent = "Memproses...";
      submitButton.disabled = true;

      try {
        const username = document.getElementById("usernameFast").value;
        const nominalRobux = Number(document.getElementById("nominalFast").value);

        // Contoh perhitungan harga (bisa disesuaikan)
        const grossGamepassPrice = nominalRobux * 100; // harga gamepass contoh
        const totalPriceIDR = grossGamepassPrice; // bisa tambahkan fee

        const dataPesanan = {
          username: username,
          netRobux: nominalRobux,
          grossGamepassPrice: grossGamepassPrice,
          totalPriceIDR: totalPriceIDR,
          transactionStatus: "Pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          tipeLayanan: "Fast Robux", // opsional untuk info tambahan
        };

        await db.collection("transactions").add(dataPesanan);

        alert("Pesanan Fast Robux berhasil dibuat! Mohon tunggu konfirmasi.");
        fastForm.reset();
      } catch (error) {
        console.error("Error Fast Robux: ", error);
        alert("Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.");
      } finally {
        submitButton.textContent = "Kirim Pesanan Fast Robux";
        submitButton.disabled = false;
      }
    });
  }

  // === B. Fungsi untuk Submission GAMEPASS ROBUX ===
  const gamepassForm = document.getElementById("gamepassOrderForm");
  if (gamepassForm) {
    gamepassForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitButton = document.getElementById("submitGamepassOrderBtn");
      submitButton.textContent = "Memproses...";
      submitButton.disabled = true;

      try {
        const username = document.getElementById("usernameGamepass").value;
        const nominalRobux = Number(document.getElementById("nominalGamepass").value);

        // Contoh perhitungan harga
        const grossGamepassPrice = nominalRobux * 120; // harga gamepass contoh
        const totalPriceIDR = grossGamepassPrice; // bisa tambahkan fee

        const dataPesanan = {
          username: username,
          netRobux: nominalRobux,
          grossGamepassPrice: grossGamepassPrice,
          totalPriceIDR: totalPriceIDR,
          transactionStatus: "Pending",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          tipeLayanan: "Gamepass Robux",
          linkGamepass: document.getElementById("linkGamepass").value,
        };

        await db.collection("transactions").add(dataPesanan);

        alert("Pesanan Gamepass Robux berhasil dibuat! Mohon tunggu konfirmasi.");
        gamepassForm.reset();
      } catch (error) {
        console.error("Error Gamepass Robux: ", error);
        alert("Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.");
      } finally {
        submitButton.textContent = "Kirim Pesanan Gamepass";
        submitButton.disabled = false;
      }
    });
  }
} else {
  console.error("Firebase Firestore (db) tidak terinisialisasi. Cek firebase-init.js.");
}
