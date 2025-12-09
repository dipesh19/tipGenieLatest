import React from "react";
import { formatCurrency } from "../../utils/formatters";

const ResultsTable = ({ results, origin, startDate, endDate }) => {
  if (!results || results.length === 0) return null;

  return (
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
                  href={`https://www.kayak.com/flights/${origin || "London"}/${encodeURIComponent(
                    r.destination.split(",")[0]
                  )}/${startDate}/${endDate}?affiliate=tripsgenie`}
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
  );
};

export default ResultsTable;
