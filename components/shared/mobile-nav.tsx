'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavProps {
  hasCoach: boolean;
}

const TABS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 11l8-7 8 7M6 10v9h12v-9" />
      </svg>
    ),
  },
  {
    href: '/care-plan',
    label: 'Plan',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 4h9a2 2 0 012 2v14a2 2 0 00-2-2H5z"/><path d="M16 6h3v12a2 2 0 00-2-2h-1"/>
      </svg>
    ),
  },
  {
    href: '/tracking',
    label: 'Track',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19V5M4 19h16" /><path d="M8 16l3-4 3 2 4-6" />
      </svg>
    ),
  },
  {
    href: '/education',
    label: 'Learn',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M2 13l10 5 10-5"/><path d="M2 18l10 5 10-5"/>
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Account',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.1 : 1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      </svg>
    ),
  },
] as const;

export function MobileNav({ hasCoach: _hasCoach }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        background: 'color-mix(in oklch, var(--card) 88%, transparent)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 -1px 0 var(--border)',
      }}
      aria-label="Main navigation"
    >
      {TABS.map(({ href, label, icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 px-0 pb-6 pt-2.5 transition-colors"
            style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}
            aria-current={active ? 'page' : undefined}
          >
            {icon(active)}
            <span className="text-[11px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
