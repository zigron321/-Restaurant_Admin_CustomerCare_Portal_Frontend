'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/submit-button';
import { SafeImage } from '@/components/ui/safe-image';
import { useRestaurants } from '@/context/restaurant-context';
import { initials, mediaUrl } from '@/lib/format';
import './restaurant-switcher.css';

/** Owner page listing every restaurant they run, with a button to open one and a card to add another. */
export function MyRestaurantsView() {
  const router = useRouter();
  const { restaurants, active, setActive, ready } = useRestaurants();

  function open(id: string, to: string) {
    setActive(id);
    router.push(to);
  }

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>My restaurants</h1>
          <p>Every restaurant you run. Each one has its own menu, orders, staff, reviews and settings.</p>
        </div>
        <Link href="/owner/restaurants/new" className="btn btn-primary">＋ Add restaurant</Link>
      </div>

      {!ready ? (
        <div className="ad-skel" style={{ height: 160, borderRadius: 16 }} aria-busy="true" />
      ) : (
        <div className="myr-grid">
          {restaurants.map((r) => {
            const current = r.id === active?.id;
            return (
              <article key={r.id} className={`card myr-card ${current ? 'is-current' : ''}`}>
                <div className="myr-top">
                  <div className="myr-logo" aria-hidden="true">
                    <SafeImage src={mediaUrl(r.logo)} alt="" fallback={<span>{initials(r.name) || '🍽'}</span>} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="myr-name">{r.name}</div>
                    <div className="myr-meta">{r.city || '—'}</div>
                  </div>
                </div>
                <div className="myr-tags">
                  <span className={`myr-tag ${r.is_active ? 'is-on' : 'is-off'}`}>{r.is_active ? 'Visible to guests' : 'Hidden by the platform'}</span>
                  <span className={`myr-tag ${r.is_open ? 'is-on' : 'is-off'}`}>{r.is_open ? 'Taking orders' : 'Paused'}</span>
                  {current && <span className="myr-tag">Working on this one</span>}
                </div>
                <div className="myr-actions">
                  <Button onClick={() => open(r.id, '/owner')}>{current ? 'Open dashboard' : 'Switch to this'}</Button>
                  <Button variant="ghost" onClick={() => open(r.id, '/owner/settings')}>Settings</Button>
                </div>
              </article>
            );
          })}
          <Link href="/owner/restaurants/new" className="myr-add">
            <span aria-hidden="true">＋</span>
            <span>Add another restaurant</span>
          </Link>
        </div>
      )}
    </>
  );
}
