'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { getInitials, cn } from '@/lib/utils';
import { LayoutDashboard, CreditCard, LogOut, Zap } from 'lucide-react';

const navItems = [
  { href: '/influencer', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/influencer/payments', label: 'My Payments', icon: CreditCard },
];

export default function InfluencerSidebar({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{ background: 'rgba(13, 13, 22, 0.95)', borderRight: '1px solid rgba(168,85,247,0.15)', backdropFilter: 'blur(12px)' }}>
      <div className="p-6 border-b" style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">InfluenceIQ</h1>
            <p className="text-xs text-slate-500">Creator Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/influencer' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}>
              <Icon className={cn('w-4 h-4', isActive ? 'text-purple-400' : 'text-slate-500')} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: 'rgba(168,85,247,0.1)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white">
            {getInitials(user?.name || 'I')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500">Influencer</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
