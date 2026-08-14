import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { fetchStoreSettings, updateStoreSettings } from '../../services/settingsService';
import { updateCustomerRole, logAdminAction, fetchAdminLogs, fetchAdmins, findProfileByEmail } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');

  async function reload() {
    const [logData, adminData, settingsData] = await Promise.all([
      fetchAdminLogs(20),
      fetchAdmins(),
      fetchStoreSettings().catch(() => null),
    ]);
    setLogs(logData || []);
    setAdmins(adminData || []);
    setSettings(settingsData);
  }
  useEffect(() => { reload(); }, []);

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await updateStoreSettings({
        support_email: settings.support_email,
        low_stock_threshold: Number(settings.low_stock_threshold),
        whish_money_name: settings.whish_money_name,
        whish_money_phone: settings.whish_money_phone,
      });
      setSettings(updated);
      await logAdminAction('updated store settings', 'store_settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handlePromote(e) {
    e.preventDefault();
    if (!promoteEmail.trim()) return;
    const data = await findProfileByEmail(promoteEmail.trim());
    if (!data) {
      alert('No account found with that email — they need to register first.');
      return;
    }
    await updateCustomerRole(data.id, 'admin');
    setPromoteEmail('');
    reload();
  }

  async function handleDemote(id) {
    if (!confirm('Remove admin access for this user?')) return;
    await updateCustomerRole(id, 'customer');
    reload();
  }

  return (
    <div>
      <h1 className="admin-page-title">Settings</h1>

      {!isSupabaseConfigured && (
        <p className="admin-empty">
          Running in local demo mode — settings, roles, and activity below are stored in your
          browser. Connect Supabase for a live, shared backend.
        </p>
      )}

      <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Store Settings</h2>
      {!settings ? (
        <p className="admin-empty" style={{ marginBottom: '2.5rem' }}>Loading…</p>
      ) : (
        <form onSubmit={handleSaveSettings} className="admin-modal" style={{ marginBottom: '2.5rem', maxWidth: 480, padding: '1.5rem' }}>
          <label>Support Email<input type="email" value={settings.support_email} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })} /></label>
          <label>Low Stock Threshold<input type="number" value={settings.low_stock_threshold} onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })} /></label>
          <label>Whish Money Recipient Name<input value={settings.whish_money_name || ''} onChange={(e) => setSettings({ ...settings, whish_money_name: e.target.value })} /></label>
          <label>Whish Money Phone<input value={settings.whish_money_phone || ''} onChange={(e) => setSettings({ ...settings, whish_money_phone: e.target.value })} /></label>
          <button type="submit" className="admin-btn solid" disabled={savingSettings}>{savingSettings ? 'Saving…' : 'Save Settings'}</button>
        </form>
      )}

      <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Role Management</h2>
      {!isAdmin ? (
        <p className="admin-empty" style={{ marginBottom: '2.5rem' }}>Only admins can promote or demote accounts. Viewing is available to all staff.</p>
      ) : (
        <form onSubmit={handlePromote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', maxWidth: 480 }}>
          <input placeholder="Promote by email…" value={promoteEmail} onChange={(e) => setPromoteEmail(e.target.value)} style={{ flex: 1, background: '#121212', border: '1px solid rgba(255,255,255,0.15)', color: '#f5f2ea', padding: '0.55rem 0.85rem' }} />
          <button type="submit" className="admin-btn solid">Make Admin</button>
        </form>
      )}
      <div className="admin-table-wrap" style={{ marginBottom: '2.5rem' }}>
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {admins.length === 0 ? <tr><td colSpan={isAdmin ? 3 : 2} className="admin-empty">No admins yet.</td></tr> : admins.map((a) => (
              <tr key={a.id}>
                <td>{a.full_name}</td>
                <td>{a.email}</td>
                {isAdmin && <td><button className="admin-btn danger" onClick={() => handleDemote(a.id)}>Remove Admin</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>Activity Log</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Action</th><th>Table</th><th>When</th></tr></thead>
          <tbody>
            {logs.length === 0 ? <tr><td colSpan={3} className="admin-empty">No activity yet.</td></tr> : logs.map((l) => (
              <tr key={l.id}><td>{l.action}</td><td>{l.table_name}</td><td>{new Date(l.created_at).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
