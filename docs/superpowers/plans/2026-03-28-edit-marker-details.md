# Edit Marker Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow marker owners to edit all fields of their giveaway items via the existing form modal.

**Architecture:** Add an `editingItem` state to `App.tsx`. Pass an `onEdit` callback to `LongPressMarker` which sets the editing state and opens the form. `GiveawayForm` receives an optional `editItem` prop and branches on create vs. edit for labels and submit behavior. The realtime subscription gains an `UPDATE` handler.

**Tech Stack:** React, TypeScript, Supabase, Leaflet/react-leaflet

---

### Task 1: Add "Edit details" button to LongPressMarker popup

**Files:**
- Modify: `src/components/LongPressMarker.tsx:7-15` (props interface)
- Modify: `src/components/LongPressMarker.tsx:141-168` (owner action bar)

- [ ] **Step 1: Add `onEdit` prop to the interface and destructure it**

In `src/components/LongPressMarker.tsx`, add the `onEdit` callback to the props interface and destructuring:

```typescript
interface LongPressMarkerProps {
  item: GiveawayItem;
  isMoving: boolean;
  mapRef: React.MutableRefObject<L.Map | null>;
  onMoveStart: (id: string) => void;
  onMoveEnd: (id: string, lat: number, lng: number) => void;
  onDelete: (id: string) => void;
  onEdit: (item: GiveawayItem) => void;
  userId: string | null;
}

export default function LongPressMarker({
  item, isMoving, mapRef, onMoveStart, onMoveEnd, onDelete, onEdit, userId,
}: LongPressMarkerProps) {
```

- [ ] **Step 2: Replace the owner action bar with Edit + Delete buttons side-by-side**

Replace the owner action section (lines 141-168) inside the `<Popup>`. The key change: the `<div>` that currently contains only the delete button/confirmation now has two buttons side-by-side — "Edit details" on the left and "Remove listing" on the right. When confirming delete, the edit button hides and the confirmation takes over.

```tsx
{userId && item.owner_id === userId && (
  <div className="border-t border-[#ebe4df] mt-2 pt-2" onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
    {!confirmingDelete ? (
      <div className="flex items-center justify-between">
        <button
          onPointerUp={() => onEdit(item)}
          className="flex items-center gap-1 text-[11px] text-[#286983] hover:text-[#286983]/80 transition-colors py-1"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit details
        </button>
        <button
          onPointerUp={() => setConfirmingDelete(true)}
          className="flex items-center gap-1 text-[11px] text-[#9893a5] hover:text-[#d7827e] transition-colors py-1"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Remove listing
        </button>
      </div>
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

- [ ] **Step 3: Verify the app still compiles**

Run: `npm run build 2>&1 | tail -20`

This will fail because `App.tsx` doesn't pass `onEdit` yet — that's expected. Confirm the only error is about the missing `onEdit` prop on `<LongPressMarker>`.

- [ ] **Step 4: Commit**

```bash
git add src/components/LongPressMarker.tsx
git commit -m "feat: add Edit details button to marker popup"
```

---

### Task 2: Add `editingItem` state and wire up edit flow in App.tsx

**Files:**
- Modify: `src/App.tsx:24-37` (state declarations)
- Modify: `src/App.tsx:52-82` (flow functions)
- Modify: `src/App.tsx:248-259` (LongPressMarker rendering)
- Modify: `src/App.tsx:316-327` (GiveawayForm rendering)

- [ ] **Step 1: Add `editingItem` state**

In `src/App.tsx`, after line 37 (`const [showAuthModal, setShowAuthModal] = useState(false);`), add:

```typescript
const [editingItem, setEditingItem] = useState<GiveawayItem | null>(null);
```

- [ ] **Step 2: Add `startEditFlow` function**

After the `cancelAdd` function (after line 82), add:

```typescript
const startEditFlow = (item: GiveawayItem) => {
  setEditingItem(item);
  setNewPinLocation({ lat: item.lat, lng: item.lng });
  setFormData({
    title: item.title,
    description: item.description,
    category: item.category,
    locationDetails: item.locationDetails,
  });
  setFormErrors({});
  setShowForm(true);
};
```

- [ ] **Step 3: Update `cancelAdd` to also clear `editingItem`**

In the `cancelAdd` function, add `setEditingItem(null);`:

```typescript
const cancelAdd = () => {
  setPlacingPin(false);
  setShowForm(false);
  setNewPinLocation(null);
  setFormErrors({});
  setEditingItem(null);
};
```

- [ ] **Step 4: Add `updateItem` submit handler**

After the `submitItem` function (after line 123), add:

```typescript
const updateItem = async () => {
  const errors: Record<string, boolean> = {};
  if (!formData.title.trim()) errors.title = true;
  if (!formData.description.trim()) errors.description = true;
  if (!formData.locationDetails.trim()) errors.locationDetails = true;
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  if (!newPinLocation || !editingItem) return;

  const updates = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    category: formData.category,
    location_details: formData.locationDetails.trim(),
    lat: newPinLocation.lat,
    lng: newPinLocation.lng,
  };

  const { error } = await supabase
    .from('giveaway_items')
    .update(updates)
    .eq('id', editingItem.id);

  if (!error) {
    setItems(prev => prev.map(i =>
      i.id === editingItem.id
        ? { ...i, ...updates, locationDetails: updates.location_details }
        : i
    ));
  }
  setShowForm(false);
  setNewPinLocation(null);
  setFormErrors({});
  setEditingItem(null);
};
```

- [ ] **Step 5: Pass `onEdit` to `LongPressMarker`**

In the `filteredItems.map` rendering (around line 249), add the `onEdit` prop:

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
    onEdit={startEditFlow}
    userId={session?.user.id ?? null}
  />
))}
```

