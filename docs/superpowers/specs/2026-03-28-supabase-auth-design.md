# Supabase Auth: Google OAuth + Email Magic Link

## Overview

Add user authentication to the Woodstock Giveaway app so that giveaway items are owned by the user who created them. Browsing remains open to everyone; posting, editing, moving, and deleting items requires sign-in.

## Auth Providers

- **Google OAuth** (free via Google Cloud Console)
- **Email magic link** (built into Supabase, no cost)
- Apple OAuth was considered but dropped (requires $99/yr Apple Developer account)

## Auth Flow

- **Just-in-time**: No persistent sign-in button. Auth modal appears only when an unauthenticated user tries to post, move, or delete an item.
- **Auth modal** contains: "Continue with Google" button, divider, email input + "Send magic link" button, and a close button.
- **Post-auth**: Modal closes, user can retry their action.
- **Session persistence**: Supabase handles tokens in localStorage. Users stay signed in across reloads.

## Signed-In State

- Minimal indicator in Navbar (desktop) / MobileBottomBar (mobile): Google avatar or first letter of email, plus sign-out button.
- No profile page or account management.

## Database Changes

Already applied to Supabase:

```sql
ALTER TABLE giveaway_items
ADD COLUMN owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE giveaway_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items"
ON giveaway_items FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own items"
ON giveaway_items FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own items"
ON giveaway_items FOR UPDATE TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own items"
ON giveaway_items FOR DELETE TO authenticated
USING (owner_id = auth.uid());
```

## UI Ownership Rules

- All users see all items on the map (SELECT is open).
- Delete button only appears on popups for items the current user owns.
- Long-press-to-move only works on items the current user owns.
- "List Your Giveaway" button is unchanged visually; auth check happens on click.

## Components

### New

- **`AuthModal.tsx`** — Sign-in modal/bottom sheet with Google OAuth and magic link options. Matches existing UI patterns (centered modal on desktop, bottom sheet on mobile).

### Modified

- **`App.tsx`** — Auth state management (`onAuthStateChange`, `getSession`), pass user/session to child components, gate protected actions behind auth check.
- **`Navbar.tsx`** — Show user avatar/initial + sign-out when authenticated.
- **`MobileBottomBar.tsx`** — Same signed-in indicator for mobile.
- **`LongPressMarker.tsx`** — Only show delete button and enable drag for items where `owner_id` matches current user.
- **`GiveawayForm.tsx`** — Include `owner_id` (from `auth.uid()`) when inserting new items.
- **`types.ts`** — Add `owner_id` field to `GiveawayItem` interface.
- **`supabaseClient.ts`** — No changes needed; existing client supports auth.

## Supabase Dashboard Configuration

- Email provider: enabled with magic link (done)
- Google OAuth: to be configured later with Google Cloud Console credentials
- Site URL: `http://localhost:5173` (update for production)
- Redirect URLs: `http://localhost:5173`
- RLS policies: applied (see SQL above)

## Out of Scope

- User profiles or account management
- Admin/moderation tools
- Rate limiting
- Email verification beyond magic link
