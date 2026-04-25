'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  PAID: 'badge-paid',
  REJECTED: 'badge-rejected',
};

export default function InfluencerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments').then(r => r.json()).then(data => {
      setPayments(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'PENDING' || p.status === 'APPROVED').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-purple-400" /> My Payments
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Your commission payment history</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><p className="text-xl font-bold text-emerald-400">{formatCurrency(totalPaid)}</p><p className="text-xs text-slate-500 mt-0.5">Total Received</p></div>
        <div className="card p-4"><p className="text-xl font-bold text-amber-400">{formatCurrency(totalPending)}</p><p className="text-xs text-slate-500 mt-0.5">Pending</p></div>
        <div className="card p-4"><p className="text-xl font-bold text-white">{payments.length}</p><p className="text-xs text-slate-500 mt-0.5">Total Transactions</p></div>
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
              <thead><tr><th>Period</th><th>Amount</th><th>Status</th><th>Paid On</th><th>Notes</th></tr></thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="text-sm text-slate-400">
                      {formatDate(payment.periodStart)} — {formatDate(payment.periodEnd)}
                    </td>
                    <td><span className="font-bold text-white">{formatCurrency(payment.amount)}</span></td>
                    <td><span className={`badge ${statusColors[payment.status] || ''}`}>{payment.status}</span></td>
                    <td className="text-sm text-slate-400">{payment.paidAt ? formatDate(payment.paidAt) : '—'}</td>
                    <td className="text-sm text-slate-500">{payment.notes || '—'}</td>
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
