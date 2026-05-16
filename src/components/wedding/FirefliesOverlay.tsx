"use client";

import { useMemo } from "react";

export function FirefliesOverlay({ active }: { active: boolean }) {
  const fireflies = useMemo(() => [
    { top: '81%', left: '12%', color: '#38bdf8', delay: '0s', size: '4px' },
    { top: '86%', left: '32%', color: '#f472b6', delay: '2.5s', size: '5px' },
    { top: '75%', left: '55%', color: '#38bdf8', delay: '1.2s', size: '3px' },
    { top: '65%', left: '72%', color: '#f472b6', delay: '4.1s', size: '4px' },
    { top: '78%', left: '88%', color: '#38bdf8', delay: '2.8s', size: '4px' },
    { top: '55%', left: '25%', color: '#f472b6', delay: '1.5s', size: '3px' },
    { top: '68%', left: '42%', color: '#38bdf8', delay: '5.2s', size: '5px' },
    { top: '92%', left: '60%', color: '#f472b6', delay: '3.3s', size: '4px' },
  ], []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes firefly-glow {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); box-shadow: 0 0 1px 0px currentColor; }
          50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.1); box-shadow: 0 0 6px 2px currentColor; }
        }
        .firefly-dot {
          position: absolute;
          border-radius: 50%;
          background-color: currentColor;
          animation: firefly-glow 6s infinite ease-in-out;
          pointer-events: none;
        }
      `}} />
      <div 
        className={`absolute inset-0 z-[6] pointer-events-none transition-opacity duration-[2000ms] ${active ? 'opacity-100' : 'opacity-0'}`}
      >
        {fireflies.map((ff, i) => (
          <div
            key={i}
            className="firefly-dot"
            style={{
              top: ff.top,
              left: ff.left,
              width: ff.size,
              height: ff.size,
              color: ff.color,
              animationDelay: ff.delay,
              animationDuration: `${5.5 + (i % 3) * 1.5}s`
            }}
          />
        ))}
      </div>
    </>
  );
}
