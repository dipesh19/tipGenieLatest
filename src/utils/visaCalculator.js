const SCHENGEN = [
  "france", "germany", "italy", "spain", "portugal",
  "netherlands", "belgium", "sweden", "norway", "finland",
  "switzerland", "austria", "greece", "denmark", "iceland",
  "czech republic", "poland", "hungary", "luxembourg", "malta",
];

const TURKEY_VISA_FREE = [
  "united states", "united kingdom", "germany",
  "france", "japan", "canada", "australia",
];

export const computeVisaFeeForTraveler = (destCountryRaw, traveler) => {
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
