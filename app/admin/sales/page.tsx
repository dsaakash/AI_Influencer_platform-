'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TrendingUp, Plus } from 'lucide-react';

export default function AdminSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ influencerId: '', productName: '', amount: '', customerEmail: '' });
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState('30');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/sales?days=${days}`).then(r => r.json()),
      fetch('/api/influencers').then(r => r.json()),
    ]).then(([s, inf]) => {
      setSales(Array.isArray(s) ? s : []);
      setInfluencers(Array.isArray(inf) ? inf : []);
      setLoading(false);
    });
  }, [days]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    if (res.ok) {
      const sale = await res.json();
      setSales(prev => [sale, ...prev]);
      setShowModal(false);
      setForm({ influencerId: '', productName: '', amount: '', customerEmail: '' });
    }
    setSaving(false);
  };

  const totalRevenue = sales.reduce((s, sale) => s + sale.amount, 0);
  const totalCommission = sales.reduce((s, sale) => s + sale.commission, 0);

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-400" /> Sales
          </h1>
          <p className="text-slate-400 mt-1 text-sm">All influencer-driven sales</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 rounded-lg text-sm" value={days} onChange={e => setDays(e.target.value)}>
            <option value="7">Last 7d</option>
            <option value="30">Last 30d</option>
            <option value="90">Last 90d</option>
          </select>
          <button id="record-sale-btn" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Record Sale
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><p className="text-xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</p><p className="text-xs text-slate-500 mt-0.5">Total Revenue</p></div>
        <div className="card p-4"><p className="text-xl font-bold text-indigo-400">{formatCurrency(totalCommission)}</p><p className="text-xs text-slate-500 mt-0.5">Commission Owed</p></div>
        <div className="card p-4"><p className="text-xl font-bold text-white">{sales.length}</p><p className="text-xs text-slate-500 mt-0.5">Total Sales</p></div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8" /></div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16 text-slate-500"><TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No sales yet</p></div>
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Influencer</th><th>Product</th><th>Amount</th><th>Commission</th><th>Status</th></tr></thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="text-slate-400 text-sm">{formatDate(sale.date)}</td>
                    <td>
                      <p className="font-medium text-white">{sale.influencer?.user?.name}</p>
                      <p className="text-xs text-slate-500">{sale.influencer?.referralCode}</p>
                    </td>
                    <td>{sale.productName}</td>
                    <td><span className="font-semibold text-emerald-400">{formatCurrency(sale.amount)}</span></td>
                    <td><span className="text-indigo-400">{formatCurrency(sale.commission)}</span></td>
                    <td><span className={`badge badge-${sale.status.toLowerCase()}`}>{sale.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Record New Sale</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Influencer *</label>
                <select className="w-full px-3 py-2.5 rounded-lg" value={form.influencerId} onChange={e => setForm({ ...form, influencerId: e.target.value })} required>
                  <option value="">Select influencer...</option>
                  {influencers.map((inf: any) => <option key={inf.id} value={inf.id}>{inf.user?.name} ({inf.commissionRate}%)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Product *</label>
                <input className="w-full px-3 py-2.5 rounded-lg" placeholder="Product name" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Amount (₹) *</label>
                <input className="w-full px-3 py-2.5 rounded-lg" type="number" min="1" placeholder="2999" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" id="save-sale-btn" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><div className="spinner w-4 h-4" />Saving...</> : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
