import React, { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

/**
 * TravelPlanner.jsx — cleaned and fixed final version
 * - All JSX tags properly closed
 * - Field labels restored
 * - Destination selector fixed
 * - Multi-select citizenship & residency
 * - Country-specific visa fees (USD)
 */

/* ---------------- utilities ---------------- */
const formatCurrency = (n) => (n == null || n === "" ? "-" : `$${Number(n).toFixed(2)}`);
const extractCountry = (label = "") => {
  const parts = String(label).split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
};

/* ---------------- UI primitives ---------------- */
const Page = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4 sm:px-6 md:px-10">
    <div className="max-w-6xl mx-auto">{children}</div>
  </div>
);

const TopHeader = ({ title, subtitle }) => (
  <header className="mb-6">
    <h1 className="text-3xl font-extrabold text-slate-900">✈️ {title}</h1>
    {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
  </header>
);

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white border rounded-2xl p-4 shadow ${className}`}>{children}</div>
);

const CTAButton = ({ children, className = "", style = {}, ...props }) => (
  <button {...props} style={style} className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold transition ${className}`}>
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
];

const NATIONALITY_LIST = ["India","United States","United Kingdom","Canada","Germany","France","Japan","Singapore","Spain","Italy"];
const RESIDENCY_LIST = ["US Green Card","US Visa","EU PR","Schengen Visa","UK Settlement Visa","Canadian PR","GCC Resident Visa","Singapore PR","Japan Residence Card"];

/* ---------------- Helpers ---------------- */
const loadSimpleOptions = (list) => async (input) => {
  const q = (input || "").toLowerCase();
  return list.filter((x) => x.toLowerCase().includes(q)).map((x) => ({ label: x, value: x }));
};

/* ---------------- VISA PRICING (USD ONLY) ---------------- */
const VISA_FEES_USD = {
  schengen: 105.62,
  turkey: 60,
  usa: 160,
};

function computeVisaFee(destination, nationalities = [], residencies = []) {
  const destCountry = extractCountry(destination).toLowerCase();
  const nat = (nationalities || []).map((n) => String(n).toLowerCase());
  const res = (residencies || []).map((r) => String(r).toLowerCase());

  // Same nationality => free
  if (nat.includes(destCountry)) return 0;

  // Schengen countries — uniform fee or free if Schengen visa / EU PR
  const SCHENGEN = ["france","germany","italy","spain","portugal","netherlands","belgium","sweden","norway","finland","switzerland","austria","greece","denmark","iceland","czech republic","poland","hungary","luxembourg","malta"];
  if (SCHENGEN.includes(destCountry)) {
    const hasRight = res.some((r) => r.includes("schengen") || r.includes("eu pr"));
    return hasRight ? 0 : VISA_FEES_USD.schengen;
  }

  // Turkey — Schengen visa does NOT exempt; use Turkey fee for many nationalities
  if (destCountry === "turkey") return VISA_FEES_USD.turkey;

  // USA / Hawaii — require US citizen or US visa/green card
  const US_TERRITORIES = ["united states","usa","hawaii","puerto rico","guam","us virgin islands"];
  const hasUSRight = nat.includes("united states") || res.some((r) => r.includes("green card") || r.includes("us visa"));
  if (US_TERRITORIES.includes(destCountry)) return hasUSRight ? 0 : VISA_FEES_USD.usa;

  // Default fallback
  return 160;
}

