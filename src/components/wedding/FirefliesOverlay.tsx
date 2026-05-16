"use client";

import { useMemo } from "react";

export function FirefliesOverlay({ active }: { active: boolean }) {
  const fireflies = useMemo(() => [
    { top: '81%', left: '12%', color: '#38bdf8', delay: '0s', size: '5px' },
    { top: '86%', left: '32%', color: '#f472b6', delay: '1.2s', size: '6px' },
    { top: '75%', left: '55%', color: '#38bdf8', delay: '0.5s', size: '4px' },
    { top: '65%', left: '72%', color: '#f472b6', delay: '2.1s', size: '5px' },
    { top: '78%', left: '88%', color: '#38bdf8', delay: '1.5s', size: '5px' },
    { top: '55%', left: '25%', color: '#f472b6', delay: '0.8s', size: '4px' },
    { top: '68%', left: '42%', color: '#38bdf8', delay: '2.5s', size: '6px' },
    { top: '92%', left: '60%', color: '#f472b6', delay: '1.8s', size: '5px' },
    { top: '88%', left: '80%', color: '#38bdf8', delay: '0.2s', size: '6px' },
    { top: '95%', left: '40%', color: '#38bdf8', delay: '1.1s', size: '5px' },
    { top: '60%', left: '15%', color: '#f472b6', delay: '2.8s', size: '4px' },
    { top: '72%', left: '65%', color: '#38bdf8', delay: '0.7s', size: '5px' },
    { top: '85%', left: '20%', color: '#f472b6', delay: '2.3s', size: '4px' },
    { top: '79%', left: '45%', color: '#38bdf8', delay: '0.9s', size: '5px' },
    { top: '70%', left: '85%', color: '#f472b6', delay: '1.6s', size: '4px' },
  ], []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes firefly-glow {
          0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(0.6); box-shadow: 0 0 2px 0px currentColor; }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); box-shadow: 0 0 10px 3px currentColor; }
        }
        .firefly-dot {
          position: absolute;
          border-radius: 50%;
          background-color: currentColor;
          animation: firefly-glow 3s infinite ease-in-out;
          pointer-events: none;
        }
      `}} />
      <div 
        className={`absolute inset-0 z-[6] pointer-events-none transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}
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
              animationDuration: `${2.5 + (i % 2)}s`
            }}
          />
        ))}
      </div>
    </>
  );
}
