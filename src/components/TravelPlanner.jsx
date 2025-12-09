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

  const generateSummaryInsight = (resultsArr, days) => {
    if (!resultsArr || resultsArr.length === 0) return [];

    const sorted = [...resultsArr].sort((a, b) => a.total - b.total);
    const cheapest = sorted[0];
    const second = sorted[1];

    const equalBest = sorted.filter((r) => r.total === cheapest.total);
    if (equalBest.length > 1) {
      const names = equalBest.map((r) => r.destination).join(" and ");
      return [
        `💡 Best Value: ${names} are equally good options at ${formatCurrency(
          cheapest.total
        )} for your ${days}-day trip.`,
      ];
    }

    if (second) {
      const savings = second.total - cheapest.total;
      const parts = [];

      const flightDiff = second.flightCost - cheapest.flightCost;
      const lodgingDiff =
        (second.breakdown.lodging - cheapest.breakdown.lodging) * days;
      const foodDiff =
        (second.breakdown.food - cheapest.breakdown.food) * days;
      const visaDiff = second.visaFee - cheapest.visaFee;

      if (Math.abs(lodgingDiff) > 80)
        parts.push(
          `${formatCurrency(Math.abs(lodgingDiff))} on accommodation`
        );
      if (Math.abs(foodDiff) > 50)
        parts.push(`${formatCurrency(Math.abs(foodDiff))} on food`);
      if (Math.abs(visaDiff) > 0)
        parts.push(`${formatCurrency(Math.abs(visaDiff))} on visa fees`);
      if (Math.abs(flightDiff) > 60)
        parts.push(`${formatCurrency(Math.abs(flightDiff))} on flights`);

      const breakdown = parts.length ? ` (mainly ${parts.join(", ")})` : "";
      return [
        `💡 Best Value: ${cheapest.destination} at ${formatCurrency(
          cheapest.total
        )} – saves ${formatCurrency(
          savings
        )} vs ${second.destination}${breakdown}.`,
      ];
    }

    return [
      `💡 Estimated trip cost for ${cheapest.destination}: ${formatCurrency(
        cheapest.total
      )} for your ${days}-day trip.`,
    ];
  };

  const buildItinerary = (destination, days) => {
    if (!destination || !days || days < 1) return [];

    if (days <= 3) {
      return [
        `Day 1: Arrival in ${destination}, explore the old town and a key viewpoint.`,
        `Day 2: Main museums/landmarks in the morning, food market + local neighborhood in the evening.`,
        `Day 3: Half‑day side trip or beach/park time, then farewell dinner in a local area.`,
      ];
    }

    if (days <= 7) {
      return [
        `Day 1: Arrive in ${destination}, settle in and explore the immediate area.`,
        `Day 2: Classic city highlights (old town, main square, top 2–3 landmarks).`,
        `Day 3: Museum / culture day + evening food tour or tapas crawl.`,
        `Day 4: Day trip or different district (beach / modern area / hills).`,
        `Day 5: Flexible day for shopping, cafés, and second‑tier sights.`,
        `Day 6: Nature or coastal escape if available, or a themed day (art, architecture, wine).`,
        `Day 7: Buffer / free day, revisit favorite spots, farewell dinner.`,
      ];
    }

    return [
      `First 2–3 days: Core city highlights, old town, main museums and viewpoints in ${destination}.`,
      `Middle days: Mix of day trips, neighborhood exploration, and food experiences.`,
      `Final days: Buffer for weather, slower days in parks or cafés, and revisiting favorites.`,
    ];
  };

  const handleSubmit = async (e) => {
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

      const visaFee =
        visaRes?.results?.[i]?.totalVisaFee ??
        form.travelers.reduce(
          (sum, t) => sum + computeVisaFeeForTraveler(destCountry, t),
          0
        );

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

    const insights = generateSummaryInsight(sorted, days);
    setAiInsights(insights);
    setSelectedItineraryDest(cheapest?.destination || null);

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
                  {buildItinerary(selectedItineraryDest, days).map(
                    (line, idx) => (
                      <li
                        key={idx}
                        style={{
                          marginBottom: "0.25rem",
                          listStyleType: "disc",
                        }}
                      >
                        {line}
                      </li>
                    )
                  )}
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
