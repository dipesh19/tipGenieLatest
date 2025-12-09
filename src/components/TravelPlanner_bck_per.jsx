import React, { useEffect, useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import Select from "react-select";
import { initFirebase, logSearch } from "../../lib/firebaseClient";

/**
 * TravelPlanner.jsx
 * Frontend that queries /api/images, /api/flights, /api/visa, /api/costs
 * - Teleport city autocomplete (primary)
 * - GeoDB Cities via RapidAPI fallback (uses NEXT_PUBLIC_TRAVEL_BUDDY_KEY)
 * - Up to 5 destination selections
 */

const Card = ({ children }) => <div className="card">{children}</div>;
const Button = ({ children, ...p }) => (
  <button {...p} className="btn" style={{ padding: 8, borderRadius: 8 }}>
    {children}
  </button>
);
const Input = (props) => <input {...props} className="border rounded px-2 py-1" />;

export default function TravelPlanner() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
    if (id && typeof window !== "undefined" && !window.dataLayer) {
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", id);
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(s);
    }
    try {
      const conf = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
      if (conf) initFirebase(JSON.parse(conf));
    } catch (e) {
      // ignore
    }
  }, []);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    travelers: [{ name: "", nationalities: [], residencies: [], age: "", shareCost: true }],
    preferences: { visaFree: false, budget: true },
    selectedDestinations: [],
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const residencyOptions = [
    "US Green Card",
    "EU Permanent Resident",
    "UK Settlement Visa",
    "Canadian PR",
    "Australian PR",
    "Schengen Visa",
    "US Tourist Visa",
  ];
  const nationalityOptions = [
    "India",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "China",
    "Brazil",
    "South Africa",
    "Singapore",
    "Mexico",
    "UAE",
  ];

  const loadOptions = (list) => async (inputValue = "") => {
    const q = (inputValue || "").toLowerCase();
    const filtered = list.filter((opt) => opt.toLowerCase().includes(q));
    const dynamic = inputValue && !filtered.includes(inputValue) ? [{ label: inputValue, value: inputValue }] : [];
    return [...filtered.map((opt) => ({ label: opt, value: opt })), ...dynamic];
  };
  const loadNationalityOptions = loadOptions(nationalityOptions);
  const loadResidencyOptions = loadOptions(residencyOptions);

  // Teleport + GeoDB Cities fallback
  const loadDestinationOptions = async (inputValue = "") => {
    if (!inputValue || inputValue.length < 2) return [];
    try {
      // Teleport first
      const res = await fetch(
        `https://api.teleport.org/api/cities/?search=${encodeURIComponent(inputValue)}&limit=10`
      );
      const j = await res.json();
      let results =
        j._embedded && j._embedded["city:search-results"]
          ? j._embedded["city:search-results"].map((r) => {
              const label = r.matching_full_name;
              const link = r._links && r._links["city:item"] && r._links["city:item"].href;
              return { label, value: JSON.stringify({ name: label, cityHref: link }) };
            })
          : [];

      // Fallback to GeoDB Cities (RapidAPI) if Teleport returned nothing
      if (results.length === 0) {
        const geoRes = await fetch(
          `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(
            inputValue
          )}&limit=10`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.NEXT_PUBLIC_TRAVEL_BUDDY_KEY || "",
              "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
            },
          }
        );
        const geoJson = await geoRes.json();
        results = geoJson.data
          ? geoJson.data.map((c) => ({
              label: `${c.city}, ${c.country}`,
              value: JSON.stringify({ name: `${c.city}, ${c.country}` }),
            }))
          : [];
      }
      return results;
    } catch (e) {
      console.warn("Destination search failed", e);
      return [];
    }
  };

  const addTraveler = () =>
    setFormData((p) => ({
      ...p,
      travelers: [...p.travelers, { name: "", nationalities: [], residencies: [], age: "", shareCost: true }],
    }));
  const updateTravelerField = (index, field, value) =>
    setFormData((p) => {
      const t = [...p.travelers];
      t[index] = { ...t[index], [field]: value };
      return { ...p, travelers: t };
    });
  const removeTraveler = (index) =>
    setFormData((p) => ({ ...p, travelers: p.travelers.filter((_, i) => i !== index) }));

  const calculateShared = (amount, travelers) => {
    const sharers = (travelers || []).filter((t) => t.shareCost).length || 1;
    return Math.round(amount / sharers);
  };

  const handleDestinationsChange = (selected) => {
    const limited = (selected || []).slice(0, 5);
    const parsed = limited.map((s) => {
      try {
        return JSON.parse(s.value);
      } catch {
        return { name: s.value };
      }
    });
    setFormData((p) => ({ ...p, selectedDestinations: parsed }));
  };

  const openBooking = (origin, destination, start, end) => {
    const link = `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(
      origin
    )}+to+${encodeURIComponent(destination)}+${start}+${end}`;
    window.open(link, "_blank");
  };

  async function fetchIntegratedResults() {
    setLoading(true);
    try {
      const chosen = formData.selectedDestinations.length ? formData.selectedDestinations : [];
      if (chosen.length === 0) {
        alert("Please choose 1-5 destinations to compare.");
        setLoading(false);
        return;
      }

      // 1) Images
      const imagesRes = await fetch("/api/images", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destinations: chosen }),
      });
      const imagesJson = imagesRes.ok ? await imagesRes.json() : {};

      // 2) Flights
      const flightsRes = await fetch("/api/flights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin: formData.travelers[0]?.nationalities?.[0] || "New York",
          destinations: chosen,
          dates: { start: formData.startDate, end: formData.endDate },
        }),
      });
      const flightsJson = flightsRes.ok ? await flightsRes.json() : {};

      // 3) Visa
      const visaPayload = {
        travelers: formData.travelers.map((t) => ({
          name: t.name,
          nationalities: t.nationalities || [],
          residencies: t.residencies || [],
        })),
        destinations: chosen,
      };
      const visaRes = await fetch("/api/visa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(visaPayload),
      });
      const visaJson = visaRes.ok ? await visaRes.json() : {};

      // 4) Costs
      const costsRes = await fetch("/api/costs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destinations: chosen }),
      });
      const costsJson = costsRes.ok ? await costsRes.json() : {};

      // Combine results
      const combined = chosen.map((destObj) => {
        const dest = destObj.name;
        const imgEntry = imagesJson[dest] || {};
        const img = imgEntry.image || `/placeholder.png`;

        const flightEntry = flightsJson[dest] || {};
        const flightCost = flightEntry.flightCost || Math.floor(Math.random() * 400 + 300);

        const costEntry = costsJson[dest] || { dailyCost: Math.floor(Math.random() * 80 + 30), avgDailyExpense: Math.floor(Math.random() * 120 + 50) };
        const dailyCost = costEntry.dailyCost;
        const avgDailyExpense = costEntry.avgDailyExpense;

        const visaForDest = visaJson[dest] || [];

        const travelerBreakdown = formData.travelers.map((t, tIdx) => {
          const visaInfo = visaForDest[tIdx] || {};
          const visaFee = typeof visaInfo.visaFee === "number" ? visaInfo.visaFee : 0;
          const individualCost = calculateShared((flightCost || 0) + (dailyCost || 0) * 5 + visaFee, formData.travelers);
          return {
            name: t.name || `Traveler ${tIdx + 1}`,
            nationalities: t.nationalities || [],
            residencies: t.residencies || [],
            visaNeeded: visaInfo.visaRequired || "Unknown",
            visaFee,
            individualCost,
          };
        });

        const totalVisa = travelerBreakdown.reduce((s, tb) => s + (tb.visaFee || 0), 0);
        const totalEstimated = Math.round((flightCost || 0) + (avgDailyExpense || 0) * 5 + totalVisa);

        return {
          destination: dest,
          image: img,
          flightCost,
          dailyCost,
          avgDailyExpense,
          totalVisa,
          totalCost: totalEstimated,
          travelerBreakdown,
        };
      });

      setResults(combined);
      try {
        await logSearch({ query: formData, resultsCount: combined.length });
      } catch (e) {
        // ignore logging errors
      }
    } catch (err) {
      console.error(err);
      alert("Live API fetch failed; check console/logs for details.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    await fetchIntegratedResults();
  };

  return (
    <div className="min-h-screen" style={{ padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 28 }}>✈️ Trips Genie - Plan Smart, Travel Better</h1>
          <p style={{ color: "#444" }}>Compare up to 5 city destinations worldwide — multi-nationality & multi-residency supported.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="text-sm">Start Date</label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="text-sm">End Date</label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))} required />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label className="block text-sm">Select destinations to compare (city-level, up to 5)</label>
              <AsyncCreatableSelect
                isMulti
                cacheOptions
                loadOptions={loadDestinationOptions}
                defaultOptions
                placeholder="Type a city name (e.g. Paris, Tokyo)"
                onChange={handleDestinationsChange}
                value={(formData.selectedDestinations || []).map((s) => ({ label: s.name, value: JSON.stringify(s) }))}
              />
            </div>

            {formData.travelers.map((trav, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                <Input placeholder="Name (optional)" value={trav.name} onChange={(e) => updateTravelerField(idx, "name", e.target.value)} />
                <AsyncCreatableSelect isMulti cacheOptions loadOptions={loadNationalityOptions} defaultOptions placeholder="Nationality (multi)" onChange={(opts) => updateTravelerField(idx, "nationalities", opts ? opts.map((o) => o.value) : [])} value={(trav.nationalities || []).map((n) => ({ label: n, value: n }))} />
                <AsyncCreatableSelect isMulti cacheOptions loadOptions={loadResidencyOptions} defaultOptions placeholder="Residency / Visa Status (multi)" onChange={(opts) => updateTravelerField(idx, "residencies", opts ? opts.map((o) => o.value) : [])} value={(trav.residencies || []).map((r) => ({ label: r, value: r }))} />
                <Input type="number" min={0} placeholder="Age" value={trav.age} onChange={(e) => updateTravelerField(idx, "age", e.target.value)} />
                <div style={{ gridColumn: "1 / -1", marginTop: 6 }}>
                  <label><input type="checkbox" checked={!!trav.shareCost} onChange={(e) => updateTravelerField(idx, "shareCost", e.target.checked)} /> <span style={{ marginLeft: 8 }}>Share cost</span></label>
                  <Button type="button" style={{ marginLeft: 8 }} onClick={() => removeTraveler(idx)}>Remove</Button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 10 }}>
              <Button type="button" onClick={addTraveler}>+ Add Traveler</Button>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <label><input type="checkbox" checked={!!formData.preferences.visaFree} onChange={(e) => setFormData((p) => ({ ...p, preferences: { ...p.preferences, visaFree: e.target.checked } }))} /> <span style={{ marginLeft: 8 }}>Visa-free only</span></label>
              <label><input type="checkbox" checked={!!formData.preferences.budget} onChange={(e) => setFormData((p) => ({ ...p, preferences: { ...p.preferences, budget: e.target.checked } }))} /> <span style={{ marginLeft: 8 }}>Budget traveler</span></label>
            </div>

            <div style={{ marginTop: 16 }}>
              <Button type="submit" className="bg-indigo-600 text-white" disabled={loading}>
                {loading ? "Analyzing..." : "Find Best Trips"}
              </Button>
            </div>
          </form>
        </Card>

        {results.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h2 style={{ textAlign: "center" }}>Comparative Destination Picks</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12, marginTop: 12 }}>
              {results.map((r, i) => (
                <Card key={i}>
                  <img src={r.image} alt={r.destination} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 8 }} />
                  <h3 style={{ marginTop: 8 }}>{r.destination}</h3>
                  <p>Flight: ${r.flightCost}</p>
                  <p>Avg Daily Expense: ${r.avgDailyExpense}</p>
                  <p style={{ fontWeight: 600 }}>Visa Fees (total): ${r.totalVisa}</p>
                  <p style={{ fontWeight: 800 }}>Total Estimated: ${r.totalCost}</p>

                  <div style={{ marginTop: 8, borderTop: "1px solid #eee", paddingTop: 8 }}>
                    <strong>Traveler breakdown</strong>
                    {r.travelerBreakdown.map((t, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                        <div style={{ maxWidth: "55%" }}>
                          <div style={{ fontWeight: 600 }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: "#666" }}>{(t.nationalities || []).join(", ")} — {(t.residencies || []).join(", ")}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13 }}>{t.visaNeeded}</div>
                          <div style={{ fontWeight: 600 }}>${t.individualCost}</div>
                          <div style={{ fontSize: 12, color: "#666" }}>Visa: ${t.visaFee}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <Button onClick={() => openBooking(formData.travelers[0]?.nationalities?.[0] || "New York", r.destination, formData.startDate, formData.endDate)}>
                      Book Flight ✈️
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
