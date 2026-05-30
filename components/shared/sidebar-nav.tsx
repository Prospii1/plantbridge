'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/shared/config/feature-flags';

interface SidebarNavProps {
  hasCoach: boolean;
}

const NAV_ITEMS = [
  { href: '/onboarding', label: 'Intake' },
  { href: '/care-plan', label: 'Care Plan' },
  { href: '/education', label: 'Education' },
  { href: '/tracking', label: 'Tracking' },
  { href: '/account', label: 'Account' },
];

export function SidebarNav({ hasCoach }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent ${
      isActive(href)
        ? 'bg-sidebar-accent text-foreground font-medium'
        : 'text-sidebar-foreground'
    }`;

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link key={href} href={href} className={linkClass(href)}>
          {label}
        </Link>
      ))}
      {hasCoach && (
        <Link href="/messages" className={linkClass('/messages')}>
          Messages
        </Link>
      )}
      {hasCoach && (
        <Link href="/book" className={linkClass('/book')}>
          Book session
        </Link>
      )}
      {FEATURE_FLAGS.DISPENSARY_LOCATOR && (
        <Link href="/locator" className={linkClass('/locator')}>
          Locator
        </Link>
      )}
    </nav>
  );
}
