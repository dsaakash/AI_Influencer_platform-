import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/influencers — list all (admin) or self (influencer)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = (session.user as any).role;

    if (role === 'ADMIN' || role === 'FINANCE') {
      const influencers = await prisma.influencer.findMany({
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
          _count: { select: { sales: true, clicks: true } },
          sales: { select: { amount: true, commission: true } },
          payments: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const enriched = influencers.map((inf) => ({
        ...inf,
        totalSales: inf.sales.reduce((s, sale) => s + sale.amount, 0),
        totalCommission: inf.sales.reduce((s, sale) => s + sale.commission, 0),
        pendingPayout: inf.payments
          .filter((p) => p.status === 'PENDING' || p.status === 'APPROVED')
          .reduce((s, p) => s + p.amount, 0),
      }));

      return NextResponse.json(enriched);
    }

    // Influencer — return own profile
    const userId = (session.user as any).id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const influencer = await prisma.influencer.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { sales: true, clicks: true } },
      },
    });

    return NextResponse.json(influencer);
  } catch (error) {
    console.error('GET /api/influencers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/influencers — create influencer (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, commissionRate, instagram, youtube, twitter } = body;

    // Create user
    const bcrypt = await import('bcryptjs');
    const tempPassword = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.default.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'INFLUENCER' },
    });

    const { generateReferralCode } = await import('@/lib/utils');
    const referralCode = generateReferralCode(name);

    const influencer = await prisma.influencer.create({
      data: {
        userId: user.id,
        referralCode,
        commissionRate: commissionRate || 10,
        instagram,
        youtube,
        twitter,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ ...influencer, tempPassword }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
