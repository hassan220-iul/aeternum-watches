import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchOrderById } from '../services/ordersService';
import { formatCurrency } from '../utils/formatCurrency';

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const isDemo = params.get('demo') === '1';
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;
    fetchOrderById(orderId).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  const paid = order?.payment_status === 'paid';
  const awaitingVerification = order?.payment_status === 'awaiting_verification';

  function statusMessage() {
    if (!order) return "we're still confirming payment — you'll receive an email as soon as it clears.";
    if (paid) return 'payment received, and your watchmaker has been notified to begin final inspection.';
    if (awaitingVerification) return "we're verifying your Whish Money transfer — you'll get a confirmation once it's checked.";
    if (order.payment_method === 'cash_on_delivery') return 'have your payment ready for the courier — you\'ll pay when it arrives.';
    return "we're still confirming payment — you'll receive an email as soon as it clears.";
  }

  return (
    <div className="section container confirmation">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <span className="confirmation__mark">✓</span>
        <h1 style={{ fontSize: 'var(--fs-h1)', margin: '1.5rem 0 1rem' }}>
          {order ? (paid ? 'Payment Confirmed' : awaitingVerification ? 'Order Placed — Verifying Payment' : 'Order Placed') : 'Order Placed'}
        </h1>

        {order ? (
          <p>
            Order #{order.order_number}{order.total ? ` — ${formatCurrency(order.total)}` : ''} — {statusMessage()}
          </p>
        ) : (
          <p>Thank you — a confirmation has been sent to your email, and your watchmaker has been notified to begin final inspection.</p>
        )}

        {isDemo && (
          <p style={{ fontSize: '0.8rem', color: 'rgba(245,242,234,0.5)', marginTop: '0.75rem' }}>
            (Local demo mode — this payment was simulated, not charged.)
          </p>
        )}

        <div className="confirmation__actions">
          <Link to="/order-tracking" className="btn btn-solid"><span>Track Your Order</span></Link>
          <Link to="/shop" className="btn btn-ghost"><span>Continue Shopping</span></Link>
        </div>
      </motion.div>
    </div>
  );
}
