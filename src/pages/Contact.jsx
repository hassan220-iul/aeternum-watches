import { useState } from 'react';
import { sendWhatsAppNotification } from '../services/whatsappService';
import { submitFeedback } from '../services/feedbackService';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await submitFeedback(form);
      await sendWhatsAppNotification('contact_form', {
        customerName: form.name,
        email: form.email,
        messagePreview: form.message.slice(0, 120),
      });
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Feedback submission failed:', err);
      setError(`Couldn't send your message: ${err.message}. Please try again.`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="section container legal-page">
      <p className="eyebrow">Get in Touch</p>
      <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 2rem' }}>Contact Us</h1>

      {sent ? (
        <p className="cart-summary__row--discount">Thank you — the atelier will respond within one business day.</p>
      ) : (
        <form onSubmit={handleSubmit} className="checkout-form" style={{ maxWidth: 520 }}>
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Message<textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
          {error && <p className="cart-summary__error">{error}</p>}
          <button className="btn btn-solid" type="submit" disabled={sending}><span>{sending ? 'Sending…' : 'Send Message'}</span></button>
        </form>
      )}
    </div>
  );
}
