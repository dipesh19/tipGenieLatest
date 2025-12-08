export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin = 'JFK', destinations = [] } = req.body || {};
    const results = destinations.map((dest, i) => ({
      destination: dest,
      flightCost: Math.floor(Math.random() * 400 + 300), // $300-700 mock
      provider: 'mock-flights'
    }));

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Flights API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
