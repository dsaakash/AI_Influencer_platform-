'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, MousePointerClick, DollarSign, Copy, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InfluencerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/influencers').then(r => r.json()),
      fetch('/api/sales?days=30').then(r => r.json()),
    ]).then(([inf, s]) => {
      setProfile(inf);
      setSales(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, []);

  const copyLink = () => {
    if (!profile?.referralCode) return;
    const link = `${window.location.origin}/api/clicks/track?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build daily chart data
  const dailyMap: Record<string, number> = {};
  sales.forEach((s) => {
    const day = new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dailyMap[day] = (dailyMap[day] || 0) + s.amount;
  });
  const chartData = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

  const totalRevenue = sales.reduce((s, sale) => s + sale.amount, 0);
  const totalCommission = sales.reduce((s, sale) => s + sale.commission, 0);
  const clicks = profile?._count?.clicks || 0;
  const convRate = clicks > 0 ? ((sales.length / clicks) * 100).toFixed(1) : '0';

  if (loading) {
    return <div className="flex items-center justify-center h-full p-16"><div className="spinner w-10 h-10" /></div>;
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">Your affiliate performance — last 30 days</p>
      </div>

      {/* Affiliate Link */}
      {profile?.referralCode && (
        <div className="card p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-1">Your Affiliate Link</p>
            <p className="text-sm font-mono text-indigo-400 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/clicks/track?ref={profile.referralCode}
            </p>
          </div>
          <button id="copy-affiliate-link" onClick={copyLink} className="btn-secondary flex-shrink-0">
            {copied ? <><Check className="w-4 h-4 text-emerald-400" />Copied!</> : <><Copy className="w-4 h-4" />Copy Link</>}
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenue Generated', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'from-emerald-500 to-teal-700', glow: 'glow-emerald' },
          { label: 'My Commission', value: formatCurrency(totalCommission), icon: DollarSign, color: 'from-indigo-500 to-indigo-700', glow: 'glow-indigo' },
          { label: 'Total Clicks', value: clicks.toString(), icon: MousePointerClick, color: 'from-purple-500 to-purple-700', glow: 'glow-purple' },
          { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUp, color: 'from-amber-500 to-amber-700', glow: '' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 ${card.glow}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Earnings Chart */}
      <div className="card p-6 mb-6">
        <h3 className="text-base font-semibold text-white mb-4">Earnings Timeline</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.08)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
              tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip formatter={(v: any) => formatCurrency(v)}
              contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="amount" stroke="#a855f7" strokeWidth={2.5} dot={false}
              activeDot={{ r: 4, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Sales */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
          <h3 className="text-sm font-semibold text-white">Recent Sales</h3>
        </div>
        <div className="table-container">
          {sales.length === 0 ? (
            <p className="text-center py-10 text-slate-500 text-sm">No sales yet. Share your affiliate link!</p>
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Product</th><th>Sale Amount</th><th>Commission</th><th>Status</th></tr></thead>
              <tbody>
                {sales.slice(0, 10).map(sale => (
                  <tr key={sale.id}>
                    <td className="text-slate-400 text-sm">{formatDate(sale.date)}</td>
                    <td>{sale.productName}</td>
                    <td><span className="text-emerald-400 font-medium">{formatCurrency(sale.amount)}</span></td>
                    <td><span className="text-purple-400">{formatCurrency(sale.commission)}</span></td>
                    <td><span className={`badge badge-${sale.status.toLowerCase()}`}>{sale.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
