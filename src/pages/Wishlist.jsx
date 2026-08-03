import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const { items } = useWishlist();

  return (
    <div className="section container">
      <p className="eyebrow">Saved</p>
      <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 2.5rem' }}>Your Wishlist</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Nothing saved yet.</p>
          <Link to="/shop" className="btn btn-solid"><span>Browse the Collection</span></Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((p, i) => <ProductCard key={p.id} product={p} variantIndex={i} />)}
        </div>
      )}
    </div>
  );
}
