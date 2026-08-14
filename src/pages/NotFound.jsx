import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="section container confirmation">
      <h1 style={{ fontSize: 'var(--fs-h1)', marginBottom: '1rem' }}>404</h1>
      <p>This page has been discontinued, like some of our earlier calibres.</p>
      <Link to="/" className="btn btn-solid"><span>Back to Home</span></Link>
    </div>
  );
}
