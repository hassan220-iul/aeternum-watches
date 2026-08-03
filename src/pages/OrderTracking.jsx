import { useState } from 'react';

const STAGES = ['Pending', 'Processing', 'Quality Inspection', 'Dispatched', 'Delivered'];

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [tracked, setTracked] = useState(null);

  function handleTrack(e) {
    e.preventDefault();
    // In production this looks up the real order in Supabase by order_number.
    // Without a connected backend we can't fabricate a status, so we just
    // echo back the input and mark the first stage active as a UI preview.
    setTracked(orderNumber);
  }

  return (
    <div className="section container">
      <p className="eyebrow">Track</p>
      <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 2rem' }}>Order Tracking</h1>

      <form onSubmit={handleTrack} className="tracking-form">
        <input
          placeholder="Enter your order number"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          aria-label="Order number"
        />
        <button className="btn btn-solid" type="submit"><span>Track</span></button>
      </form>

      {tracked && (
        <div className="tracking-timeline">
          <p className="tracking-timeline__order">Order #{tracked}</p>
          <ol>
            {STAGES.map((stage, i) => (
              <li key={stage} className={i === 0 ? 'is-active' : ''}>
                <span className="tracking-timeline__dot" />
                {stage}
              </li>
            ))}
          </ol>
          <p className="tracking-timeline__note">
            Connect Supabase to pull the real, live status for this order — see the Admin
            Dashboard's Orders tab to update status as it moves through fulfillment.
          </p>
        </div>
      )}
    </div>
  );
}
