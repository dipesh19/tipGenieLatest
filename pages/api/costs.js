import fetch from "node-fetch";

const REGION_COSTS = {
  europe: 150,        // Western/Northern Europe
  eastern_europe: 90, // Eastern Europe & Balkans
  asia: 80,           // East/Southeast Asia
  south_asia: 65,     // India, Nepal, Sri Lanka
  middle_east: 100,   // Gulf & Levant
  africa: 85,         // North & Sub-Saharan
  americas: 120,      // North & South America
  oceania: 160,       // Australia, NZ
  default: 110,
};

const REGION_MAP = {
  france: "europe",
  spain: "europe",
  portugal: "europe",
  italy: "europe",
  germany: "europe",
  switzerland: "europe",
  greece: "europe",
  poland: "eastern_europe",
  czechia: "eastern_europe",
  india: "south_asia",
  nepal: "south_asia",
  sri_lanka: "south_asia",
  thailand: "asia",
  japan: "asia",
  singapore: "asia",
  vietnam: "asia",
  china: "asia",
  uae: "middle_east",
  saudi_arabia: "middle_east",
  kenya: "africa",
  tanzania: "africa",
  morocco: "africa",
  egypt: "africa",
  usa: "americas",
  mexico: "americas",
  brazil: "americas",
  canada: "americas",
  australia: "oceania",
  new_zealand: "oceania",
};

export default async function handler(req, res) {
  try {
    const { destinations = [] } = req.body;
    if (!Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: "No destinations provided" });
    }

    const results = await Promise.all(
      destinations.map(async (dest) => {
        const slug = dest.toLowerCase().replace(/\s+/g, "-");
        let dailyCost = null;

        try {
          const response = await fetch(
            `https://api.teleport.org/api/urban_areas/slug:${slug}/details/`,
            { timeout: 8000 }
          );
          if (response.ok) {
            const data = await response.json();
            const costSection = data.categories.find(
              (c) => c.id === "COST-OF-LIVING"
            );
            if (costSection) {
              const costItem = costSection.data.find(
                (d) => d.id === "COST-RESTAURANT-MEAL"
              );
              dailyCost = Math.round(
                (costItem?.currency_dollar_value || 10) * 3 * 1.5
              ); // 3 meals * markup
            }
          }
        } catch (err) {
          console.warn(`Teleport fetch failed for ${dest}`, err.message);
        }

        // Use fallback if Teleport failed or returned null
        if (!dailyCost) {
          const key = Object.keys(REGION_MAP).find((k) =>
            slug.includes(k)
          );
          const region = REGION_MAP[key] || "default";
          dailyCost = REGION_COSTS[region];
        }

        return { destination: dest, dailyCost };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Cost API error:", error);
    res.status(500).json({ error: error.message });
  }
}
