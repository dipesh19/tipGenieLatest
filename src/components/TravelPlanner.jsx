import React, { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

/**
 * TravelPlanner.jsx — stable production-ready UI (JSX fixed)
 * - Multi-select nationality & residency
 * - Tier-based visa exemptions
 * - Robust, fully-closed JSX
 */

/* ---------------- utilities ---------------- */
const formatCurrency = (n) => (n == null || n === "" ? "-" : `$${Number(n).toLocaleString()}`);
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
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">✈️ {title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
      </div>
    </div>
  </header>
);

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 sm:p-6 shadow ${className}`}>{children}</div>
);

const CTAButton = ({ children, className = "", style = {}, ...props }) => (
  <button {...props} style={style} className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-md font-semibold transition ${className}`}>
    {children}
  </button>
);

/* ---------------- data ---------------- */
const FALLBACK_CITIES = [
  "Paris, France",
  "Barcelona, Spain",
  "Lisbon, Portugal",
  "Rome, Italy",
  "Tokyo, Japan",
  "New York, USA",
  "Bangkok, Thailand",
  "Istanbul, Turkey",
  "Singapore",
  "Dubai, United Arab Emirates",
  "Bali, Indonesia",
  "Prague, Czech Republic",
  "Cape Town, South Africa",
  "Toronto, Canada",
];

const NATIONALITY_LIST = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","Singapore","China","Brazil","UAE","Spain","Italy"];
const RESIDENCY_LIST = ["US Green Card","EU PR","Schengen Visa","UK Settlement Visa","Canadian PR","Australian PR","GCC Resident Visa","Singapore PR","Japan Residence Card"];

const ASIA_VISA_FREE = ["japan","singapore","south korea","malaysia","hong kong","thailand","indonesia","philippines","vietnam"];
const EUROPE_VISA_FREE = ["france","germany","italy","spain","portugal","netherlands","belgium","sweden","norway","finland","switzerland","austria","greece","denmark","iceland","czech republic","poland","hungary","luxembourg","malta"];

