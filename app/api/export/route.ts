import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'payments';
    const days = parseInt(searchParams.get('days') || '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: since } },
        include: {
          influencer: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const csvRows = [
        ['ID', 'Influencer', 'Email', 'Amount (₹)', 'Status', 'Period Start', 'Period End', 'Paid At', 'Created'],
        ...payments.map((p) => [
          p.id,
          p.influencer.user.name,
          p.influencer.user.email,
          p.amount.toFixed(2),
          p.status,
          new Date(p.periodStart).toLocaleDateString('en-IN'),
          new Date(p.periodEnd).toLocaleDateString('en-IN'),
          p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : 'N/A',
          new Date(p.createdAt).toLocaleDateString('en-IN'),
        ]),
      ];

      const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payments-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (type === 'sales') {
      const sales = await prisma.sale.findMany({
        where: { date: { gte: since } },
        include: {
          influencer: { include: { user: { select: { name: true } } } },
        },
        orderBy: { date: 'desc' },
      });

      const csvRows = [
        ['ID', 'Influencer', 'Product', 'Amount (₹)', 'Commission (₹)', 'Status', 'Order ID', 'Date'],
        ...sales.map((s) => [
          s.id,
          s.influencer.user.name,
          s.productName,
          s.amount.toFixed(2),
          s.commission.toFixed(2),
          s.status,
          s.orderId || 'N/A',
          new Date(s.date).toLocaleDateString('en-IN'),
        ]),
      ];

      const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
