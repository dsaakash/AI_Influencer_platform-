'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate, formatPercent, getInitials } from '@/lib/utils';
import { Users, Plus, Copy, Check, ExternalLink, TrendingUp, MousePointerClick } from 'lucide-react';

export default function AdminInfluencersPage() {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', commissionRate: '10', instagram: '', youtube: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/influencers').then(r => r.json()).then(data => {
      setInfluencers(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/api/clicks/track?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/influencers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, commissionRate: parseFloat(form.commissionRate) }),
    });
    if (res.ok) {
      const inf = await res.json();
      setInfluencers(prev => [{ ...inf, _count: { sales: 0, clicks: 0 }, sales: [], payments: [], totalSales: 0, totalCommission: 0 }, ...prev]);
      setShowModal(false);
      setForm({ name: '', email: '', commissionRate: '10', instagram: '', youtube: '' });
    }
    setSaving(false);
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-400" /> Influencers
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Manage your affiliate influencer network</p>
        </div>
        <button id="add-influencer-btn" onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Influencer
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Influencers', value: influencers.length },
          { label: 'Active', value: influencers.filter(i => i.isActive).length },
          { label: 'Total Revenue', value: formatCurrency(influencers.reduce((s, i) => s + (i.totalSales || 0), 0)) },
        ].map(stat => (
          <div key={stat.label} className="card p-4">
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner w-8 h-8" />
            </div>
          ) : influencers.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No influencers yet. Add your first one!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Influencer</th>
                  <th>Referral Code</th>
                  <th>Commission</th>
                  <th>Clicks</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((inf) => (
                  <tr key={inf.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                          {getInitials(inf.user?.name || '?')}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{inf.user?.name}</p>
                          <p className="text-xs text-slate-500">{inf.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-indigo-600/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">
                          {inf.referralCode}
                        </code>
                        <button
                          onClick={() => copyLink(inf.referralCode)}
                          className="text-slate-500 hover:text-indigo-400 transition-colors"
                          title="Copy affiliate link"
                        >
                          {copied === inf.referralCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="text-indigo-400 font-semibold">{inf.commissionRate}%</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />
                        <span>{inf._count?.clicks || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                        <span>{inf._count?.sales || 0}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-emerald-400">{formatCurrency(inf.totalSales || 0)}</span>
                    </td>
                    <td>
                      <span className={`badge ${inf.isActive ? 'badge-confirmed' : 'badge-rejected'}`}>
                        {inf.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs text-slate-400 hover:text-indigo-400 transition-colors px-2 py-1 rounded hover:bg-indigo-600/10"
                          onClick={() => copyLink(inf.referralCode)}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Influencer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Add New Influencer</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Full Name *</label>
                <input className="w-full px-3 py-2.5 rounded-lg" placeholder="Priya Sharma" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Email *</label>
                <input className="w-full px-3 py-2.5 rounded-lg" type="email" placeholder="priya@email.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Commission Rate (%)</label>
                <input className="w-full px-3 py-2.5 rounded-lg" type="number" min="1" max="50" value={form.commissionRate}
                  onChange={e => setForm({ ...form, commissionRate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Instagram</label>
                  <input className="w-full px-3 py-2.5 rounded-lg" placeholder="@handle" value={form.instagram}
                    onChange={e => setForm({ ...form, instagram: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">YouTube</label>
                  <input className="w-full px-3 py-2.5 rounded-lg" placeholder="channel name" value={form.youtube}
                    onChange={e => setForm({ ...form, youtube: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" id="save-influencer-btn" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <><div className="spinner w-4 h-4" />Saving...</> : 'Add Influencer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
