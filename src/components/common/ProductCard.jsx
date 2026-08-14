import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WatchIllustration from './WatchIllustration';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import './product-card.css';

export default function ProductCard({ product, variantIndex = 0 }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [justAdded, setJustAdded] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addItem } = useCart();

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  }
  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  function handleAddToCart(e) {
    e.preventDefault();
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <motion.article
      ref={cardRef}
      className="product-card card-glass"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      {product.isLimited && <span className="product-card__tag">Limited</span>}
      {product.isNew && !product.isLimited && <span className="product-card__tag product-card__tag--new">New</span>}

      <button
        className="product-card__wish"
        onClick={() => toggleWishlist(product)}
        aria-pressed={isWishlisted(product.id)}
        aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {isWishlisted(product.id) ? '♥' : '♡'}
      </button>

      <Link to={`/product/${product.slug}`} className="product-card__media">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <WatchIllustration variant={variantIndex} />
        )}
      </Link>

      <div className="product-card__body">
        <p className="product-card__collection">{product.collection}</p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="product-card__name">{product.name}</h3>
        </Link>
        <p className="product-card__price">{formatCurrency(product.price, product.currency)}</p>

        <button className={`btn btn-ghost product-card__cta ${justAdded ? 'is-added' : ''}`} onClick={handleAddToCart}>
          <span>{justAdded ? 'Added ✓' : 'Add to Cart'}</span>
        </button>
      </div>
    </motion.article>
  );
}
