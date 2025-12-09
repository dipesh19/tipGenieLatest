import React from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import {
  NATIONALITY_LIST,
  RESIDENCY_LIST,
  SELECT_STYLES,
} from "../../constants/travelData";

const loadSimpleOptions = (list) => async (input) => {
  const q = (input || "").toLowerCase();
  return list
    .filter((x) => x.toLowerCase().includes(q))
    .map((x) => ({ label: x, value: x }));
};

const TravelerFields = ({ form, addTraveler, updateTraveler }) => (
  <>
    {form.travelers.map((t, i) => (
      <div
        key={i}
        className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-white bg-opacity-40 rounded-lg"
      >
        <div>
          <label className="text-xs font-semibold block mb-1">Name</label>
          <input
            value={t.name}
            onChange={(e) => updateTraveler(i, "name", e.target.value)}
            className="w-full p-1.5 border rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Citizenship</label>
          <AsyncCreatableSelect
            isMulti
            defaultOptions={NATIONALITY_LIST.map((n) => ({
              label: n,
              value: n,
            }))}
            loadOptions={loadSimpleOptions(NATIONALITY_LIST)}
            value={
              Array.isArray(t.nationality)
                ? t.nationality.map((n) => ({ label: n, value: n }))
                : []
            }
            onChange={(o) =>
              updateTraveler(
                i,
                "nationality",
                o ? o.map((x) => x.value) : []
              )
            }
            placeholder="Start typing a passport country e.g. India, United Kingdom"
            formatCreateLabel={(input) => `Add citizenship "${input}"`}
            noOptionsMessage={({ inputValue }) =>
              inputValue
                ? `No match. Press Enter to add "${inputValue}" as a citizenship.`
                : "Type or add a citizenship country name."
            }
            styles={SELECT_STYLES}
          />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">
            Visa Residency
          </label>
          <AsyncCreatableSelect
            isMulti
            defaultOptions={RESIDENCY_LIST.map((r) => ({
              label: r,
              value: r,
            }))}
            loadOptions={loadSimpleOptions(RESIDENCY_LIST)}
            value={
              Array.isArray(t.residency)
                ? t.residency.map((r) => ({ label: r, value: r }))
                : []
            }
            onChange={(o) =>
              updateTraveler(
                i,
                "residency",
                o ? o.map((x) => x.value) : []
              )
            }
            placeholder="e.g. Schengen Visa, UK ILR/PR, US Green Card"
            formatCreateLabel={(input) => `Add residency/visa "${input}"`}
            noOptionsMessage={({ inputValue }) =>
              inputValue
                ? `No match. Add your exact status, e.g. "${inputValue}" ILR/PR/visa type.`
                : "Type or add any visa or residency status."
            }
            styles={SELECT_STYLES}
          />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Age</label>
          <input
            type="number"
            value={t.age}
            onChange={(e) => updateTraveler(i, "age", e.target.value)}
            className="w-full p-1.5 border rounded text-sm"
          />
        </div>
      </div>
    ))}
    <button
      type="button"
      onClick={addTraveler}
      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium"
    >
      ➕ Add Traveler
    </button>
  </>
);

export default TravelerFields;
