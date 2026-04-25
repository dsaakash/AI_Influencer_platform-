import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const influencerData = [
  { name: 'Priya Sharma', email: 'priya@demo.com', code: 'PRIYASH7K', commission: 12, instagram: '@priyasharma', youtube: 'PriyaLifestyle' },
  { name: 'Arjun Mehta', email: 'arjun@demo.com', code: 'ARJUNM4X', commission: 10, instagram: '@arjunfit', youtube: 'ArjunFitness' },
  { name: 'Kavya Reddy', email: 'kavya@demo.com', code: 'KAVYAR9Q', commission: 15, instagram: '@kavyafashion', youtube: 'KavyaStyle' },
  { name: 'Rohit Gupta', email: 'rohit@demo.com', code: 'ROHITG2P', commission: 8, instagram: '@rohittech', youtube: 'TechWithRohit' },
  { name: 'Sneha Patel', email: 'sneha@demo.com', code: 'SNEHAP6M', commission: 11, instagram: '@snehacooks', youtube: 'SnehaKitchen' },
];

const products = ['Premium Membership', 'Starter Pack', 'Pro Bundle', 'Elite Subscription', 'Growth Plan', 'Annual Pass'];

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.aIInsight.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.click.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.influencer.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@demo.com', passwordHash: adminHash, role: 'ADMIN' },
  });
  console.log('✅ Admin created');

  // Create Finance user
  const finHash = await bcrypt.hash('finance123', 12);
  await prisma.user.create({
    data: { name: 'Finance Team', email: 'finance@demo.com', passwordHash: finHash, role: 'FINANCE' },
  });

  // Create influencers
  for (const inf of influencerData) {
    const hash = await bcrypt.hash('influencer123', 12);
    const user = await prisma.user.create({
      data: { name: inf.name, email: inf.email, passwordHash: hash, role: 'INFLUENCER' },
    });

    const influencer = await prisma.influencer.create({
      data: {
        userId: user.id,
        referralCode: inf.code,
        commissionRate: inf.commission,
        instagram: inf.instagram,
        youtube: inf.youtube,
        isActive: true,
      },
    });

    // Generate 90 days of clicks (50-200 per day)
    const clicks: any[] = [];
    for (let day = 90; day >= 0; day--) {
      const dailyClicks = Math.floor(randomBetween(20, 150));
      for (let c = 0; c < dailyClicks; c++) {
        const ts = new Date(daysAgo(day).getTime() + Math.random() * 86400000);
        const fakeIp = `${Math.floor(randomBetween(1,254))}.${Math.floor(randomBetween(1,254))}.${Math.floor(randomBetween(1,254))}.${Math.floor(randomBetween(1,254))}`;
        clicks.push({ influencerId: influencer.id, referralCode: inf.code, ipAddress: fakeIp, timestamp: ts, converted: Math.random() < 0.08 });
      }
    }
    await prisma.click.createMany({ data: clicks });

    // Generate 90 days of sales
    let totalEarnings = 0;
    for (let day = 90; day >= 0; day--) {
      const dailySales = Math.floor(randomBetween(1, 8));
      for (let s = 0; s < dailySales; s++) {
        const amount = Math.floor(randomBetween(999, 9999));
        const commission = (amount * inf.commission) / 100;
        const product = products[Math.floor(Math.random() * products.length)];
        const saleDate = new Date(daysAgo(day).getTime() + Math.random() * 86400000);
        await prisma.sale.create({
          data: {
            influencerId: influencer.id,
            productName: product,
            amount,
            commission,
            status: 'CONFIRMED',
            date: saleDate,
          },
        });
        totalEarnings += commission;
      }
    }

    // Update total earnings
    await prisma.influencer.update({ where: { id: influencer.id }, data: { totalEarnings } });

    // Generate payment records
    const paymentStatuses = ['PAID', 'PAID', 'APPROVED', 'PENDING'] as const;
    for (let month = 3; month >= 0; month--) {
      const status = paymentStatuses[month] || 'PENDING';
      const periodStart = new Date(daysAgo((month + 1) * 30));
      const periodEnd = new Date(daysAgo(month * 30));
      const amount = Math.floor(randomBetween(2000, 15000));
      await prisma.payment.create({
        data: {
          influencerId: influencer.id,
          amount,
          status,
          periodStart,
          periodEnd,
          paidAt: status === 'PAID' ? new Date(periodEnd.getTime() + 3 * 86400000) : null,
        },
      });
    }

    console.log(`✅ ${inf.name} seeded with ${clicks.length} clicks`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Admin:      admin@demo.com / admin123');
  console.log('  Finance:    finance@demo.com / finance123');
  console.log('  Influencer: priya@demo.com / influencer123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
