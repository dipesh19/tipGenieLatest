import React from "react";

const CTAButton = ({ children, className = "", ...props }) => (
  <button {...props} className={`px-6 py-3 rounded-xl font-bold ${className}`}>
    {children}
  </button>
);

export default CTAButton;
