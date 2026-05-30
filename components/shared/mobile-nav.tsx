'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FEATURE_FLAGS } from '@/lib/shared/config/feature-flags';

interface MobileNavProps {
  hasCoach: boolean;
}

const NAV_ITEMS = [
  { href: '/onboarding', label: 'Intake' },
  { href: '/care-plan', label: 'Care Plan' },
  { href: '/education', label: 'Education' },
  { href: '/tracking', label: 'Tracking' },
  { href: '/account', label: 'Account' },
];

export function MobileNav({ hasCoach }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const linkClass = (href: string) =>
    `block rounded-md px-4 py-3 text-sm transition-colors hover:bg-sidebar-accent ${
      isActive(href)
        ? 'bg-sidebar-accent text-foreground font-medium'
        : 'text-sidebar-foreground'
    }`;

  return (
    <div className="flex md:hidden flex-col border-b border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-base font-semibold text-primary">PlantBridge</span>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
          className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="16" y2="16" />
              <line x1="16" y1="2" x2="2" y2="16" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="5" x2="16" y2="5" />
              <line x1="2" y1="9" x2="16" y2="9" />
              <line x1="2" y1="13" x2="16" y2="13" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 px-2 pb-3" onClick={() => setOpen(false)}>
          {NAV_ITEMS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {label}
            </Link>
          ))}
          {hasCoach && (
            <Link href="/messages" className={linkClass('/messages')}>Messages</Link>
          )}
          {hasCoach && (
            <Link href="/book" className={linkClass('/book')}>Book session</Link>
          )}
          {FEATURE_FLAGS.DISPENSARY_LOCATOR && (
            <Link href="/locator" className={linkClass('/locator')}>Locator</Link>
          )}
          <form method="POST" action="/logout" className="mt-1">
            <button
              type="submit"
              className="w-full rounded-md px-4 py-3 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
