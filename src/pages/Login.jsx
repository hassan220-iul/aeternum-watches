import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabaseClient';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section container auth-page">
      <div className="auth-card card-glass">
        <p className="eyebrow">Welcome Back</p>
        <h1 style={{ fontSize: 'var(--fs-h2)', margin: '0.75rem 0 2rem' }}>Sign In</h1>
        {!isSupabaseConfigured && (
          <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', padding: '1rem 1.2rem', marginBottom: '1.75rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'rgba(245,242,234,0.8)' }}>
            <strong style={{ color: '#d4af37' }}>Local demo mode</strong> — try one of these accounts:
            <br />Admin: <code>admin@aeternum.test</code> / <code>admin123</code>
            <br />Manager: <code>manager@aeternum.test</code> / <code>manager123</code>
            <br />Customer: <code>isabelle.laurent@example.com</code> / <code>password123</code>
          </div>
        )}
        <form onSubmit={handleSubmit} className="checkout-form">
          <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="cart-summary__error">{error}</p>}
          <button className="btn btn-solid" type="submit" disabled={loading} style={{ width: '100%' }}>
            <span>{loading ? 'Signing In…' : 'Sign In'}</span>
          </button>
        </form>
        <p className="auth-card__footer">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
