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

Destinations:
${JSON.stringify(payload, null, 2)}

Trip length: ${days} days.

1) Write ONE short cost-saving summary line.
2) For EACH destination, write 3–6 bullet points for an efficient, country-level itinerary.

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
