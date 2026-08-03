import { useState } from 'react';

const FAQS = [
  { q: 'How long does delivery take?', a: 'White Glove Delivery typically takes 5-7 business days; Express Courier arrives in 2-3.' },
  { q: 'What does the lifetime warranty cover?', a: 'All mechanical faults arising from normal wear are repaired at no charge for as long as you own the watch.' },
  { q: 'Can I return a watch?', a: 'Yes — unworn pieces can be returned within 30 days. See our Returns Policy for full details.' },
  { q: 'How do I verify authenticity?', a: 'Every watch ships with a signed, numbered Certificate of Authenticity matching the serial engraved on the case back.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <div className="section container legal-page">
      <p className="eyebrow">Help</p>
      <h1 style={{ fontSize: 'var(--fs-h1)', margin: '0.75rem 0 2rem' }}>Frequently Asked Questions</h1>
      <div className="faq-list">
        {FAQS.map((item, i) => (
          <div key={item.q} className="faq-item">
            <button
              className="faq-item__question"
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              {item.q}
              <span aria-hidden="true">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p className="faq-item__answer">{item.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
