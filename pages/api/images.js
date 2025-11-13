/**
 * Images API — Pexels free photos + Firestore cache
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
    const key = process.env.NEXT_PUBLIC_PEXELS_KEY || "";
    const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
    const out = {};

    for (const destObj of destinations) {
      const destName = destObj.name || String(destObj);
      const cacheKey = destName.replace(/\s+/g, "_");

      let cached = null;
      if (db) {
        try {
          const ref = doc(db, "imgCache", cacheKey);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            if (Date.now() - data.updatedAt.toMillis() < ttl) cached = data.result;
          }
        } catch (e) {
          console.warn("Image cache read failed", e);
        }
      }

      if (cached) {
        out[destName] = cached;
        continue;
      }

      let imgUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(destName)}`;
      if (key) {
        try {
          const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(destName)}&per_page=1`, {
            headers: { Authorization: key },
          });
          if (r.ok) {
            const j = await r.json();
            if (j.photos?.length > 0) imgUrl = j.photos[0].src.medium;
          }
        } catch (err) {
          console.warn("Pexels fetch failed", err);
        }
      }

      const result = { image: imgUrl };
      out[destName] = result;

      if (db)
        await setDoc(
          doc(db, "imgCache", cacheKey),
          { result, updatedAt: serverTimestamp() },
          { merge: true }
        );
    }

    res.json(out);
  } catch (err) {
    console.error("Images handler error", err);
    res.status(500).json({ error: "image fetch failed" });
  }
};
