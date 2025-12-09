import React from "react";

const GlassCard = ({ children }) => (
  <div
    style={{
      background: "rgba(15, 23, 42, 0.14)",
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: "1.25rem",
      padding: "1.25rem",
      boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
      marginBottom: "1rem",
      display: "flex",
      gap: "1.25rem",
      alignItems: "flex-start",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      color: "#f9fafb",
    }}
  >
    <div style={{ flex: 1 }}>{children}</div>

    <div
      style={{
        width: "150px",
        height: "224px",
        border: "1px solid #94a3b8",
        borderRadius: "3px",
        overflow: "hidden",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      <img
        src="/TripGirl2.jpeg"
        alt="Traveler illustration"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  </div>
);

export default GlassCard;
