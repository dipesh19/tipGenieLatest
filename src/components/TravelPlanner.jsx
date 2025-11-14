import React, { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

// ----- Utility -----
const fmt = (n) =>
  Number(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

// UI wrappers
const Container = ({ children }) => (
  <div className="p-6 max-w-5xl mx-auto">{children}</div>
);
const GlassCard = ({ children }) => (
  <div className="bg-white/70 backdrop-blur-lg shadow-xl border border-gray-200 rounded-2xl p-6">
    {children}
  </div>
);
const Input = (props) => (
  <input
    {...props}
    className={
      "border rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-indigo-300"
    }
  />
);
const Button = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-lg text-sm font-medium ${className}`}
  >
    {children}
  </button>
);

// --- Teleport city autocomplete ---
const fallbackCities = [
  "Paris, France",
  "Barcelona, Spain",
  "Lisbon, Portugal",
  "London, UK",
  "Rome, Italy",
  "Tokyo, Japan",
  "Bangkok, Thailand",
  "Dubai, UAE",
  "Bali, Indonesia",
  "Sydney, Australia",
  "Toronto, Canada",
  "Mexico City, Mexico",
  "Singapore",
  "Marrakesh, Morocco",
];

const loadDestinationOptions = async (inputValue) => {
  if (!inputValue)
    return fallbackCities.map((c) => ({ label: c, value: c }));

  try {
    const res = await fetch(
      `https://api.teleport.org/api/cities/?search=${encodeURIComponent(
        inputValue
      )}&limit=10`
    );

    if (!res.ok) throw new Error("Teleport error");
    const data = await res.json();

    const arr =
      data._embedded?.["city:search-results"]?.map((c) => ({
        label: c.matching_full_name,
        value: c.matching_full_name,
      })) || [];

    if (arr.length > 0) return arr;
  } catch {
    /* fallback */
  }

  return fallbackCities
    .filter((c) =>
      c.toLowerCase().includes(inputValue.toLowerCase())
    )
    .map((c) => ({ label: c, value: c }));
};

// Autocomplete for travelers
const nationalityOptions = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "China",
  "Brazil",
  "UAE",
];
const residencyOptions = [
  "US Green Card",
  "EU PR",
  "Schengen Visa",
  "UK Settlement Visa",
  "Canadian PR",
  "Australian PR",
  "GCC Resident Visa",
  "Singapore PR",
  "Japan Residence Card",
];

const loadSimpleOptions = (list) => async (input) =>
  list
    .filter((x) =>
      x.toLowerCase().includes((input || "").toLowerCase())
    )
    .map((x) => ({ label: x, value: x }));

// Fetch unsplash image
async function fetchImageForDestination(dest) {
  try {
    const query = encodeURIComponent(dest);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&client_id=Q4uDqR_xxx_replace_yours`
    );

    const data = await res.json();
    return (
      data?.results?.[0]?.urls?.regular ||
      "https://via.placeholder.com/800x500?text=Destination"
    );
  } catch {
    return "https://via.placeholder.com/800x500?text=Destination";
  }
}

