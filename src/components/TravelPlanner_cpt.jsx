"use client";

import React, { useState, useEffect } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

/**
 * TravelPlanner.jsx — enhanced colorful UI with hero image
 * ✅ Detailed AI insights with per-category savings
 * ✅ AI typing animation effect
 * ✅ Insight now appears even for single destination
 * ✅ Fixed Turbopack parsing issue (clean EOF, no stray tokens)
 * ✅ Added basic runtime test assertions
 */

/* ---------------- utilities ---------------- */
const formatCurrency = (n) =>
  n == null || n === "" || Number.isNaN(Number(n))
    ? "-"
    : `$${Number(n).toFixed(2)}`;

const extractCountry = (label = "") => {
  const parts = String(label).split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
};

/* ---------------- UI primitives ---------------- */
const Page = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-fuchsia-100 via-sky-100 to-amber-100 py-10 px-6">
    <div className="max-w-7xl mx-auto space-y-10">{children}</div>
  </div>
);

const TopHeader = ({ title, subtitle }) => (
  <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-pink-200 via-indigo-200 to-cyan-200 rounded-3xl p-6 shadow-xl">
    <div className="space-y-3">
      <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 drop-shadow">✈️ {title}</h1>
      {subtitle && (
        <p className="text-base md:text-lg text-slate-700 max-w-xl">{subtitle}</p>
      )}
    </div>
    <div className="shrink-0">
      <img
        src="/A_vibrant_digital_illustration_in_a_flat_and_moder.png"
        alt="Trips Genie Hero"
        className="w-40 md:w-48 h-auto rounded-2xl shadow-2xl border-4 border-white"
      />
    </div>
  </header>
);

const GlassCard = ({ children }) => (
  <div className="bg-white/80 backdrop-blur border rounded-3xl p-8 shadow-xl">
    {children}
  </div>
);

const CTAButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`px-6 py-3 rounded-2xl font-bold transition-all hover:scale-105 ${className}`}
  >
    {children}
  </button>
);

/* ---------------- static data ---------------- */
const FALLBACK_CITIES = [
  "Paris, France",
  "Rome, Italy",
  "Tokyo, Japan",
  "New York, USA",
  "Bangkok, Thailand",
  "Istanbul, Turkey",
  "Singapore",
  "Dubai, United Arab Emirates",
  "Toronto, Canada",
  "Delhi, India",
];

const loadSimpleOptions = (list) => async (input) => {
  const q = (input || "").toLowerCase();
  return list
    .filter((x) => x.toLowerCase().includes(q))
    .map((x) => ({ label: x, value: x }));
};

