'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import clsx from 'clsx';
import { NAV } from '@/lib/nav';
import { useAppStore } from '@/lib/store/useAppStore';
import { useAuthStore } from '@/lib/store/useAuthStore';

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <Cmp className={className} strokeWidth={2} />;
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={clsx(
        'flex flex-shrink-0 flex-col border-r border-hair bg-gradient-to-b from-raised to-base transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[252px]'
      )}
    >
      <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-hair px-4">
        <div className="flex flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan to-cyan-dim shadow-glow" style={{ width: 26, height: 26 }}>
          <Icons.ShieldCheck className="h-4 w-4 text-[#05131a]" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="whitespace-nowrap font-display text-[14.5px] font-bold tracking-wide">
            LandGuard <span className="text-cyan">AI</span>
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2.5 space-y-1">
        {NAV.map((group) => {
          // Filter items based on user role
          const visibleItems = group.items.filter((item) => {
            if (!item.roles) return true;
            if (!user) return true; // Show until loaded
            return item.roles.includes(user.role) || user.role === 'SUPER_ADMIN';
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group}>
              {!collapsed && (
                <div className="px-2.5 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-wider text-txt-tertiary">
                  {group.group}
                </div>
              )}
              {visibleItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={clsx(
                      'relative my-0.5 flex items-center gap-2.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                      collapsed && 'justify-center',
                      active ? 'border-cyanline bg-cyan-glow text-cyan font-semibold' : 'border-transparent text-txt-secondary hover:bg-white/5 hover:text-txt-primary'
                    )}
                  >
                    {active && <span className="absolute -left-2 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded bg-cyan" />}
                    <Icon name={item.icon} className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="overflow-hidden truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto rounded-full border border-cyanline/30 bg-cyan-glow/40 px-1.5 py-0.2 font-mono text-[9.5px] text-cyan">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="flex-shrink-0 border-t border-hair p-2.5">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-hair py-2 text-[12px] text-txt-tertiary hover:border-mid hover:text-txt-secondary"
        >
          <Icons.ChevronLeft className={clsx('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
