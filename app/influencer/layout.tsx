import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InfluencerSidebar from '@/components/InfluencerSidebar';

export default async function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const role = (session.user as any).role;
  if (role !== 'INFLUENCER') redirect('/admin');

  return (
    <div className="flex min-h-screen">
      <InfluencerSidebar user={session.user} />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
