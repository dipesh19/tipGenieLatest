import React from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { FALLBACK_CITIES, SELECT_STYLES } from "../../constants/travelData";

const loadSimpleOptions = (list) => async (input) => {
  const q = (input || "").toLowerCase();
  return list
    .filter((x) => x.toLowerCase().includes(q))
    .map((x) => ({ label: x, value: x }));
};

const DestinationSelect = ({ form, setForm }) => (
  <div>
    <label className="text-xs font-semibold block mb-1">Destinations</label>
    <AsyncCreatableSelect
      isMulti
      defaultOptions={FALLBACK_CITIES.map((x) => ({ label: x, value: x }))}
      loadOptions={loadSimpleOptions(FALLBACK_CITIES)}
      value={form.destinations}
      onChange={(v) => setForm((p) => ({ ...p, destinations: v || [] }))}
      placeholder="Start typing a city, or add your own like Oslo, Norway"
      formatCreateLabel={(input) => `Add destination "${input}"`}
      noOptionsMessage={({ inputValue }) =>
        inputValue
          ? `No matches. Press Enter to add "${inputValue}" as City, Country.`
          : "Type a destination or create your own City, Country."
      }
      styles={SELECT_STYLES}
    />
  </div>
);

export default DestinationSelect;
