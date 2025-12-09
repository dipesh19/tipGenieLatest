import React from "react";
import TypingText from "../TypingText";

const AIInsights = ({ aiInsights }) => {
  if (!aiInsights || aiInsights.length === 0) return null;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))",
        borderRadius: "0.75rem",
        padding: "1rem",
        border: "1px solid rgba(139, 92, 246, 0.2)",
      }}
    >
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <span>🤖</span> AI Travel Insights
      </h3>
      {aiInsights.map((insight, i) => (
        <div
          key={i}
          className="text-sm leading-relaxed"
          style={{
            padding: "0.75rem",
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "0.5rem",
            borderLeft: "3px solid rgba(139, 92, 246, 0.6)",
            color: "#111827",
          }}
        >
          <TypingText text={insight} speed={20} />
        </div>
      ))}
    </div>
  );
};

export default AIInsights;
