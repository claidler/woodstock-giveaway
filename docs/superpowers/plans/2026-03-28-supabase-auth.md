# Supabase Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth and email magic link authentication so giveaway items are owned by the user who created them, with just-in-time auth prompts and ownership-based UI controls.

**Architecture:** Auth state is managed in `App.tsx` via Supabase's `onAuthStateChange` listener, then passed down as props. A new `AuthModal` component handles sign-in UI. Ownership is enforced server-side via RLS (already applied) and client-side by conditionally rendering edit/delete controls.

**Tech Stack:** React 18, TypeScript, Supabase Auth (`@supabase/supabase-js` v2), Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types.ts` | Modify | Add `owner_id` to `GiveawayItem` and `GiveawayItemRow` |
| `src/utils.ts` | Modify | Pass `owner_id` through in `rowToItem` |
| `src/components/AuthModal.tsx` | Create | Sign-in modal with Google OAuth + magic link |
| `src/App.tsx` | Modify | Auth state, pass user down, gate actions, include `owner_id` on insert |
| `src/components/Navbar.tsx` | Modify | Show user avatar/initial + sign-out when authenticated |
| `src/components/MobileBottomBar.tsx` | Modify | Show user avatar/initial + sign-out when authenticated |
| `src/components/LongPressMarker.tsx` | Modify | Conditionally show delete/move based on ownership |

---

### Task 1: Add `owner_id` to types and utils

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils.ts`

- [ ] **Step 1: Add `owner_id` to `GiveawayItem` interface**

In `src/types.ts`, add `owner_id` to both interfaces:

```typescript
export type Category = 'furniture' | 'clothing' | 'entertainment' | 'pets' | 'kids';

export interface GiveawayItem {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: Category;
  timePosted: string;
  locationDetails: string;
  owner_id: string;
}

export interface GiveawayItemRow {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: Category;
  location_details: string;
  created_at: string;
  owner_id: string;
}
```

- [ ] **Step 2: Update `rowToItem` to pass through `owner_id`**

In `src/utils.ts`, add `owner_id` to the returned object in `rowToItem`:

```typescript
export function rowToItem(row: GiveawayItemRow): GiveawayItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    locationDetails: row.location_details,
    timePosted: formatRelativeTime(row.created_at),
    owner_id: row.owner_id,
  };
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: Errors in components that don't yet supply `owner_id` — that's fine, we'll fix them in later tasks. No errors in `types.ts` or `utils.ts` themselves.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/utils.ts
git commit -m "feat: add owner_id to GiveawayItem types and rowToItem"
```

---

### Task 2: Create `AuthModal` component

**Files:**
- Create: `src/components/AuthModal.tsx`

- [ ] **Step 1: Create the AuthModal component**

Create `src/components/AuthModal.tsx`. This modal matches the existing app styling (same backdrop, rounded corners, bottom-sheet on mobile, centered on desktop as `GiveawayForm` does):

```tsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-[#575279]/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#fffaf3] w-full md:max-w-sm md:mx-4 rounded-t-3xl md:rounded-3xl shadow-2xl border-t md:border border-[#ebe4df]/50 animate-slide-up">
        {/* Drag handle for mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#ebe4df]" />
        </div>

        <div className="px-6 pt-4 md:pt-6 pb-6 md:pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-serif font-semibold text-[#575279]">Sign in to continue</h3>
              <p className="text-xs text-[#9893a5] mt-0.5">Sign in to list and manage your giveaways.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f4ede8] flex items-center justify-center text-[#9893a5] hover:text-[#575279] hover:bg-[#ebe4df] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {magicLinkSent ? (
            <div className="text-center py-4">
              <span className="material-symbols-outlined text-4xl text-[#d7827e] mb-2 block">mark_email_read</span>
              <p className="text-sm font-serif font-semibold text-[#575279]">Check your email</p>
              <p className="text-xs text-[#9893a5] mt-1">We sent a sign-in link to <strong>{email}</strong></p>
              <button onClick={onClose} className="mt-4 text-xs text-[#9893a5] hover:text-[#d7827e] transition-colors">
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Google OAuth */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border border-[#ebe4df] rounded-xl py-3 px-4 flex items-center justify-center gap-3 text-sm font-medium text-[#575279] hover:border-[#d7827e]/30 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#ebe4df]" />
                <span className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-[#ebe4df]" />
              </div>

              {/* Magic link */}
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                  className="w-full bg-white border border-[#ebe4df] rounded-xl py-3 px-4 text-base md:text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50"
                />
                <button
                  onClick={handleMagicLink}
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#d7827e] text-[#faf4ed] py-3 rounded-xl font-serif font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </div>

              {error && (
                <p className="text-[11px] text-[#d7827e] mt-3 text-center">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors in `AuthModal.tsx` (it has no dependencies on the not-yet-updated components).

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthModal.tsx
git commit -m "feat: add AuthModal component with Google OAuth and magic link"
```

