'use client';

import { useBookableRestaurants } from '@/hooks/use-my-reservations';

/** "Restaurant" dropdown for the customer's lists. Hidden while there is only one restaurant to choose from. */
export function RestaurantFilter({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const list = useBookableRestaurants();
  const rows = list.data ?? [];
  if (rows.length < 2) return null;
  return (
    <label className="sv-filter">
      Restaurant
      <select className="sv-select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All restaurants</option>
        {rows.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
    </label>
  );
}
