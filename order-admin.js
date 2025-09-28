// File: order-admin.js - Menangani Tampilan Data di Dashboard Admin

if (typeof db !== "undefined") {
  const tableBody = document.getElementById("ordersTableBody");
  const ordersContainer = document.getElementById("ordersContainer");
  const loadingMessage = document.getElementById("loadingMessage");

  // Mendengarkan perubahan pada koleksi 'orders' secara real-time
  db.collection("orders")
    .orderBy("tanggalOrder", "desc")
    .onSnapshot((snapshot) => {
      tableBody.innerHTML = "";

      if (snapshot.empty) {
        loadingMessage.textContent = "Tidak ada pesanan baru.";
        ordersContainer.classList.add("hidden");
        return;
      }

      loadingMessage.classList.add("hidden");
      ordersContainer.classList.remove("hidden");

      snapshot.forEach((doc) => {
        const order = doc.data();
        const orderId = doc.id;

        // Format Waktu
        const date = order.tanggalOrder
          ? order.tanggalOrder.toDate()
          : new Date();
        const formattedDate = date.toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Tentukan Detail Pesanan Berdasarkan Tipe Layanan
        let detailPesananHTML = "";
        if (order.tipeLayanan === "Fast Robux") {
          detailPesananHTML = `
                        <p class="font-semibold text-red-600">${order.nominalRobux} Robux</p>
                        <p class="text-xs">Password: <span class="text-red-700">${order.password}</span></p>
                    `;
        } else if (order.tipeLayanan === "Gamepass Robux") {
          detailPesananHTML = `
                        <p class="font-semibold text-purple-600">Rp ${Number(
                          order.nominalPembelian
                        ).toLocaleString("id-ID")}</p>
                        <a href="${
                          order.linkGamepass
                        }" target="_blank" class="text-blue-500 hover:underline text-xs block truncate max-w-[150px]">Link Gamepass</a>
                    `;
        }

        // Tentukan Warna Badge Status
        let statusClass = "";
        if (order.status === "SELESAI") {
          statusClass = "bg-green-100 text-green-800";
        } else if (order.status === "DIPROSES") {
          statusClass = "bg-blue-100 text-blue-800";
        } else {
          statusClass = "bg-yellow-100 text-yellow-800";
        }

        const row = tableBody.insertRow();
        row.className = "hover:bg-gray-50";

        row.innerHTML = `
                    <td class="px-3 py-3 whitespace-nowrap text-sm font-semibold ${
                      order.tipeLayanan === "Fast Robux"
                        ? "text-red-600"
                        : "text-purple-600"
                    }">${order.tipeLayanan.replace(" Robux", "")}</td>
                    
                    <td class="px-3 py-3 whitespace-nowrap text-xs text-gray-500">${formattedDate}</td>
                    
                    <td class="px-3 py-3 text-sm text-gray-900">
                        <p class="font-medium">${order.username}</p>
                        <p class="text-xs text-gray-500">Telp: ${
                          order.nomorTelepon
                        }</p>
                        ${
                          order.emailPelanggan
                            ? `<p class="text-xs text-gray-500">Email: ${order.emailPelanggan}</p>`
                            : ""
                        }
                    </td>

                    <td class="px-3 py-3 text-sm text-gray-900">
                        ${detailPesananHTML}
                    </td>
                    
                    <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-500">${
                      order.metodePembayaran
                    }</td>

                    <td class="px-3 py-3 whitespace-nowrap">
                        <span id="status-${orderId}" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${order.status}
                        </span>
                    </td>

                    <td class="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <select onchange="updateOrderStatus('${orderId}', this.value)" class="text-gray-600 border border-gray-300 rounded-md p-1 text-xs focus:ring-blue-500 focus:border-blue-500">
                            <option value="" disabled selected>Ubah Status</option>
                            <option value="DIPROSES">Diproses</option>
                            <option value="SELESAI">Selesai</option>
                            <option value="DIBATALKAN">Dibatalkan</option>
                        </select>
                    </td>
                `;
      });
    });

  // Fungsi untuk memperbarui status pesanan
  window.updateOrderStatus = function (orderId, newStatus) {
    if (
      confirm(
        `Yakin ingin mengubah status pesanan ${orderId} menjadi ${newStatus}?`
      )
    ) {
      db.collection("orders")
        .doc(orderId)
        .update({
          status: newStatus,
        })
        .then(() => {
          // Berhasil
        })
        .catch((error) => {
          console.error("Error saat update status: ", error);
          alert("Gagal memperbarui status. Cek konsol.");
        });
    }
  };
} else {
  console.error("Firebase tidak terinisialisasi. Cek firebase-init.js");
}
