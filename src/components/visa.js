import fetch from "node-fetch";

const feeMap = require('../data/VisaFees.json');

export default async function handler(req, res) {
  const { nationality = "", residency = "", destination = "" } = req.query;
  const RAPID_KEY = process.env.NEXT_PUBLIC_TRAVEL_BUDDY_KEY;

  if (!nationality || !destination)
    return res.status(400).json({ error: "Missing nationality or destination" });

  try {
    if (!global._visaCache) global._visaCache = new Map();

    const cacheKey = `${nationality}_${destination}`;

    if (global._visaCache.has(cacheKey))
      return res.status(200).json(global._visaCache.get(cacheKey));

    const tbRes = await fetch(
      `https://travel-buddy.p.rapidapi.com/api/v1/visa?nationality=${encodeURIComponent(
        nationality
      )}&destination=${encodeURIComponent(destination)}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPID_KEY,
          "X-RapidAPI-Host": "travel-buddy.p.rapidapi.com",
        },
      }
    );

    let visaInfo = null;
    if (tbRes.ok) {
      const tbData = await tbRes.json();
      visaInfo =
        tbData?.data ||
        tbData?.result ||
        tbData ||
        { visa_required: "Unknown", visa_type: "Unknown" };
    }

    const normDest = destination.trim().toLowerCase();
    const visaFee = feeMap?.[normDest] || feeMap?.[destination] || 0;

    const response = {
      destination,
      nationality,
      residency,
      visa_required:
        visaInfo?.visa_required || visaInfo?.requirement || "Unknown",
      visa_type: visaInfo?.visa_type || "Tourist",
      visa_fee_usd: visaFee,
      source: visaFee ? "VisaFees.json (fallback)" : "Travel Buddy API",
      last_updated: new Date().toISOString(),
    };

    global._visaCache.set(cacheKey, response);

    res.status(200).json(response);
  } catch (err) {
    console.error("Visa API error:", err);
    res.status(500).json({ error: "Failed to fetch visa info", details: err.message });
  }
}
