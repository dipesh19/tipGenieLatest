import React, { useState, useEffect } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";


/**
 * TravelPlanner.jsx — with enhanced AI insights and typing animation
 */

/* ---------------- utilities ---------------- */
const formatCurrency = (n) =>
  n == null || n === "" ? "-" : `$${Number(n).toFixed(2)}`;

const extractCountry = (label = "") => {
  const parts = String(label).split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
};

/* ---------------- Typing Animation Component ---------------- */
const TypingText = ({ text, speed = 30 }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    // reset typing when text changes
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <span>
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
};

/* ---------------- UI primitives ---------------- */
const Page = ({ children }) => (
  <div
    className="tp-page"
    style={{
      position: "relative",
      minHeight: "100vh",
      backgroundColor: "#0b0b12",
    }}
  >
    {/* Background image */}
    <div
className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "url(/SeaMtn.jpeg)",
        backgroundPosition: "center",
        opacity: 1,
        filter: "brightness(1.1) contrast(1.5)",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />

    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(to bottom, rgba(5,5,10,0.15), rgba(5,5,10,0.4))",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />

    <main
      className="tp-main"
      style={{
        position: "relative",
        zIndex: 1,
        paddingTop: "3rem",
        paddingBottom: "3rem",
      }}
    >
      {children}
    </main>

    <style jsx>{`
      .typing-cursor {
        animation: blink 1s infinite;
        font-weight: 100;
      }
      @keyframes blink {
        0%,
        49% {
          opacity: 1;
        }
        50%,
        100% {
          opacity: 0;
        }
      }
    `}</style>
  </div>
);

const TopHeader = ({ title, subtitle }) => (
  <header
    className="space-y-2"
    style={{ textAlign: "center", padding: "1.75rem 1rem 1.25rem" }}
  >
    <h1
      className="text-3xl md:text-4xl font-extrabold tracking-tight"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.55rem 1.3rem",
        borderRadius: "999px",
        background:
          "linear-gradient(135deg, rgba(255,215,128,0.95), rgba(255,140,180,0.95))",
        color: "#1a1024",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
      }}
    >
      <span style={{ fontSize: "1.4rem" }}>✈️</span>
      <span>{title}</span>
    </h1>

    {subtitle && (
      <p
        className="text-sm md:text-base"
        style={{
          color: "#f9fafb",
          textShadow: "0 0 10px rgba(0,0,0,0.9)",
          maxWidth: "36rem",
          margin: "0.5rem auto 0",
        }}
      >
        {subtitle}
      </p>
    )}
  </header>
);

const GlassCard = ({ children }) => (
  <div
    style={{
      background: "rgba(15, 23, 42, 0.14)",          // very transparent dark tint
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: "1.25rem",
      padding: "1.25rem",
      boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
      marginBottom: "1rem",
      display: "flex",
      gap: "1.25rem",
      alignItems: "flex-start",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      color: "#f9fafb",                              // default text color inside card
    }}
  >
    <div style={{ flex: 1 }}>{children}</div>

    <div
      style={{
        width: "150px",
        height: "224px",
        border: "1px solid #94a3b8",
        borderRadius: "3px",
        overflow: "hidden",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      <img
        src="/TripGirl2.jpeg"
        alt="Traveler illustration"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  </div>
);




const CTAButton = ({ children, className = "", ...props }) => (
  <button {...props} className={`px-6 py-3 rounded-xl font-bold ${className}`}>
    {children}
  </button>
);

/* ---------------- static data ---------------- */
const FALLBACK_CITIES = [
  "Paris, France",
  "London, United Kingdom",
  "Rome, Italy",
  "Barcelona, Spain",
  "Amsterdam, Netherlands",
  "Berlin, Germany",
  "Lisbon, Portugal",
  "Istanbul, Turkey",
  "Dubai, United Arab Emirates",
  "Bangkok, Thailand",
  "Singapore",
  "Tokyo, Japan",
  "New York, USA",
  "Los Angeles, USA",
  "Toronto, Canada",
  "Sydney, Australia",
  "Hong Kong, China",
  "Seoul, South Korea",
  "Bali, Indonesia",
  "Cape Town, South Africa",
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
  return list
    .filter((x) => x.toLowerCase().includes(q))
    .map((x) => ({ label: x, value: x }));
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    borderRadius: "0.75rem",
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#fbbf24" : "#d1d5db",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(251,191,36,0.55)"
      : "none",
  }),
  menu: (base) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: "#0f172a",
    color: "#f9fafb",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "rgba(251,191,36,0.25)"
      : "transparent",
    color: "#f9fafb",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "rgba(37,99,235,0.1)",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#1f2937",
    fontWeight: 500,
  }),
};

