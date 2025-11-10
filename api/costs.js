/**
 * Costs API — Teleport Urban Areas + Firestore cache
 */
const fetch = require("node-fetch");
const { initializeApp, getApps } = require("firebase/app");
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require("firebase/firestore");

let db;
if (!getApps().length) {
  try {
    const conf = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}");
    initializeApp(conf);
    db = getFirestore();
  } catch (e) {
    console.error("Firebase init failed", e);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { destinations = [] } = req.body || {};
    const out = {};
    const ttl = 24 * 60 * 60 * 1000;

    for (const destObj of destinations) {
      const destName = destObj.name?.toLowerCase() || String(destObj).toLowerCase();
      const cacheKey = destName.replace(/\s+/g, "_");

      // Cache check
      let cached = null;
      if (db) {
        try {
          const ref = doc(db, "costCache", cacheKey);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            if (Date.now() - data.updatedAt.toMillis() < ttl) cached = data.result;
          }
        } catch (e) {
          console.warn("Cost cache read failed", e);
        }
      }

      if (cached) {
        out[destName] = cached;
        continue;
      }

      let result = null;
      try {
        const slug = destName.replace(/\s+/g, "-");
        const r = await fetch(`https://api.teleport.org/api/urban_areas/slug:${slug}/details/`);
        if (r.ok) {
          const j = await r.json();
          const costCategory = j.categories.find((c) => c.id === "COST-OF-LIVING");
          if (costCategory && costCategory.data.length > 0) {
            const avg =
              Math.round(
                costCategory.data.reduce((s, i) => s + (i.value || 0), 0) /
                  Math.max(1, costCategory.data.length)
              ) || 100;
            result = { dailyCost: avg, avgDailyExpense: avg + 30 };
          }
        }
      } catch (e) {
        console.warn("Teleport fetch failed", e);
      }

      if (!result)
        result = {
          dailyCost: Math.floor(Math.random() * 80 + 30),
          avgDailyExpense: Math.floor(Math.random() * 120 + 50),
        };

      out[destName] = result;

      if (db)
        await setDoc(
          doc(db, "costCache", cacheKey),
          { result, updatedAt: serverTimestamp() },
          { merge: true }
        );
    }

    res.json(out);
  } catch (err) {
    console.error("Costs handler error", err);
    res.status(500).json({ error: "cost fetch failed" });
  }
};
