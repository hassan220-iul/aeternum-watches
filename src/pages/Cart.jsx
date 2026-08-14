import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatCurrency';
import { validateCoupon } from '../services/discountsService';
import WatchIllustration from '../components/common/WatchIllustration';

export default function Cart() {
  const { items, subtotal, discount, total, coupon, updateQuantity, removeItem, applyCoupon, clearCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  async function applyCouponCode() {
    const code = couponInput.trim();
    if (!code) return;
    setChecking(true);
    setCouponError('');
    try {
      const result = await validateCoupon(code);
      if (result) {
        applyCoupon(result.code, result.percent_off);
        setCouponInput('');
      } else {
        setCouponError('That code isn\u2019t valid or has expired.');
      }
    } catch {
      setCouponError('Could not check that code — try again.');
    } finally {
      setChecking(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="section container empty-state">
        <p>Your cart is empty.</p>
        <Link to="/shop" className="btn btn-solid"><span>Browse the Collection</span></Link>
      </div>
    );
  }

  return (
    <div className="section container cart-page">
      <h1 style={{ fontSize: 'var(--fs-h1)', marginBottom: '2.5rem' }}>Your Cart</h1>
      <div className="cart-page__grid">
        <ul className="cart-items">
          {items.map((item) => (
            <li key={item.id} className="cart-item">
              <div className="cart-item__media">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <WatchIllustration />
                )}
              </div>
              <div className="cart-item__body">
                <h3>{item.name}</h3>
                <p>{formatCurrency(item.price, item.currency)}</p>
                <div className="cart-item__qty">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                </div>
              </div>
              <button className="cart-item__remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>Remove</button>
            </li>
          ))}
        </ul>

        <aside className="cart-summary card-glass">
          <h2>Order Summary</h2>
          <div className="cart-summary__row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {coupon && (
            <div className="cart-summary__row cart-summary__row--discount">
              <span>Coupon ({coupon.code}) <button onClick={clearCoupon} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '0.4rem' }}>remove</button></span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          {!coupon && (
            <div className="cart-summary__coupon">
              <input placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
              <button className="btn btn-ghost" onClick={applyCouponCode} disabled={checking}><span>{checking ? 'Checking…' : 'Apply'}</span></button>
            </div>
          )}
          {couponError && <p className="cart-summary__error">{couponError}</p>}
          <div className="divider" style={{ margin: '1.25rem 0' }} />
          <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>{formatCurrency(total)}</span></div>
          <button className="btn btn-solid" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => navigate('/checkout')}>
            <span>Proceed to Checkout</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
