# Edit Marker Details

## Overview

Allow marker owners to edit all fields (title, description, category, location details, position) of their giveaway items after posting. Reuses the existing `GiveawayForm` component in an edit mode rather than creating a new component.

## Requirements

- Owners can edit any of their markers at any time, no restrictions
- All fields are editable: title, description, category, location details, and position
- Non-owners see no edit UI
- Edit uses the same form modal as creation, pre-filled with current values

## Design

### Popup Changes

The owner action bar at the bottom of the marker popup gains an **"Edit details"** button alongside the existing "Remove listing" button.

- **Layout**: Two buttons side-by-side — "Edit details" (left, `#286983` blue accent) and "Remove listing" (right, muted `#9893a5`)
- **Icon**: `edit` Material Symbol for the edit button
- **Behavior**: Clicking "Edit details" closes the popup and opens the `GiveawayForm` modal pre-filled with the item's current values
- **Visibility**: Only shown when `userId && item.owner_id === userId` (same gate as delete)

### GiveawayForm Edit Mode

The existing `GiveawayForm` component accepts an optional `editItem: GiveawayItem` prop. When present:

- All fields pre-filled with the item's current values
- Pin initialized at the item's existing `lat`/`lng`
- Header text: "Edit Listing" (instead of "List a Giveaway")
- Submit button: "Save changes" (instead of "List for neighbours")
- Submit handler calls `supabase.from('giveaway_items').update(...)` matching on `editItem.id`
- "Reposition Pin" works identically to the create flow

### State Changes in App.tsx

One new piece of state:

- `editingItem: GiveawayItem | null` — the item being edited, or `null`

Existing state reused as-is:

- `showForm` — controls form visibility
- `newPinLocation` — initialized from `editingItem.lat`/`editingItem.lng` when editing
- `movingItemId` — reused for "Reposition Pin" during edit

When `showForm` closes, `editingItem` is cleared alongside `newPinLocation`.

### Data Flow

1. Owner clicks "Edit details" in popup
2. `App.tsx` receives callback with the item → sets `editingItem` state + `showForm = true`
3. `GiveawayForm` renders pre-filled with `editingItem` data
4. On submit → `supabase.from('giveaway_items').update({ title, description, category, location_details, lat, lng }).eq('id', editingItem.id)`
5. Realtime subscription picks up the `UPDATE` event → updates local `items` state
6. On cancel/close → clears `editingItem` and `showForm`

### Realtime Subscription Update

The existing realtime subscription in `App.tsx` listens for `INSERT` and `DELETE` events. Add an `UPDATE` handler that replaces the matching item in local state with the updated row (converted via `rowToItem`).

## Scope

- No new components
- No database schema changes
- No new Supabase RLS policies needed (existing owner-based policies already permit updates — confirmed by the drag-to-move `update()` call in `App.tsx:43`)
- No new API calls beyond `update()`
- Files modified: `App.tsx`, `GiveawayForm.tsx`, `LongPressMarker.tsx`
