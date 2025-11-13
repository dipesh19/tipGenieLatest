import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // get request data
    const { destinations = [], travelers = [] } = req.body;

    // construct path to VisaFees.json
    const visaDataPath = path.join(process.cwd(), "pages", "api", "VisaFees.json");
    const raw = fs.readFileSync(visaDataPath, "utf-8");
    const visaFees = JSON.parse(raw);

    const results = destinations.map((dest) => {
      // try to extract country from city-level names like "Paris, France"
      const country = dest.includes(",")
        ? dest.split(",").pop().trim()
        : dest.trim();

      const visaFee = visaFees[country] || 0;
      const totalVisaFee = visaFee * (travelers?.length || 1);

      return {
        destination: dest,
        country,
        visaFee,
        totalVisaFee,
      };
    });

    res.status(200).json({ results });
  } catch (err) {
    console.error("Visa API error:", err);
    res.status(500).json({ error: "Failed to load visa data" });
  }
}
