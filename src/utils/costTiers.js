import { extractCountry } from './formatters';

const COST_TIERS = {
  expensive: { lodging: 140, food: 75, transport: 35, misc: 25 },
  mid: { lodging: 85, food: 45, transport: 22, misc: 15 },
  cheap: { lodging: 45, food: 25, transport: 14, misc: 10 },
};

const EXPENSIVE_COUNTRIES = [
  "United States", "Canada", "Japan", "Singapore", "France",
  "Germany", "United Kingdom", "Italy", "Switzerland", "Australia",
];

const MID_COUNTRIES = [
  "Turkey", "Thailand", "Malaysia", "China", "Mexico",
  "Brazil", "South Africa", "Poland", "Portugal",
];

export const resolveCostTier = (destination) => {
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

  if (EXPENSIVE_COUNTRIES.map((x) => x.toLowerCase()).includes(country))
    return COST_TIERS.expensive;
  if (MID_COUNTRIES.map((x) => x.toLowerCase()).includes(country))
    return COST_TIERS.mid;
  return COST_TIERS.cheap;
};
