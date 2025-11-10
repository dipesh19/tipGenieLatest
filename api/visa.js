const fetch = require('node-fetch');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');

let db;
if (!getApps().length) {
  try {
    const conf = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
    initializeApp(conf);
    db = getFirestore();
  } catch (e) { console.error('Firebase init failed', e); }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { travelers = [], destinations = [] } = req.body || {};
    const key = process.env.NEXT_PUBLIC_TRAVEL_BUDDY_KEY || '';
    const cacheTTL = 12 * 60 * 60 * 1000; // 12 hours
    const out = {};

    for (const dest of destinations) {
      out[dest] = [];
      for (const trav of travelers) {
        const nationalities = (trav.nationalities && trav.nationalities.length) ? trav.nationalities : [''];
        const residencies = (trav.residencies && trav.residencies.length) ? trav.residencies : [''];
        let cachedResult = null;
        let visaResult = { visaRequired: 'Check', visaFee: 0 };

        for (const nat of nationalities) {
          for (const resStatus of residencies) {
            const cacheKey = `${nat}_${resStatus}_${dest}`.replace(/\s+/g, '_');
            try {
              if (db) {
                const ref = doc(db, 'visaCache', cacheKey);
                const snapshot = await getDoc(ref);
                if (snapshot.exists()) {
                  const cached = snapshot.data();
                  if (Date.now() - cached.updatedAt.toMillis() < cacheTTL) {
                    cachedResult = cached.data;
                    break;
                  }
                }
              }
            } catch (err) { console.warn('Cache read failed', err); }
            if (cachedResult) break;

            try {
              const url = `https://travel-buddy.p.rapidapi.com/api/v1/visa-policy?nationality=${encodeURIComponent(nat)}&destination=${encodeURIComponent(dest)}`;
              const r = await fetch(url, { method: 'GET', headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'travel-buddy.p.rapidapi.com' } });
              if (!r.ok) continue;
              const j = await r.json();
              if (j?.visa_free) { visaResult = { visaRequired: 'Not Required', visaFee: 0 }; }
              else if (j?.visa_required) { const fee = Number(j.visa_fee) || Number(j.fee_amount) || 0; visaResult = { visaRequired: 'Required', visaFee: fee }; }
              else { visaResult = { visaRequired: 'Check', visaFee: 0 }; }

              if (db) await setDoc(doc(db, 'visaCache', cacheKey), { data: visaResult, updatedAt: serverTimestamp() }, { merge: true });
              break;
            } catch (e) { console.warn('Travel Buddy call failed', e); }
          }
          if (cachedResult) break;
        }

        out[dest].push({ nationality: nationalities[0], residencies, visaRequired: cachedResult?.visaRequired || visaResult.visaRequired, visaFee: (cachedResult && typeof cachedResult.visaFee === 'number') ? cachedResult.visaFee : visaResult.visaFee });
      }
    }

    res.json(out);
  } catch (err) { console.error('Visa handler error', err); res.status(500).json({ error: 'Internal visa handler error' }); }
};
