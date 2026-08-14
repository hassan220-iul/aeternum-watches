import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signUp(form.email, form.password, form.fullName);
      if (result?.session === null) {

        setNeedsConfirmation(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="section container auth-page">
        <div className="auth-card card-glass">
          <p className="eyebrow">Join Aeternum</p>
          <h1 style={{ fontSize: 'var(--fs-h2)', margin: '0.75rem 0 1.5rem' }}>Check Your Email</h1>
          <p>
            Your account is set up — we've sent a confirmation link to <strong>{form.email}</strong>.
            Click it, then come back and sign in.
          </p>
          <p className="auth-card__footer" style={{ marginTop: '1.5rem' }}>
            <Link to="/login">Go to Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section container auth-page">
      <div className="auth-card card-glass">
        <p className="eyebrow">Join Aeternum</p>
        <h1 style={{ fontSize: 'var(--fs-h2)', margin: '0.75rem 0 2rem' }}>Create Account</h1>
        <form onSubmit={handleSubmit} className="checkout-form">
          <label>Full Name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="cart-summary__error">{error}</p>}
          <button className="btn btn-solid" type="submit" disabled={loading} style={{ width: '100%' }}>
            <span>{loading ? 'Creating Account…' : 'Create Account'}</span>
          </button>
        </form>
        <p className="auth-card__footer">Already a member? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
