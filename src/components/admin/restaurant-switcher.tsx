'use client';

import './restaurant-switcher.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRestaurants } from '@/context/restaurant-context';

/** `/owner/orders/123` -> `/owner/orders`: detail pages belong to one restaurant, so go back to the section's list. */
function sectionRoot(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'owner' && parts[0] !== 'admin') return pathname;
  return '/' + parts.slice(0, 2).join('/');
}

/**
 * "Which restaurant am I working on?" Shown to owners, kitchen and delivery staff and the platform admin.
 * Picking another restaurant reloads every tab with that restaurant's own orders, menu, staff, reviews and so on.
 */
export function RestaurantSwitcher({ variant = 'sidebar' }: { variant?: 'sidebar' | 'bar' }) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { restaurants, active, canSwitch, allowAll, ready, failed, setActive } = useRestaurants();

  if (!ready || failed) return null;
  if (restaurants.length === 0 && !allowAll) return null;

  const isOwner = user?.role === 'RESTAURANT_OWNER';

  function change(next: string) {
    setActive(next || null);
    const target = sectionRoot(pathname);
    if (target !== pathname) router.replace(target);
  }

  return (
    <div className={`rs rs-${variant}`}>
      <label className="rs-label" htmlFor={id}>Restaurant</label>
      {canSwitch ? (
        <select id={id} className="rs-select" value={active?.id ?? ''} onChange={(e) => change(e.target.value)}>
          {allowAll && <option value="">All restaurants</option>}
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}{r.city ? ` · ${r.city}` : ''}{r.is_active ? '' : ' (hidden)'}
            </option>
          ))}
        </select>
      ) : (
        <div className="rs-single" id={id}>🍽 {active?.name ?? restaurants[0]?.name}</div>
      )}
      {isOwner && variant === 'sidebar' && (
        <Link href="/owner/restaurants/new" className="rs-add">＋ Add restaurant</Link>
      )}
    </div>
  );
}
