import { prisma } from '@/lib/prisma';
import { formatCurrency, formatNumber } from '@/lib/utils';
import AdminDashboardCharts from '@/components/AdminDashboardCharts';
import { TrendingUp, Users, CreditCard, MousePointerClick, ArrowUpRight, ArrowDownRight } from 'lucide-react';

async function getDashboardData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalInfluencers,
    activeInfluencers,
    recentSales,
    prevSales,
    recentClicks,
    prevClicks,
    pendingPayments,
    topInfluencers,
    dailySalesRaw,
  ] = await Promise.all([
    prisma.influencer.count(),
    prisma.influencer.count({ where: { isActive: true } }),
    prisma.sale.findMany({ where: { date: { gte: thirtyDaysAgo }, status: 'CONFIRMED' } }),
    prisma.sale.findMany({ where: { date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, status: 'CONFIRMED' } }),
    prisma.click.count({ where: { timestamp: { gte: thirtyDaysAgo } } }),
    prisma.click.count({ where: { timestamp: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.payment.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true }, _count: true }),
    prisma.influencer.findMany({
      include: { user: { select: { name: true } }, sales: { where: { date: { gte: thirtyDaysAgo } } } },
      take: 10,
    }),
    prisma.sale.findMany({
      where: { date: { gte: thirtyDaysAgo }, status: 'CONFIRMED' },
      orderBy: { date: 'asc' },
    }),
  ]);

  const totalRevenue = recentSales.reduce((s, sale) => s + sale.amount, 0);
  const prevRevenue = prevSales.reduce((s, sale) => s + sale.amount, 0);
  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const clickGrowth = prevClicks > 0 ? ((recentClicks - prevClicks) / prevClicks) * 100 : 0;
  const conversionRate = recentClicks > 0 ? (recentSales.length / recentClicks) * 100 : 0;

  // Aggregate daily sales for line chart
  const dailyMap: Record<string, number> = {};
  dailySalesRaw.forEach((s) => {
    const day = new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dailyMap[day] = (dailyMap[day] || 0) + s.amount;
  });
  const salesOverTime = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

  // Top influencers for bar chart
  const topInfluencerData = topInfluencers
    .map((inf) => ({
      name: inf.user.name.split(' ')[0],
      revenue: inf.sales.reduce((s: number, sale: any) => s + sale.amount, 0),
      sales: inf.sales.length,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Revenue split for pie chart
  const revenueSplit = topInfluencerData.slice(0, 5).map((inf) => ({
    name: inf.name,
    value: Math.round(inf.revenue),
  }));

  return {
    kpis: {
      totalRevenue,
      revenueGrowth,
      activeInfluencers,
      totalInfluencers,
      recentClicks,
      clickGrowth,
      pendingPayoutAmount: pendingPayments._sum.amount || 0,
      pendingPayoutCount: pendingPayments._count,
      conversionRate,
      totalSales: recentSales.length,
    },
    charts: { salesOverTime, topInfluencerData, revenueSplit },
  };
}

export default async function AdminDashboard() {
  const { kpis, charts } = await getDashboardData();

  const kpiCards = [
    {
      label: 'Total Revenue (30d)',
      value: formatCurrency(kpis.totalRevenue),
      change: kpis.revenueGrowth,
      icon: TrendingUp,
      color: 'indigo',
      sub: `${kpis.totalSales} sales`,
    },
    {
      label: 'Active Influencers',
      value: kpis.activeInfluencers.toString(),
      change: 0,
      icon: Users,
      color: 'purple',
      sub: `of ${kpis.totalInfluencers} total`,
    },
    {
      label: 'Total Clicks (30d)',
      value: formatNumber(kpis.recentClicks),
      change: kpis.clickGrowth,
      icon: MousePointerClick,
      color: 'emerald',
      sub: `${kpis.conversionRate.toFixed(1)}% conversion`,
    },
    {
      label: 'Pending Payouts',
      value: formatCurrency(kpis.pendingPayoutAmount),
      change: 0,
      icon: CreditCard,
      color: 'amber',
      sub: `${kpis.pendingPayoutCount} requests`,
    },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-700',
    purple: 'from-purple-500 to-purple-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-700',
  };

  const glowMap: Record<string, string> = {
    indigo: 'glow-indigo',
    purple: 'glow-purple',
    emerald: 'glow-emerald',
    amber: '',
  };

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-slate-400 mt-1 text-sm">Track your influencer program performance in real-time</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isPos = card.change >= 0;
          return (
            <div key={card.label} className="card p-5 relative overflow-hidden group">
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity ${colorMap[card.color]}`} />
              
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[card.color]} flex items-center justify-center ${glowMap[card.color]}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {card.change !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(card.change).toFixed(1)}%
                  </div>
                )}
              </div>

              <div>
                <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <AdminDashboardCharts charts={charts} />
    </div>
  );
}
