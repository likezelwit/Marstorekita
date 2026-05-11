// ============================================
// VERCEL SERVERLESS FUNCTION
// Endpoint: /api/roblox?url=ROBLOX_API_URL
// ============================================

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Security: hanya izinkan roblox.com
  try {
    const parsed = new URL(targetUrl);
    if (!parsed.hostname.endsWith('roblox.com')) {
      return res.status(403).json({ error: 'Only roblox.com allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': req.headers['accept'] || 'application/json',
        'Content-Type': req.headers['content-type'] || 'application/json',
        'User-Agent': 'Roblox-Profile-Finder/1.0 (Vercel)',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    
    // Parse Content-Type dari response Roblox
    const contentType = response.headers.get('content-type') || 'application/json';
    
    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    res.send(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
