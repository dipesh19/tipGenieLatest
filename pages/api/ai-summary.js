// pages/api/ai-summary.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { results, days } = req.body || {};
    if (!results || !Array.isArray(results) || !results.length || !days) {
      return res.status(400).json({ error: "Missing results or days" });
    }

   const payload = results
  .slice(0, 3)
  .sort((a, b) => a.total - b.total)
  .map((r) => ({
    destination: r.destination,
    country: r.country,
    total: r.total,
    flightCost: r.flightCost,
    breakdown: r.breakdown,
    visaFee: r.visaFee,
  }));

const prompt = `
You are an expert travel planner.

Destinations (city, country, costs):
${JSON.stringify(payload, null, 2)}

Trip length: ${days} days.

Important: Plan at the COUNTRY level.
- Treat the city in "destination" only as the main entry point into that country.
- Focus on how to best use time across regions within the country (coast, mountains, main hub, etc.).
- Do NOT give street-level or neighborhood-level detail inside a single city.
- Think in terms of "in Spain", "in France", "in the United States", etc.

1) Task A: Write ONE short cost-saving summary line comparing the destinations.

2) Task B: For EACH destination, output 3–6 bullet points describing an efficient COUNTRY-LEVEL itinerary:
- Mention 1–3 key regions or cities, but keep the focus on how to allocate days across the country.
- Emphasize minimizing hotel changes and long transfers.
- Show how to cluster regions to make the most of the given days.

Respond as valid JSON only:
{
  "summary": "one line summary here",
  "itineraries": {
    "[destination label exactly as given]": ["bullet 1", "bullet 2"]
  }
}
`.trim();


    const apiRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("Perplexity error raw:", apiRes.status, text);
      return res
        .status(502)
        .json({ error: "Upstream AI error", status: apiRes.status });
    }

    const data = await apiRes.json();
let content = data?.choices?.[0]?.message?.content || "";

// Strip Markdown code fences if present
// Strip Markdown code fences if present
content = content.trim();

if (content.startsWith("```")) {
  const firstNewline = content.indexOf("\n");
  const lastFence = content.lastIndexOf("```");
  if (firstNewline !== -1 && lastFence !== -1 && lastFence > firstNewline) {
    content = content.slice(firstNewline + 1, lastFence).trim();
  }
}


let parsed;
try {
  parsed = JSON.parse(content);
} catch (e) {
  console.error("AI JSON parse error:", e, content);
  return res.status(500).json({ error: "AI response parse error" });
}

return res.status(200).json({
  summary: parsed.summary || "",
  itineraries: parsed.itineraries || {},
});

  } catch (err) {
    console.error("AI handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
