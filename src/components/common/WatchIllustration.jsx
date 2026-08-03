// Stand-in illustration for real product photography. Swap ProductCard /
// Gallery to render `product.image_url` (populated from Supabase Storage)
// once real photography is uploaded — see DEPLOYMENT_GUIDE.md.

export default function WatchIllustration({ variant = 0, className = '' }) {
  const accent = ['#D4AF37', '#C0C0C0', '#D4AF37', '#8f8f8f'][variant % 4];
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Watch illustration placeholder">
      <rect width="400" height="400" fill="#0d0d0d" />
      <circle cx="200" cy="200" r="120" fill="none" stroke={accent} strokeWidth="3" />
      <circle cx="200" cy="200" r="105" fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="1" />
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1="200" y1="98" x2="200" y2="112"
          stroke={accent}
          strokeWidth="2"
          transform={`rotate(${i * 30} 200 200)`}
        />
      ))}
      <line x1="200" y1="200" x2="200" y2="140" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <line x1="200" y1="200" x2="245" y2="200" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="200" cy="200" r="4" fill={accent} />
      <rect x="185" y="60" width="30" height="24" rx="3" fill="none" stroke={accent} strokeWidth="2" />
      <rect x="185" y="316" width="30" height="24" rx="3" fill="none" stroke={accent} strokeWidth="2" />
    </svg>
  );
}
