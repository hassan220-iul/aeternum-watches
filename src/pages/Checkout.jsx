import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { createOrder } from '../services/ordersService';
import { startCheckout, startWhishCardCheckout } from '../services/paymentService';
import { fetchStoreSettings } from '../services/settingsService';
import { isSupabaseConfigured } from '../services/supabaseClient';

const STEPS = ['Shipping', 'Delivery', 'Payment', 'Review'];
const SHIPPING_OPTIONS = [
  { id: 'white-glove', label: 'White Glove Delivery (Free)', cost: 0, eta: '5-7 business days' },
  { id: 'express', label: 'Express Courier', cost: 45, eta: '2-3 business days' },
];
const PAYMENT_METHODS = [
  { id: 'whish_money', label: 'Whish Money — Manual Transfer' },
  { id: 'whish_card', label: 'Whish Money — Pay by Visa/Card' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery' },
  { id: 'stripe', label: 'Card (via Stripe)' },
];

export default function Checkout() {
  const { items, subtotal, discount, coupon, clearCart } = useCart();
  const { user, isVip } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [shipping, setShipping] = useState({ fullName: '', email: '', phone: '', address: '', city: '', country: '' });
  const [shippingOption, setShippingOption] = useState(SHIPPING_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState('whish_money');
  const [whishReference, setWhishReference] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => { fetchStoreSettings().then(setSettings).catch(() => {}); }, []);

  const shippingCost = shippingOption.cost;
  const total = subtotal - discount + shippingCost;
  const isRedirectMethod = paymentMethod === 'stripe' || paymentMethod === 'whish_card';

  function handleShippingSubmit(e) {
    e.preventDefault();
    setStep(1);
  }

  async function handlePlaceOrder() {
    if (paymentMethod === 'whish_money' && !whishReference.trim()) {
      setPaymentError('Enter the reference/confirmation number from your Whish Money transfer.');
      return;
    }
    setPaymentError('');
    setPlacing(true);
    try {
      const order = await createOrder({
        userId: user?.id || null,
        items,
        shipping,
        totals: { subtotal, shippingCost, total, discount },
        isVip,
        paymentMethod,
        paymentReference: paymentMethod === 'whish_money' ? whishReference.trim() : null,
      });

      if (paymentMethod === 'stripe' || paymentMethod === 'whish_card') {
        const { redirectUrl, simulated } = paymentMethod === 'stripe'
          ? await startCheckout(order, shipping.email)
          : await startWhishCardCheckout(order);
        if (redirectUrl) {
          // Leaving the app for the payment provider's hosted page — the
          // cart is cleared once the shopper lands back on confirmation.
          window.location.href = redirectUrl;
          return;
        }
        clearCart();
        navigate(`/order-confirmation?order=${order.id}${simulated ? '&demo=1' : ''}`);
        return;
      }

      // Whish Money and Cash on Delivery don't involve a payment redirect —
      // the order is placed immediately and payment is confirmed manually
      // (by an admin checking the transfer, or by the courier on delivery).
      clearCart();
      navigate(`/order-confirmation?order=${order.id}`);
    } catch (err) {
      console.error(err);
      alert(`Couldn't place your order: ${err.message}`);
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return <div className="section container"><p>Your cart is empty — add something before checking out.</p></div>;
  }

  return (
    <div className="section container checkout">
      <ol className="checkout__steps" aria-label="Checkout progress">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'is-active' : i < step ? 'is-done' : ''}>{label}</li>
        ))}
      </ol>

      <div className="checkout__grid">
        <div className="checkout__panel">
          {step === 0 && (
            <form onSubmit={handleShippingSubmit} className="checkout-form">
              <h2>Shipping Details</h2>
              <label>Full Name<input required value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} /></label>
              <label>Email<input required type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} /></label>
              <label>Phone<input required type="tel" placeholder="+961 ..." value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} /></label>
              <label>Address<input required value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} /></label>
              <div className="checkout-form__row">
                <label>City<input required value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></label>
                <label>Country<input required value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} /></label>
              </div>
              <button type="submit" className="btn btn-solid"><span>Continue to Delivery</span></button>
            </form>
          )}

          {step === 1 && (
            <div className="checkout-form">
              <h2>Delivery Method</h2>
              {SHIPPING_OPTIONS.map((opt) => (
                <label key={opt.id} className="checkout-radio">
                  <input type="radio" name="shipping" checked={shippingOption.id === opt.id} onChange={() => setShippingOption(opt)} />
                  <span>{opt.label} — {opt.eta}</span>
                  <strong>{opt.cost === 0 ? 'Free' : formatCurrency(opt.cost)}</strong>
                </label>
              ))}
              <div className="checkout-form__actions">
                <button className="btn btn-ghost" onClick={() => setStep(0)}><span>Back</span></button>
                <button className="btn btn-solid" onClick={() => setStep(2)}><span>Choose Payment</span></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-form">
              <h2>Payment Method</h2>
              {PAYMENT_METHODS.map((m) => (
                <label key={m.id} className="checkout-radio">
                  <input type="radio" name="payment" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} />
                  <span>{m.label}</span>
                </label>
              ))}

              {paymentMethod === 'whish_money' && (
                <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', padding: '1rem 1.2rem', margin: '1rem 0', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '0.5rem' }}>
                    Send <strong>{formatCurrency(total)}</strong> via Whish Money to:
                  </p>
                  <p style={{ marginBottom: '0.15rem' }}>Name: <strong>{settings?.whish_money_name || 'Aeternum Watches'}</strong></p>
                  <p style={{ marginBottom: '0.75rem' }}>Phone: <strong>{settings?.whish_money_phone || '+961 70 674 606'}</strong></p>
                  <label style={{ display: 'block' }}>
                    Transfer Reference / Confirmation Number
                    <input
                      required
                      value={whishReference}
                      onChange={(e) => setWhishReference(e.target.value)}
                      placeholder="e.g. the code shown after you send the transfer"
                      style={{ width: '100%', marginTop: '0.4rem', background: '#121212', border: '1px solid rgba(255,255,255,0.2)', color: '#f5f2ea', padding: '0.55rem 0.75rem' }}
                    />
                  </label>
                  <p style={{ marginTop: '0.6rem', color: 'rgba(245,242,234,0.55)' }}>
                    Your order is placed immediately — we confirm the transfer and begin fulfillment shortly after.
                  </p>
                </div>
              )}

              {paymentMethod === 'whish_card' && (
                <p style={{ color: 'rgba(245,242,234,0.6)', fontSize: '0.85rem', margin: '1rem 0' }}>
                  You'll be taken to Whish Money's secure payment page to enter your Visa/Mastercard
                  details — the charge settles directly into our Whish account.
                </p>
              )}

              {paymentMethod === 'cash_on_delivery' && (
                <p style={{ color: 'rgba(245,242,234,0.6)', fontSize: '0.85rem', margin: '1rem 0' }}>
                  Pay in cash when your order arrives. Please have the exact amount, <strong>{formatCurrency(total)}</strong>, ready for the courier.
                </p>
              )}

              {paymentMethod === 'stripe' && (
                <p style={{ color: 'rgba(245,242,234,0.6)', fontSize: '0.85rem', margin: '1rem 0' }}>
                  {isSupabaseConfigured
                    ? "You'll be taken to Stripe's secure checkout to enter card details next."
                    : 'Local demo mode: card payment is simulated as successful — connect Supabase + Stripe for real processing (see DEPLOYMENT_GUIDE.md).'}
                </p>
              )}

              {paymentError && <p className="cart-summary__error">{paymentError}</p>}

              <div className="checkout-form__actions">
                <button className="btn btn-ghost" onClick={() => setStep(1)}><span>Back</span></button>
                <button className="btn btn-solid" onClick={() => setStep(3)}><span>Review Order</span></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="checkout-form">
              <h2>Review &amp; Place Order</h2>
              <p className="checkout__review-line"><strong>Ship to:</strong> {shipping.fullName}, {shipping.address}, {shipping.city}, {shipping.country}</p>
              <p className="checkout__review-line"><strong>Delivery:</strong> {shippingOption.label}</p>
              <p className="checkout__review-line"><strong>Payment:</strong> {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</p>
              {paymentError && <p className="cart-summary__error">{paymentError}</p>}
              <div className="checkout-form__actions">
                <button className="btn btn-ghost" onClick={() => setStep(2)}><span>Back</span></button>
                <button className="btn btn-solid" onClick={handlePlaceOrder} disabled={placing}>
                  <span>
                    {placing
                      ? (isRedirectMethod ? 'Redirecting to payment…' : 'Placing Order…')
                      : isRedirectMethod ? 'Continue to Payment' : 'Place Order'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="cart-summary card-glass">
          <h2>Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="cart-summary__row"><span>{item.name} × {item.quantity}</span><span>{formatCurrency(item.price * item.quantity)}</span></div>
          ))}
          <div className="divider" style={{ margin: '1.25rem 0' }} />
          <div className="cart-summary__row"><span>Shipping</span><span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span></div>
          {coupon && <div className="cart-summary__row cart-summary__row--discount"><span>Coupon ({coupon.code})</span><span>-{formatCurrency(discount)}</span></div>}
          <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </aside>
      </div>
    </div>
  );
}
