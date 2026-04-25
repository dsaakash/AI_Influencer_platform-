import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/clicks/track?ref=CODE — track a click on an affiliate link
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'Missing ref code' }, { status: 400 });
    }

    const influencer = await prisma.influencer.findUnique({ where: { referralCode: ref } });
    if (!influencer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    await prisma.click.create({
      data: {
        influencerId: influencer.id,
        referralCode: ref,
        ipAddress: ip,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, influencerId: influencer.id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
