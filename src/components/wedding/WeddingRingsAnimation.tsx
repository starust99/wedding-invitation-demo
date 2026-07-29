export function WeddingRingsAnimation() {
  return (
    <svg
      aria-hidden="true"
      className="wedding-rings-animation h-full w-full"
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1bd" />
          <stop offset="0.42" stopColor="#d8ad5e" />
          <stop offset="0.72" stopColor="#fff0b2" />
          <stop offset="1" stopColor="#a8752e" />
        </linearGradient>
        <filter id="ring-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" floodColor="#7d5521" floodOpacity=".22" stdDeviation="2.5" />
        </filter>
      </defs>

      <g className="wedding-ring wedding-ring--left" filter="url(#ring-shadow)">
        <ellipse cx="67" cy="83" rx="24" ry="42" fill="none" stroke="url(#ring-gold)" strokeWidth="10" />
        <ellipse cx="67" cy="83" rx="18" ry="35" fill="none" stroke="#fff4c9" strokeOpacity=".45" strokeWidth="1.5" />
      </g>
      <g className="wedding-ring wedding-ring--right" filter="url(#ring-shadow)">
        <ellipse cx="93" cy="77" rx="24" ry="42" fill="none" stroke="url(#ring-gold)" strokeWidth="10" />
        <ellipse cx="93" cy="77" rx="18" ry="35" fill="none" stroke="#fff4c9" strokeOpacity=".45" strokeWidth="1.5" />
        <path d="M72 44 78 34 88 31 98 35 103 45 94 51 82 50Z" fill="#fff9e8" stroke="#c99643" strokeWidth="2" />
        <path d="m78 35 5 15m15-14-5 14M88 31l1 19" fill="none" stroke="#d9b56f" strokeWidth="1" />
      </g>
      <path className="wedding-rings-sparkle" d="M122 42q0 9 9 9-9 0-9 9 0-9-9-9 9 0 9-9Z" fill="#e1b85f" />
      <path className="wedding-rings-sparkle wedding-rings-sparkle--small" d="M39 54q0 6 6 6-6 0-6 6 0-6-6-6 6 0 6-6Z" fill="#f1d58d" />
    </svg>
  );
}
