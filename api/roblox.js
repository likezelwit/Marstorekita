export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL diperlukan' });

    try {
        const response = await fetch(decodeURIComponent(url));
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Proxy Error', details: error.message });
    }
}
