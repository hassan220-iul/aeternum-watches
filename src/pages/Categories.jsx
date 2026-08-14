import { Link } from 'react-router-dom';
import { categories } from '../data/mockProducts';

export default function Categories() {
  return (
    <div className="section container">
      <p className="eyebrow">Browse</p>
      <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 2.5rem' }}>Categories</h1>
      <div className="tile-grid">
        {categories.map((c) => (
          <Link key={c.slug} to={`/shop?category=${c.slug}`} className="tile card-glass">
            <h3>{c.name}</h3>
            <span>Shop {c.name} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
