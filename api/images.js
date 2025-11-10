const fetch = require('node-fetch');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { queries = [] } = req.body || {};
    const key = process.env.NEXT_PUBLIC_PEXELS_KEY || '';
    const destinations = [];
    await Promise.all((queries||[]).map(async (q)=>{
      try{
        if(!key){ destinations.push({ name: q, image: `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}` }); return; }
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1`;
        const r = await fetch(url, { headers: { Authorization: key } });
        const j = await r.json();
        const photo = j.photos && j.photos[0] ? j.photos[0].src.medium : `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`;
        destinations.push({ name: q, image: photo });
      }catch(e){ destinations.push({ name: q, image: `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}` }); }
    }));
    res.json({ destinations });
  } catch (err) { console.error(err); res.status(500).json({ error: 'images failed' }); }
};
