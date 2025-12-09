import React from "react";

const Page = ({ children }) => (
  <div
    className="tp-page"
    style={{
      position: "relative",
      minHeight: "100vh",
      backgroundColor: "#0b0b12",
    }}
  >
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "url(/SeaMtn.jpeg)",
        backgroundPosition: "center",
        opacity: 1,
        filter: "brightness(1.1) contrast(1.5)",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(to bottom, rgba(5,5,10,0.15), rgba(5,5,10,0.4))",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
    <main
      className="tp-main"
      style={{
        position: "relative",
        zIndex: 1,
        paddingTop: "3rem",
        paddingBottom: "3rem",
      }}
    >
      {children}
    </main>
  </div>
);

export default Page;
