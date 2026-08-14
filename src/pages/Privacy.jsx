export default function Privacy() {
  return (
    <div className="section container legal-page">
      <p className="eyebrow">Legal</p>
      <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 2rem' }}>Privacy Policy</h1>
      <p>This placeholder policy should be replaced with counsel-reviewed text before launch. It outlines the structure a real policy needs.</p>
      <h2>Information We Collect</h2>
      <p>Account details (name, email), order and shipping information, and site usage analytics collected via the `analytics` and `visitors` tables described in schema.sql.</p>
      <h2>How We Use It</h2>
      <p>To fulfill orders, provide customer support, personalize recommendations, and send order-related notifications (including WhatsApp updates you opt into).</p>
      <h2>Your Rights</h2>
      <p>You may request access, correction, or deletion of your personal data at any time by contacting us.</p>
    </div>
  );
}
