import React, { useState } from "react";

import Page from "./UI/Page";
import TopHeader from "./UI/TopHeader";
import GlassCard from "./UI/GlassCard";
import CTAButton from "./UI/CTAButton";

import DateFields from "./Form/DateFields";
import DestinationSelect from "./Form/DestinationSelect";
import TravelerFields from "./Form/TravelerFields";

import AIInsights from "./Results/AIInsights";
import ResultsTable from "./Results/ResultsTable";

import { formatCurrency, extractCountry } from "../utils/formatters";
import { resolveCostTier } from "../utils/costTiers";
import { computeVisaFeeForTraveler } from "../utils/visaCalculator";

export default function TravelPlanner() {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    origin: "",
    destinations: [],
    travelers: [{ name: "", nationality: [], residency: [], age: "" }],
  });

  const [results, setResults] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [aiItineraries, setAiItineraries] = useState({});
  const [showInsights, setShowInsights] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItineraryDest, setSelectedItineraryDest] = useState(null);

  const addTraveler = () =>
    setForm((p) => ({
      ...p,
      travelers: [
        ...p.travelers,
        { name: "", nationality: [], residency: [], age: "" },
      ],
    }));

  const updateTraveler = (i, key, val) =>
    setForm((p) => {
      const t = [...p.travelers];
      t[i] = { ...t[i], [key]: val };
      return { ...p, travelers: t };
    });

  const buildFallbackItinerary = (destination, days) => {
    if (!destination || !days || days < 1) return [];
    const country = extractCountry(destination);

    if (days <= 3) {
      return [
        `Day 1: Arrive in ${country}. Focus on one primary city/area to avoid transit fatigue. Explore the historic center and a key viewpoint.`,
        `Day 2: Deep dive into culture – top museums, local markets, and a neighborhood known for food or nightlife.`,
        `Day 3: Half‑day nearby nature or coastal escape, then a slow evening in cafés or plazas to soak up local life.`,
      ];
    }

    if (days <= 7) {
      return [
        `Days 1–2: Start in the main gateway city in ${country}. Cover core highlights, old town, and 2–3 must‑see landmarks.`,
        `Days 3–4: One secondary region (coastal, wine, mountains, or cultural hub). Minimize hotel changes to 1 move only.`,
        `Day 5: Flexible day for local markets, food experiences, and second‑tier sights at a relaxed pace.`,
        `Day 6: Day trip within 1–2 hours to a contrasting area – small town, beach, or countryside.`,
        `Day 7: Buffer day for weather or energy. Revisit favorite spots, shop, and enjoy a long local-style dinner.`,
      ];
    }

    return [
      `First 3 days: Base in a major hub in ${country}. Do core city highlights and get oriented without rushing.`,
      `Next 3–5 days: Two key regions max (e.g. coast + inland, north + south). Spend at least 2 nights per stop to avoid constant packing.`,
      `Final days: Slow down in your favorite region. Add low‑effort day trips, food tours, and time in parks, beaches, or small towns.`,
      `Overall strategy: Limit long transfers, cluster sights by area, and keep one or two easy afternoons for serendipitous exploration.`,
    ];
  };

  const callPerplexityForSummaryAndItinerary = async (resultsArr, days) => {
  if (!resultsArr || resultsArr.length === 0) {
    return { summary: [], itineraries: {} };
  }

  const payload = resultsArr
    .sort((a, b) => a.total - b.total)
    .slice(0, 3)
    .map((r) => ({
      destination: r.destination,
      country: extractCountry(r.destination),
      total: r.total,
      flightCost: r.flightCost,
      breakdown: r.breakdown,
      visaFee: r.visaFee,
    }));

  const res = await fetch("/api/ai-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results: payload, days }),
  });

  if (!res.ok) {
    throw new Error(`AI summary API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    summary: data.summary ? [data.summary] : [],
    itineraries: data.itineraries || {},
  };
};


  const handleSubmit = async (e) => {
    // ... rest of your file unchanged ...

    e?.preventDefault();
    setLoading(true);
    setShowInsights(false);

    const days = Math.max(
      1,
      Math.round(
        (new Date(form.endDate) - new Date(form.startDate)) /
          (1000 * 60 * 60 * 24)
      )
    );

    let costsRes = {};
    let flightsRes = {};
    let visaRes = {};

    try {
      costsRes = await fetch("/api/costs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinations: form.destinations.map((d) => d.value),
        }),
      })
        .then((r) => r.json())
        .catch(() => ({}));
    } catch {
      costsRes = {};
    }

    try {
      flightsRes = await fetch("/api/flights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: form.origin || null,
          destinations: form.destinations.map((d) => d.value),
        }),
      })
        .then((r) => r.json())
        .catch(() => ({}));
    } catch {
      flightsRes = {};
    }

    try {
      visaRes = await fetch("/api/visa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinations: form.destinations.map((d) => d.value),
          travelers: form.travelers,
        }),
      })
        .then((r) => r.json())
        .catch(() => ({}));
    } catch {
      visaRes = {};
    }

    const built = form.destinations.map((d, i) => {
      const destLabel = d.value;
      const destCountry = extractCountry(destLabel);

      const apiBreakdown = costsRes?.results?.[i]?.breakdown || {};
      const tierFallback = resolveCostTier(destLabel);

      const breakdown = {
        lodging: Number(apiBreakdown.lodging ?? tierFallback.lodging),
        food: Number(apiBreakdown.food ?? tierFallback.food),
        transport: Number(apiBreakdown.transport ?? tierFallback.transport),
        misc: Number(apiBreakdown.misc ?? tierFallback.misc),
      };

      const visaFeeFromApi = visaRes?.results?.[i]?.totalVisaFee;
      const computedVisaFee = form.travelers.reduce(
        (sum, t) => sum + computeVisaFeeForTraveler(destCountry, t),
        0
      );
      const visaFee =
        visaFeeFromApi != null ? visaFeeFromApi : computedVisaFee;

      const flightCost = Number(
        flightsRes?.results?.[i]?.flightCost ??
          (form.origin ? 450 : 500)
      );

      const tripDaily =
        (Number(breakdown.lodging || 0) +
          Number(breakdown.food || 0) +
          Number(breakdown.transport || 0) +
          Number(breakdown.misc || 0)) *
        days;

      const total = Math.round(
        Number(flightCost || 0) + Number(tripDaily || 0) + Number(visaFee || 0)
      );

      return {
        destination: destLabel,
        breakdown,
        visaFee: Number(visaFee || 0),
        flightCost,
        total,
      };
    });

    setResults(built);

    const sorted = [...built].sort((a, b) => a.total - b.total);
    const cheapest = sorted[0];

    try {
      const ai = await callPerplexityForSummaryAndItinerary(sorted, days);

      if (ai.summary && ai.summary.length) {
        setAiInsights(ai.summary);
      } else {
        setAiInsights([
          `💡 Estimated trip cost for ${cheapest.destination}: ${formatCurrency(
            cheapest.total
          )} for your ${days}-day trip.`,
        ]);
      }

      setAiItineraries(ai.itineraries || {});
      const firstDest =
        cheapest?.destination || sorted[0]?.destination || null;
      setSelectedItineraryDest(firstDest);
    } catch (err) {
      console.error("AI call failed:", err);
      setAiInsights([
        `💡 Estimated trip cost for ${cheapest.destination}: ${formatCurrency(
          cheapest.total
        )} for your ${days}-day trip.`,
      ]);
      setAiItineraries({});
      setSelectedItineraryDest(cheapest?.destination || null);
    }

    setTimeout(() => setShowInsights(true), 300);
    setLoading(false);
  };

  const days = Math.max(
    1,
    form.startDate && form.endDate
      ? Math.round(
          (new Date(form.endDate) - new Date(form.startDate)) /
            (1000 * 60 * 60 * 24)
        )
      : 1
  );

  return (
    <Page>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0.5rem" }}>
        <TopHeader
          title="Trips Genie - AI"
          subtitle="Destination total cost estimator. Turn your travel wishes into budget-smart itineraries."
        />

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-3">
            <DateFields form={form} setForm={setForm} />

            <div>
              <label className="text-xs font-semibold block mb-1">
                Flight Origin (optional)
              </label>
              <input
                placeholder="e.g. JFK, DEL, LHR"
                value={form.origin}
                onChange={(e) =>
                  setForm((p) => ({ ...p, origin: e.target.value }))
                }
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>

            <DestinationSelect form={form} setForm={setForm} />

            {/* TravelerFields with disabled Age and Add Traveler handled inside */}
            <TravelerFields
              form={form}
              addTraveler={addTraveler}
              updateTraveler={updateTraveler}
            />

            <div className="flex gap-2">
              <CTAButton
                type="submit"
                className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-sky-400 text-slate-950 text-sm font-extrabold tracking-wide shadow-lg shadow-fuchsia-900/60 hover:brightness-110 hover:shadow-xl transition transform hover:-translate-y-0.5 flex-1"
                disabled={loading}
              >
                {loading ? "Analyzing..." : "FIND BEST TRIPS"}
              </CTAButton>
            </div>
          </form>
        </GlassCard>

        {showInsights && (
          <GlassCard>
            <AIInsights aiInsights={aiInsights} />

            {results.length > 0 && selectedItineraryDest && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(148, 163, 184, 0.6)",
                  color: "#e5e7eb",
                }}
              >
                <div
                  style={{
                    marginBottom: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    🗺️ Tentative itinerary for {selectedItineraryDest}
                  </span>
                  {results.length > 1 && (
                    <div style={{ fontSize: "0.75rem" }}>
                      Show itinerary for:&nbsp;
                      {results.map((r) => (
                        <button
                          key={r.destination}
                          type="button"
                          onClick={() =>
                            setSelectedItineraryDest(r.destination)
                          }
                          style={{
                            marginLeft: "0.25rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "999px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.7rem",
                            background:
                              r.destination === selectedItineraryDest
                                ? "rgba(251, 191, 36, 0.9)"
                                : "rgba(148, 163, 184, 0.4)",
                            color:
                              r.destination === selectedItineraryDest
                                ? "#111827"
                                : "#e5e7eb",
                          }}
                        >
                          {r.destination}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ul
                  style={{
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    paddingLeft: "1rem",
                  }}
                >
                  {(aiItineraries[selectedItineraryDest] &&
                  Array.isArray(aiItineraries[selectedItineraryDest]) &&
                  aiItineraries[selectedItineraryDest].length
                    ? aiItineraries[selectedItineraryDest]
                    : buildFallbackItinerary(selectedItineraryDest, days)
                  ).map((line, idx) => (
                    <li
                      key={idx}
                      style={{
                        marginBottom: "0.25rem",
                        listStyleType: "disc",
                      }}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>
        )}

        {results.length > 0 && (
          <GlassCard>
            <ResultsTable
              results={results}
              origin={form.origin}
              startDate={form.startDate}
              endDate={form.endDate}
            />
          </GlassCard>
        )}
      </div>
    </Page>
  );
}
