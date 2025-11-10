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
    const { destinations = [] } = req.body || {};
    const out = {}; const ttl = 24 * 60 * 60 * 1000; // 24 hours
    for (const destObj of destinations) {
      const destName = destObj.name || String(destObj);
      const cacheKey = `${destName}`.replace(/\s+/g, '_');
      let cached = null;
      if (db) {
        try { const ref = doc(db, 'costCache', cacheKey); const snap = await getDoc(ref); if (snap.exists()) { const data = snap.data(); if (Date.now() - data.updatedAt.toMillis() < ttl) cached = data.result; } } catch (e) { console.warn('Cost cache read failed', e); }
      }
      if (cached) { out[destName] = cached; continue; }
      try {
        let result = null;
        if (destObj.cityHref) {
          try {
            const cityRes = await fetch(destObj.cityHref);
            const cityJson = await cityRes.json();
            const uaLink = cityJson._links && cityJson._links['city:urban_area'] && cityJson._links['city:urban_area'].href;
            if (uaLink) {
              const detailsRes = await fetch(`${uaLink}details/`);
              if (detailsRes.ok) {
                const details = await detailsRes.json();
                const costCategory = details.categories.find(c=>c.id==='COST-OF-LIVING');
                const avg = costCategory ? Math.round(costCategory.data.reduce((s,i)=>s+(i.value||0),0)/Math.max(1,costCategory.data.length)) : null;
                result = { dailyCost: avg || Math.floor(Math.random()*80+30), avgDailyExpense: avg || Math.floor(Math.random()*120+50) };
              }
            }
          } catch(e) { console.warn('Teleport urban area fetch failed', e); }
        }
        if (!result) {
          const slug = destName.toLowerCase().replace(/ /g,'-');
          try {
            const r = await fetch(`https://api.teleport.org/api/urban_areas/slug:${slug}/details/`);
            if (r.ok) {
              const j = await r.json();
              const costCategory = j.categories.find(c=>c.id==='COST-OF-LIVING');
              const avg = costCategory ? Math.round(costCategory.data.reduce((s,i)=>s+(i.value||0),0)/Math.max(1,costCategory.data.length)) : null;
              result = { dailyCost: avg || Math.floor(Math.random()*80+30), avgDailyExpense: avg || Math.floor(Math.random()*120+50) };
            }
          } catch(e){}
        }
        if (!result) result = { dailyCost: Math.floor(Math.random()*80+30), avgDailyExpense: Math.floor(Math.random()*120+50) };
        out[destName] = result;
        if (db) await setDoc(doc(db, 'costCache', cacheKey), { result, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        const mock = { dailyCost: Math.floor(Math.random()*80+30), avgDailyExpense: Math.floor(Math.random()*120+50) };
        out[destName] = mock;
        if (db) await setDoc(doc(db, 'costCache', cacheKey), { result: mock, updatedAt: serverTimestamp() }, { merge: true });
      }
    }
    res.json(out);
  } catch (err) { console.error('Costs handler error', err); res.status(500).json({ error: 'cost fetch failed' }); }
};
