'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: '首页' },
  { href: '/history', label: '历史' },
  { href: '/progress', label: '进度' },
  { href: '/coach', label: 'AI教练' },
  { href: '/chat', label: '聊天' },
  { href: '/programs', label: '计划' },
  { href: '/exercises', label: '动作库' },
  { href: '/settings', label: '设置' },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-1">
      {LINKS.map((link) => {
        const active =
          link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'relative rounded-md px-3 py-2 text-sm font-medium transition-all',
              active
                ? 'text-primary after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