const hasUKPermanentStatus = (residencies) => {
  return (Array.isArray(residencies) ? residencies : []).some(r =>
    r.includes("settlement") || r.includes("ilr") || 
    r.includes("indefinite leave to remain") || 
    r.includes("permanent residence") || r.includes("pr")
  );
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
  const [showInsights, setShowInsights] = useState(false);
  const [loading, setLoading] = useState(false);

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

  /* --------- AI insights generator --------- */
  const generateDetailedInsights = (results, days) => {
    const insights = [];

    if (results.length === 1) {
      const r = results[0];
      const dailyCost = Math.round(
        r.breakdown.lodging +
          r.breakdown.food +
          r.breakdown.transport +
          r.breakdown.misc
      );

      insights.push(
        `🎯 Planning a ${days}-day trip to ${r.destination}! Here's your complete breakdown:`
      );
      insights.push(
        `✈️ Flight: ${formatCurrency(
          r.flightCost
        )} - Your journey begins here!`
      );
      insights.push(
        `🏨 Accommodation: ${formatCurrency(
          r.breakdown.lodging
        )} per day (${formatCurrency(
          r.breakdown.lodging * days
        )} total) - Comfortable stays await you.`
      );
      insights.push(
        `🍽️ Food: ${formatCurrency(
          r.breakdown.food
        )} per day (${formatCurrency(
          r.breakdown.food * days
        )} total) - Savor local cuisine!`
      );
      insights.push(
        `🚕 Local Transport: ${formatCurrency(
          r.breakdown.transport
        )} per day (${formatCurrency(
          r.breakdown.transport * days
        )} total) - Getting around made easy.`
      );
      insights.push(
        `🎭 Activities & Misc: ${formatCurrency(
          r.breakdown.misc
        )} per day (${formatCurrency(
          r.breakdown.misc * days
        )} total) - Make memories!`
      );

      if (r.visaFee > 0) {
        insights.push(
          `📋 Visa Fees: ${formatCurrency(
            r.visaFee
          )} - Don't forget to apply in advance!`
        );
      } else {
        insights.push(
          `📋 Great news! No visa fees required for this destination! 🎉`
        );
      }

      insights.push(
        `💰 Daily Budget: ${formatCurrency(
          dailyCost
        )} - Plan your spending wisely.`
      );
      insights.push(
        `🎊 Total Trip Cost: ${formatCurrency(
          r.total
        )} - Your adventure awaits!`
      );
    } else if (results.length > 1) {
      const sorted = [...results].sort((a, b) => a.total - b.total);
      const cheapest = sorted[0];
      const mostExpensive = sorted[sorted.length - 1];

      insights.push(
        `🔍 Comparing ${results.length} amazing destinations for your ${days}-day adventure!`
      );
      insights.push(
        `💡 Best Value: ${cheapest.destination} at ${formatCurrency(
          cheapest.total
        )} - The most budget-friendly option!`
      );

      for (let i = 1; i < Math.min(3, sorted.length); i++) {
        const current = sorted[i];
        const savings = current.total - cheapest.total;
        const flightDiff = current.flightCost - cheapest.flightCost;
        const accomDiff =
          (current.breakdown.lodging - cheapest.breakdown.lodging) * days;
        const foodDiff =
          (current.breakdown.food - cheapest.breakdown.food) * days;
        const visaDiff = current.visaFee - cheapest.visaFee;

        const breakdown = [];
        if (Math.abs(flightDiff) > 50)
          breakdown.push(
            `${formatCurrency(Math.abs(flightDiff))} on flights`
          );
        if (Math.abs(accomDiff) > 100)
          breakdown.push(
            `${formatCurrency(Math.abs(accomDiff))} on accommodation`
          );
        if (Math.abs(foodDiff) > 50)
          breakdown.push(
            `${formatCurrency(Math.abs(foodDiff))} on food`
          );
        if (Math.abs(visaDiff) > 0)
          breakdown.push(
            `${formatCurrency(Math.abs(visaDiff))} on visa fees`
          );

        const breakdownText =
          breakdown.length > 0
            ? ` (Save ${breakdown.join(", ")})`
            : "";

        insights.push(
          `📊 ${
            current.destination
          }: ${formatCurrency(current.total)} - Choose ${
            cheapest.destination
          } instead to save ${formatCurrency(savings)}${breakdownText}`
        );
      }

      if (sorted.length > 3) {
        insights.push(
          `💸 Most Expensive: ${
            mostExpensive.destination
          } at ${formatCurrency(
            mostExpensive.total
          )} - ${formatCurrency(
            mostExpensive.total - cheapest.total
          )} more than ${cheapest.destination}`
        );
      }

      const cheapestFlight = sorted.reduce((a, b) =>
        a.flightCost < b.flightCost ? a : b
      );
      const cheapestAccom = sorted.reduce((a, b) =>
        a.breakdown.lodging < b.breakdown.lodging ? a : b
      );
      const cheapestFood = sorted.reduce((a, b) =>
        a.breakdown.food < b.breakdown.food ? a : b
      );

      insights.push(
        `✈️ Cheapest Flights: ${cheapestFlight.destination} (${formatCurrency(
          cheapestFlight.flightCost
        )})`
      );
      insights.push(
        `🏨 Best Accommodation Deals: ${
          cheapestAccom.destination
        } (${formatCurrency(cheapestAccom.breakdown.lodging)}/day)`
      );
      insights.push(
        `🍽️ Most Affordable Food: ${
          cheapestFood.destination
        } (${formatCurrency(cheapestFood.breakdown.food)}/day)`
      );
    }

    return insights;
  };

const computeVisaFee = (destination, travelers) => {
  const destCountry = extractCountry(destination).toLowerCase();
  let total = 0;
  
  travelers.forEach(traveler => {
    const nationality = Array.isArray(traveler.nationality) ? traveler.nationality[0]?.toLowerCase() : '';
    
    if (nationality === 'india') {
      if (destCountry.includes('usa') || destCountry.includes('united states')) total += 185;
      if (destCountry.includes('united kingdom') || destCountry.includes('uk')) total += 115;
      if (['france','germany','italy','spain'].some(c => destCountry.includes(c))) total += 80;
    }
  });
  
  return total;
};


  const handleSubmit = async (e) => {
  e?.preventDefault();
  setLoading(true);
  setShowInsights(false);

  const days = Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24)));

  // Your existing API calls
  let costsRes = [], flightsRes = [], visaRes = [];
  try { costsRes = await fetch("/api/costs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
          destinations: form.destinations.map((d) => d.value),
        }),
      })
        .then((r) => r.json())
        .catch(() => []);
    } catch {
      costsRes = [];
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
        .catch(() => []);
    } catch {
      flightsRes = [];
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
        .catch(() => []);
    } catch {
      visaRes = [];
    }

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
    const MID_COUNTRIES = [
      "Turkey",
      "Thailand",
      "Malaysia",
      "China",
      "Mexico",
      "Brazil",
      "South Africa",
      "Poland",
      "Portugal",
    ];

    const SCHENGEN = [
      "france",
      "germany",
      "italy",
      "spain",
      "portugal",
      "netherlands",
      "belgium",
      "sweden",
      "norway",
      "finland",
      "switzerland",
      "austria",
      "greece",
      "denmark",
      "iceland",
      "czech republic",
      "poland",
      "hungary",
      "luxembourg",
      "malta",
    ];
    const TURKEY_VISA_FREE = [
      "united states",
      "united kingdom",
      "germany",
      "france",
      "japan",
      "canada",
      "australia",
    ];

    const computeVisaFeeForTraveler = (destCountryRaw, traveler) => {
  const dest = (destCountryRaw || "").toLowerCase();
  const nationalities = (
    Array.isArray(traveler.nationality)
      ? traveler.nationality
      : [traveler.nationality]
  ).map((n) => (n || "").toLowerCase());
  const residencies = (
    Array.isArray(traveler.residency)
      ? traveler.residency
      : [traveler.residency]
  ).map((r) => (r || "").toLowerCase());

  // Treat ILR / PR / settlement as equivalent UK permanent status
  const hasUKPermanentStatus = (form.travelers[0]?.residency || []).some((r) =>
    r.includes("settlement") ||
    r.includes("ilr") ||
    r.includes("indefinite leave to remain") ||
    r.includes("permanent residence") ||
    r.includes("pr")
  );

  if (nationalities.includes(dest)) return 0;

  if (SCHENGEN.includes(dest)) {
    if (
      residencies.some((r) => r.includes("schengen")) ||
      residencies.some((r) => r.includes("eu pr")) ||
      nationalities.some((n) => SCHENGEN.includes(n))
    )
      return 0;
    return 105.62;
  }

  if (dest === "turkey" || dest.includes("turkey")) {
    if (nationalities.some((n) => TURKEY_VISA_FREE.includes(n))) return 0;
    return 50;
  }

  if (
    dest === "united states" ||
    dest === "usa" ||
    dest === "united states of america" ||
    dest.includes("hawaii")
  ) {
    if (
      nationalities.includes("united states") ||
      residencies.some((r) => r.includes("green card"))
    )
      return 0;
    return 160;
  }

  // Example: if you ever add UK-destination-specific logic, you can reuse hasUKPermanentStatus there
  // if (dest === "united kingdom" || dest.includes("uk")) {
  //   if (nationalities.includes("united kingdom") || hasUKPermanentStatus)
  //     return 0;
  //   return SOME_FEE;
  // }

  if (dest === "japan" || dest === "canada") {
    if (
      nationalities.includes("united states") ||
      nationalities.includes("canada") ||
      nationalities.includes("japan")
    )
      return 0;
    return 0;
  }

  return 0;
};


    const resolveCostTier = (destination) => {
      const city = String(destination || "").toLowerCase();
      const country = extractCountry(destination).toLowerCase();

      if (city.includes("new york")) return COST_TIERS.expensive;
      if (city.includes("tokyo")) return COST_TIERS.expensive;
      if (city.includes("singapore")) return COST_TIERS.expensive;
      if (
        city.includes("paris") ||
        city.includes("rome") ||
        city.includes("milan") ||
        city.includes("madrid") ||
        city.includes("barcelona")
      )
        return COST_TIERS.expensive;
      if (
        city.includes("london") ||
        city.includes("zurich") ||
        city.includes("geneva")
      )
        return COST_TIERS.expensive;

      if (
        city.includes("istanbul") ||
        city.includes("bangkok") ||
        city.includes("kuala") ||
        city.includes("dubai")
      )
        return COST_TIERS.mid;

      if (
        city.includes("delhi") ||
        city.includes("mumbai") ||
        city.includes("bangalore") ||
        city.includes("jakarta") ||
        city.includes("manila")
      )
        return COST_TIERS.cheap;

      if (
        EXPENSIVE_COUNTRIES.map((x) => x.toLowerCase()).includes(country)
      )
        return COST_TIERS.expensive;
      if (MID_COUNTRIES.map((x) => x.toLowerCase()).includes(country))
        return COST_TIERS.mid;
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

      const destCountry = extractCountry(d.value);
      const visaFee =
        (visaRes && visaRes[i]) ||
        form.travelers.reduce(
          (sum, t) => sum + computeVisaFeeForTraveler(destCountry, t),
          0
        );
      const flightCost = Number(
        flightsRes?.[i]?.price ??
          flightsRes?.[i]?.cost ??
          (form.origin ? 450 : 500)
      );

      const tripDaily =
        (Number(breakdown.lodging || 0) +
          Number(breakdown.food || 0) +
          Number(breakdown.transport || 0) +
          Number(breakdown.misc || 0)) *
        days;
      const total = Math.round(
        flightCost + tripDaily + Number(visaFee || 0)
      );

      return {
        destination: d.value,
        breakdown,
        visaFee: Number(visaFee || 0),
        flightCost,
        total,
      };
    });

    // ✅ Perplexity AI + fallback
