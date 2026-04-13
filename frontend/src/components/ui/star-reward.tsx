"use client";

import { useEffect, useState } from "react";

export function StarReward() {
  const [stars, setStars] = useState<
    { x: number; y: number; delay: number }[]
  >([]);

  useEffect(() => {
    const s = Array.from({ length: 8 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setStars(s);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      aria-live="polite"
      aria-label="Ótimo trabalho! Você ganhou uma estrela!"
      role="status"
    >
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute text-4xl animate-bounce"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.delay}s`,
          }}
        >
          ⭐
        </div>
      ))}
      <div className="text-6xl animate-pulse">🎉</div>
    </div>
  );
}