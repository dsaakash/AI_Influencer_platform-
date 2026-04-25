import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/sales
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let where: any = { date: { gte: since } };

    if (role === 'INFLUENCER') {
      const userId = (session.user as any).id;
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const influencer = await prisma.influencer.findUnique({ where: { userId } });
      if (!influencer) return NextResponse.json([]);
      where.influencerId = influencer.id;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        influencer: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('GET /api/sales error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sales — record a new sale
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { influencerId, productName, amount, customerEmail, orderId } = await req.json();

    const influencer = await prisma.influencer.findUnique({ where: { id: influencerId } });
    if (!influencer) return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });

    const commission = (amount * influencer.commissionRate) / 100;

    const sale = await prisma.sale.create({
      data: {
        influencerId,
        productName,
        amount,
        commission,
        customerEmail,
        orderId,
        status: 'CONFIRMED',
      },
    });

    // Update total earnings
    await prisma.influencer.update({
      where: { id: influencerId },
      data: { totalEarnings: { increment: commission } },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Order ID already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
