import React, { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";

const Button = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 ${className}`}
  >
    {children}
  </button>
);

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
  />
);

const Card = ({ children, className = "" }) => (
  <div className={`border rounded-xl p-4 shadow-md bg-white ${className}`}>
    {children}
  </div>
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

  const addTraveler = () =>
    setFormData((p) => ({
      ...p,
      travelers: [
        ...p.travelers,
        { name: "", nationality: "", residency: "", age: "", shareCost: true },
      ],
    }));

  const updateTraveler = (i, field, value) => {
    const arr = [...formData.travelers];
    arr[i][field] = value;
    setFormData({ ...formData, travelers: arr });
  };

  const loadDestinations = async (inputValue) => {
    if (!inputValue) return [];
    const res = await fetch(
      `https://api.teleport.org/api/cities/?search=${encodeURIComponent(
        inputValue
      )}&limit=5`
    );
    const data = await res.json();
    return data._embedded["city:search-results"].map((c) => ({
      label: c.matching_full_name,
      value: c.matching_full_name.split(",")[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const totalDays =
      (new Date(formData.endDate) - new Date(formData.startDate)) /
      (1000 * 60 * 60 * 24);

    const results = [];

    for (const dest of formData.destinations) {
      // mock fallback for flight & cost
      const flightRes = await fetch(`/api/flights?destination=${dest}`);
      const costRes = await fetch(`/api/costs?destination=${dest}`);
      const flight = (await flightRes.json())?.flightCost || 500;
      const daily = (await costRes.json())?.avgDailyExpense || 100;

      const travelerBreakdown = [];
      let totalCost = 0;

      for (const t of formData.travelers) {
        const visaRes = await fetch(
          `/api/visa?nationality=${encodeURIComponent(
            t.nationality
          )}&residency=${encodeURIComponent(
            t.residency
          )}&destination=${encodeURIComponent(dest)}`
        );
        const visaData = await visaRes.json();
        const visaFee = visaData?.visa_fee_usd || 0;

        const personal = flight + daily * totalDays + visaFee;
        travelerBreakdown.push({
          name: t.name || "Traveler",
          nationality: t.nationality,
          residency: t.residency,
          visaFee,
          total: personal
        });
        totalCost += personal;
      }

      results.push({ destination: dest, flight, daily, travelerBreakdown, totalCost });
    }

    setResults(results);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-pink-50 to-yellow-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-indigo-700 mb-6">
        ✈️ Trips Genie — Plan Smart, Travel Better
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData({ ...formData, startDate: e.target.value })
            }
            required
          />
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData({ ...formData, endDate: e.target.value })
            }
            required
          />
        </div>

        <AsyncCreatableSelect
          cacheOptions
          loadOptions={loadDestinations}
          defaultOptions
          placeholder="Select destinations (up to 5)"
          onChange={(opt) =>
            setFormData((p) => ({
              ...p,
              destinations: p.destinations.includes(opt.value)
                ? p.destinations
                : [...p.destinations, opt.value],
            }))
          }
        />

        {formData.travelers.map((t, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="Name"
              value={t.name}
              onChange={(e) => updateTraveler(i, "name", e.target.value)}
            />
            <Input
              placeholder="Nationality"
              value={t.nationality}
              onChange={(e) => updateTraveler(i, "nationality", e.target.value)}
            />
            <Input
              placeholder="Residency / Visa"
              value={t.residency}
              onChange={(e) => updateTraveler(i, "residency", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Age"
              value={t.age}
              onChange={(e) => updateTraveler(i, "age", e.target.value)}
            />
          </div>
        ))}

        <Button type="button" onClick={addTraveler}>
          + Add Traveler
        </Button>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Analyzing..." : "Find Best Trips"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((r, idx) => (
            <Card key={idx}>
              <h2 className="text-xl font-semibold mb-2">{r.destination}</h2>
              <p>Flight: ${r.flight}</p>
              <p>Avg Daily: ${r.daily}</p>
              <div className="mt-2 border-t pt-2">
                <p className="font-semibold">Traveler Breakdown:</p>
                {r.travelerBreakdown.map((t, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span>{t.name}</span>
                    <span>Visa: ${t.visaFee}</span>
                    <span>Total: ${t.total}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-bold">Total (All): ${r.totalCost}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
