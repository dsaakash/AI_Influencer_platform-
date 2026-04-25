import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/influencers/[id] — get single influencer with full stats
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const influencer = await prisma.influencer.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true, createdAt: true } },
        sales: { orderBy: { date: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        clicks: { orderBy: { timestamp: 'desc' }, take: 100 },
        insights: { orderBy: { generatedAt: 'desc' }, take: 5 },
      },
    });

    if (!influencer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(influencer);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/influencers/[id] — update commission rate, status, etc.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { commissionRate, isActive, instagram, youtube, twitter } = body;

    const influencer = await prisma.influencer.update({
      where: { id: params.id },
      data: { commissionRate, isActive, instagram, youtube, twitter },
    });

    return NextResponse.json(influencer);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
