export default async function handler(req, res) {
    // Memberi izin agar browser tidak memblokir (Anti-CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { endpoint } = req.query;

    if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint diperlukan' });
    }

    try {
        // Mendekode URL yang dikirim dari browser
        const targetUrl = decodeURIComponent(endpoint);
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json'
            },
            // Jika method-nya POST (buat cari username), kirim body-nya juga
            body: req.method === 'POST' ? JSON.stringify(req.body) : null
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Gagal mengambil data dari Roblox', details: error.message });
    }
}
