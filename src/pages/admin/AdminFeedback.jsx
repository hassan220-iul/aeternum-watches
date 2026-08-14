import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { fetchFeedback, deleteFeedback } from '../../services/feedbackService';

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);

  async function reload() {
    setFeedback(await fetchFeedback());
  }
  useEffect(() => { reload(); }, []);

  async function handleDelete(id) {
    if (!confirm('Remove this feedback permanently?')) return;
    await deleteFeedback(id);
    reload();
  }

  return (
    <div>
      <h1 className="admin-page-title">Customer Feedback</h1>
      {!isSupabaseConfigured && (
        <p className="admin-empty">Managing locally stored feedback — connect Supabase for a live, shared inbox.</p>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Message</th><th>Received</th><th>Actions</th></tr></thead>
          <tbody>
            {feedback.length === 0 ? (
              <tr><td colSpan={5} className="admin-empty">No feedback submitted yet.</td></tr>
            ) : feedback.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.email}</td>
                <td style={{ maxWidth: 360 }}>{f.message}</td>
                <td>{new Date(f.created_at).toLocaleDateString()}</td>
                <td><button className="admin-btn danger" onClick={() => handleDelete(f.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
