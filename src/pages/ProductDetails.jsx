import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WatchViewer from '../components/three/WatchViewer';
import WatchIllustration from '../components/common/WatchIllustration';
import ProductCard from '../components/common/ProductCard';
import { fetchProductBySlug, fetchProducts } from '../services/productsService';
import { fetchReviews, fetchUserReview, submitReview } from '../services/reviewsService';
import { formatCurrency } from '../utils/formatCurrency';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { fadeUp } from '../animations/variants';

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [view3d, setView3d] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewBody, setReviewBody] = useState('');
  const [hoverStar, setHoverStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    fetchProductBySlug(slug).then((p) => {
      setProduct(p);
      if (p) fetchProducts({ collection: p.collection }).then((all) => setRelated(all.filter((x) => x.slug !== slug)));
    });
  }, [slug]);

  async function reloadReviews(productId) {
    setReviews(await fetchReviews(productId));
    if (user) {
      const mine = await fetchUserReview(productId, user.id);
      setMyReview(mine);
      if (mine) {
        setReviewRating(mine.rating);
        setReviewBody(mine.body || '');
      }
    }
  }

  useEffect(() => {
    if (product) reloadReviews(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, user?.id]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    setReviewError('');
    if (reviewRating < 1) {
      setReviewError('Pick a star rating first.');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview(product.id, user.id, reviewRating, reviewBody.trim());
      await reloadReviews(product.id);
      // Re-fetch the product so the header rating/review count reflect the new average.
      fetchProductBySlug(slug).then(setProduct);
    } catch (err) {
      setReviewError(err.message || 'Could not submit your review.');
    } finally {
      setSubmittingReview(false);
    }
  }

  // Track recently viewed products locally.
  useEffect(() => {
    if (!product) return;
    try {
      const stored = JSON.parse(localStorage.getItem('aeternum_recently_viewed') || '[]');
      const next = [product.slug, ...stored.filter((s) => s !== product.slug)].slice(0, 8);
      localStorage.setItem('aeternum_recently_viewed', JSON.stringify(next));
    } catch { /* non-critical */ }
  }, [product]);

  if (!product) {
    return <div className="container section"><p>Loading watch details…</p></div>;
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard?.writeText(url);
    }
  }

  return (
    <div className="section product-details">
      <div className="container product-details__grid">
        <div>
          <div className="product-details__toggle">
            <button className={!view3d ? 'is-active' : ''} onClick={() => setView3d(false)}>Gallery</button>
            <button className={view3d ? 'is-active' : ''} onClick={() => setView3d(true)}>3D View</button>
          </div>
          {view3d ? (
            <WatchViewer accent="#D4AF37" modelUrl={product.model_url || null} />
          ) : (
            <div className="product-details__media">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <WatchIllustration />
              )}
            </div>
          )}
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <p className="eyebrow">{product.collection}</p>
          <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 1rem' }}>{product.name}</h1>
          <p className="product-details__rating">★ {product.rating} · {product.reviewCount} reviews</p>
          <p className="product-details__price">{formatCurrency(product.price, product.currency)}</p>
          <p className="product-details__desc">{product.description}</p>

          <div className="product-details__qty">
            <label htmlFor="qty">Quantity</label>
            <select id="qty" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
              {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="product-details__actions">
            <button
              className="btn btn-solid"
              onClick={() => { addItem(product, quantity); setAdded(true); setTimeout(() => setAdded(false), 1800); }}
            >
              <span>{added ? 'Added to Cart ✓' : 'Add to Cart'}</span>
            </button>
            <button className="btn btn-ghost" onClick={() => toggleWishlist(product)}>
              <span>{isWishlisted(product.id) ? 'In Wishlist ♥' : 'Add to Wishlist ♡'}</span>
            </button>
            <button className="btn btn-ghost" onClick={handleShare} aria-label="Share this product">
              <span>Share</span>
            </button>
          </div>

          <dl className="product-details__specs">
            <div><dt>Movement</dt><dd>{product.movement}</dd></div>
            <div><dt>Case</dt><dd>{product.caseMaterial}</dd></div>
            <div><dt>Water Resistance</dt><dd>{product.waterResistance}</dd></div>
            <div><dt>Warranty</dt><dd>{product.warranty}</dd></div>
          </dl>

          <div className="product-details__shipping">
            <p>Free White Glove Delivery · Fitted at your address</p>
            <p>Ships with signed Certificate of Authenticity</p>
          </div>
        </motion.div>
      </div>

      <div className="container">
        <h2 className="product-details__section-title">Reviews</h2>

        <div className="reviews" style={{ marginBottom: '2rem' }}>
          {reviews.length === 0 ? (
            <p style={{ color: 'rgba(245,242,234,0.55)' }}>No reviews yet — be the first to share your thoughts.</p>
          ) : reviews.map((r) => (
            <ReviewPreview
              key={r.id}
              name={r.profiles?.full_name || 'Verified Buyer'}
              rating={r.rating}
              text={r.body}
            />
          ))}
        </div>

        {user ? (
          <form onSubmit={handleSubmitReview} className="card-glass" style={{ padding: '1.5rem', maxWidth: 520 }}>
            <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
              {myReview ? 'Edit Your Review' : 'Leave a Review'}
            </p>
            <StarPicker
              value={hoverStar || reviewRating}
              onHover={setHoverStar}
              onLeave={() => setHoverStar(0)}
              onSelect={setReviewRating}
            />
            <textarea
              rows={3}
              placeholder="What did you think of this watch?"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              style={{ width: '100%', margin: '1rem 0', background: '#121212', border: '1px solid rgba(255,255,255,0.15)', color: '#f5f2ea', padding: '0.65rem 0.85rem', fontFamily: 'inherit' }}
            />
            {reviewError && <p className="cart-summary__error" style={{ marginBottom: '0.75rem' }}>{reviewError}</p>}
            <button type="submit" className="btn btn-solid" disabled={submittingReview}>
              <span>{submittingReview ? 'Saving…' : myReview ? 'Update Review' : 'Submit Review'}</span>
            </button>
          </form>
        ) : (
          <p style={{ color: 'rgba(245,242,234,0.6)' }}>
            <Link to="/login">Sign in</Link> to leave a review and star rating.
          </p>
        )}
      </div>

      {related.length > 0 && (
        <div className="container">
          <h2 className="product-details__section-title">You may also like</h2>
          <div className="product-grid">
            {related.slice(0, 3).map((p, i) => <ProductCard key={p.id} product={p} variantIndex={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewPreview({ name, rating, text }) {
  return (
    <div className="review card-glass">
      <p className="review__rating">{'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}</p>
      {text && <p className="review__text">{text}</p>}
      <p className="review__name">{name}</p>
    </div>
  );
}

function StarPicker({ value, onHover, onLeave, onSelect }) {
  return (
    <div onMouseLeave={onLeave} style={{ display: 'inline-flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => onHover(n)}
          onClick={() => onSelect(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: '1.6rem', lineHeight: 1, color: n <= value ? '#d4af37' : 'rgba(245,242,234,0.25)',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
