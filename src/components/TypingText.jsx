import React, { useState, useEffect } from "react";

const TypingText = ({ text, speed = 30 }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      setCurrentIndex(0);
      return;
    }
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <span>
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
};

export default TypingText;
