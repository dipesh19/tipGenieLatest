import fs from "fs";
import path from "path";

// Basic region mapping for realistic expense estimates
const regionMap = {
  india: "south_asia",
  nepal: "south_asia",
  "sri lanka": "south_asia",
  thailand: "asia",
  japan: "asia",
  singapore: "asia",
  egypt: "africa",
  usa: "americas",
  "united states": "americas",
  "new zealand": "oceania",
  "south africa": "africa",
  "united kingdom": "europe",
  spain: "europe",
  portugal: "europe",
  france: "europe",
  italy: "europe",
  morocco: "africa",
  mexico: "americas",
  brazil: "americas",
  canada: "americas",
  australia: "oceania",
  indonesia: "asia",
  malaysia: "asia",
  china: "asia",
  "hong kong": "asia",
  "south korea": "asia",
  uae: "middle_east",
  "saudi arabia": "middle_east",
  turkey: "europe",
  greece: "europe",
};

// Typical per-day cost estimates (USD) by region
const regionCosts = {
  europe: { avgDaily: 130, lodging: 70, food: 40, transport: 20 },
  americas: { avgDaily: 110, lodging: 60, food: 35, transport: 15 },
  middle_east: { avgDaily: 95, lodging: 50, food: 30, transport: 15 },
  asia: { avgDaily: 85, lodging: 40, food: 30, transport: 15 },
  south_asia: { avgDaily: 65, lodging: 30, food: 20, transport: 10 },
  africa: { avgDaily: 75, lodging: 35, food: 25, transport: 15 },
  oceania: { avgDaily: 140, lodging: 80, food: 40, transport: 20 },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { destinations } = req.body;
    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: "No destinations provided" });
    }

    // Compute cost estimates
    const results = destinations.map((destRaw) => {
      const dest = destRaw.toLowerCase().trim();
      const region = regionMap[dest] || "europe"; // fallback to europe
      const costData = regionCosts[region] || regionCosts.europe;

      const breakdown = {
        lodging: costData.lodging,
        food: costData.food,
        transport: costData.transport,
        misc: Math.round(costData.avgDaily * 0.1),
      };

      return {
        destination: destRaw,
        region,
        avgDaily: costData.avgDaily,
        breakdown,
      };
    });

    res.status(200).json({ results });
  } catch (err) {
    console.error("Costs API error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
