import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateAIContent } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { days = 7 } = await req.json();

    // Get last 90 days of aggregated daily sales
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const sales = await prisma.sale.findMany({
      where: { date: { gte: since }, status: 'CONFIRMED' },
      orderBy: { date: 'asc' },
    });

    // Aggregate by day
    const dailyMap: Record<string, number> = {};
    sales.forEach((s: any) => {
      const dateKey = new Date(s.date).toISOString().split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + s.amount;
    });

    const dailyData = Object.entries(dailyMap).map(([date, amount]) => ({ date, amount }));

    const totalRevenue = dailyData.reduce((s: number, d: any) => s + d.amount, 0);
    const avgDaily = dailyData.length > 0 ? totalRevenue / dailyData.length : 0;

    const prompt = `You are a data scientist specializing in e-commerce revenue forecasting. Based on the following daily sales data, predict revenue for the next ${days} days.

Historical daily sales (last 90 days):
${JSON.stringify(dailyData.slice(-30), null, 2)}

Total revenue: ₹${totalRevenue.toFixed(0)}
Average daily revenue: ₹${avgDaily.toFixed(0)}
Prediction period: Next ${days} days

Analyze trends, seasonality (day-of-week patterns), and growth trajectory to make predictions.

Respond with JSON in this exact format:
{
  "predictions": [
    { "date": "YYYY-MM-DD", "predictedAmount": number, "confidence": "high|medium|low" }
  ],
  "trend": "growing|stable|declining",
  "trendPercent": number,
  "summary": "Brief explanation of the prediction",
  "totalPredicted": number
}

Generate exactly ${days} prediction entries starting from tomorrow.`;

    const text = await generateAIContent(prompt);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed) {
      return NextResponse.json({ error: 'Failed to parse prediction' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('AI predict error:', error);
    if (error.status === 429) {
      return NextResponse.json({ error: 'AI Rate Limit (429): Quota exceeded. Please wait.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate prediction' }, { status: 500 });
  }
}
