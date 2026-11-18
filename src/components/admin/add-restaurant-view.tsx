'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/submit-button';
import { Switch } from '@/components/ui/switch';
import { TextArea } from '@/components/ui/text-area';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { useRestaurants } from '@/context/restaurant-context';
import { myRestaurantsApi } from '@/lib/api/my-restaurants';
import { parseError } from '@/lib/errors';
import { mapSaveError } from './settings-kit';

const FIELDS = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'postal_code', 'opening_time', 'closing_time'] as const;
type Field = (typeof FIELDS)[number];

const MAX: Record<string, number> = { name: 200, email: 254, phone: 15, address: 500, city: 100, state: 100, country: 100, postal_code: 10, description: 2000 };

const EMPTY = {
  name: '', description: '', email: '', phone: '', address: '', city: '', state: '', country: '', postal_code: '',
  opening_time: '09:00', closing_time: '22:00',
};

/** Owner form to open another restaurant (or the very first one). */
export function AddRestaurantView() {
  const router = useRouter();
  const { push } = useToast();
  const { restaurants, setActive, reload } = useRestaurants();
  const first = restaurants.length === 0;

  const [v, setV] = useState(EMPTY);
  const [pickup, setPickup] = useState(true);
  const [delivery, setDelivery] = useState(true);
  const [dineIn, setDineIn] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field | 'description' | 'services', string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (f: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setV((x) => ({ ...x, [f]: e.target.value }));
    setErrors((x) => ({ ...x, [f]: undefined }));
  };

  function validate() {
    const e: typeof errors = {};
    const need = (f: Field, label: string) => {
      if (!v[f].trim()) e[f] = `Enter ${label}`;
      else if (MAX[f] && v[f].trim().length > MAX[f]) e[f] = `Keep this under ${MAX[f]} characters`;
    };
    need('name', 'the restaurant name');
    need('address', 'the street address');
    need('city', 'the city');
    need('state', 'the state or province');
    need('country', 'the country');
    need('postal_code', 'the postal code');
    if (!v.email.trim()) e.email = 'Enter a contact email';
    else if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Enter a valid email address';
    if (!v.phone.trim()) e.phone = 'Enter a contact phone number';
    else if (v.phone.trim().length > MAX.phone) e.phone = `Phone numbers can be up to ${MAX.phone} characters`;
    if (!v.opening_time) e.opening_time = 'Choose an opening time';
    if (!v.closing_time) e.closing_time = 'Choose a closing time';
    else if (v.opening_time && v.closing_time <= v.opening_time) e.closing_time = 'Closing time must be after opening time';
    if (!pickup && !delivery && !dineIn) e.services = 'Choose at least one way guests can order';
    if (v.description.length > MAX.description) e.description = `Keep this under ${MAX.description} characters`;
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setBusy(true);
    try {
      const created = await myRestaurantsApi.create({
        name: v.name.trim(),
        description: v.description.trim() || undefined,
        email: v.email.trim(),
        phone: v.phone.trim(),
        address: v.address.trim(),
        city: v.city.trim(),
        state: v.state.trim(),
        country: v.country.trim(),
        postal_code: v.postal_code.trim(),
        opening_time: v.opening_time,
        closing_time: v.closing_time,
        allows_pickup: pickup,
        allows_delivery: delivery,
        allows_dine_in: dineIn,
      });
      await reload();
      setActive(created.id);
      push(`${created.name} is ready. Now add its menu.`);
      router.replace('/owner/menu');
    } catch (err) {
      const m = mapSaveError(err, [...FIELDS, 'description']);
      setErrors(m.fields as typeof errors);
      setFormError(m.form ?? (Object.keys(m.fields).length ? null : parseError(err).display));
      if (Object.keys(m.fields).length) requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="ad-head">
        <div>
          <h1>{first ? 'Create your first restaurant' : 'Add a restaurant'}</h1>
          <p>
            {first
              ? 'Tell guests about your restaurant. You can add photos, a map pin, tax and delivery zones in Settings afterwards.'
              : 'It gets its own menu, orders, staff, reviews and settings. You can switch between your restaurants from the sidebar.'}
          </p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="ad-stack">
        {formError && <Alert kind="error">{formError}</Alert>}

        <section className="card ad-card-pad" aria-labelledby="ar-about">
          <h2 id="ar-about" className="ad-card-title">About the restaurant</h2>
          <TextField label="Restaurant name" value={v.name} onChange={set('name')} error={errors.name} maxLength={MAX.name} autoComplete="organization" hint="Each restaurant needs its own unique name." />
          <TextArea label="Description" value={v.description} onChange={set('description')} error={errors.description} maxLength={MAX.description} counter rows={3} hint="A short welcome guests read before they order. You can add it later." />
        </section>

        <section className="card ad-card-pad" aria-labelledby="ar-contact">
          <h2 id="ar-contact" className="ad-card-title">Contact</h2>
          <div className="ad-two">
            <TextField label="Contact email" type="email" inputMode="email" value={v.email} onChange={set('email')} error={errors.email} autoComplete="email" />
            <TextField label="Phone" type="tel" inputMode="tel" value={v.phone} onChange={set('phone')} error={errors.phone} maxLength={MAX.phone} autoComplete="tel" hint="Up to 15 characters" />
          </div>
        </section>

        <section className="card ad-card-pad" aria-labelledby="ar-where">
          <h2 id="ar-where" className="ad-card-title">Address</h2>
          <TextField label="Street address" value={v.address} onChange={set('address')} error={errors.address} autoComplete="street-address" />
          <div className="ad-two">
            <TextField label="City" value={v.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
            <TextField label="State / province" value={v.state} onChange={set('state')} error={errors.state} autoComplete="address-level1" />
          </div>
          <div className="ad-two">
            <TextField label="Country" value={v.country} onChange={set('country')} error={errors.country} autoComplete="country-name" />
            <TextField label="Postal code" value={v.postal_code} onChange={set('postal_code')} error={errors.postal_code} maxLength={MAX.postal_code} autoComplete="postal-code" />
          </div>
          <p className="ad-note">After saving, open Settings → Restaurant details to drop a pin on the map.</p>
        </section>

        <section className="card ad-card-pad" aria-labelledby="ar-hours">
          <h2 id="ar-hours" className="ad-card-title">Opening hours</h2>
          <div className="ad-two">
            <TextField label="Opens at" type="time" value={v.opening_time} onChange={set('opening_time')} error={errors.opening_time} />
            <TextField label="Closes at" type="time" value={v.closing_time} onChange={set('closing_time')} error={errors.closing_time} />
          </div>
          <p className="ad-note">The same hours apply every day to start with. Change them per day, or add holidays, in Settings.</p>
        </section>

        <section className="card ad-card-pad" aria-labelledby="ar-how">
          <h2 id="ar-how" className="ad-card-title">How guests can order</h2>
          <div className="myr-toggles">
            <Switch label="Pickup" description="Guests collect their order at the restaurant." checked={pickup} onChange={(x) => { setPickup(x); setErrors((e) => ({ ...e, services: undefined })); }} />
            <Switch label="Delivery" description="You bring the order to the guest." checked={delivery} onChange={(x) => { setDelivery(x); setErrors((e) => ({ ...e, services: undefined })); }} />
            <Switch label="Dine-in" description="Guests order from their table and can book tables." checked={dineIn} onChange={(x) => { setDineIn(x); setErrors((e) => ({ ...e, services: undefined })); }} />
          </div>
          {errors.services && <p className="field-error" role="alert">{errors.services}</p>}
        </section>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button type="submit" loading={busy} loadingText="Creating…">{first ? 'Create restaurant' : 'Add restaurant'}</Button>
          {!first && <Button type="button" variant="ghost" onClick={() => router.push('/owner/restaurants')}>Cancel</Button>}
        </div>
      </form>
    </>
  );
}
