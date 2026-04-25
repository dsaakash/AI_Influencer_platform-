import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateAIContent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Analyze last 30 days of clicks for each influencer
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const influencers = await prisma.influencer.findMany({
      include: {
        user: { select: { name: true } },
        clicks: { where: { timestamp: { gte: since } } },
        sales: { where: { date: { gte: since } } },
      },
    });

    const analysisData = influencers.map((inf: any) => {
      const clicks = inf.clicks;
      const sales = inf.sales;

      // Group clicks by IP
      const ipMap: Record<string, number> = {};
      clicks.forEach((c: any) => {
        if (c.ipAddress) ipMap[c.ipAddress] = (ipMap[c.ipAddress] || 0) + 1;
      });

      const maxClicksFromSingleIp = Math.max(...Object.values(ipMap), 0);
      const uniqueIps = Object.keys(ipMap).length;
      const conversionRate = clicks.length > 0 ? (sales.length / clicks.length) * 100 : 0;

      // Check for hourly spikes
      const hourMap: Record<number, number> = {};
      clicks.forEach((c: any) => {
        const hour = new Date(c.timestamp).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      });
      const maxHourlyClicks = Math.max(...Object.values(hourMap), 0);
      const avgHourlyClicks = clicks.length / 24;

      return {
        id: inf.id,
        name: inf.user.name,
        totalClicks: clicks.length,
        totalSales: sales.length,
        conversionRate: conversionRate.toFixed(1),
        uniqueIps,
        maxClicksFromSingleIp,
        maxHourlyClicks,
        avgHourlyClicks: avgHourlyClicks.toFixed(1),
        ipConcentration: clicks.length > 0 ? ((maxClicksFromSingleIp / clicks.length) * 100).toFixed(1) : '0',
      };
    });

    const prompt = `You are a fraud detection specialist for an influencer affiliate marketing platform. Analyze the following click and sales data for each influencer and determine if there are signs of fraudulent activity (fake clicks, click farms, bot traffic).

Influencer Data (last 30 days):
${JSON.stringify(analysisData, null, 2)}

Fraud signals to look for:
- High IP concentration (>30% clicks from single IP = suspicious)
- Very low or zero conversion despite high clicks
- Extreme hourly click spikes
- Too-good-to-be-true conversion rates (>50%)

For each influencer, classify as:
- "clean": No fraud signals
- "suspicious": Some anomalies worth monitoring  
- "flagged": Clear fraud indicators, action required

Respond with JSON:
{
  "results": [
    {
      "influencerId": "id",
      "name": "name",
      "status": "clean|suspicious|flagged",
      "riskScore": 0-100,
      "flags": ["list of specific issues found"],
      "recommendation": "What admin should do"
    }
  ],
  "summary": "Overall platform health summary"
}`;

    const text = await generateAIContent(prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed) return NextResponse.json({ error: 'Parse error' }, { status: 500 });

    return NextResponse.json({ ...parsed, rawData: analysisData });
  } catch (error: any) {
    console.error('Fraud detection error:', error);
    if (error.status === 429) {
      return NextResponse.json({ error: 'AI Rate Limit (429): Too many requests.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to run fraud detection' }, { status: 500 });
  }
}
