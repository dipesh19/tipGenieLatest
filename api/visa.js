/**
 * Visa API — Travel Buddy + Firestore cache
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
    const { travelers = [], destinations = [] } = req.body || {};
    const key = process.env.NEXT_PUBLIC_TRAVEL_BUDDY_KEY || "";
    const cacheTTL = 12 * 60 * 60 * 1000;
    const out = {};

    for (const destObj of destinations) {
      const destName = destObj.name || String(destObj);
      out[destName] = [];

      for (const trav of travelers) {
        const nationalities = trav.nationalities?.length ? trav.nationalities : [""];
        const residencies = trav.residencies?.length ? trav.residencies : [""];
        let visaResult = { visaRequired: "Unknown", visaFee: 0 };

        for (const nat of nationalities) {
          for (const resStatus of residencies) {
            const cacheKey = `${nat}_${resStatus}_${destName}`.replace(/\s+/g, "_");

            // Try cache
            if (db) {
              try {
                const ref = doc(db, "visaCache", cacheKey);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                  const cached = snap.data();
                  if (Date.now() - cached.updatedAt.toMillis() < cacheTTL) {
                    visaResult = cached.data;
                    break;
                  }
                }
              } catch (err) {
                console.warn("Cache read failed", err);
              }
            }

            // Live Travel Buddy API call
            if (key) {
              try {
                const url = `https://travel-buddy.p.rapidapi.com/api/v1/visa-policy?nationality=${encodeURIComponent(
                  nat
                )}&destination=${encodeURIComponent(destName)}`;
                const r = await fetch(url, {
                  method: "GET",
                  headers: {
                    "x-rapidapi-key": key,
                    "x-rapidapi-host": "travel-buddy.p.rapidapi.com",
                  },
                });

                if (r.ok) {
                  const j = await r.json();
                  const d = j.data || {};

                  if (d.visa_free) visaResult = { visaRequired: "Not Required", visaFee: 0 };
                  else if (d.visa_required)
                    visaResult = { visaRequired: "Required", visaFee: Number(d.visa_fee) || 80 };
                  else visaResult = { visaRequired: "Check", visaFee: 0 };

                  if (db)
                    await setDoc(
                      doc(db, "visaCache", cacheKey),
                      { data: visaResult, updatedAt: serverTimestamp() },
                      { merge: true }
                    );
                }
              } catch (err) {
                console.warn("Travel Buddy call failed", err);
              }
            }
          }
        }

        out[destName].push({
          nationality: nationalities[0],
          residencies,
          visaRequired: visaResult.visaRequired,
          visaFee: visaResult.visaFee,
        });
      }
    }

    res.json(out);
  } catch (err) {
    console.error("Visa handler error", err);
    res.status(500).json({ error: "Internal visa handler error" });
  }
};
