import React, { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

/**
 * TravelPlanner.jsx (Minimal modern UI)
 * - Clean layout
 * - Destination autocomplete (Teleport with fallback)
 * - Nationality / Residency autocomplete (creatable)
 * - Calls /api/costs, /api/flights, /api/visa
 * - Results sorted cheapest-first
 */

/* ----------------- Utilities ----------------- */
const fmt = (n) => (n == null ? "-" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const extractCountry = (label = "") => {
  const parts = String(label).split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
};

/* ----------------- Small UI Primitives ----------------- */
const Container = ({ children }) => (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-5xl mx-auto px-4">{children}</div>
  </div>
);

const Header = ({ title, subtitle }) => (
  <header className="mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="text-xs text-gray-500">MVP</div>
    </div>
  </header>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm ${className}`}>{children}</div>
);

const PrimaryButton = ({ children, className = "", ...props }) => (
  <button {...props} className={`px-4 py-2 rounded-md font-semibold transition ${className}`}>
    {children}
  </button>
);

const SmallButton = ({ children, className = "", ...props }) => (
  <button {...props} className={`px-3 py-1.5 rounded-md text-sm ${className}`}>{children}</button>
);

/* ----------------- Destination fallback (small curated list) ----------------- */
const FALLBACK_CITIES = [
  "Paris, France","Rome, Italy","Tokyo, Japan","New York, USA","Barcelona, Spain",
  "London, United Kingdom","Bangkok, Thailand","Istanbul, Turkey","Singapore","Dubai, United Arab Emirates",
  "Lisbon, Portugal","Bali, Indonesia","Prague, Czech Republic","Cape Town, South Africa","Toronto, Canada"
];

/* ----------------- Helpers: Image (Pexels -> Unsplash fallback) ----------------- */
async function fetchImageFor(dest) {
  try {
    const key = process.env.NEXT_PUBLIC_PEXELS_KEY;
    const q = dest.split(",")[0];
    if (key) {
      const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=1`, { headers: { Authorization: key }});
      if (r.ok) {
        const j = await r.json();
        const p = j.photos?.[0];
        if (p?.src?.medium) return p.src.medium;
      }
    }
    return `https://source.unsplash.com/600x400/?${encodeURIComponent(dest.split(",")[0])}`;
  } catch {
    return `https://source.unsplash.com/600x400/?${encodeURIComponent(dest.split(",")[0])}`;
  }
}

