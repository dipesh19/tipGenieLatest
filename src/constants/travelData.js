export const FALLBACK_CITIES = [
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

export const NATIONALITY_LIST = [
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

export const RESIDENCY_LIST = [
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

export const SELECT_STYLES = {
  control: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    borderRadius: "0.75rem",
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#fbbf24" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(251,191,36,0.55)" : "none",
  }),
  menu: (base) => ({
    ...base,
    fontSize: "0.875rem",
    backgroundColor: "#0f172a",
    color: "#f9fafb",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "rgba(251,191,36,0.25)" : "transparent",
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