- [ ] **Step 6: Pass `editingItem` and correct submit handler to `GiveawayForm`**

Update the `GiveawayForm` rendering to pass `editItem` and switch the submit handler:

```tsx
{showForm && newPinLocation && (
  <GiveawayForm
    formData={formData}
    formErrors={formErrors}
    titleInputRef={titleInputRef}
    onFormDataChange={setFormData}
    onFormErrorChange={setFormErrors}
    onRepositionPin={repositionPin}
    onCancel={cancelAdd}
    onSubmit={editingItem ? updateItem : submitItem}
    editItem={editingItem}
  />
)}
```

- [ ] **Step 7: Verify the app compiles**

Run: `npm run build 2>&1 | tail -20`

This will fail because `GiveawayForm` doesn't accept `editItem` yet — that's expected. Confirm it's the only error.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add editingItem state and edit flow wiring in App"
```

---

### Task 3: Update GiveawayForm to support edit mode

**Files:**
- Modify: `src/components/GiveawayForm.tsx:4-13` (props interface)
- Modify: `src/components/GiveawayForm.tsx:31-35` (header)
- Modify: `src/components/GiveawayForm.tsx:118-124` (submit button)

- [ ] **Step 1: Add `editItem` to the props interface and destructure it**

In `src/components/GiveawayForm.tsx`, add the optional `editItem` prop:

```typescript
import type { Category, GiveawayItem } from '../types';
import { categoryOptions } from '../constants';

interface GiveawayFormProps {
  formData: { title: string; description: string; category: Category; locationDetails: string };
  formErrors: Record<string, boolean>;
  titleInputRef: React.RefObject<HTMLInputElement>;
  onFormDataChange: (updater: (d: { title: string; description: string; category: Category; locationDetails: string }) => { title: string; description: string; category: Category; locationDetails: string }) => void;
  onFormErrorChange: (updater: (e: Record<string, boolean>) => Record<string, boolean>) => void;
  onRepositionPin: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  editItem?: GiveawayItem | null;
}

export default function GiveawayForm({
  formData, formErrors, titleInputRef,
  onFormDataChange, onFormErrorChange,
  onRepositionPin, onCancel, onSubmit, editItem,
}: GiveawayFormProps) {
```

- [ ] **Step 2: Update the header to show edit-mode text**

Replace the header `<div>` (the inner div with the title and subtitle) to branch on `editItem`:

```tsx
<div>
  <h3 className="text-lg font-serif font-semibold text-[#575279]">
    {editItem ? 'Edit listing' : 'List your giveaway'}
  </h3>
  <p className="text-xs text-[#9893a5] mt-0.5">
    {editItem ? 'Update the details below.' : 'Fill in the details below.'}
  </p>
</div>
```

- [ ] **Step 3: Update the submit button text**

Replace the submit button label:

```tsx
<button
  onClick={onSubmit}
  className="w-full bg-[#d7827e] text-[#faf4ed] py-3.5 rounded-xl font-serif font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
>
  <span className="material-symbols-outlined text-lg">check_circle</span>
  {editItem ? 'Save changes' : 'List for neighbours'}
</button>
```

- [ ] **Step 4: Verify the app compiles and runs**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/GiveawayForm.tsx
git commit -m "feat: support edit mode in GiveawayForm"
```

---

### Task 4: Add UPDATE handler to realtime subscription

**Files:**
- Modify: `src/App.tsx:136-150` (realtime subscription)

- [ ] **Step 1: Add the UPDATE event handler**

In `src/App.tsx`, in the realtime channel chain (after the DELETE handler around line 149), add an UPDATE handler before `.subscribe()`:

```typescript
const channel = supabase
  .channel('giveaway_items_changes')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'giveaway_items' }, (payload) => {
    setItems(prev => {
      const newItem = rowToItem(payload.new as GiveawayItemRow);
      if (prev.some(i => i.id === newItem.id)) return prev;
      return [newItem, ...prev];
    });
  })
  .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'giveaway_items' }, (payload) => {
    const deletedId = (payload.old as { id: string }).id;
    setItems(prev => prev.filter(i => i.id !== deletedId));
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'giveaway_items' }, (payload) => {
    const updated = rowToItem(payload.new as GiveawayItemRow);
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
  })
  .subscribe();
```

- [ ] **Step 2: Verify the app compiles**

Run: `npm run build 2>&1 | tail -20`

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: handle UPDATE events in realtime subscription"
```

---

### Task 5: Manual smoke test

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Test the edit flow**

1. Sign in with magic link
2. Create a new giveaway item
3. Click the marker to open the popup
4. Verify "Edit details" and "Remove listing" buttons appear side-by-side
5. Click "Edit details" — form opens with all fields pre-filled
6. Change the title, description, category, and location hint
7. Click "Save changes"
8. Click the marker again — verify all changes are reflected in the popup
9. Click "Edit details" again, click "Reposition Pin", move the pin, return to form, save
10. Verify marker moved to the new position

- [ ] **Step 3: Test non-owner view**

1. Open the app in an incognito window (or sign out)
2. Click a marker — verify no "Edit details" or "Remove listing" buttons appear

- [ ] **Step 4: Test cancel/escape**

1. Click "Edit details" on a marker
2. Click cancel (X button) — verify form closes and no changes are saved
3. Click "Edit details" again, click the backdrop — verify same behavior

- [ ] **Step 5: Commit any fixes if needed**
