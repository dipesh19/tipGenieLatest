import React, { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

/**
 * TravelPlanner.jsx — corrected and stable
 * - Fixed JSX mismatched tags
 * - Hybrid flight pricing (origin optional)
 * - Tiered fallback daily costs
 * - Defensive runtime checks
 */

/* ---------------- utilities ---------------- */
const formatCurrency = (n) => (n == null || n === "" ? "-" : `$${Number(n).toFixed(2)}`);
const extractCountry = (label = "") => {
  const parts = String(label).split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
};

/* ---------------- UI primitives ---------------- */
const Page = ({ children }) => (
  <div className="min-h-screen bg-slate-50 py-10 px-6">
    <div className="max-w-7xl mx-auto space-y-8">{children}</div>
  </div>
);

const TopHeader = ({ title, subtitle }) => (
  <header className="space-y-2">
    <h1 className="text-4xl font-extrabold text-slate-900">✈️ {title}</h1>
    {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
  </header>
);

const GlassCard = ({ children }) => <div className="bg-white border rounded-2xl p-6 shadow-sm">{children}</div>;
const CTAButton = ({ children, className = "", ...props }) => (
  <button {...props} className={`px-6 py-3 rounded-xl font-bold ${className}`}>
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

const NATIONALITY_LIST = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "Spain",
  "Italy",
];
const RESIDENCY_LIST = [
  "US Green Card",
  "US Visa",
  "EU PR",
  "Schengen Visa",
  "UK Settlement Visa",
  "Canadian PR",
  "GCC Resident Visa",
  "Singapore PR",
  "Japan Residence Card",
];

const loadSimpleOptions = (list) => async (input) => {
  const q = (input || "").toLowerCase();
  return list.filter((x) => x.toLowerCase().includes(q)).map((x) => ({ label: x, value: x }));
};

/* ---------------- main component ---------------- */
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
  const [loading, setLoading] = useState(false);

  const addTraveler = () =>
    setForm((p) => ({ ...p, travelers: [...p.travelers, { name: "", nationality: [], residency: [], age: "" }] }));

  const updateTraveler = (i, key, val) =>
    setForm((p) => {
      const t = [...p.travelers];
      t[i] = { ...t[i], [key]: val };
      return { ...p, travelers: t };
    });

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);

    const days = Math.max(
      1,
      Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24))
    );

    // API calls to your Next.js pages/api routes
    let costsRes = [];
    let flightsRes = [];
    let visaRes = [];

    try {
      costsRes = await fetch("/api/costs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destinations: form.destinations.map((d) => d.value) }),
      }).then((r) => r.json()).catch(() => []);
    } catch (err) {
      costsRes = [];
    }

    try {
      flightsRes = await fetch("/api/flights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ origin: form.origin || null, destinations: form.destinations.map((d) => d.value) }),
      }).then((r) => r.json()).catch(() => []);
    } catch (err) {
      flightsRes = [];
    }

    try {
      visaRes = await fetch("/api/visa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destinations: form.destinations.map((d) => d.value), travelers: form.travelers }),
      }).then((r) => r.json()).catch(() => []);
    } catch (err) {
      visaRes = [];
    }

    // Tiered fallback rough cost estimates (USD per day)
    const COST_TIERS = {
      expensive: { lodging: 140, food: 75, transport: 35, misc: 25 },
      mid: { lodging: 85, food: 45, transport: 22, misc: 15 },
      cheap: { lodging: 45, food: 25, transport: 14, misc: 10 },
    };

    const EXPENSIVE_COUNTRIES = [
      "United States",
      "Canada",
      "Japan",
      "Singapore",
      "France",
      "Germany",
      "United Kingdom",
      "Italy",
      "Switzerland",
      "Australia",
    ];
    const MID_COUNTRIES = ["Turkey", "Thailand", "Malaysia", "China", "Mexico", "Brazil", "South Africa", "Poland", "Portugal"];

    // Visa rule helpers
    const SCHENGEN = ["france","germany","italy","spain","portugal","netherlands","belgium","sweden","norway","finland","switzerland","austria","greece","denmark","iceland","czech republic","poland","hungary","luxembourg","malta"];
    const TURKEY_VISA_FREE = ["united states","united kingdom","germany","france","japan","canada","australia"]; // common visa-free countries for Turkey

    const computeVisaFeeForTraveler = (destCountryRaw, traveler) => {
      const dest = (destCountryRaw || "").toLowerCase();
      const nationalities = (Array.isArray(traveler.nationality) ? traveler.nationality : [traveler.nationality]).map((n) => (n || "").toLowerCase());
      const residencies = (Array.isArray(traveler.residency) ? traveler.residency : [traveler.residency]).map((r) => (r || "").toLowerCase());

      // Same-country
      if (nationalities.includes(dest)) return 0;

      // Schengen: standard fee unless traveler has Schengen Visa / EU PR / is Schengen national
      if (SCHENGEN.includes(dest)) {
        if (residencies.some((r) => r.includes("schengen")) || residencies.some((r) => r.includes("eu pr")) || nationalities.some((n) => SCHENGEN.includes(n))) return 0;
        return 105.62; // standard Schengen visa fee (USD)
      }

      // Turkey: Schengen visa does NOT grant entry. Only some passports visa-free.
      if (dest === "turkey" || dest.includes("turkey")) {
        if (nationalities.some((n) => TURKEY_VISA_FREE.includes(n))) return 0;
        return 50; // e-visa approximate
      }

      // USA: green card holders or US nationals are exempt; others likely need visa (estimate)
      if (dest === "united states" || dest === "usa" || dest === "united states of america" || dest.includes("hawaii")) {
        if (nationalities.includes("united states") || residencies.some((r) => r.includes("green card"))) return 0;
        return 160; // non-immigrant visa estimate
      }

      // Japan / Canada: many passports visa-free (quick rule for US)
      if (dest === "japan" || dest === "canada") {
        if (nationalities.includes("united states") || nationalities.includes("canada") || nationalities.includes("japan")) return 0;
        return 0; // assume visa-free for many nationalities; default 0
      }

      // Default conservative estimate: assume no visa fee unless known
      return 0;
    };

    const resolveCostTier = (destination) => {
      const city = String(destination || "").toLowerCase();
      const country = extractCountry(destination).toLowerCase();

      // City-level overrides (more accurate than country)
      if (city.includes("new york")) return COST_TIERS.expensive;
      if (city.includes("tokyo")) return COST_TIERS.expensive;
      if (city.includes("singapore")) return COST_TIERS.expensive;
      if (city.includes("paris") || city.includes("rome") || city.includes("milan") || city.includes("madrid") || city.includes("barcelona")) return COST_TIERS.expensive;
      if (city.includes("london") || city.includes("zurich") || city.includes("geneva")) return COST_TIERS.expensive;

      if (city.includes("istanbul") || city.includes("bangkok") || city.includes("kuala") || city.includes("dubai")) return COST_TIERS.mid;

      if (city.includes("delhi") || city.includes("mumbai") || city.includes("bangalore") || city.includes("jakarta") || city.includes("manila")) return COST_TIERS.cheap;

      // Fallback by country tier
      if (EXPENSIVE_COUNTRIES.map((x) => x.toLowerCase()).includes(country)) return COST_TIERS.expensive;
      if (MID_COUNTRIES.map((x) => x.toLowerCase()).includes(country)) return COST_TIERS.mid;
      return COST_TIERS.cheap;
    };

    const built = (form.destinations || []).map((d, i) => {
      const tierFallback = resolveCostTier(d.value);
      const breakdown = {
        lodging: Number(costsRes?.[i]?.lodging ?? tierFallback.lodging),
        food: Number(costsRes?.[i]?.food ?? tierFallback.food),
        transport: Number(costsRes?.[i]?.transport ?? tierFallback.transport),
        misc: Number(costsRes?.[i]?.misc ?? tierFallback.misc),
      };

      // compute visa fee per traveler using local rules if API missing
      const destCountry = extractCountry(d.value);
      const visaFee = (visaRes && visaRes[i]) || form.travelers.reduce((sum, t) => sum + computeVisaFeeForTraveler(destCountry, t), 0);
      const flightCost = Number(flightsRes?.[i]?.price ?? flightsRes?.[i]?.cost ?? (form.origin ? 450 : 500));

      const tripDaily =
        (Number(breakdown?.lodging || 0) + Number(breakdown?.food || 0) + Number(breakdown?.transport || 0) + Number(breakdown?.misc || 0)) * days;
      const total = Math.round(flightCost + tripDaily + Number(visaFee || 0));

      return { destination: d.value, breakdown, visaFee: Number(visaFee || 0), flightCost, total };
    });

    const sorted = [...built].sort((a, b) => a.total - b.total);
    const insightList = sorted.slice(1).map((x) => `Swap ${x.destination} for ${sorted[0]?.destination} to save ${formatCurrency(x.total - sorted[0]?.total)}`);

    // Runtime safety tests
    console.assert(!built.some((x) => typeof x.total !== "number" || isNaN(x.total)), "TEST FAILED: totals must be valid numbers");
    console.assert(!built.some((x) => !x.breakdown), "TEST FAILED: breakdown must always exist");

    setAiInsights(insightList);
    setResults(built);
    setLoading(false);
  };

  return (
    <Page>
      <TopHeader title="Trips Genie - AI" subtitle="Destination total cost estimator." />

      <GlassCard>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className="font-semibold">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="font-semibold">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold">Flight Origin (optional)</label>
            <input
              placeholder="e.g. JFK, DEL, LHR"
              value={form.origin}
              onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold">Destinations</label>
            <AsyncCreatableSelect
              isMulti
              defaultOptions={FALLBACK_CITIES.map((x) => ({ label: x, value: x }))}
              loadOptions={loadSimpleOptions(FALLBACK_CITIES)}
              value={form.destinations}
              onChange={(v) => setForm((p) => ({ ...p, destinations: v || [] }))}
            />
          </div>

          {form.travelers.map((t, i) => (
            <React.Fragment key={i}>
              <div>
                <label className="text-xs font-semibold">Name</label>
                <input value={t.name} onChange={(e) => updateTraveler(i, "name", e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>

              <div>
                <label className="text-xs font-semibold">Citizenship</label>
                <AsyncCreatableSelect
                  isMulti
                  defaultOptions={NATIONALITY_LIST.map((n) => ({ label: n, value: n }))}
                  loadOptions={loadSimpleOptions(NATIONALITY_LIST)}
                  value={Array.isArray(t.nationality) ? t.nationality.map((n) => ({ label: n, value: n })) : []}
                  onChange={(o) => updateTraveler(i, "nationality", o ? o.map((x) => x.value) : [])}
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Visa / Residency</label>
                <AsyncCreatableSelect
                  isMulti
                  defaultOptions={RESIDENCY_LIST.map((r) => ({ label: r, value: r }))}
                  loadOptions={loadSimpleOptions(RESIDENCY_LIST)}
                  value={Array.isArray(t.residency) ? t.residency.map((n) => ({ label: n, value: n })) : []}
                  onChange={(o) => updateTraveler(i, "residency", o ? o.map((x) => x.value) : [])}
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Age</label>
                <input type="number" value={t.age} onChange={(e) => updateTraveler(i, "age", e.target.value)} className="w-full p-2 border rounded-lg" />
              </div>
            </React.Fragment>
          ))}

          <div className="md:col-span-2 flex gap-4">
            <button type="button" onClick={addTraveler} className="px-4 py-2 bg-slate-900 text-white rounded-lg">+ Add Traveler</button>
            <CTAButton type="submit" className="bg-indigo-600 text-white">{loading ? "Analyzing..." : "FIND BEST TRIPS"}</CTAButton>
          </div>
        </form>
      </GlassCard>

      {aiInsights.length > 0 && (
        <GlassCard>
          <ul className="list-disc pl-6">{aiInsights.map((x, i) => (
            <li key={i}>{x}</li>
          ))}</ul>
        </GlassCard>
      )}

      {results.length > 0 && (
        <GlassCard>
          <table className="w-full border text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2">Destination</th>
                <th className="p-2">Flight</th>
                <th className="p-2">Lodging</th>
                <th className="p-2">Food</th>
                <th className="p-2">Transport</th>
                <th className="p-2">Misc</th>
                <th className="p-2">Visa</th>
                <th className="p-2">Total</th>
                <th className="p-2">Book</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="p-2">{r.destination}</td>
                  <td className="p-2 text-right">{formatCurrency(r.flightCost)}</td>
                  <td className="p-2 text-right">{formatCurrency(r.breakdown?.lodging || 0)}</td>
                  <td className="p-2 text-right">{formatCurrency(r.breakdown?.food || 0)}</td>
                  <td className="p-2 text-right">{formatCurrency(r.breakdown?.transport || 0)}</td>
                  <td className="p-2 text-right">{formatCurrency(r.breakdown?.misc || 0)}</td>
                  <td className="p-2 text-right">{formatCurrency(r.visaFee)}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(r.total)}</td>
                  <td className="p-2 text-center">
                    <a
                      href={`https://www.kayak.com/flights/${form.origin || "NYC"}/${encodeURIComponent(r.destination.split(",")[0])}/${form.startDate}/${form.endDate}?affiliate=tripsgenie`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold"
                    >
                      Book
                    </a>
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
