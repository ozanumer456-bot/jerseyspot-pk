
# Multi-Store Platform — Implementation Plan

## 1. Database Schema

New migration adds:

**`stores` table** — id (uuid), store_slug (unique text), owner_email, store_name, tagline, primary_color, secondary_color, logo_letter, hero_headline, hero_subheading, hero_image_url, whatsapp_number, email, instagram_url, facebook_url, karachi_shipping, other_city_shipping, free_shipping_above, status ('active'|'inactive'), created_at.

**`store_id` column** added to `products`, `orders`, `customers`, `settings` (nullable → backfill → NOT NULL, FK to `stores.id`).

**Backfill**: insert one KitVerse store row, copy current `settings` row values into it, then set `store_id` on every existing products/orders/customers row.

**Roles**: extend `app_role` enum with `superadmin`. Add `store_id uuid null` column to `user_roles` (null for superadmin, required for admin). Update `has_role` and add `has_store_role(_user, _store_id, _role)` security-definer helper. Grant humza.merch@gmail.com the `superadmin` role via existing allowlist trigger.

**RLS** (rewritten per table):
- `stores`: superadmin full; store admin read own; anon read active stores (public storefront needs it).
- `products`: anon SELECT where store's status='active'; store admin full on own store; superadmin full.
- `orders` / `customers`: store admin read/write own; superadmin full; anon insert via `place_order` RPC only.
- `settings`: replaced by per-store fields on `stores`; kept for back-compat but scoped by store_id.

`place_order` RPC gains a `p_store_id` parameter.

## 2. Routing

Path structure (keeps existing `/` working):

```text
/                              → KitVerse storefront (default store, store_id lookup by slug 'kitverse')
/shop, /product/$id, /cart,    → default store (unchanged)
  /checkout, /contact, /about
/admin                         → default store admin (unchanged, gated by admin role for default store)

/store/$slug                   → storefront for that store
/store/$slug/shop
/store/$slug/product/$id
/store/$slug/cart
/store/$slug/checkout
/store/$slug/contact
/store/$slug/about
/store/$slug/admin             → that store's admin (gated by admin role scoped to that store_id)

/superadmin                    → superadmin dashboard (gated by superadmin role)
/auth                          → single login page (existing /admin/login redirects here)
```

New file structure:
- `src/routes/store.$slug.tsx` — layout that resolves store by slug, provides `StoreContext`, applies branding
- `src/routes/store.$slug.index.tsx`, `.shop.tsx`, `.product.$id.tsx`, `.cart.tsx`, `.checkout.tsx`, `.about.tsx`, `.contact.tsx` — thin wrappers reusing the same page components with store context
- `src/routes/_authenticated.store.$slug.admin.tsx` — per-store admin
- `src/routes/_authenticated.superadmin.tsx` — superadmin dashboard

## 3. Store Context & Data Scoping

New `src/lib/store-context.tsx`:
- `StoreProvider` fetches store by slug (or default 'kitverse') and exposes `{ store, storeId }`
- `useStore()` hook used by all page components

Update `src/lib/products.ts`, `src/lib/settings.ts`, `src/store/cart.ts`, `src/store/wishlist.ts`, `src/lib/invoice.ts`:
- All queries filter by `store_id`
- Cart/wishlist storage keys namespaced by store slug
- `useSettings()` returns the current store's row from `stores` (renamed internally; `settings` table becomes read-only legacy)

## 4. Superadmin Panel (`/superadmin`)

Tabs:
1. **Stores** — table of all stores; row actions: activate/deactivate, edit branding (full form), open `/store/{slug}/admin` (impersonate = just navigate; superadmin role already permits access via `has_store_role` policy allowing superadmin fallback), delete
2. **Create Store** — modal: name, slug (auto-generated + editable), owner_email, primary_color, logo_letter. On save: insert store row + (optionally) invite owner via `supabase.auth.admin.inviteUserByEmail` through a server function using `supabaseAdmin`, then insert `user_roles(user_id, role='admin', store_id=new.id)` when they confirm (trigger-based mapping by email → store_id on signup)
3. **Analytics** — cross-store totals: revenue, order count per store; leaderboard table

## 5. Store Owner Admin (`/store/{slug}/admin`)

Reuses the existing `_authenticated.admin.tsx` component, wrapped to:
- Read `slug` param → resolve `storeId`
- Verify signed-in user has `admin` role scoped to that `store_id` (or `superadmin`)
- All CRUD calls filter/insert with that `store_id`

The existing `/admin` route stays and hard-codes the KitVerse store_id lookup so nothing breaks.

## 6. Auth Flow

- Single `/auth` route (rename `/admin/login`). Redirects on success:
  - superadmin → `/superadmin`
  - admin with store_id → `/store/{slug}/admin`
  - default-store admin → `/admin`
- `useAuth()` returns `{ user, isSuperadmin, adminStoreIds: string[] }`
- `_authenticated` layout gate stays; child routes do their own role check

## 7. Migration of Existing Data

Single migration handles:
1. Create `stores` table + GRANTs + RLS
2. Insert KitVerse store using current `settings` row values (slug='kitverse')
3. Add `store_id` nullable to products/orders/customers, backfill = KitVerse id, set NOT NULL + FK
4. Add `superadmin` to enum, add `store_id` to `user_roles`
5. Grant humza.merch@gmail.com superadmin (via updated allowlist trigger)
6. Rewrite all RLS policies
7. Update `place_order` RPC signature

## 8. What Stays The Same

- `/`, `/shop`, `/product/$id`, `/cart`, `/checkout`, `/admin` behavior for the default KitVerse store
- All existing components, PDF invoice generator, cart/wishlist stores (adjusted for store_id)
- Branding system — now driven by `stores` row instead of `settings`

## Technical Notes

- Storefront pages are shared components that accept `storeId` via context; no code duplication between `/shop` and `/store/$slug/shop`
- Cart Zustand store uses `persist` with a dynamic name → refactor to keyed-per-store cart map
- Product images / hero images remain URL strings on the store row
- Superadmin invite flow: server function using `supabaseAdmin.auth.admin.inviteUserByEmail`; on signup, a trigger inserts `user_roles(admin, store_id)` if `stores.owner_email = new.email`
- No subdomain wildcard DNS work — path-based only

## Rollout Order

1. Migration (schema + backfill + RLS + roles)
2. StoreContext + refactor lib/queries to accept storeId
3. `/store/$slug/*` route wrappers
4. `/superadmin` panel
5. Per-store admin route
6. Auth redirect logic + invite flow

Ready to proceed once you approve.
