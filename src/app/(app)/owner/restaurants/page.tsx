import type { Metadata } from 'next';
import { MyRestaurantsView } from '@/components/admin/my-restaurants-view';

export const metadata: Metadata = { title: 'My restaurants' };

export default function MyRestaurantsPage() {
  return <MyRestaurantsView />;
}