---

### Task 3: Wire up auth state in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

This is the biggest change. We need to:
1. Track auth session state
2. Show `AuthModal` when an unauthenticated user tries a protected action
3. Include `owner_id` on insert
4. Pass `userId` to child components

- [ ] **Step 1: Add auth imports and state**

At the top of `App.tsx`, add the `Session` import and `AuthModal` import:

```typescript
import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { Category, GiveawayItem, GiveawayItemRow } from './types';
import { WOODSTOCK_CENTER } from './constants';
import { rowToItem } from './utils';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import GiveawayForm from './components/GiveawayForm';
import MobileBottomBar from './components/MobileBottomBar';
import PinDropBanner from './components/PinDropBanner';
import MarkerDragBanner from './components/MarkerDragBanner';
import MapClickHandler from './components/MapClickHandler';
import DraggableMarker from './components/DraggableMarker';
import LongPressMarker from './components/LongPressMarker';
import MapRefCapture from './components/MapRefCapture';
import AuthModal from './components/AuthModal';
```

- [ ] **Step 2: Add session state and auth listener**

Inside the `App` function, after existing state declarations, add:

```typescript
const [session, setSession] = useState<Session | null>(null);
const [showAuthModal, setShowAuthModal] = useState(false);
```

Add a new `useEffect` for auth state (place it after the existing Supabase data-fetch `useEffect`):

```typescript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
    if (session) setShowAuthModal(false);
  });

  return () => subscription.unsubscribe();
}, []);
```

- [ ] **Step 3: Add `requireAuth` helper and gate `startAddFlow`**

Add a helper function inside the `App` component:

```typescript
const requireAuth = (action: () => void) => {
  if (session) {
    action();
  } else {
    setShowAuthModal(true);
  }
};
```

Update `startAddFlow` call sites — wrap the `onStartAddFlow` prop passed to `Navbar` and `MobileBottomBar`:

In the JSX, change the Navbar line:
```tsx
<Navbar onStartAddFlow={() => requireAuth(startAddFlow)} session={session} onSignOut={() => supabase.auth.signOut()} />
```

Change the MobileBottomBar line:
```tsx
<MobileBottomBar onStartAddFlow={() => requireAuth(startAddFlow)} onRecentreMap={() => mapRef.current?.flyTo(WOODSTOCK_CENTER, 15, { duration: 0.5 })} session={session} onSignOut={() => supabase.auth.signOut()} />
```

Also change the desktop add card's `onClick`:
```tsx
<div onClick={() => requireAuth(startAddFlow)} className="bg-white/95 ...">
```

- [ ] **Step 4: Include `owner_id` in the insert**

In the `submitItem` function, add `owner_id` to the insert object. Change the insert call:

```typescript
const { data, error } = await supabase
  .from('giveaway_items')
  .insert({
    title: formData.title.trim(),
    description: formData.description.trim(),
    lat: newPinLocation.lat,
    lng: newPinLocation.lng,
    category: formData.category,
    location_details: formData.locationDetails.trim(),
    owner_id: session!.user.id,
  })
  .select()
  .single();
```

- [ ] **Step 5: Pass `userId` to `LongPressMarker`**

Update the `LongPressMarker` usage in the JSX to pass the current user's ID:

```tsx
{filteredItems.map(item => (
  <LongPressMarker
    key={item.id}
    item={item}
    isMoving={movingItemId === item.id}
    mapRef={mapRef}
    onMoveStart={handleMoveStart}
    onMoveEnd={handleMoveEnd}
    onDelete={handleDelete}
    userId={session?.user.id ?? null}
  />
))}
```

- [ ] **Step 6: Render `AuthModal`**

Add right before the closing `</div>` of the root element, after the `MobileBottomBar`:

```tsx
{showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
```