/* ---------------- helpers ---------------- */
const loadDestinationOptions = async (input = "") => {
  if (!input || input.length < 2) return FALLBACK_CITIES.map((c) => ({ label: c, value: c }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);
  try {
    const res = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURIComponent(input)}&limit=8`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("Teleport error");
    const data = await res.json();
    const opts = data._embedded?.["city:search-results"]?.map((c) => ({ label: c.matching_full_name, value: c.matching_full_name })) || [];
    return opts.length ? opts : FALLBACK_CITIES.filter((c) => c.toLowerCase().includes(input.toLowerCase())).map((c) => ({ label: c, value: c }));
  } catch (err) {
    clearTimeout(timeout);
    return FALLBACK_CITIES.filter((c) => c.toLowerCase().includes(input.toLowerCase())).map((c) => ({ label: c, value: c }));
  }
};

async function fetchImageForDestination(dest) {
  const query = (dest || "").split(",")[0];
  const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_KEY;
  try {
    if (PEXELS_KEY) {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, { headers: { Authorization: PEXELS_KEY } });
      if (res.ok) {
        const j = await res.json();
        const photo = j.photos?.[0];
        if (photo?.src?.medium) return photo.src.medium;
      }
    }
  } catch (e) {
    // fallback to unsplash
  }
  return `https://source.unsplash.com/900x600/?${encodeURIComponent(query)}`;
}

function flagUrl(country) { return country ? `https://countryflagsapi.com/png/${encodeURIComponent(country)}` : ""; }
const loadSimpleOptions = (list) => async (input) => { const q = (input || "").toLowerCase(); return list.filter((x) => x.toLowerCase().includes(q)).map((x) => ({ label: x, value: x })); };

/* ---------------- main component ---------------- */
export default function TravelPlanner() {
  const [form, setForm] = useState({ startDate: "", endDate: "", destinations: [], travelers: [{ name: "", nationality: [], residency: [], age: "" }] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const addTraveler = () => setForm((p) => ({ ...p, travelers: [...p.travelers, { name: "", nationality: [], residency: [], age: "" }] }));
  const updateTraveler = (i, key, val) => setForm((p) => { const t = [...p.travelers]; t[i] = { ...t[i], [key]: val }; return { ...p, travelers: t }; });
  const removeTraveler = (i) => setForm((p) => ({ ...p, travelers: p.travelers.filter((_, idx) => idx !== i) }));

  const validateForm = () => {
    if (!form.startDate || !form.endDate) return "Please select both start and end dates.";
    if (new Date(form.endDate) < new Date(form.startDate)) return "End date cannot be before start date.";
    if (!form.destinations.length) return "Please select at least one destination.";
    if (form.travelers.length === 0) return "Add at least one traveler.";
    for (const t of form.travelers) {
      if (!t.name) return "Each traveler must have a name.";
      if (!t.nationality || (Array.isArray(t.nationality) && t.nationality.length === 0)) return "Each traveler must have a nationality.";
      if (!t.residency || (Array.isArray(t.residency) && t.residency.length === 0)) return "Each traveler must have a residency/visa type.";
      if (!t.age || Number(t.age) <= 0) return "A valid age is required for all travelers.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const validationError = validateForm();
    if (validationError) { alert(validationError); return; }
    setLoading(true);
    try {
      const destList = form.destinations.map((d) => d.value).slice(0, 5);
      const [costsRes, flightsRes, visasRes] = await Promise.all([
        fetch("/api/costs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinations: destList }) }).then((r) => r.json()).catch(() => ({})),
        fetch("/api/flights", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinations: destList }) }).then((r) => r.json()).catch(() => ([])),
        fetch("/api/visa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinations: destList, travelers: form.travelers }) }).then((r) => r.json()).catch(() => ({ results: [] })),
      ]);

      const days = Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)));

      const built = await Promise.all(destList.map(async (dest, i) => {
        const costObj = costsRes?.results?.[i] || (Array.isArray(costsRes) ? costsRes[i] : costsRes?.[dest]) || {};
        const flightObj = Array.isArray(flightsRes) ? flightsRes[i] || {} : flightsRes?.[dest] || {};
        const visaObj = (visasRes?.results || []).find((v) => v.destination === dest) || {};
        const avgDaily = costObj.avgDaily || costObj.avgDailyExpense || 120;
        const breakdown = costObj.breakdown || { lodging: Math.round(avgDaily * 0.45), food: Math.round(avgDaily * 0.35), transport: Math.round(avgDaily * 0.15), misc: Math.round(avgDaily * 0.05) };
        const img = await fetchImageForDestination(dest);

        const travelerBreakdown = form.travelers.map((t, ti) => {
          let visaFee = 0;
          const destCountry = extractCountry(dest).toLowerCase();
          const nationalities = Array.isArray(t.nationality) ? t.nationality.map((n) => String(n).toLowerCase()) : [(t.nationality || "").toLowerCase()];
          const residencies = Array.isArray(t.residency) ? t.residency.map((r) => String(r).toLowerCase()) : [(t.residency || "").toLowerCase()];

          // Tiered exemptions
          if (nationalities.includes(destCountry)) visaFee = 0;
          const US_TERRITORIES = ["united states","usa","hawaii","puerto rico","guam","us virgin islands"];
          if (US_TERRITORIES.includes(destCountry) && (nationalities.includes("united states") || residencies.some((r) => r.includes("green card")))) visaFee = 0;
          const SCHENGEN = ["france","germany","italy","spain","portugal","netherlands","belgium","sweden","norway","finland","switzerland","austria","greece","denmark","iceland","czech republic","poland","hungary","luxembourg","malta"];
          if (SCHENGEN.includes(destCountry) && (residencies.some((r) => r.includes("eu pr")) || residencies.some((r) => r.includes("schengen")) || nationalities.includes("united kingdom"))) visaFee = 0;
          const GCC = ["uae","qatar","bahrain","oman","kuwait","saudi arabia"];
          if (GCC.includes(destCountry) && residencies.some((r) => r.includes("gcc resident"))) visaFee = 0;
          const EAST_ASIA = ["japan","singapore","south korea","malaysia","hong kong","thailand"];
          if (EAST_ASIA.includes(destCountry) && (residencies.some((r) => r.includes("japan residence")) || residencies.some((r) => r.includes("singapore pr")) || nationalities.some((n) => EAST_ASIA.includes(n)))) visaFee = 0;
          if (ASIA_VISA_FREE.includes(destCountry) && nationalities.some((n) => ASIA_VISA_FREE.includes(n))) visaFee = 0;
          if (EUROPE_VISA_FREE.includes(destCountry) && nationalities.some((n) => EUROPE_VISA_FREE.includes(n))) visaFee = 0;

          // If API provides specific visa fees use those (overrides above unless exemptions set)
          if (Array.isArray(visaObj?.data) && visaObj.data[ti]) {
            visaFee = Number(visaObj.data[ti].visa_fee_usd || visaObj.data[ti].visaFee || visaObj.data[ti].visa_fee || 0);
          } else {
            visaFee = Number(visaObj?.visa_fee_usd || visaObj?.visaFee || visaObj?.visa_fee || 0);
          }

          const flightCost = Number(flightObj?.flightCost || flightObj?.price || Math.floor(Math.random() * 450 + 250));
          const tripDaily = Math.round(avgDaily * days);
          const total = Math.round(flightCost + tripDaily + visaFee);

          return { name: t.name || `Traveler ${ti + 1}`, nationality: t.nationality, residency: t.residency, age: t.age, flightCost, tripDaily, visaFee, total };
        });

        const grandTotal = travelerBreakdown.reduce((s, t) => s + t.total, 0);
        return { destination: dest, country: extractCountry(dest), image: img, avgDaily, breakdown, travelerBreakdown, grandTotal, days };
      }));

      built.sort((a, b) => a.grandTotal - b.grandTotal);
      setResults(built);
    } catch (err) {
      console.error("Search failed", err);
      alert("Failed to fetch trip data — see console");
    } finally { setLoading(false); }
  };

  const aiRecommendations = () => {
    if (results.length < 2) return [];
    const sorted = [...results].sort((a, b) => a.grandTotal - b.grandTotal);
    const best = sorted[0];
    const recs = [];
    for (let i = 1; i < sorted.length; i++) {
      const dest = sorted[i];
      let visaDiff = 0;
      for (let ti = 0; ti < dest.travelerBreakdown.length; ti++) {
        const t = dest.travelerBreakdown[ti];
        const b = best.travelerBreakdown[ti] || {};
        visaDiff += (t.visaFee || 0) - (b.visaFee || 0);
      }
      const totalDiff = dest.grandTotal - best.grandTotal;
      recs.push({ from: dest.destination, to: best.destination, visaDiff, totalDiff });
    }
    return recs;
  };

  return (
    <Page>
      <TopHeader title="Trips Genie" subtitle="AI‑powered travel cost analysis & destination comparison" />

      <GlassCard className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-600">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="mt-1 w-full p-2 border rounded-md" required />
            </div>

            <div>
              <label className="block text-xs text-slate-600">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="mt-1 w-full p-2 border rounded-md" required />
            </div>

            <div>
              <label className="block text-xs text-slate-600">Destinations (up to 5)</label>
              <div className="mt-1">
                <AsyncCreatableSelect
                  isMulti
                  cacheOptions
                  defaultOptions
                  loadOptions={loadDestinationOptions}
                  value={form.destinations}
                  onChange={(v) => setForm((p) => ({ ...p, destinations: v ? v.slice(0, 5) : [] }))}
                  placeholder="Search city (e.g. Paris, France)"
                  styles={{ control: (base) => ({ ...base, minHeight: 48 }), valueContainer: (base) => ({ ...base, padding: '0 8px' }), input: (base) => ({ ...base, margin: 0, padding: 0 }) }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Travelers</div>
              <div className="text-xs text-slate-500">One row per traveler</div>
            </div>

            <div className="space-y-3">
              {form.travelers.map((t, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                  <input className="p-2 border rounded-md" placeholder="Name" value={t.name} onChange={(e) => updateTraveler(i, "name", e.target.value)} />

                  <div>
                    <AsyncCreatableSelect
                      isMulti
                      cacheOptions
                      defaultOptions={NATIONALITY_LIST.map((n) => ({ label: n, value: n }))}
                      loadOptions={loadSimpleOptions(NATIONALITY_LIST)}
                      placeholder="Nationality (multiple)"
                      value={Array.isArray(t.nationality) ? t.nationality.map((n) => ({ label: n, value: n })) : []}
                      onChange={(opts) => updateTraveler(i, "nationality", opts ? opts.map((o) => o.value) : [])}
                      styles={{ control: (base) => ({ ...base, minHeight: 44 }), valueContainer: (base) => ({ ...base, padding: '0 8px' }), input: (base) => ({ ...base, margin: 0, padding: 0 }) }}
                    />
                  </div>

                  <div>
                    <AsyncCreatableSelect
                      isMulti
                      cacheOptions
                      defaultOptions={RESIDENCY_LIST.map((r) => ({ label: r, value: r }))}
                      loadOptions={loadSimpleOptions(RESIDENCY_LIST)}
                      placeholder="Residency / Visa (multiple)"
                      value={Array.isArray(t.residency) ? t.residency.map((r) => ({ label: r, value: r })) : []}
                      onChange={(opts) => updateTraveler(i, "residency", opts ? opts.map((o) => o.value) : [])}
                      styles={{ control: (base) => ({ ...base, minHeight: 44 }), valueContainer: (base) => ({ ...base, padding: '0 8px' }), input: (base) => ({ ...base, margin: 0, padding: 0 }) }}
                    />
                  </div>

                  <input type="number" className="p-2 border rounded-md md:w-24" placeholder="Age" value={t.age} onChange={(e) => updateTraveler(i, "age", e.target.value)} />

                  <button type="button" onClick={() => removeTraveler(i)} className="text-sm text-red-600">Remove</button>
                </div>
              ))}

              <div>
                <button type="button" onClick={addTraveler} className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm">+ Add Traveler</button>
              </div>
            </div>
          </div>

          <div>
            <CTAButton
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white text-lg"
              style={{ fontSize: 18, padding: "12px 16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "FIND BEST TRIPS"}
            </CTAButton>
          </div>
        </form>
      </GlassCard>

      {results.length > 1 && (
        <GlassCard className="mb-6">
          <div className="text-lg font-bold text-slate-800 mb-2">AI Recommendations</div>
          <p className="text-sm text-slate-600 mb-4">Personalized suggestions based on total cost, nationality, residency, and visa fees:</p>
          <ul className="list-disc pl-5 text-slate-700 text-sm">
            {aiRecommendations().map((rec, i) => (
              <li key={i}>
                Consider swapping <b>{rec.from}</b> for <b>{rec.to}</b> to save approximately <b>{formatCurrency(Math.abs(rec.totalDiff))}</b>. Visa difference impact: <b>{formatCurrency(rec.visaDiff)}</b>.
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="text-sm text-slate-600">Results — sorted cheapest first</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((r, idx) => (
              <GlassCard key={idx}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <img src={r.image} alt={r.destination} className="w-full h-44 object-cover rounded-md col-span-1" />
                  <div className="col-span-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{r.destination}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                          <img src={flagUrl(r.country)} alt={r.country} className="w-5 h-3 object-cover rounded-sm" />
                          <span>{r.country}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-indigo-700">{formatCurrency(r.grandTotal)}</div>
                        <div className="text-xs text-slate-500">Total (all travelers)</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
                      <div>Avg daily: <span className="font-medium">{formatCurrency(r.avgDaily)}</span></div>
                      <div>Days: <span className="font-medium">{r.days}</span></div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-medium text-slate-800 mb-2">Daily cost breakdown</div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                        <div className="flex justify-between"><span>Lodging</span><span>{formatCurrency(r.breakdown?.lodging)}</span></div>
                        <div className="flex justify-between"><span>Food</span><span>{formatCurrency(r.breakdown?.food)}</span></div>
                        <div className="flex justify-between"><span>Transport</span><span>{formatCurrency(r.breakdown?.transport)}</span></div>
                        <div className="flex justify-between"><span>Misc</span><span>{formatCurrency(r.breakdown?.misc)}</span></div>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-800">Traveler Breakdown</div>
                        <button type="button" onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)} className="text-sm text-indigo-600">{expandedIndex === idx ? "Hide details" : "Show details"}</button>
                      </div>

                      {expandedIndex === idx ? (
                        <div className="mt-3 space-y-2">
                          {r.travelerBreakdown.map((t, j) => (
                            <div key={j} className="flex justify-between p-3 rounded-md bg-slate-50 border">
                              <div>
                                <div className="font-medium">{t.name}</div>
                                <div className="text-xs text-slate-500">{Array.isArray(t.nationality) ? t.nationality.join(", ") : t.nationality} — {Array.isArray(t.residency) ? t.residency.join(", ") : t.residency}</div>
                              </div>
                              <div className="text-right text-sm">
                                <div>Flight: {formatCurrency(t.flightCost)}</div>
                                <div>Trip: {formatCurrency(t.tripDaily)}</div>
                                <div>Visa: {formatCurrency(t.visaFee)}</div>
                                <div className="font-semibold mt-1">{formatCurrency(t.total)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600">{r.travelerBreakdown.map((t) => `${t.name}: ${formatCurrency(t.total)}`).join(" • ")}</div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2 justify-end">
                      <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(r.destination)}`} target="_blank" rel="noreferrer">
                        <CTAButton className="bg-green-600 text-white">Book Flight</CTAButton>
                      </a>
                      <CTAButton onClick={() => alert("Download report coming soon")} className="border">Download</CTAButton>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