export default function TravelPlanner() {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    destinations: [],
    travelers: [
      {
        name: "",
        nationality: "",
        residency: "",
        age: "",
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [results, setResults] = useState([]);

  const addTraveler = () =>
    setFormData((p) => ({
      ...p,
      travelers: [
        ...p.travelers,
        { name: "", nationality: "", residency: "", age: "" },
      ],
    }));

  const updateTraveler = (i, field, value) =>
    setFormData((p) => {
      const arr = [...p.travelers];
      arr[i][field] = value;
      return { ...p, travelers: arr };
    });

  const removeTraveler = (i) =>
    setFormData((p) => ({
      ...p,
      travelers: p.travelers.filter((_, x) => x !== i),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.startDate ||
      !formData.endDate ||
      formData.destinations.length === 0
    ) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);
    const destList = formData.destinations
      .map((d) => d.value)
      .slice(0, 5);

    try {
      const [costsRes, flightsRes, visasRes] = await Promise.all([
        fetch("/api/costs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ destinations: destList }),
        }).then((r) => r.json()),

        fetch("/api/flights", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            destinations: destList,
            dates: {
              start: formData.startDate,
              end: formData.endDate,
            },
          }),
        }).then((r) => r.json()),

        fetch("/api/visa", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            destinations: destList,
            travelers: formData.travelers,
          }),
        }).then((r) => r.json()),
      ]);

      const built = await Promise.all(
        destList.map(async (dest, i) => {
          const costObj = costsRes?.results?.[i] || {};
          const flightObj = flightsRes?.[i] || {};
          const visaObj =
            visasRes?.results?.find((v) => v.destination === dest) || {};

          const days = Math.max(
            1,
            Math.round(
              (new Date(formData.endDate) -
                new Date(formData.startDate)) /
                (1000 * 60 * 60 * 24)
            )
          );

          const image = await fetchImageForDestination(dest);

          const travelerBreakdown = formData.travelers.map((t, j) => {
            const visaFee =
              visaObj?.data?.[j]?.visaFee ||
              visaObj?.visaFee ||
              0;

            const flight =
              flightObj?.flightCost ||
              flightObj?.price ||
              Math.floor(Math.random() * 300 + 250);

            const daily = costObj?.avgDaily || 100;
            const tripDaily = daily * days;

            return {
              name: t.name || `Traveler ${j + 1}`,
              nationality: t.nationality,
              residency: t.residency,
              flightCost: flight,
              tripDaily,
              visaFee,
              total: Math.round(flight + tripDaily + visaFee),
            };
          });

          const grandTotal = travelerBreakdown.reduce(
            (acc, t) => acc + t.total,
            0
          );

          return {
            destination: dest,
            image,
            avgDaily: costObj.avgDaily,
            breakdown: costObj.breakdown,
            travelerBreakdown,
            grandTotal,
            days,
          };
        })
      );

      // Sort results by total cost ascending
      built.sort((a, b) => a.grandTotal - b.grandTotal);

      setResults(built);
    } catch (err) {
      console.error("Trip fetch failed:", err);
    }

    setLoading(false);
  };

  return (
    <Container>
      <h1 className="text-3xl font-bold text-center mb-6">
        ✈️ Trips Genie — Plan Smart, Travel Better
      </h1>

      {/* MAIN FORM */}
      <GlassCard>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    startDate: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    endDate: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          {/* Destinations */}
          <div>
            <label className="text-sm font-medium">
              Destinations (up to 5)
            </label>
            <AsyncCreatableSelect
              isMulti
              cacheOptions
              loadOptions={loadDestinationOptions}
              value={formData.destinations}
              onChange={(v) =>
                setFormData((p) => ({
                  ...p,
                  destinations: v.slice(0, 5),
                }))
              }
              placeholder="Select destinations…"
            />
          </div>

          {/* TRAVELERS */}
          <div>
            <label className="font-semibold text-sm">Travelers</label>
            <div className="space-y-3 mt-2">
              {formData.travelers.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3"
                >
                  <Input
                    placeholder="Name"
                    value={t.name}
                    onChange={(e) =>
                      updateTraveler(i, "name", e.target.value)
                    }
                  />

                  <AsyncCreatableSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadSimpleOptions(nationalityOptions)}
                    value={
                      t.nationality
                        ? { label: t.nationality, value: t.nationality }
                        : null
                    }
                    onChange={(opt) =>
                      updateTraveler(i, "nationality", opt?.value || "")
                    }
                    placeholder="Nationality"
                  />

                  <AsyncCreatableSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadSimpleOptions(residencyOptions)}
                    value={
                      t.residency
                        ? { label: t.residency, value: t.residency }
                        : null
                    }
                    onChange={(opt) =>
                      updateTraveler(i, "residency", opt?.value || "")
                    }
                    placeholder="Residency / Visa"
                  />

                  <Input
                    type="number"
                    placeholder="Age"
                    value={t.age}
                    onChange={(e) =>
                      updateTraveler(i, "age", e.target.value)
                    }
                  />

                  <Button
                    type="button"
                    onClick={() => removeTraveler(i)}
                    className="bg-red-200 hover:bg-red-300"
                  >
                    Remove
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                onClick={addTraveler}
                className="bg-indigo-100 hover:bg-indigo-200"
              >
                + Add Traveler
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white"
            >
              {loading ? "Analyzing..." : "Find Best Trips"}
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* RESULTS */}
      {results.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Best Destination Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((r, idx) => (
              <GlassCard key={idx}>
                <img
                  src={r.image}
                  alt={r.destination}
                  className="w-full h-56 object-cover rounded-xl mb-3"
                />

                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {r.destination}
                </h3>

                <div className="text-gray-600 text-sm mb-2">
                  {r.days} days trip
                </div>

                <div className="text-gray-700 text-sm">
                  <div>Avg Daily Expense: {fmt(r.avgDaily)}</div>
                </div>

                {/* Traveler Breakdown */}
                <div className="mt-3 border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">
                      Traveler Breakdown
                    </span>
                    <button
                      className="text-sm text-indigo-600"
                      onClick={() =>
                        setExpanded((s) => ({
                          ...s,
                          [idx]: !s?.[idx],
                        }))
                      }
                    >
                      {expanded?.[idx] ? "Hide details" : "Show details"}
                    </button>
                  </div>

                  {expanded?.[idx] ? (
                    <div className="mt-2 space-y-2">
                      {r.travelerBreakdown.map((t, j) => (
                        <div
                          key={j}
                          className="p-3 rounded border bg-gray-50 flex justify-between"
                        >
                          <div>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-gray-500">
                              {t.nationality} — {t.residency}
                            </div>
                          </div>

                          <div className="text-sm text-right">
                            <div>Flight: {fmt(t.flightCost)}</div>
                            <div>
                              Trip ({r.days} days): {fmt(t.tripDaily)}
                            </div>
                            <div>Visa: {fmt(t.visaFee)}</div>
                            <div className="font-semibold mt-1">
                              Total: {fmt(t.total)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-gray-600">
                      {r.travelerBreakdown
                        .map((t) => `${t.name}: ${fmt(t.total)}`)
                        .join(" • ")}
                    </div>
                  )}
                </div>

                <div className="mt-4 text-right font-bold text-indigo-700">
                  Grand Total: {fmt(r.grandTotal)}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}

