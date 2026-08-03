import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { fetchOrdersInRange } from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatCurrency';

const RANGES = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };

export default function AdminAnalytics() {
  const [range, setRange] = useState('weekly');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrdersInRange(RANGES[range]).then(setOrders);
  }, [range]);

  const chartData = groupByDay(orders);

  function exportCsv() {
    const header = 'date,order_count,revenue\n';
    const rows = chartData.map((d) => `${d.date},${d.orders},${d.revenue}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeternum-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="admin-page-title">Analytics</h1>
      <div className="admin-toolbar">
        <select value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <button className="admin-btn solid" onClick={exportCsv}>Export CSV</button>
      </div>

      {!isSupabaseConfigured && (
        <p className="admin-empty">Charting locally stored orders — connect Supabase for a live, shared dataset.</p>
      )}
      {chartData.length === 0 ? (
        <p className="admin-empty">No orders in this range yet.</p>
      ) : (
        <div style={{ background: '#121212', border: '1px solid rgba(212,175,55,0.15)', padding: '1.5rem', height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="rgba(245,242,234,0.5)" fontSize={12} />
              <YAxis stroke="rgba(245,242,234,0.5)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(212,175,55,0.3)' }}
                formatter={(value, name) => (name === 'revenue' ? formatCurrency(value) : value)}
              />
              <Bar dataKey="revenue" fill="#d4af37" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function groupByDay(orders) {
  const map = {};
  orders.forEach((o) => {
    const date = new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    if (!map[date]) map[date] = { date, orders: 0, revenue: 0 };
    map[date].orders += 1;
    if (o.status === 'completed') map[date].revenue += Number(o.total);
  });
  return Object.values(map);
}
