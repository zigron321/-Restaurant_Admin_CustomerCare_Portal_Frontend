import type { Metadata } from 'next';
import { AddRestaurantView } from '@/components/admin/add-restaurant-view';

export const metadata: Metadata = { title: 'Add restaurant' };

export default function AddRestaurantPage() {
  return <AddRestaurantView />;
}
