
import React, { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

// Minimal UI components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-md p-4 ${className}`}>
    {children}
  </div>
);
const CardContent = ({ children }) => <div>{children}</div>;
const Button = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${className}`}
  >
    {children}
  </button>
);
const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`border border-gray-300 rounded-lg px-3 py-2 w-full ${className}`}
  />
);

export default function TravelPlanner() {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    travelers: [
      { name: "", nationality: "", residency: "", age: "", shareCost: true },
    ],
    destinations: [],
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load destination suggestions dynamically (Teleport)
  // Hybrid destination search with Teleport + local fallback
const fallbackCities = [
  "Paris, France",
  "Rome, Italy",
  "Tokyo, Japan",
  "New York, USA",
  "Barcelona, Spain",
  "London, UK",
  "Bangkok, Thailand",
  "Istanbul, Turkey",
  "Singapore",
  "Dubai, UAE",
  "Lisbon, Portugal",
  "Bali, Indonesia",
  "Prague, Czech Republic",
  "Cape Town, South Africa",
  "Toronto, Canada",
  "Mexico City, Mexico",
  "Sydney, Australia",
  "Auckland, New Zealand",
  "Marrakesh, Morocco",
  "Kathmandu, Nepal"
];

const loadDestinationOptions = async (inputValue) => {
  if (!inputValue) {
    return fallbackCities.map((c) => ({ label: c, value: c }));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

  try {
    const res = await fetch(
      `https://api.teleport.org/api/cities/?search=${encodeURIComponent(
        inputValue
      )}&limit=10`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error("Teleport fetch failed");
    const data = await res.json();

    const options =
      data._embedded?.["city:search-results"]?.map((city) => ({
        label: city.matching_full_name,
        value: city.matching_full_name,
      })) || [];

    if (options.length > 0) return options;

    // fallback if Teleport returns nothing
    return fallbackCities
      .filter((c) => c.toLowerCase().includes(inputValue.toLowerCase()))
      .map((c) => ({ label: c, value: c }));
  } catch (err) {
    console.warn("Teleport API fallback triggered:", err.message);
    clearTimeout(timeout);
    // fallback immediately
    return fallbackCities
      .filter((c) => c.toLowerCase().includes(inputValue.toLowerCase()))
      .map((c) => ({ label: c, value: c }));
  }
};


  const loadOptions = (list) => async (inputValue) => {
    const q = (inputValue || "").toLowerCase();
    return list
      .filter((opt) => opt.toLowerCase().includes(q))
      .map((opt) => ({ label: opt, value: opt }));
  };

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

  const loadNationalityOptions = loadOptions(nationalityOptions);
  const loadResidencyOptions = loadOptions(residencyOptions);

  const addTraveler = () =>
    setFormData((p) => ({
      ...p,
      travelers: [
        ...p.travelers,
        { name: "", nationality: "", residency: "", age: "", shareCost: true },
      ],
    }));

  const updateTraveler = (i, field, value) =>
    setFormData((p) => {
      const travelers = [...p.travelers];
      travelers[i] = { ...travelers[i], [field]: value };
      return { ...p, travelers };
    });

  const removeTraveler = (i) =>
    setFormData((p) => ({
      ...p,
      travelers: p.travelers.filter((_, x) => x !== i),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.destinations.length === 0) return;
    setLoading(true);

    try {
      const [visaRes, flightRes, costRes] = await Promise.all([
        fetch("/api/visa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinations: formData.destinations.map((d) => d.value),
            travelers: formData.travelers,
          }),
        }).then((r) => r.json()),
        fetch("/api/flights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinations: formData.destinations.map((d) => d.value),
          }),
        }).then((r) => r.json()),
        fetch("/api/costs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinations: formData.destinations.map((d) => d.value),
          }),
        }).then((r) => r.json()),
      ]);

      const merged = formData.destinations.map((d, i) => {
        const dest = d.value;
        const flight = flightRes?.[i]?.flightCost || 400;
        const expense = costRes?.[i]?.avgDailyExpense || 100;
        const visaFees =
          visaRes?.results?.find((v) => v.destination === dest)?.visaFee || 0;

        const travelerBreakdown = formData.travelers.map((t) => {
          const total = flight + expense + visaFees;
          return {
            name: t.name || "Traveler",
            nationality: t.nationality,
            residency: t.residency,
            visaFee: visaFees,
            total,
          };
        });

        const grandTotal = travelerBreakdown.reduce(
          (acc, t) => acc + t.total,
          0
        );

        return {
          destination: dest,
          flight,
          expense,
          visaFees,
          travelerBreakdown,
          grandTotal,
        };
      });

      setResults(merged);
    } catch (err) {
      console.error("Failed to fetch trip data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-pink-50 to-yellow-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-indigo-700 mb-6">
        ✈️ Trips Genie — Plan Smart, Travel Better
      </h1>

      <Card className="p-6 shadow-xl mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startDate: e.target.value }))
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
                  setFormData((p) => ({ ...p, endDate: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">
              Select destinations to compare (city-level, up to 5)
            </label>
            <AsyncCreatableSelect
              isMulti
              cacheOptions
              defaultOptions
              loadOptions={loadDestinationOptions}
              value={formData.destinations}
              onChange={(v) =>
                setFormData((p) => ({ ...p, destinations: v.slice(0, 5) }))
              }
              placeholder="Select destinations..."
              isClearable
              formatCreateLabel={() => null}
            />
          </div>

          {formData.travelers.map((t, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center"
            >
              <Input
                placeholder="Name"
                value={t.name}
                onChange={(e) => updateTraveler(i, "name", e.target.value)}
              />
              <AsyncCreatableSelect
                cacheOptions
                loadOptions={loadNationalityOptions}
                defaultOptions
                placeholder="Nationality"
                value={
                  t.nationality
                    ? { label: t.nationality, value: t.nationality }
                    : null
                }
                onChange={(opt) =>
                  updateTraveler(i, "nationality", opt ? opt.value : "")
                }
              />
              <AsyncCreatableSelect
                cacheOptions
                loadOptions={loadResidencyOptions}
                defaultOptions
                placeholder="Residency / Visa"
                value={
                  t.residency
                    ? { label: t.residency, value: t.residency }
                    : null
                }
                onChange={(opt) =>
                  updateTraveler(i, "residency", opt ? opt.value : "")
                }
              />
              <Input
                type="number"
                placeholder="Age"
                value={t.age}
                onChange={(e) => updateTraveler(i, "age", e.target.value)}
              />
              <Button
                type="button"
                onClick={() => removeTraveler(i)}
                className="bg-gray-200 hover:bg-red-300"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={addTraveler}
            className="mt-2 bg-indigo-500 text-white hover:bg-indigo-600"
          >
            + Add Traveler
          </Button>

          <Button
            className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-pink-500 text-white"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Find Best Trips"}
          </Button>
        </form>
      </Card>

      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-center mb-4">
            Comparative Destination Picks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((r, i) => (
              <Card key={i} className="p-4 shadow-lg border-l-4 border-indigo-400">
                <CardContent>
                  <h3 className="text-xl font-bold mb-2">{r.destination}</h3>
                  <p className="text-sm text-gray-600 mb-1">Flight: ${r.flight}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    Avg Daily Expense: ${r.expense}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Visa Fees (each): ${r.visaFees}
                  </p>

                  <div className="border-t pt-2 mt-3">
                    <p className="text-md font-semibold mb-1">
                      Traveler Breakdown:
                    </p>
                    {r.travelerBreakdown.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm border-b py-1"
                      >
                        <span>
                          {t.name} ({t.nationality})
                        </span>
                        <span>Visa: ${t.visaFee}</span>
                        <span>Total: ${t.total}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-right text-indigo-700 font-semibold mt-2">
                    Grand Total (All Travelers): ${r.grandTotal.toFixed(2)}
                  </p>

                  <Button
                    onClick={() => alert(`Booking flight to ${r.destination}`)}
                    className="mt-3 bg-gradient-to-r from-green-400 to-blue-500 text-white hover:opacity-90"
                  >
                    Book Flight ✈️
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
