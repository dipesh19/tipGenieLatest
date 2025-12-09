import React from "react";

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

export default TopHeader;
