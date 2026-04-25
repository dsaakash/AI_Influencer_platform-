import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateAIContent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { influencerId } = await req.json();

    // Fetch 30-day data for the influencer
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const influencer = await prisma.influencer.findUnique({
      where: { id: influencerId },
      include: {
        user: { select: { name: true } },
        sales: { where: { date: { gte: since } }, orderBy: { date: 'asc' } },
        clicks: { where: { timestamp: { gte: since } }, orderBy: { timestamp: 'asc' } },
      },
    });

    if (!influencer) return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });

    // Build day-of-week analysis
    const dayMap: Record<string, { sales: number; amount: number; clicks: number }> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    influencer.clicks.forEach((c: any) => {
      const day = days[new Date(c.timestamp).getDay()];
      if (!dayMap[day]) dayMap[day] = { sales: 0, amount: 0, clicks: 0 };
      dayMap[day].clicks += 1;
    });

    influencer.sales.forEach((s: any) => {
      const day = days[new Date(s.date).getDay()];
      if (!dayMap[day]) dayMap[day] = { sales: 0, amount: 0, clicks: 0 };
      dayMap[day].sales += 1;
      dayMap[day].amount += s.amount;
    });

    const totalClicks = influencer.clicks.length;
    const totalSales = influencer.sales.length;
    const totalRevenue = influencer.sales.reduce((s: number, sale: any) => s + sale.amount, 0);
    const conversionRate = totalClicks > 0 ? ((totalSales / totalClicks) * 100).toFixed(1) : '0';

    const prompt = `You are an expert influencer marketing analyst. Analyze this influencer's performance data from the last 30 days and provide 3-5 concise, actionable insights.

Influencer Name: ${influencer.user.name}
Commission Rate: ${influencer.commissionRate}%
Total Clicks: ${totalClicks}
Total Sales: ${totalSales}
Total Revenue: ₹${totalRevenue.toFixed(0)}
Conversion Rate: ${conversionRate}%

Day-wise Performance:
${JSON.stringify(dayMap, null, 2)}

Please provide:
1. Performance insights (what's working, what's not)
2. Best performing days/patterns
3. Conversion rate analysis
4. Specific, actionable recommendations

Format as JSON with this structure:
{
  "summary": "2-3 sentence overall performance summary",
  "insights": [
    { "type": "positive|negative|neutral", "title": "Short title", "detail": "Detailed explanation" }
  ],
  "recommendation": "Top recommendation for improvement"
}`;

    const text = await generateAIContent(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, insights: [], recommendation: '' };

    // Save insight to DB
    await prisma.aIInsight.create({
      data: {
        influencerId,
        insightType: 'performance',
        content: JSON.stringify(parsed),
        metadata: JSON.stringify({ totalClicks, totalSales, totalRevenue, conversionRate }),
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('AI insights error:', error);
    if (error.status === 429) {
      return NextResponse.json({ error: 'AI Rate Limit (429): Too many requests. Please wait a minute.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate insights: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}
