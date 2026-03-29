# Multi-Category Location Tagging

## Overview

Replace the current single-category-per-item model with a multi-category tagging system. Each pin on the map represents a location where someone is giving away items. Rather than listing specific items, users tag their location with the types of things available and provide a brief description. Visitors physically go to the location to see what's on offer.

This is designed for a one-day giveaway event in Woodstock, not an ongoing marketplace.

## Data Model

Reuse the existing `giveaway_items` table with no schema migration:

| Column | Current use | New use |
|--------|------------|---------|
| `id` | UUID | Same |
| `title` | Item title (text) | Repurposed as **description** — a required free-text field ("Briefly describe what you're giving away") |
| `description` | Item description (text) | Unused (store empty string) |
| `lat` / `lng` | Pin coordinates | Same |
| `category` | Single value e.g. `"furniture"` | Comma-separated e.g. `"furniture,kids,clothing"` |
| `location_details` | Required location hint | Now **optional** |
| `created_at` | Timestamp | Same |
| `owner_id` | Auth user UUID | Same |

### Frontend Types

```typescript
type Category =
  | 'furniture'
  | 'clothing'
  | 'entertainment'
  | 'pets'
  | 'kids'
  | 'garden'
  | 'books'
  | 'kitchen';

interface GiveawayItem {
  id: string;
  description: string;        // mapped from DB `title` column
  lat: number;
  lng: number;
  categories: Category[];     // parsed from comma-separated `category` column
  locationDetails: string;    // optional, may be empty
  timePosted: string;
  owner_id: string;
}
```

Parsing: when reading from DB, split `category` on commas into `categories` array. When writing, join the array back to a comma-separated string.

## Categories

8 categories, each with a distinct Rose Pine Dawn colour and Material Symbols Outlined icon:

| Category | Icon | Colour | Rose Pine Dawn name |
|----------|------|--------|---------------------|
| Furniture | `chair` | `#d7827e` | Rose |
| Clothing | `apparel` | `#907aa9` | Iris |
| Entertainment | `movie` | `#ea9d34` | Gold |
| Pets | `pets` | `#286983` | Pine |
| Kids | `child_care` | `#b4637a` | Love |
| Garden | `yard` | `#56949f` | Foam |
| Books | `menu_book` | `#797593` | Muted |
| Kitchen | `cooking` | `#575279` | Text |

## Form (GiveawayForm)

The listing form has three fields:

1. **Category tags** (multi-select toggle buttons) — required, at least one must be selected. Each category button toggles on/off independently. Uses the same icons and colours as the map markers.
2. **Description** (single text area) — required. Label: "Briefly describe what you're giving away". Placeholder: e.g. "Mostly kids' toys, some garden furniture, and a few paperbacks". Maps to the DB `title` column.
3. **Location hint** (text input) — optional. Label: "Location hint (optional)". Placeholder: e.g. "By the front gate on Park Street".

Below the fields: "Reposition Pin" button and "List Giveaway" submit button (same as current).

The form is used for both creating and editing listings. When editing, fields are pre-populated with current values. The category multi-select reflects which categories are currently tagged.

## Map Markers

Markers use the **stacked circle** style:

- Each selected category is rendered as a circular icon badge (38px, white border, drop shadow)
- Multiple categories stack left-to-right with ~12px overlap
- Z-index decreases left-to-right so the first category sits on top
- A single-category pin looks identical to the current single-icon marker
- Markers are rendered as Leaflet DivIcon custom HTML

### Single category example
One circle with the category's colour and icon.

### Multi-category example
Overlapping circles, one per category, each in its own colour with its own icon.

## Filtering

The sidebar category filter buttons work the same as current — single-select, one active category or "All Items".

The matching logic changes from exact match to **contains**:
- Current: `item.category === selectedCategory`
- New: `item.categories.includes(selectedCategory)`

A pin tagged `"furniture,kids,books"` appears when filtering by furniture, kids, or books.

"All Items" shows every pin regardless of categories.

## Popup

When a marker is tapped, the popup shows:

1. **Category pills** — coloured badges for each category (matching marker colours and icons)
2. **Description** — the free-text description
3. **Location hint** — shown only if provided
4. **Edit/Delete buttons** — shown only if the current user owns the pin (same ownership logic as current)

## Existing Behaviour Preserved

- **Pin drop flow** — unchanged (click map to place pin, then fill form)
- **Long-press drag** — unchanged (owner can reposition their pin)
- **Realtime updates** — unchanged (Supabase realtime subscriptions for INSERT/UPDATE/DELETE)
- **RLS policies** — unchanged (public read, owner write)
- **Auth flow** — unchanged (magic link email)
- **One pin per listing** — unchanged (each form submission creates one row)