/* ----------------- Destination Autocomplete (Teleport w/ timeout + fallback) ----------------- */
const loadDestinationOptions = async (input = "") => {
  if (!input || input.length < 2) return FALLBACK_CITIES.map(c => ({ label: c, value: c }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`https://api.teleport.org/api/cities/?search=${encodeURIComponent(input)}&limit=8`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("Teleport failed");
    const j = await res.json();
    const opts = (j._embedded?.["city:search-results"] || []).map(c => ({ label: c.matching_full_name, value: c.matching_full_name }));
    return opts.length ? opts : FALLBACK_CITIES.filter(c => c.toLowerCase().includes(input.toLowerCase())).map(c => ({ label: c, value: c }));
  } catch {
    clearTimeout(timeout);
    return FALLBACK_CITIES.filter(c => c.toLowerCase().includes(input.toLowerCase())).map(c => ({ label: c, value: c }));
  }
};

/* ----------------- Autocomplete options for nationality/residency ----------------- */
const NATIONALITY_LIST = [
  "India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","Singapore","China","Brazil","UAE","Spain","Italy","Netherlands","Sweden","South Africa"
];

const RESIDENCY_LIST = [
  "US Green Card","EU PR","Schengen Visa","UK Settlement Visa","Canadian PR","Australian PR","GCC Resident Visa","Singapore PR","Japan Residence Card"
];

const loadTextOptions = (list) => async (input) => {
  const q = (input || "").toLowerCase();
  return list.filter(x => x.toLowerCase().includes(q)).map(x => ({ label: x, value: x }));
};

/* ----------------- Component ----------------- */
export default function TravelPlanner() {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    destinations: [],
    travelers: [{ name: "Traveler 1", nationality: "", residency: "", age: "", shareCost: true }],
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  /* Traveler helpers */
  const addTraveler = () => setForm(p => ({ ...p, travelers: [...p.travelers, { name: "", nationality: "", residency: "", age: "", shareCost: true }] }));
  const updateTraveler = (i, key, val) => { const t = [...form.travelers]; t[i] = { ...t[i], [key]: val }; setForm({ ...form, travelers: t }); };
  const removeTraveler = (i) => setForm(p => ({ ...p, travelers: p.travelers.filter((_, idx) => idx !== i) }));

  /* Main submit logic */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.startDate || !form.endDate || !form.destinations.length) {
      alert("Please select start/end dates and at least one destination.");
      return;
    }
    setLoading(true);
    try {
      const destList = form.destinations.map(d => d.value).slice(0,5);

      const [costsRes, flightsRes, visasRes] = await Promise.all([
        fetch("/api/costs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinations: destList }) }).then(r => r.json()).catch(()=>[]),
        fetch("/api/flights", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinations: destList }) }).then(r => r.json()).catch(()=>[]),
        fetch("/api/visa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinations: destList, travelers: form.travelers }) }).then(r => r.json()).catch(()=>({ results: [] })),
      ]);

      const days = Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000*60*60*24)));

      const assembled = await Promise.all(destList.map(async (dest, idx) => {
        const costObj = costsRes?.results?.[idx] || (Array.isArray(costsRes) ? costsRes[idx] : {}) || {};
        const flightObj = Array.isArray(flightsRes) ? flightsRes[idx] || {} : flightsRes?.[dest] || {};
        const visaObj = (visasRes?.results || []).find(v => v.destination === dest) || {};

        const avgDaily = costObj.avgDaily || costObj.avgDailyExpense || 110;
        const breakdown = costObj.breakdown || {
          lodging: Math.round(avgDaily * 0.45),
          food: Math.round(avgDaily * 0.35),
          transport: Math.round(avgDaily * 0.2),
        };

        const image = await fetchImageFor(dest);

        const travelerBreakdown = form.travelers.map((t, ti) => {
          let visaFee = 0;
          if (Array.isArray(visaObj?.data) && visaObj.data[ti]) {
            visaFee = Number(visaObj.data[ti].visa_fee_usd || visaObj.data[ti].visaFee || 0);
          } else {
            visaFee = Number(visaObj?.visa_fee_usd || visaObj?.visaFee || 0);
          }

          const flightCost = Number(flightObj?.flightCost || flightObj?.price || Math.floor(Math.random() * 400 + 300));
          const tripDaily = avgDaily * days;
          const total = Math.round(flightCost + tripDaily + visaFee);

          return {
            name: t.name || `Traveler ${ti + 1}`,
            nationality: t.nationality,
            residency: t.residency,
            age: t.age,
            visaFee,
            flightCost,
            tripDaily,
            total
          };
        });

        const grandTotal = travelerBreakdown.reduce((s, t) => s + t.total, 0);
        const country = extractCountry(dest);
        return { destination: dest, country, image, avgDaily, breakdown, travelerBreakdown, flightEstimate: travelerBreakdown[0]?.flightCost || 0, grandTotal };
      }));

      // sort ascending by grandTotal (cheapest first)
      assembled.sort((a,b) => a.grandTotal - b.grandTotal);

      setResults(assembled);
    } catch (err) {
      console.error("Search failed:", err);
      alert("Failed to fetch trip info — check console.");
    } finally {
      setLoading(false);
    }
  };

  const flagUrl = (country) => country ? `https://countryflagsapi.com/png/${encodeURIComponent(country)}` : "";

  /* ----------------- Render ----------------- */
  return (
    <Container>
      <Header title="Trips Genie" subtitle="Plan Smart, Travel Better — compare up to 5 city-level destinations" />

      <Card className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dates + Destinations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-600">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="mt-1 p-2 border rounded w-full" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="mt-1 p-2 border rounded w-full" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Destinations (up to 5)</label>
              <div className="mt-1">
                <AsyncCreatableSelect
                  isMulti
                  cacheOptions
                  defaultOptions
                  loadOptions={loadDestinationOptions}
                  value={form.destinations}
                  onChange={v => setForm(p => ({ ...p, destinations: v ? v.slice(0,5) : [] }))}
                  placeholder="Search city, e.g. Paris, France"
                  styles={{ menu: provided => ({ ...provided, zIndex: 9999 }) }}
                />
              </div>
            </div>
          </div>

          {/* Travelers */}
          <div>
            <div className="mb-2 font-medium">Travelers</div>
            {form.travelers.map((t, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center mb-3">
                <input value={t.name} onChange={e => updateTraveler(i, "name", e.target.value)} placeholder="Name" className="p-2 border rounded w-full" />
                <AsyncCreatableSelect
                  cacheOptions
                  defaultOptions={NATIONALITY_LIST.map(n => ({ label: n, value: n }))}
                  loadOptions={loadTextOptions(NATIONALITY_LIST)}
                  placeholder="Nationality"
                  value={t.nationality ? { label: t.nationality, value: t.nationality } : null}
                  onChange={opt => updateTraveler(i, "nationality", opt ? opt.value : "")}
                />
                <AsyncCreatableSelect
                  cacheOptions
                  defaultOptions={RESIDENCY_LIST.map(r => ({ label: r, value: r }))}
                  loadOptions={loadTextOptions(RESIDENCY_LIST)}
                  placeholder="Residency / Visa"
                  value={t.residency ? { label: t.residency, value: t.residency } : null}
                  onChange={opt => updateTraveler(i, "residency", opt ? opt.value : "")}
                />
                <input type="number" value={t.age} onChange={e => updateTraveler(i, "age", e.target.value)} placeholder="Age" className="p-2 border rounded w-full md:w-24" />
                <SmallButton type="button" onClick={() => removeTraveler(i)} className="text-red-600 border">Remove</SmallButton>
              </div>
            ))}

            <div>
              <SmallButton type="button" onClick={addTraveler} className="bg-gray-900 text-white">+ Add Traveler</SmallButton>
            </div>
          </div>

          <div>
            <PrimaryButton type="submit" className="w-full bg-indigo-600 text-white" disabled={loading}>
              {loading ? "Analyzing..." : "Find Best Trips"}
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="mb-3 text-sm text-gray-600">Results — cheapest first</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.map((r, idx) => (
              <Card key={idx} className="flex gap-4">
                <div className="w-36 h-24 flex-shrink-0 overflow-hidden rounded">
                  <img src={r.image} alt={r.destination} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-semibold text-gray-800">{r.destination}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <img src={flagUrl(r.country)} alt={r.country} className="w-5 h-3 object-cover rounded-sm" />
                        <span>{r.country}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-indigo-700">{fmt(r.grandTotal)}</div>
                      <div className="text-xs text-gray-500">Total (all travelers)</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-gray-600">
                    <div>
                      <div className="text-xs text-gray-500">Avg/day</div>
                      <div className="font-medium">{fmt(r.avgDaily)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Lodging/day</div>
                      <div className="font-medium">{fmt(r.breakdown?.lodging)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Food/day</div>
                      <div className="font-medium">{fmt(r.breakdown?.food)}</div>
                    </div>
                  </div>

                  <div className="mt-3 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-800">Traveler breakdown</div>
                      <SmallButton onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)} className="text-indigo-600">
                        {expandedIndex === idx ? "Hide" : "Details"}
                      </SmallButton>
                    </div>

                    {expandedIndex === idx ? (
                      <div className="mt-3 space-y-2">
                        {r.travelerBreakdown.map((t, j) => (
                          <div key={j} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <div className="font-medium">{t.name}</div>
                              <div className="text-xs text-gray-500">{t.nationality} — {t.residency}</div>
                            </div>
                            <div className="text-right text-sm">
                              <div>Flight: {fmt(t.flightCost)}</div>
                              <div>Trip: {fmt(t.tripDaily)}</div>
                              <div>Visa: {fmt(t.visaFee)}</div>
                              <div className="font-semibold mt-1">{fmt(t.total)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-600">
                        {r.travelerBreakdown.map(t => `${t.name}: ${fmt(t.total)}`).join(" • ")}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 justify-end">
                    <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(r.destination)}`} target="_blank" rel="noreferrer" className="inline-block">
                      <PrimaryButton className="bg-green-600 text-white">Book Flight</PrimaryButton>
                    </a>
                    <SmallButton onClick={() => alert("Download report will be added later")} className="border">Download</SmallButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}

/* ----------------- small helper after component ----------------- */
function flagUrl(country) {
  if (!country) return "";
  return `https://countryflagsapi.com/png/${encodeURIComponent(country)}`;
}
