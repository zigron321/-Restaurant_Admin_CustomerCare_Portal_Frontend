import { api } from '../http';
import { call } from './call';

/** One row of GET /restaurants/mine/: a restaurant this person can work on. */
export interface MyRestaurant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  city: string;
  is_active: boolean;
  is_open: boolean;
  /** Team role at this restaurant (kitchen / delivery staff only). */
  my_role: string | null;
}

/** What the "Add restaurant" form sends to POST /restaurants/ (an owner creates the restaurant, the server makes them its owner). */
export interface NewRestaurantInput {
  name: string;
  description?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  opening_time: string; // HH:MM
  closing_time: string; // HH:MM
  allows_pickup: boolean;
  allows_delivery: boolean;
  allows_dine_in: boolean;
}

export const myRestaurantsApi = {
  list: () => call<MyRestaurant[]>(() => api.get('/restaurants/mine/')),
  create: (input: NewRestaurantInput) => call<{ id: string; name: string }>(() => api.post('/restaurants/', input)),
};
