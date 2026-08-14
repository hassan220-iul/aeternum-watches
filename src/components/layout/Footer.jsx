import { Link } from 'react-router-dom';
import { useState } from 'react';
import './footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;

    setSubscribed(true);
    setEmail('');
  }

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <p className="footer-brand__name">AETERNUM</p>
          <p className="footer-brand__tag">Swiss precision, crafted for generations.</p>

          <form onSubmit={handleSubmit} className="newsletter-form" aria-label="Newsletter signup">
            <label htmlFor="newsletter-email" className="visually-hidden">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn btn-solid"><span>Join</span></button>
          </form>
          {subscribed && <p className="footer-subscribed" role="status">You're on the list.</p>}
        </div>

        <nav aria-label="Shop">
          <h3>Shop</h3>
          <Link to="/shop">All Watches</Link>
          <Link to="/collections">Collections</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/shop?filter=limited">Limited Editions</Link>
        </nav>

        <nav aria-label="Company">
          <h3>Company</h3>
          <Link to="/about">Heritage</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/dashboard">Your Account</Link>
        </nav>

        <nav aria-label="Legal">
          <h3>Policies</h3>
          <Link to="/shipping-policy">Shipping</Link>
          <Link to="/returns-policy">Returns</Link>
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms-conditions">Terms</Link>
        </nav>
      </div>

      <div className="container footer-bottom">
        <p>&copy; {new Date().getFullYear()} Aeternum Watches. All rights reserved.</p>
        <p>Certified Swiss Movements · Lifetime Warranty · White Glove Delivery</p>
      </div>
    </footer>
  );
}
