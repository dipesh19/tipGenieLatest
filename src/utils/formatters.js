export const formatCurrency = (n) =>
  n == null || n === "" ? "-" : `$${Number(n).toFixed(2)}`;

export const extractCountry = (label = "") => {
  const parts = String(label).split(",");
  return parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
};