/* ---------------- main component ---------------- */
export default function TravelPlanner() {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    origin: "",
    destinations: [],
  });

  const [results, setResults] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [typedInsights, setTypedInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ----------- typing animation ----------- */
  useEffect(() => {
    if (aiInsights.length === 0) return;

    setTypedInsights([]);
    let currentLine = 0;

    const typeLine = () => {
      const fullText = aiInsights[currentLine];
      let charIndex = 0;
      let buffer = "";

      const interval = setInterval(() => {
        buffer += fullText[charIndex];
        setTypedInsights((p) => {
          const copy = [...p];
          copy[currentLine] = buffer;
          return copy;
        });
        charIndex++;
        if (charIndex >= fullText.length) {
          clearInterval(interval);
          currentLine++;
          if (currentLine < aiInsights.length) {
            setTimeout(typeLine, 300);
          }
        }
      }, 15);
    };

    typeLine();
  }, [aiInsights]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const days = Math.max(
      1,
      Math.round(
        (new Date(form.endDate) - new Date(form.startDate)) /
          (1000 * 60 * 60 * 24)
      )
    );

    const COST_TIERS = {
      expensive: { lodging: 140, food: 75, transport: 35, misc: 25 },
      mid: { lodging: 85, food: 45, transport: 22, misc: 15 },
      cheap: { lodging: 45, food: 25, transport: 14, misc: 10 },
    };

    const resolveCostTier = (destination) => {
      const city = String(destination || "").toLowerCase();

      if (
        city.includes("new york") ||
        city.includes("tokyo") ||
        city.includes("singapore") ||
        city.includes("paris") ||
        city.includes("rome") ||
        city.includes("london")
      )
        return COST_TIERS.expensive;

      if (
        city.includes("istanbul") ||
        city.includes("bangkok") ||
        city.includes("dubai")
      )
        return COST_TIERS.mid;

      return COST_TIERS.cheap;
    };

    const built = (form.destinations || []).map((d, i) => {
      const tierFallback = resolveCostTier(d?.value);

      const breakdown = {
        lodging: tierFallback.lodging,
        food: tierFallback.food,
        transport: tierFallback.transport,
        misc: tierFallback.misc,
      };

      const flightCost = form.origin ? 450 + i * 40 : 500 + i * 35;

      const tripDaily =
        (breakdown.lodging +
          breakdown.food +
          breakdown.transport +
          breakdown.misc) * days;

      const total = Math.round(flightCost + tripDaily);

      return {
        destination: d?.value,
        breakdown,
        visaFee: 0,
        flightCost,
        total,
      };
    });

    // ✅ runtime test assertions
    console.assert(
      built.every((x) => typeof x.total === "number" && !Number.isNaN(x.total)),
      "TEST FAILED: totals must be valid numbers"
    );

    const sorted = [...built].sort((a, b) => a.total - b.total);

    let insightList = [];

    if (sorted.length === 1) {
      const r = sorted[0];
      insightList.push(
        `For ${r.destination}, your estimated costs break down as: Flight ${formatCurrency(
          r.flightCost
        )}, Lodging ${formatCurrency(
          r.breakdown.lodging * days
        )}, Food ${formatCurrency(
          r.breakdown.food * days
        )}, Transport ${formatCurrency(
          r.breakdown.transport * days
        )}, and Misc ${formatCurrency(
          r.breakdown.misc * days
        )}. Total estimated trip cost: ${formatCurrency(r.total)}.`
      );
    }

    if (sorted.length > 1) {
      const base = sorted[0];

      sorted.slice(1).forEach((x) => {
        const savings = x.total - base.total;
        const lodgingDiff = (x.breakdown.lodging - base.breakdown.lodging) * days;
        const foodDiff = (x.breakdown.food - base.breakdown.food) * days;
        const transportDiff =
          (x.breakdown.transport - base.breakdown.transport) * days;
        const miscDiff = (x.breakdown.misc - base.breakdown.misc) * days;

        insightList.push(
          `Swapping ${x.destination} for ${base.destination} saves you ${formatCurrency(
            savings
          )}. Biggest differences come from Lodging (${formatCurrency(
            lodgingDiff
          )}), Food (${formatCurrency(foodDiff)}), Transport (${formatCurrency(
            transportDiff
          )}), and Misc (${formatCurrency(miscDiff)}).`
        );
      });
    }

    setAiInsights(insightList);
    setResults(built);
    setLoading(false);
  };

  return (
    <Page>
      <TopHeader title="Trips Genie - AI" subtitle="Destination total cost estimator." />

      <GlassCard>
        <form
          onSubmit={handleSubmit}
          className="relative grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="font-semibold text-indigo-700">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
              className="w-full p-3 border rounded-xl"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-indigo-700">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
              className="w-full p-3 border rounded-xl"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-indigo-700">
              Flight Origin (optional)
            </label>
            <input
              placeholder="e.g. JFK, DEL, LHR"
              value={form.origin}
              onChange={(e) =>
                setForm((p) => ({ ...p, origin: e.target.value }))
              }
              className="w-full p-3 border rounded-xl"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-indigo-700">Destinations</label>
            <AsyncCreatableSelect
              isMulti
              defaultOptions={FALLBACK_CITIES.map((x) => ({
                label: x,
                value: x,
              }))}
              loadOptions={loadSimpleOptions(FALLBACK_CITIES)}
              value={form.destinations}
              onChange={(v) =>
                setForm((p) => ({ ...p, destinations: v || [] }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <CTAButton
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white w-full"
            >
              {loading ? "Analyzing..." : "FIND BEST TRIPS"}
            </CTAButton>
          </div>
        </form>
      </GlassCard>

      {typedInsights.length > 0 && (
        <GlassCard>
          <h3 className="font-bold text-indigo-700 mb-3">AI Insights</h3>
          <ul className="list-disc pl-6 space-y-2 text-slate-700">
            {typedInsights.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </GlassCard>
      )}

      {results.length > 0 && (
        <GlassCard>
          <table className="w-full border text-sm rounded-xl overflow-hidden">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="p-3">Destination</th>
                <th className="p-3">Flight</th>
                <th className="p-3">Lodging</th>
                <th className="p-3">Food</th>
                <th className="p-3">Transport</th>
                <th className="p-3">Misc</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {results.map((r, i) => (
                <tr key={i} className="hover:bg-pink-50 transition">
                  <td className="p-2">{r.destination}</td>
                  <td className="p-2 text-right">
                    {formatCurrency(r.flightCost)}
                  </td>
                  <td className="p-2 text-right">
                    {formatCurrency(r.breakdown?.lodging || 0)}
                  </td>
                  <td className="p-2 text-right">
                    {formatCurrency(r.breakdown?.food || 0)}
                  </td>
                  <td className="p-2 text-right">
                    {formatCurrency(r.breakdown?.transport || 0)}
                  </td>
                  <td className="p-2 text-right">
                    {formatCurrency(r.breakdown?.misc || 0)}
                  </td>
                  <td className="p-2 text-right font-bold text-indigo-700">
                    {formatCurrency(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </Page>
  );
}
