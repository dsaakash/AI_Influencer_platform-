'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Download, Check, X, Clock } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  PAID: 'badge-paid',
  REJECTED: 'badge-rejected',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments').then(r => r.json()).then(data => {
      setPayments(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const res = await fetch('/api/payments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    }
    setUpdating(null);
  };

  const exportCSV = () => window.open('/api/export?type=payments&days=90', '_blank');

  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-amber-400" /> Payments
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Manage influencer commission payouts</p>
        </div>
        <button id="export-payments-btn" onClick={exportCSV} className="btn-secondary">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Pending Payout</p>
        </div>
        <div className="card p-4">
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Paid Out</p>
        </div>
        <div className="card p-4">
          <p className="text-xl font-bold text-white">{payments.filter(p => p.status === 'PENDING').length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting Approval</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8" /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No payment records yet</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Influencer</th>
                  <th>Amount</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Paid At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <p className="font-medium text-white">{payment.influencer?.user?.name}</p>
                      <p className="text-xs text-slate-500">{payment.influencer?.user?.email}</p>
                    </td>
                    <td><span className="font-bold text-white">{formatCurrency(payment.amount)}</span></td>
                    <td className="text-sm text-slate-400">
                      {formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}
                    </td>
                    <td><span className={`badge ${statusColors[payment.status] || ''}`}>{payment.status}</span></td>
                    <td className="text-sm text-slate-400">
                      {payment.paidAt ? formatDate(payment.paidAt) : '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {payment.status === 'PENDING' && (
                          <button
                            id={`approve-${payment.id}`}
                            onClick={() => updateStatus(payment.id, 'APPROVED')}
                            disabled={updating === payment.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                        )}
                        {payment.status === 'APPROVED' && (
                          <button
                            id={`mark-paid-${payment.id}`}
                            onClick={() => updateStatus(payment.id, 'PAID')}
                            disabled={updating === payment.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all flex items-center gap-1.5"
                          >
                            <Check className="w-3 h-3" /> Mark Paid
                          </button>
                        )}
                        {(payment.status === 'PENDING' || payment.status === 'APPROVED') && (
                          <button
                            onClick={() => updateStatus(payment.id, 'REJECTED')}
                            disabled={updating === payment.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-all flex items-center gap-1.5"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        )}
                        {updating === payment.id && <div className="spinner w-4 h-4" />}
                      </div>
                    </td>
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
