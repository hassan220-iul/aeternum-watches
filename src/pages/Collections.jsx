import { Link } from 'react-router-dom';
import { collections } from '../data/mockProducts';

export default function Collections() {
  return (
    <div className="section container">
      <p className="eyebrow">Curated</p>
      <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 2.5rem' }}>Collections</h1>
      <div className="tile-grid">
        {collections.map((c) => (
          <Link key={c.slug} to={`/shop?collection=${c.slug}`} className="tile card-glass">
            <h3>{c.name}</h3>
            <p>{c.tagline}</p>
            <span>Explore →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