// ✅ Concise Perplexity AI (replace your try block)
try {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{
        role: 'user', 
        content: `From ${JSON.stringify(built.slice(0,3))}, pick BEST destination. ONE sentence: "Choose [city] ($X) over [next] - saves $Y on [factor]." Max 80 chars.`
      }],
      max_tokens: 100  // Force brevity
    })
  });
  const data = await res.json();
  setAiInsights([data.choices[0].message.content]);
} catch {
  setAiInsights(generateDetailedInsights(built, days));
}


setResults(built);
setLoading(false);
setTimeout(() => setShowInsights(true), 300);

  };

  return (
    <Page>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0.5rem" }}>
        <TopHeader
          title="Trips Genie - AI"
          subtitle="Destination total cost estimator. Turn your travel wishes into budget-smart itineraries."
        />

        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-3"><div className="w-full overflow-x-auto"><div
  style={{
    display: "flex",
    flexDirection: "row",
    gap: "0.1rem",
    width: "100%",
    flexWrap: "nowrap",
  }}><div style={{ flex: 1, minWidth: 0 }}>
    <label className="text-xs font-semibold block mb-1">Start Date </label>
    <input
      type="date"
      value={form.startDate}
      onChange={(e) =>
        setForm((p) => ({ ...p, startDate: e.target.value }))
      }
      className="w-full p-2 border rounded-lg text-sm"
      required
    />
  </div><div style={{ flex: 1, minWidth: 0 }}>
    <label className="text-xs font-semibold block mb-1">End Date </label>
    <input
      type="date"
      value={form.endDate}
      onChange={(e) =>
        setForm((p) => ({ ...p, endDate: e.target.value }))
      }
      className="w-full p-2 border rounded-lg text-sm"
      required
    />
  </div>
</div>

</div>



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

            <div>
              <label className="text-xs font-semibold block mb-1">
                Destinations
              </label>
              <AsyncCreatableSelect
  isMulti
  defaultOptions={FALLBACK_CITIES.map((x) => ({ label: x, value: x }))}
  loadOptions={loadSimpleOptions(FALLBACK_CITIES)}
  value={form.destinations}
  onChange={(v) => setForm((p) => ({ ...p, destinations: v || [] }))}
  placeholder="Start typing a city, or add your own like “Oslo, Norway”"
  formatCreateLabel={(input) => `Add destination: ${input} (City, Country)`}
  noOptionsMessage={({ inputValue }) =>
    inputValue
      ? `No matches. Press Enter to add “${inputValue}” as City, Country.`
      : "Type a destination or create your own (City, Country)."
  }
  styles={selectStyles}
 />

            </div>

            {form.travelers.map((t, i) => (
              <div
                key={i}
                className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-white bg-opacity-40 rounded-lg"
              >
                {/*<div>
                  <label className="text-xs font-semibold block mb-1">
                    Name
                  </label>
                  <input
                    value={t.name}
                    onChange={(e) =>
                      updateTraveler(i, "name", e.target.value)
                    }
                    className="w-full p-1.5 border rounded text-sm"
                  />
                </div>*/}

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Citizenship
                  </label>
                  <AsyncCreatableSelect
  isMulti
  defaultOptions={NATIONALITY_LIST.map((n) => ({ label: n, value: n }))}
  loadOptions={loadSimpleOptions(NATIONALITY_LIST)}
  value={
    Array.isArray(t.nationality)
      ? t.nationality.map((n) => ({ label: n, value: n }))
      : []
  }
  onChange={(o) =>
    updateTraveler(i, "nationality", o ? o.map((x) => x.value) : [])
  }
  placeholder="Start typing a passport country (e.g. India, United Kingdom)"
  formatCreateLabel={(input) => `Add citizenship: ${input}`}
  noOptionsMessage={({ inputValue }) =>
    inputValue
      ? `No match. Press Enter to add “${inputValue}” as a citizenship.`
      : "Type or add a citizenship (country name)."
  }
  styles={selectStyles}
/>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Visa / Residency
                  </label>
                  <AsyncCreatableSelect
  isMulti
  defaultOptions={RESIDENCY_LIST.map((r) => ({ label: r, value: r }))}
  loadOptions={loadSimpleOptions(RESIDENCY_LIST)}
  value={
    Array.isArray(t.residency)
      ? t.residency.map((n) => ({ label: n, value: n }))
      : []
  }
  onChange={(o) =>
    updateTraveler(i, "residency", o ? o.map((x) => x.value) : [])
  }
  placeholder="e.g. Schengen Visa, UK ILR / PR, US Green Card"
  formatCreateLabel={(input) => `Add residency/visa: ${input}`}
  noOptionsMessage={({ inputValue }) =>
    inputValue
      ? `No match. Add your exact status, e.g. “${inputValue} (ILR / PR / visa type)”.`
      : "Type or add any visa or residency status (PR, ILR, long-term visa, etc.)."
  }
  styles={selectStyles}
/>
                </div>

                {/*<div>
                  <label className="text-xs font-semibold block mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={t.age}
                    onChange={(e) =>
                      updateTraveler(i, "age", e.target.value)
                    }
                    className="w-full p-1.5 border rounded text-sm"
                  />
                </div>
*/}
              </div>
            ))}

            <div className="flex gap-2">
  {/*

              <button
                type="button"
                onClick={addTraveler}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium"
              >
                + Add Traveler
              </button>
  */}

              <CTAButton
                type="submit"
                className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-sky-400
                  text-slate-950 text-sm font-extrabold tracking-wide
                  shadow-lg shadow-fuchsia-900/60
                  hover:brightness-110 hover:shadow-xl
                  transition transform hover:-translate-y-0.5 flex-1"
              >
                {loading ? "Analyzing..." : "FIND BEST TRIPS"}
              </CTAButton>
            </div>
          </form>
        </GlassCard>

        {showInsights && aiInsights.length > 0 && (
          <GlassCard>
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))",
                borderRadius: "0.75rem",
                padding: "1rem",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                <span>🤖</span>
                <span>AI Travel Insights</span>
              </h3>
              <div className="space-y-3">
                {aiInsights.map((insight, i) => (
                  <div
                    key={i}
                    className="text-sm leading-relaxed"
                    style={{
                      padding: "0.75rem",
                      background: "rgba(255, 255, 255, 0.5)",
                      borderRadius: "0.5rem",
                      borderLeft: "3px solid rgba(139, 92, 246, 0.6)",
                    }}
                  >
                    <TypingText text={insight} speed={20} />
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}

        {results.length > 0 && (
          <GlassCard>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full border text-xs">
                <thead className="bg-slate-100 bg-opacity-80">
                  <tr>
                    <th className="p-1.5">Destination</th>
                    <th className="p-1.5">Flight</th>
                    <th className="p-1.5">Lodging</th>
                    <th className="p-1.5">Food</th>
                    <th className="p-1.5">Transport</th>
                    <th className="p-1.5">Misc</th>
                    <th className="p-1.5">Visa</th>
                    <th className="p-1.5">Total</th>
                    <th className="p-1.5">Book</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-1.5">{r.destination}</td>
                      <td className="p-1.5 text-right">
                        {formatCurrency(r.flightCost)}
                      </td>
                      <td className="p-1.5 text-right">
                        {formatCurrency(r.breakdown?.lodging || 0)}
                      </td>
                      <td className="p-1.5 text-right">
                        {formatCurrency(r.breakdown?.food || 0)}
                      </td>
                      <td className="p-1.5 text-right">
                        {formatCurrency(r.breakdown?.transport || 0)}
                      </td>
                      <td className="p-1.5 text-right">
                        {formatCurrency(r.breakdown?.misc || 0)}
                      </td>
                      <td className="p-1.5 text-right">
                        {formatCurrency(r.visaFee)}
                      </td>
                      <td className="p-1.5 text-right font-bold">
                        {formatCurrency(r.total)}
                      </td>
                      <td className="p-1.5 text-center">
                        <a
                          href={`https://www.kayak.com/flights/${
                            form.origin || "NYC"
                          }/${encodeURIComponent(
                            r.destination.split(",")[0]
                          )}/${form.startDate}/${form.endDate}?affiliate=tripsgenie`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 font-semibold text-xs"
                        >
                          Book
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>
    </Page>
  );
}