/* ---------------- main component ---------------- */
export default function TravelPlanner() {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    destinations: [],
    travelers: [{ name: "", nationality: [], residency: [], age: "" }],
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTraveler = () =>
    setForm((p) => ({ ...p, travelers: [...p.travelers, { name: "", nationality: [], residency: [], age: "" }] }));

  const updateTraveler = (i, key, val) =>
    setForm((p) => {
      const t = [...p.travelers];
      t[i] = { ...t[i], [key]: val };
      return { ...p, travelers: t };
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const days = Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)));

    const built = (form.destinations || []).map((d) => {
      const breakdown = { lodging: 70, food: 40, transport: 20, misc: 13 };

      const travelerBreakdown = (form.travelers || []).map((t, ti) => {
        const visaFee = computeVisaFee(d.value, t.nationality, t.residency);
        const flightCost = 400 + ti * 20;
        const tripDaily = (breakdown.lodging + breakdown.food + breakdown.transport + breakdown.misc) * days;
        const total = Math.round(flightCost + tripDaily + visaFee);
        return { name: t.name || `Traveler ${ti + 1}`, visaFee, flightCost, tripDaily, total };
      });

      const grandTotal = travelerBreakdown.reduce((s, t) => s + t.total, 0);
      return { destination: d.value, breakdown, travelerBreakdown, grandTotal };
    });

    setResults(built);
    setLoading(false);
  };

  return (
    <Page>
      <TopHeader title="Trips Genie" subtitle="AI-powered travel cost analysis & destination comparison — All prices shown in USD" />

      <GlassCard className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm block mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="p-2 border rounded w-full"
                required
              />
            </div>

            <div>
              <label className="text-sm block mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="p-2 border rounded w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1">Destinations (up to 5)</label>
            <AsyncCreatableSelect
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={loadSimpleOptions(FALLBACK_CITIES)}
              value={form.destinations}
              onChange={(v) => setForm((p) => ({ ...p, destinations: v ? v.slice(0, 5) : [] }))}
              placeholder="Search city (e.g. Paris, France)"
            />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Travelers</div>

            {(form.travelers || []).map((t, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start mb-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Name</label>
                  <input
                    placeholder="Name"
                    value={t.name}
                    onChange={(e) => updateTraveler(i, "name", e.target.value)}
                    className="p-2 border rounded w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Citizenship</label>
                  <AsyncCreatableSelect
                    isMulti
                    cacheOptions
                    defaultOptions={NATIONALITY_LIST.map((n) => ({ label: n, value: n }))}
                    loadOptions={loadSimpleOptions(NATIONALITY_LIST)}
                    value={Array.isArray(t.nationality) ? t.nationality.map((n) => ({ label: n, value: n })) : []}
                    onChange={(opts) => updateTraveler(i, "nationality", opts ? opts.map((o) => o.value) : [])}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Visa / Residency</label>
                  <AsyncCreatableSelect
                    isMulti
                    cacheOptions
                    defaultOptions={RESIDENCY_LIST.map((r) => ({ label: r, value: r }))}
                    loadOptions={loadSimpleOptions(RESIDENCY_LIST)}
                    value={Array.isArray(t.residency) ? t.residency.map((r) => ({ label: r, value: r })) : []}
                    onChange={(opts) => updateTraveler(i, "residency", opts ? opts.map((o) => o.value) : [])}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={t.age}
                    onChange={(e) => updateTraveler(i, "age", e.target.value)}
                    className="p-2 border rounded w-full"
                  />
                </div>
              </div>
            ))}

            <div>
              <button type="button" onClick={addTraveler} className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm">
                + Add Traveler
              </button>
            </div>
          </div>

          <div>
            <CTAButton type="submit" className="w-full bg-indigo-600 text-white" style={{ fontWeight: 700 }} disabled={loading}>
              {loading ? "Analyzing..." : "FIND BEST TRIPS"}
            </CTAButton>
          </div>
        </form>
      </GlassCard>

      {results.length > 0 && (
        <GlassCard>
          <table className="w-full text-sm border">
            <thead className="bg-slate-100">
              <tr>
                <th className="border p-2 text-left">Destination</th>
                <th className="border p-2 text-right">Flight (USD)</th>
                <th className="border p-2 text-right">Lodging (USD)</th>
                <th className="border p-2 text-right">Food (USD)</th>
                <th className="border p-2 text-right">Transport (USD)</th>
                <th className="border p-2 text-right">Misc (USD)</th>
                <th className="border p-2 text-right">Visa (USD)</th>
                <th className="border p-2 text-right">Total (USD)</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="text-sm">
                  <td className="border p-2">{r.destination}</td>
                  <td className="border p-2 text-right">{formatCurrency(r.travelerBreakdown[0]?.flightCost)}</td>
                  <td className="border p-2 text-right">{formatCurrency(r.breakdown.lodging)}</td>
                  <td className="border p-2 text-right">{formatCurrency(r.breakdown.food)}</td>
                  <td className="border p-2 text-right">{formatCurrency(r.breakdown.transport)}</td>
                  <td className="border p-2 text-right">{formatCurrency(r.breakdown.misc)}</td>
                  <td className="border p-2 text-right">{formatCurrency(r.travelerBreakdown[0]?.visaFee)}</td>
                  <td className="border p-2 text-right font-bold">{formatCurrency(r.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </Page>
  );
}
