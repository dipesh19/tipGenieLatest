import React from "react";

const DateFields = ({ form, setForm }) => (
  <div className="w-full overflow-x-auto">
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "0.1rem",
        width: "100%",
        flexWrap: "nowrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <label className="text-xs font-semibold block mb-1">Start Date</label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) =>
            setForm((p) => ({ ...p, startDate: e.target.value }))
          }
          className="w-full p-2 border rounded-lg text-sm"
          required
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label className="text-xs font-semibold block mb-1">End Date</label>
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
);

export default DateFields;
