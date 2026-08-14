import { useEffect, useState } from 'react';

export default function ScrollProgressDial() {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? window.scrollY / scrollable : 0;
      setAngle(pct * 360);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="scroll-dial" aria-hidden="true">
      <svg width="46" height="46" viewBox="0 0 46 46">
        <circle cx="23" cy="23" r="20" fill="none" stroke="rgba(212,175,55,0.25)" strokeWidth="1" />
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="23" y1="4" x2="23" y2="7"
            stroke="rgba(212,175,55,0.5)"
            strokeWidth="1"
            transform={`rotate(${i * 30} 23 23)`}
          />
        ))}
        <line
          x1="23" y1="23" x2="23" y2="8"
          stroke="#D4AF37"
          strokeWidth="1.4"
          strokeLinecap="round"
          transform={`rotate(${angle} 23 23)`}
          style={{ transition: 'transform 0.1s linear' }}
        />
        <circle cx="23" cy="23" r="2" fill="#D4AF37" />
      </svg>
    </div>
  );
}
