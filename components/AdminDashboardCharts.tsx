'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 text-sm border border-indigo-500/20">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.name === 'revenue' || p.name === 'amount' ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboardCharts({ charts }: { charts: any }) {
  const { salesOverTime, topInfluencerData, revenueSplit } = charts;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Sales Over Time — Line Chart (full width) */}
      <div className="card p-6 xl:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white">Sales Revenue</h3>
            <p className="text-xs text-slate-500 mt-0.5">Last 30 days daily performance</p>
          </div>
          <span className="text-xs bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20">30d</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={salesOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="amount" name="amount"
              stroke="#6366f1" strokeWidth={2.5}
              dot={false} activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Split — Pie Chart */}
      <div className="card p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white">Revenue Split</h3>
          <p className="text-xs text-slate-500 mt-0.5">By influencer (30d)</p>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={revenueSplit}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {revenueSplit.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: any) => formatCurrency(v)}
              contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-2">
          {revenueSplit.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-slate-400">{item.name}</span>
              </div>
              <span className="text-white font-medium">{formatCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Influencers — Bar Chart */}
      <div className="card p-6 xl:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white">Top Influencers</h3>
            <p className="text-xs text-slate-500 mt-0.5">By revenue generated (30d)</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topInfluencerData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="revenue" radius={[4, 4, 0, 0]}>
              {topInfluencerData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Stats */}
      <div className="card p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white">Top Performers</h3>
          <p className="text-xs text-slate-500 mt-0.5">Sales count (30d)</p>
        </div>
        <div className="space-y-3">
          {topInfluencerData.map((inf: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: COLORS[i % COLORS.length] }}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white">{inf.name}</span>
                  <span className="text-xs text-slate-400">{inf.sales} sales</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(inf.sales / (topInfluencerData[0]?.sales || 1)) * 100}%`,
                      background: COLORS[i % COLORS.length]
                    }} />
                </div>
              </div>
            </div>
          ))}
          {topInfluencerData.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
