'use client';

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { getActiveRestaurantId, setActiveRestaurantId } from '@/lib/active-restaurant';
import { myRestaurantsApi, type MyRestaurant } from '@/lib/api/my-restaurants';

export const MY_RESTAURANTS_KEY = ['my-restaurants'] as const;

interface RestaurantContextValue {
  /** Everything this person can work on. */
  restaurants: MyRestaurant[];
  /** The one they are working on now. null = "All restaurants" (platform admin only) or no restaurant yet (new owner). */
  active: MyRestaurant | null;
  /** Owners and platform admins can have several; staff only the ones they were added to. */
  canSwitch: boolean;
  /** Platform admins may look at every restaurant at once. */
  allowAll: boolean;
  ready: boolean;
  /** True when the list of restaurants could not be loaded (the pages then work as before, without a switcher). */
  failed: boolean;
  setActive: (id: string | null) => void;
  reload: () => Promise<void>;
}

const Ctx = createContext<RestaurantContextValue | null>(null);

const TEAM_ROLES = ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'RESTAURANT_STAFF', 'DELIVERY_STAFF', 'SUPER_ADMIN'];

/**
 * Wraps the signed-in area. For owners, kitchen/delivery staff and the platform admin it loads their restaurants,
 * remembers the one being worked on, and re-mounts the page when it changes so every tab shows that restaurant's data.
 * Customers pass straight through.
 */
export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const team = !!user && TEAM_ROLES.includes(user.role);
  const allowAll = user?.role === 'SUPER_ADMIN';

  const list = useQuery({ queryKey: MY_RESTAURANTS_KEY, queryFn: myRestaurantsApi.list, enabled: team, staleTime: 60_000 });
  const restaurants = useMemo(() => list.data ?? [], [list.data]);

  // `chosen` is what the person picked; it only counts if they still have access to it.
  const [chosen, setChosen] = useState<string | null>(() => getActiveRestaurantId());
  const active = useMemo(() => {
    if (!team || !list.data) return null;
    const picked = restaurants.find((r) => r.id === chosen);
    if (picked) return picked;
    return allowAll ? null : restaurants[0] ?? null;
  }, [team, list.data, restaurants, chosen, allowAll]);
  const activeId = active?.id ?? null;

  // Keep the stored id in step with what is really active (first sign-in, or a restaurant that is gone).
  useEffect(() => {
    if (!team) return;
    if (list.isError) setActiveRestaurantId(null); // can't verify it, so don't send a possibly stale id
    else if (list.data && getActiveRestaurantId() !== activeId) setActiveRestaurantId(activeId);
  }, [team, list.data, list.isError, activeId]);

  const setActive = useCallback(
    (id: string | null) => {
      if (id === activeId) return;
      setActiveRestaurantId(id);
      setChosen(id);
      // Throw away everything loaded for the previous restaurant (the list of restaurants stays).
      void qc.cancelQueries({ predicate: (q) => q.queryKey[0] !== MY_RESTAURANTS_KEY[0] });
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== MY_RESTAURANTS_KEY[0] });
    },
    [activeId, qc],
  );

  const reload = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: MY_RESTAURANTS_KEY });
  }, [qc]);

  const value = useMemo<RestaurantContextValue>(
    () => ({
      restaurants,
      active,
      canSwitch: allowAll || restaurants.length > 1,
      allowAll,
      ready: !team || !list.isPending,
      failed: list.isError,
      setActive,
      reload,
    }),
    [restaurants, active, allowAll, team, list.isPending, list.isError, setActive, reload],
  );

  if (!team) return <>{children}</>;

  if (list.isPending) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner spinner-lg" role="status" aria-label="Loading your restaurants" />
      </div>
    );
  }

  // Re-mounting on a change makes every page forget the old restaurant's data and load the new one's.
  return (
    <Ctx.Provider value={value}>
      <Fragment key={activeId ?? 'all'}>{children}</Fragment>
    </Ctx.Provider>
  );
}

export function useRestaurants(): RestaurantContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Customers (and pages outside the signed-in area) have no restaurant to choose.
    return { restaurants: [], active: null, canSwitch: false, allowAll: false, ready: true, failed: false, setActive: () => {}, reload: async () => {} };
  }
  return ctx;
}