/**
 * The restaurant a team member (owner, kitchen, driver) or the platform admin is working on right now.
 * It is kept in the browser and added to every request as `?active_restaurant=<id>`, so the server only
 * returns that restaurant's orders, menu, staff, reviews and so on.
 */
const KEY = 'savoria.activeRestaurant';

export function getActiveRestaurantId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(KEY) || null;
  } catch {
    return null; // private window / blocked storage: behave as "no restaurant chosen"
  }
}

export function setActiveRestaurantId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
