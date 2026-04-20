'use client';

import { Home, ShoppingBag, MessageCircle, Package2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavTab = 'home' | 'orders' | 'conversations' | 'catalog' | 'more';

interface TabConfig {
  id: NavTab;
  label: string;
  Icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badgeLabel: (count: number) => string;
}

const TABS: TabConfig[] = [
  {
    id: 'home',
    label: 'Accueil',
    Icon: Home,
    badgeLabel: (n) => `Accueil, ${n} notification${n > 1 ? 's' : ''}`,
  },
  {
    id: 'orders',
    label: 'Commandes',
    Icon: ShoppingBag,
    badgeLabel: (n) => `Commandes, ${n} en attente`,
  },
  {
    id: 'conversations',
    label: 'Conversations',
    Icon: MessageCircle,
    badgeLabel: (n) => `Conversations, ${n} non lue${n > 1 ? 's' : ''}`,
  },
  {
    id: 'catalog',
    label: 'Catalogue',
    Icon: Package2,
    badgeLabel: (n) => `Catalogue, ${n} alerte${n > 1 ? 's' : ''}`,
  },
  {
    id: 'more',
    label: 'Plus',
    Icon: MoreHorizontal,
    badgeLabel: (n) => `Plus, ${n} notification${n > 1 ? 's' : ''}`,
  },
];

interface MobileNavBarProps {
  activeTab: NavTab;
  badges?: Partial<Record<NavTab, number>>;
  onTabChange: (tab: NavTab) => void;
  className?: string;
}

function BadgeCount({ count }: { count: number }) {
  return (
    <span className="absolute -top-1 -right-1 bg-error text-white text-label rounded-badge min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
      {count >= 10 ? '9+' : count}
    </span>
  );
}

export function MobileNavBar({ activeTab, badges = {}, onTabChange, className }: MobileNavBarProps) {
  return (
    <nav
      role="navigation"
      aria-label="Navigation principale"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-surface border-t border-border',
        'min-h-[60px]',
        className
      )}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <ul className="flex h-full items-stretch" role="list">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const badgeCount = badges[tab.id] ?? 0;
          const hasBadge = badgeCount > 0;
          const ariaLabel = hasBadge ? tab.badgeLabel(badgeCount) : tab.label;

          return (
            <li key={tab.id} className="flex-1" role="listitem">
              <button
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={ariaLabel}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'w-full h-full min-h-[44px] min-w-[44px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                  'transition-colors',
                  isActive
                    ? 'text-primary bg-primary-light'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <div className="relative">
                  <tab.Icon size={22} aria-hidden />
                  {hasBadge && <BadgeCount count={badgeCount} />}
                </div>
                <span className="text-label leading-none">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
