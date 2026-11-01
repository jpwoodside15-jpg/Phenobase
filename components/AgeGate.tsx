"use client";

import { useEffect, useState } from "react";

export default function AgeGate() {
  const [isAdult, setIsAdult] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("phenobase-age-gate");
    setIsAdult(stored === "accepted");
  }, []);

  if (isAdult) {
    return null;
  }

  return (
    <div className="age-gate-overlay">
      <div className="age-gate-card">
        <h2>Adult content</h2>
        <p>
          This site contains information about cannabis genetics and related culture.
          You must be 21+ to continue.
        </p>
        <button onClick={() => {
          window.localStorage.setItem("phenobase-age-gate", "accepted");
          setIsAdult(true);
        }}>
          I am 21+
        </button>
      </div>
    </div>
  );
}
