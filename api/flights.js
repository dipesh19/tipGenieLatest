const fetch = require('node-fetch');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

let db;
if (!getApps().length) {
  try { const conf = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'); initializeApp(conf); db = getFirestore(); } catch (e) { console.error('Firebase init failed', e); }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { origin = 'JFK', destinations = [], dates = {} } = req.body || {};
    const key = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY || '';
    const out = {}; const ttl = 6 * 60 * 60 * 1000; // 6 hours

    for (const dest of destinations) {
      const cacheKey = `${origin}_${dest}_${dates.start || 'any'}_${dates.end || 'any'}`.replace(/\s+/g, '_');
      let cached = null;
      if (db) {
        try { const ref = doc(db, 'flightCache', cacheKey); const snap = await getDoc(ref); if (snap.exists()) { const data = snap.data(); if (Date.now() - data.updatedAt.toMillis() < ttl) cached = data.result; } } catch (e) { console.warn('Flight cache read failed', e); }
      }
      if (cached) { out[dest] = cached; continue; }
      if (!key) { const mock = { price: Math.floor(Math.random()*400+300) }; out[dest] = mock; if (db) await setDoc(doc(db, 'flightCache', cacheKey), { result: mock, updatedAt: serverTimestamp() }, { merge: true }); continue; }
      try {
        const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}&dep_iata=${encodeURIComponent(origin)}&arr_iata=${encodeURIComponent(dest)}`;
        const r = await fetch(url); const j = await r.json(); const price = j.data && j.data[0] && j.data[0].price ? j.data[0].price : Math.floor(Math.random()*400+300); const result = { price, raw: j };
        out[dest] = result; if (db) await setDoc(doc(db, 'flightCache', cacheKey), { result, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) { const mock = { price: Math.floor(Math.random()*400+300), error: e.message }; out[dest] = mock; if (db) await setDoc(doc(db, 'flightCache', cacheKey), { result: mock, updatedAt: serverTimestamp() }, { merge: true }); }
    }

    res.json(out);
  } catch (err) { console.error('Flights handler error', err); res.status(500).json({ error: 'flights fetch failed' }); }
};
