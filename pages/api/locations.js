export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&limit=10` +
      `&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TripGenie-MVP/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const locations = data
      .filter(item => {
        const type = item.type || '';
        return ['city', 'town', 'village', 'municipality', 'administrative'].includes(type);
      })
      .map(item => {
        const address = item.address || {};
        const city = address.city || address.town || address.village || item.name;
        const country = address.country || '';
        const state = address.state || '';

        let label = city;
        if (state && state !== city) {
          label += `, ${state}`;
        }
        if (country) {
          label += `, ${country}`;
        }

        return {
          value: item.place_id,
          label: label,
          city: city,
          country: country,
          lat: item.lat,
          lon: item.lon
        };
      })
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      locations: locations
    });

  } catch (error) {
    console.error('Locations API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch locations',
      message: error.message 
    });
  }
}