- [ ] **Step 7: Verify build**

Run: `npx tsc --noEmit`
Expected: Errors about `Navbar`, `MobileBottomBar`, and `LongPressMarker` not accepting the new props yet. That's expected — we fix those next.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up auth state, requireAuth gate, and owner_id on insert"
```

---

### Task 4: Update `Navbar` with user indicator

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Update Navbar to accept and display auth state**

Replace the full content of `src/components/Navbar.tsx`:

```tsx
import type { Session } from '@supabase/supabase-js';

interface NavbarProps {
  onStartAddFlow: () => void;
  session: Session | null;
  onSignOut: () => void;
}

export default function Navbar({ onStartAddFlow, session, onSignOut }: NavbarProps) {
  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initial = (displayName[0] || '?').toUpperCase();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#faf4ed]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-16 md:h-20 shadow-none border-b border-[#ebe4df]/50">
      <div className="flex items-center gap-12">
        <span className="text-lg md:text-2xl font-serif italic font-semibold text-[#d7827e] tracking-tight">The Woodstock Giveaway</span>
        <div className="hidden md:flex gap-8 items-center">
          <a href="#" className="text-[#d7827e] border-b border-[#d7827e] pb-1 font-serif font-medium tracking-tight">Woodstock Map</a>
          <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">My Street</a>
          <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">Community Rules</a>
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={onStartAddFlow} className="hidden md:block bg-[#d7827e] text-[#faf4ed] px-6 py-2 rounded-lg font-serif font-medium text-sm hover:opacity-90 active:scale-95 transition-all">
          List Your Giveaway
        </button>
        {user ? (
          <div className="hidden md:flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df] bg-[#907aa9] flex items-center justify-center text-[#faf4ed]">
                <span className="font-serif font-semibold">{initial}</span>
              </div>
            )}
            <button onClick={onSignOut} className="text-xs text-[#9893a5] hover:text-[#d7827e] transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-4 text-[#575279]/70">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#d7827e] transition-colors">notifications</span>
            <div className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df] overflow-hidden cursor-pointer bg-[#907aa9] flex items-center justify-center text-[#faf4ed]">
              <span className="font-serif font-semibold">?</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors for `Navbar.tsx`. May still have errors for other components.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: show user avatar and sign-out in Navbar when authenticated"
```

---

### Task 5: Update `MobileBottomBar` with user indicator

**Files:**
- Modify: `src/components/MobileBottomBar.tsx`

- [ ] **Step 1: Update MobileBottomBar to show auth state**

Replace the full content of `src/components/MobileBottomBar.tsx`:

```tsx
import type { Session } from '@supabase/supabase-js';

interface MobileBottomBarProps {
  onStartAddFlow: () => void;
  onRecentreMap: () => void;
  session: Session | null;
  onSignOut: () => void;
}

export default function MobileBottomBar({ onStartAddFlow, onRecentreMap, session, onSignOut }: MobileBottomBarProps) {
  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initial = (displayName[0] || '?').toUpperCase();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf4ed]/95 backdrop-blur-md h-20 border-t border-[#ebe4df] flex justify-around items-center px-6 z-50">
      <button onClick={onRecentreMap} className="flex flex-col items-center gap-1.5 text-[#d7827e]">
        <span className="material-symbols-outlined">map</span>
        <span className="text-[9px] font-semibold tracking-wider uppercase">Map</span>
      </button>
      <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
        <span className="material-symbols-outlined">format_list_bulleted</span>
        <span className="text-[9px] font-semibold tracking-wider uppercase">List</span>
      </a>
      <div onClick={onStartAddFlow} className="w-14 h-14 bg-[#d7827e] rounded-full -mt-12 flex items-center justify-center text-[#faf4ed] shadow-xl ring-4 ring-[#faf4ed] cursor-pointer active:scale-90 transition-transform">
        <span className="material-symbols-outlined text-2xl">add</span>
      </div>
      <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
        <span className="material-symbols-outlined">bookmark</span>
        <span className="text-[9px] font-semibold tracking-wider uppercase">Saved</span>
      </a>
      {user ? (
        <button onClick={onSignOut} className="flex flex-col items-center gap-1.5 text-[#575279]/70">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#907aa9] flex items-center justify-center text-[#faf4ed] text-[10px] font-serif font-semibold">
              {initial}
            </div>
          )}
          <span className="text-[9px] font-semibold tracking-wider uppercase">Sign out</span>
        </button>
      ) : (
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">You</span>
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors for `MobileBottomBar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/MobileBottomBar.tsx
git commit -m "feat: show user avatar and sign-out in MobileBottomBar when authenticated"
```

---

### Task 6: Update `LongPressMarker` with ownership controls

**Files:**
- Modify: `src/components/LongPressMarker.tsx`

- [ ] **Step 1: Add `userId` prop and conditionally render controls**

In `src/components/LongPressMarker.tsx`, update the interface to accept `userId`:

```typescript
interface LongPressMarkerProps {
  item: GiveawayItem;
  isMoving: boolean;
  mapRef: React.MutableRefObject<L.Map | null>;
  onMoveStart: (id: string) => void;
  onMoveEnd: (id: string, lat: number, lng: number) => void;
  onDelete: (id: string) => void;
  userId: string | null;
}
```

Update the destructured props:

```typescript
export default function LongPressMarker({
  item, isMoving, mapRef, onMoveStart, onMoveEnd, onDelete, userId,
}: LongPressMarkerProps) {
```

- [ ] **Step 2: Gate long-press drag on ownership**

In the `useEffect` that sets up touch/mouse event handlers, wrap the `startDrag` timer setup so it only fires when the user owns the item. Change the `onTouchStart` function:

```typescript
const onTouchStart = (e: TouchEvent) => {
  if (item.owner_id !== userId) return;
  startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  timer = setTimeout(startDrag, 600);
};
```

And similarly change the `onMouseDown` function:

```typescript
const onMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return;
  if (item.owner_id !== userId) return;
  startX = e.clientX; startY = e.clientY;
  timer = setTimeout(startDrag, 600);
};
```

- [ ] **Step 3: Conditionally render delete button in popup**

In the JSX, wrap the delete button section so it only renders for the item owner. Replace the existing delete `div` (the one with `border-t border-[#ebe4df] mt-2 pt-2`):

```tsx
{userId && item.owner_id === userId && (
  <div className="border-t border-[#ebe4df] mt-2 pt-2" onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
    {!confirmingDelete ? (
      <button
        onPointerUp={() => setConfirmingDelete(true)}
        className="flex items-center gap-1 text-[11px] text-[#9893a5] hover:text-[#d7827e] transition-colors py-1"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
        Remove listing
      </button>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#575279]">Delete this item?</span>
        <button
          onPointerUp={() => { onDelete(item.id); setConfirmingDelete(false); }}
          className="text-[11px] font-semibold text-[#faf4ed] bg-[#d7827e] px-2.5 py-1 rounded-lg hover:opacity-90 active:scale-95 transition-all"
        >
          Yes
        </button>
        <button
          onPointerUp={() => setConfirmingDelete(false)}
          className="text-[11px] font-semibold text-[#575279] bg-[#f4ede8] px-2.5 py-1 rounded-lg hover:bg-[#ebe4df] active:scale-95 transition-all"
        >
          No
        </button>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: Add `userId` to the useEffect dependency array**

Update the dependency array of the long-press `useEffect` to include `userId`:

```typescript
}, [item.id, item.owner_id, userId, isMoving]);
```

- [ ] **Step 5: Verify full build**

Run: `npx tsc --noEmit`
Expected: PASS — all type errors should now be resolved.

- [ ] **Step 6: Commit**

```bash
git add src/components/LongPressMarker.tsx
git commit -m "feat: restrict delete and move to item owners only"
```

---

### Task 7: Verify end-to-end and final commit

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No warnings or errors.

- [ ] **Step 3: Manual smoke test**

Start dev server: `npm run dev`

Test these flows:
1. **Browse without auth** — map loads, items visible, popups show but no delete button, long-press doesn't start drag
2. **Click "List Your Giveaway"** — auth modal appears with Google and magic link options
3. **Sign in via magic link** — enter email, receive link, click it, redirected back and signed in
4. **Create an item** — should succeed, item appears with your `owner_id`
5. **View your item popup** — delete button visible
6. **View someone else's item popup** — no delete button
7. **Long-press your item** — drag starts
8. **Long-press someone else's item** — nothing happens
9. **Sign out** — avatar disappears, back to unauthenticated state

- [ ] **Step 4: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "fix: adjustments from smoke testing auth flow"
```
