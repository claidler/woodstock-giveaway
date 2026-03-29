# Multi-Category Location Tagging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-category-per-pin model with multi-category tagging, allowing users to tag a location with multiple item types (furniture, kids, garden, etc.) for the Woodstock giveaway day.

**Architecture:** Update the `Category` type to include 3 new categories (garden, books, kitchen). Change `formData.category` from a single value to an array. Store as comma-separated string in the existing DB `category` column. Update markers to show stacked icons for multi-category pins. Repurpose `title` as a required description field, make `locationDetails` optional, and remove the `description` field from the form.

**Tech Stack:** React 18, TypeScript, Leaflet (react-leaflet), Supabase, Tailwind CSS

---

### Task 1: Update Category type and constants

**Files:**
- Modify: `src/types.ts`
- Modify: `src/constants.ts`

- [ ] **Step 1: Update the Category type to include new categories**

In `src/types.ts`, replace the entire file:

```typescript
export type Category = 'furniture' | 'clothing' | 'entertainment' | 'pets' | 'kids' | 'garden' | 'books' | 'kitchen';

export interface GiveawayItem {
  id: string;
  description: string;
  lat: number;
  lng: number;
  categories: Category[];
  locationDetails: string;
  timePosted: string;
  owner_id: string;
}

export interface GiveawayItemRow {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  location_details: string;
  created_at: string;
  owner_id: string;
}
```

Key changes:
- `Category` union gains `'garden' | 'books' | 'kitchen'`
- `GiveawayItem.category` → `categories: Category[]`
- `GiveawayItem.title` and `GiveawayItem.description` → single `description` field
- `GiveawayItemRow.category` becomes `string` (comma-separated values)

- [ ] **Step 2: Update CATEGORY_STYLES and categoryOptions in constants**

In `src/constants.ts`, replace the entire file:

```typescript
import type { Category } from './types';

export const WOODSTOCK_CENTER: [number, number] = [51.847, -1.354];

export const CATEGORY_STYLES: Record<Category, { icon: string; bg: string }> = {
  furniture: { icon: 'chair', bg: '#d7827e' },
  clothing: { icon: 'apparel', bg: '#907aa9' },
  entertainment: { icon: 'movie', bg: '#ea9d34' },
  pets: { icon: 'pets', bg: '#286983' },
  kids: { icon: 'child_care', bg: '#b4637a' },
  garden: { icon: 'yard', bg: '#56949f' },
  books: { icon: 'menu_book', bg: '#797593' },
  kitchen: { icon: 'cooking', bg: '#575279' },
};

export const categoryOptions: { id: Category; icon: string; label: string }[] = [
  { id: 'furniture', icon: 'chair', label: 'Furniture' },
  { id: 'clothing', icon: 'apparel', label: 'Clothing' },
  { id: 'entertainment', icon: 'movie', label: 'Media & Games' },
  { id: 'pets', icon: 'pets', label: 'Pets' },
  { id: 'kids', icon: 'child_care', label: 'Kids' },
  { id: 'garden', icon: 'yard', label: 'Garden' },
  { id: 'books', icon: 'menu_book', label: 'Books' },
  { id: 'kitchen', icon: 'cooking', label: 'Kitchen' },
];
```

Key changes:
- `pets` colour changes from `#575279` to `#286983` (Pine)
- `kids` colour changes from `#d7827e` to `#b4637a` (Love)
- 3 new categories added: garden (Foam), books (Muted), kitchen (Text)

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/constants.ts
git commit -m "feat: expand Category type to 8 categories with distinct Rose Pine Dawn colours"
```

---

### Task 2: Update rowToItem parsing and utils

**Files:**
- Modify: `src/utils.ts`

- [ ] **Step 1: Update rowToItem to parse comma-separated categories**

Replace `src/utils.ts`:

```typescript
import type { Category, GiveawayItem, GiveawayItemRow } from './types';

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function parseCategories(raw: string): Category[] {
  return raw.split(',').filter(Boolean) as Category[];
}

export function rowToItem(row: GiveawayItemRow): GiveawayItem {
  return {
    id: row.id,
    description: row.title,
    lat: row.lat,
    lng: row.lng,
    categories: parseCategories(row.category),
    locationDetails: row.location_details,
    timePosted: formatRelativeTime(row.created_at),
    owner_id: row.owner_id,
  };
}
```

Key changes:
- New `parseCategories` helper splits comma-separated string into `Category[]`
- `row.title` maps to `description` (repurposed column)
- `row.category` parsed via `parseCategories` into `categories` array

- [ ] **Step 2: Commit**

```bash
git add src/utils.ts
git commit -m "feat: update rowToItem to parse multi-category comma-separated strings"
```

---

### Task 3: Update marker icons for stacked multi-category display

**Files:**
- Modify: `src/icons.ts`

- [ ] **Step 1: Replace icon functions to support multiple categories**

Replace `src/icons.ts`:

```typescript
import L from 'leaflet';
import type { Category } from './types';
import { CATEGORY_STYLES } from './constants';

export const getIconForCategories = (categories: Category[]) => {
  const cats = categories.length > 0 ? categories : (['furniture'] as Category[]);
  const count = cats.length;
  const circleSize = 40;
  const overlap = 12;
  const totalWidth = circleSize + (count - 1) * (circleSize - overlap);

  const circles = cats.map((cat, i) => {
    const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.furniture;
    const left = i * (circleSize - overlap);
    const zIndex = count - i;
    return `<div style="position:absolute;left:${left}px;top:0;z-index:${zIndex};width:${circleSize}px;height:${circleSize}px;background:${s.bg};color:#faf4ed;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);">
      <span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1;">${s.icon}</span>
    </div>`;
  }).join('');

  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div style="position:relative;width:${totalWidth}px;height:${circleSize}px;margin-top:-${circleSize / 2}px;margin-left:-${totalWidth / 2}px;cursor:pointer;">${circles}</div>`,
    iconSize: [totalWidth, circleSize],
    iconAnchor: [totalWidth / 2, circleSize / 2],
    popupAnchor: [0, -(circleSize / 2)]
  });
};

export const getMovingIconForCategories = (categories: Category[]) => {
  const cat = categories[0] || 'furniture';
  const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.furniture;
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div style="position:relative;width:48px;height:48px;margin-top:-24px;margin-left:-24px;cursor:grab;">
        <div class="marker-ping" style="position:absolute;inset:0;background:${s.bg};border-radius:50%;opacity:0.35;"></div>
        <div style="position:relative;width:48px;height:48px;background:${s.bg};color:#faf4ed;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.3);border:3px solid white;transform:scale(1.1);">
          <span class="material-symbols-outlined" style="font-size:20px;font-variation-settings:'FILL' 1;">${s.icon}</span>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
};

export const dropPinIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="relative -mt-10 -ml-5">
      <div class="w-10 h-10 bg-[#d7827e] text-[#faf4ed] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">add_location</span>
      </div>
      <div class="w-2 h-2 bg-[#d7827e] rounded-full mx-auto mt-0.5 opacity-40"></div>
    </div>
  `,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
});
```

Key changes:
- `getIconForCategory(cat)` → `getIconForCategories(cats[])` — renders stacked overlapping circles
- `getMovingIconForCategory(cat)` → `getMovingIconForCategories(cats[])` — uses first category for moving state
- `dropPinIcon` unchanged

- [ ] **Step 2: Commit**

```bash
git add src/icons.ts
git commit -m "feat: stacked circle markers for multi-category pins"
```

---

### Task 4: Update GiveawayForm for multi-select categories

**Files:**
- Modify: `src/components/GiveawayForm.tsx`

- [ ] **Step 1: Update the form props and layout**

Replace `src/components/GiveawayForm.tsx`:

```tsx
import type { Category, GiveawayItem } from '../types';
import { categoryOptions } from '../constants';

interface GiveawayFormProps {
  formData: { description: string; categories: Category[]; locationDetails: string };
  formErrors: Record<string, boolean>;
  descriptionInputRef: React.RefObject<HTMLTextAreaElement>;
  onFormDataChange: (updater: (d: { description: string; categories: Category[]; locationDetails: string }) => { description: string; categories: Category[]; locationDetails: string }) => void;
  onFormErrorChange: (updater: (e: Record<string, boolean>) => Record<string, boolean>) => void;
  onRepositionPin: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  editItem?: GiveawayItem | null;
}

export default function GiveawayForm({
  formData, formErrors, descriptionInputRef,
  onFormDataChange, onFormErrorChange,
  onRepositionPin, onCancel, onSubmit, editItem,
}: GiveawayFormProps) {
  const toggleCategory = (catId: Category) => {
    onFormDataChange(d => {
      const has = d.categories.includes(catId);
      const next = has
        ? d.categories.filter(c => c !== catId)
        : [...d.categories, catId];
      return { ...d, categories: next };
    });
    onFormErrorChange(e => ({ ...e, categories: false }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-[#575279]/20 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-[#fffaf3] w-full md:max-w-md md:mx-4 rounded-t-3xl md:rounded-3xl shadow-2xl border-t md:border border-[#ebe4df]/50 animate-slide-up max-h-[80vh] md:max-h-[85vh] flex flex-col">
        {/* Drag handle for mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#ebe4df]" />
        </div>

        {/* Header */}
        <div className="px-5 md:px-6 pt-2 md:pt-6 pb-3 md:pb-4 border-b border-[#ebe4df]/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-semibold text-[#575279]">
                {editItem ? 'Edit listing' : 'List your giveaway'}
              </h3>
              <p className="text-xs text-[#9893a5] mt-0.5">
                {editItem ? 'Update the details below.' : 'Fill in the details below.'}
              </p>
            </div>
            <button onClick={onCancel} className="w-8 h-8 rounded-full bg-[#f4ede8] flex items-center justify-center text-[#9893a5] hover:text-[#575279] hover:bg-[#ebe4df] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-6 py-4 md:py-5 space-y-4 md:space-y-5">
          {/* Categories — multi-select */}
          <div>
            <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-1.5">What are you giving away? <span className="normal-case tracking-normal font-normal">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(cat => {
                const selected = formData.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 md:py-2 rounded-xl border text-xs font-medium transition-all active:scale-95
                      ${selected
                        ? 'bg-[#d7827e] text-[#faf4ed] border-[#d7827e] shadow-sm'
                        : 'bg-white border-[#ebe4df] text-[#575279]/70 hover:border-[#d7827e]/30 hover:text-[#575279]'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                    {cat.label}
                  </button>
                );
              })}
            </div>
            {formErrors.categories && <p className="text-[11px] text-[#d7827e] mt-1">Please select at least one category</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-1.5">Briefly describe what you're giving away</label>
            <textarea
              ref={descriptionInputRef}
              placeholder="e.g. Mostly kids' toys, some garden furniture, and a few paperbacks"
              rows={3}
              value={formData.description}
              onChange={e => { onFormDataChange(d => ({ ...d, description: e.target.value })); onFormErrorChange(e2 => ({ ...e2, description: false })); }}
              className={`w-full bg-white border ${formErrors.description ? 'border-[#d7827e] ring-1 ring-[#d7827e]/30' : 'border-[#ebe4df]'} rounded-xl py-3 px-4 text-base md:text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50 resize-none`}
            />
            {formErrors.description && <p className="text-[11px] text-[#d7827e] mt-1">Please add a description</p>}
          </div>

          {/* Location hint — optional */}
          <div>
            <label className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest block mb-1.5">Location hint <span className="normal-case tracking-normal font-normal">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. By the front gate on Park Street"
              value={formData.locationDetails}
              onChange={e => onFormDataChange(d => ({ ...d, locationDetails: e.target.value }))}
              className="w-full bg-white border border-[#ebe4df] rounded-xl py-3 px-4 text-base md:text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50"
            />
          </div>

          {/* Reposition pin */}
          <button
            onClick={onRepositionPin}
            className="flex items-center gap-2 text-xs text-[#9893a5] hover:text-[#d7827e] active:text-[#d7827e] transition-colors py-1"
          >
            <span className="material-symbols-outlined text-base">edit_location_alt</span>
            Drag the pin or tap here to reposition
          </button>
        </div>

        {/* Submit area */}
        <div className="bg-[#fffaf3] px-5 md:px-6 pt-3 pb-5 md:pb-5 border-t border-[#ebe4df]/50 flex-shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onSubmit}
            className="w-full bg-[#d7827e] text-[#faf4ed] py-3.5 rounded-xl font-serif font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {editItem ? 'Save changes' : 'List for neighbours'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Key changes:
- `formData` shape: `{ description, categories: Category[], locationDetails }` — no `title` or single `category`
- `titleInputRef` → `descriptionInputRef` (textarea ref)
- Category picker becomes multi-select toggle via `toggleCategory`
- Title field removed, description field is now the primary text area
- Location hint has no validation/error state (optional)
- Error key `categories` validates at least one selected

- [ ] **Step 2: Commit**

```bash
git add src/components/GiveawayForm.tsx
git commit -m "feat: multi-select category form with simplified description field"
```

---

### Task 5: Update LongPressMarker for multi-category display

**Files:**
- Modify: `src/components/LongPressMarker.tsx`

- [ ] **Step 1: Update imports, icon calls, and popup content**

Replace `src/components/LongPressMarker.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { GiveawayItem } from '../types';
import { getIconForCategories, getMovingIconForCategories } from '../icons';
import { CATEGORY_STYLES } from '../constants';

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
  const markerRef = useRef<L.Marker>(null);
  const dragging = useRef(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (!el) return;

    let startX = 0, startY = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const THRESHOLD_SQ = 100;

    const cancelTimer = () => {
      if (timer !== null) { clearTimeout(timer); timer = null; }
    };

    const startDrag = () => {
      timer = null;
      if (dragging.current) return;
      dragging.current = true;
      onMoveStart(item.id);
      mapRef.current?.dragging.disable();

      const getLL = (clientX: number, clientY: number) => {
        const map = mapRef.current;
        if (!map) return null;
        const r = map.getContainer().getBoundingClientRect();
        return map.containerPointToLatLng([clientX - r.left, clientY - r.top]);
      };

      const endDrag = () => {
        dragging.current = false;
        mapRef.current?.dragging.enable();
        const ll = markerRef.current?.getLatLng();
        if (ll) onMoveEnd(item.id, ll.lat, ll.lng);
        document.removeEventListener('touchmove', onDocTouch as EventListener, true);
        document.removeEventListener('touchend', endDrag);
        document.removeEventListener('mousemove', onDocMouse);
        document.removeEventListener('mouseup', endDrag);
      };

      const onDocTouch = (e: TouchEvent) => {
        e.preventDefault();
        const ll = getLL(e.touches[0].clientX, e.touches[0].clientY);
        if (ll) markerRef.current?.setLatLng(ll);
      };
      const onDocMouse = (e: MouseEvent) => {
        const ll = getLL(e.clientX, e.clientY);
        if (ll) markerRef.current?.setLatLng(ll);
      };

      document.addEventListener('touchmove', onDocTouch as EventListener, { passive: false, capture: true });
      document.addEventListener('touchend', endDrag);
      document.addEventListener('mousemove', onDocMouse);
      document.addEventListener('mouseup', endDrag);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (item.owner_id !== userId) return;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      timer = setTimeout(startDrag, 600);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (dragging.current) return;
      const dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
      if (dx * dx + dy * dy > THRESHOLD_SQ) cancelTimer();
    };
    const onTouchEnd = () => cancelTimer();
    const onContextMenu = (e: Event) => e.preventDefault();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (item.owner_id !== userId) return;
      startX = e.clientX; startY = e.clientY;
      timer = setTimeout(startDrag, 600);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (dx * dx + dy * dy > THRESHOLD_SQ) cancelTimer();
    };
    const onMouseUp = () => cancelTimer();

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelTimer();
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
    };
  }, [item.id, item.owner_id, userId, isMoving]);

  return (
    <Marker
      ref={markerRef}
      position={[item.lat, item.lng]}
      icon={isMoving ? getMovingIconForCategories(item.categories) : getIconForCategories(item.categories)}
    >
      {!isMoving && (
        <Popup className="custom-popup" eventHandlers={{ remove: () => setConfirmingDelete(false) }}>
          <div className="p-1 min-w-[200px]">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.categories.map(cat => {
                const s = CATEGORY_STYLES[cat];
                return (
                  <span key={cat} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full" style={{ background: s?.bg || '#9893a5' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>{s?.icon || 'category'}</span>
                    {cat}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-[#575279]/80 mb-3">{item.description}</p>
            {item.locationDetails && (
              <div className="flex justify-between items-center text-[10px] text-[#9893a5] border-t border-[#ebe4df] pt-2">
                <span className="italic">{item.locationDetails}</span>
                <span>{item.timePosted}</span>
              </div>
            )}
            {!item.locationDetails && (
              <div className="flex justify-end items-center text-[10px] text-[#9893a5] border-t border-[#ebe4df] pt-2">
                <span>{item.timePosted}</span>
              </div>
            )}
            {userId && item.owner_id === userId && (
              <div className="border-t border-[#ebe4df] mt-2 pt-2" onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                {!confirmingDelete ? (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { markerRef.current?.closePopup(); onEdit(item); }}
                      className="flex items-center gap-1 text-[11px] text-[#286983] hover:text-[#286983]/80 transition-colors py-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit details
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-1 text-[11px] text-[#9893a5] hover:text-[#d7827e] transition-colors py-1"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Remove listing
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#575279]">Delete this listing?</span>
                    <button
                      onClick={() => { onDelete(item.id); setConfirmingDelete(false); }}
                      className="text-[11px] font-semibold text-[#faf4ed] bg-[#d7827e] px-2.5 py-1 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="text-[11px] font-semibold text-[#575279] bg-[#f4ede8] px-2.5 py-1 rounded-lg hover:bg-[#ebe4df] active:scale-95 transition-all"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Popup>
      )}
    </Marker>
  );
}
```

Key changes:
- Import `getIconForCategories` / `getMovingIconForCategories` instead of singular versions
- Import `CATEGORY_STYLES` for popup pills
- Icon calls use `item.categories` array
- Popup shows coloured category pills instead of single category label
- Shows `item.description` instead of `item.title` + `item.description`
- Location details row only renders if non-empty
- Delete confirmation says "listing" instead of "item"

- [ ] **Step 2: Commit**

```bash
git add src/components/LongPressMarker.tsx
git commit -m "feat: stacked icons and category pills in marker popup"
```

---

### Task 6: Update Sidebar with new categories

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add the 3 new categories to the sidebar filter grid**

Replace `src/components/Sidebar.tsx`:

```tsx
import type { Category } from '../types';
import { categoryOptions } from '../constants';

interface SidebarProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const allFilters = [{ id: 'all' as const, icon: 'map', label: 'All Items' }, ...categoryOptions];

  return (
    <aside className="hidden md:flex flex-col w-80 bg-[#f4ede8] p-8 gap-8 z-40 border-r border-[#ebe4df] overflow-y-auto">
      <div>
        <h2 className="text-2xl font-serif font-semibold tracking-tight">The Great Woodstock Giveaway</h2>
        <p className="text-[10px] text-[#9893a5] uppercase tracking-[0.2em] mt-2">Share with your neighbours</p>
      </div>

      <div>
        <h3 className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest mb-4 px-1">Filter by Tag</h3>
        <div className="grid grid-cols-3 gap-2">
          {allFilters.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onCategoryChange(cat.id as Category | 'all')}
              className={`p-3 rounded-xl border transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-1.5
                ${activeCategory === cat.id
                  ? 'bg-white border-[#d7827e]/30 shadow-sm'
                  : 'bg-white/40 border-transparent hover:bg-white hover:border-[#d7827e]/20'}`}
            >
              <span className={`material-symbols-outlined ${activeCategory === cat.id ? 'text-[#d7827e]' : 'text-[#9893a5]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {cat.icon}
              </span>
              <span className="text-[11px] font-medium opacity-80">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto">
         <div className="bg-[#fffaf3] p-5 rounded-2xl shadow-sm border border-white/50">
           <h4 className="font-serif font-semibold text-sm mb-2">How it works</h4>
           <ul className="text-xs text-[#9893a5] leading-relaxed space-y-2">
             <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#d7827e] text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>Tap "List Your Giveaway" and drop a pin to share what you have.</li>
             <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#d7827e] text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>Browse the map to find giveaways near you.</li>
             <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#d7827e] text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>filter_alt</span>Use tags above to filter by category.</li>
           </ul>
         </div>
      </div>
    </aside>
  );
}
```

Key changes:
- Import `categoryOptions` from constants instead of hardcoding the list
- Build `allFilters` by prepending "All Items" to `categoryOptions`
- Grid now shows 9 items (all + 8 categories) — 3 columns still works
- "How it works" text updated to say "share what you have" instead of "share an item"

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add garden, books, kitchen to sidebar filters"
```

---

### Task 7: Update App.tsx — form state, filtering, submit/edit logic

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update formData state, filtering logic, and submit/update functions**

Make the following changes to `src/App.tsx`:

**1. Update formData state initialiser** (line 29):

Change:
```typescript
const [formData, setFormData] = useState({ title: '', description: '', category: 'furniture' as Category, locationDetails: '' });
```
To:
```typescript
const [formData, setFormData] = useState({ description: '', categories: [] as Category[], locationDetails: '' });
```

**2. Update titleInputRef** (line 32):

Change:
```typescript
const titleInputRef = useRef<HTMLInputElement>(null);
```
To:
```typescript
const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
```

**3. Update startAddFlow** (line 66):

Change:
```typescript
setFormData({ title: '', description: '', category: 'furniture', locationDetails: '' });
```
To:
```typescript
setFormData({ description: '', categories: [], locationDetails: '' });
```

**4. Update handleMapClick focus** (line 74):

Change:
```typescript
setTimeout(() => titleInputRef.current?.focus(), 300);
```
To:
```typescript
setTimeout(() => descriptionInputRef.current?.focus(), 300);
```

**5. Update startEditFlow** (lines 98-103):

Change:
```typescript
setFormData({
  title: item.title,
  description: item.description,
  category: item.category,
  locationDetails: item.locationDetails,
});
```
To:
```typescript
setFormData({
  description: item.description,
  categories: [...item.categories],
  locationDetails: item.locationDetails,
});
```

**6. Update submitItem validation and insert** (lines 116-146):

Replace the entire `submitItem` function:

```typescript
const submitItem = async () => {
  const errors: Record<string, boolean> = {};
  if (formData.categories.length === 0) errors.categories = true;
  if (!formData.description.trim()) errors.description = true;
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  if (!newPinLocation) return;

  const { data, error } = await supabase
    .from('giveaway_items')
    .insert({
      title: formData.description.trim(),
      description: '',
      lat: newPinLocation.lat,
      lng: newPinLocation.lng,
      category: formData.categories.join(','),
      location_details: formData.locationDetails.trim(),
      owner_id: session!.user.id,
    })
    .select()
    .single();

  if (!error && data) {
    setItems(prev => [rowToItem(data as GiveawayItemRow), ...prev]);
  }
  setShowForm(false);
  setNewPinLocation(null);
  setFormErrors({});
};
```

**7. Update updateItem validation and update** (lines 148-184):

Replace the entire `updateItem` function:

```typescript
const updateItem = async () => {
  const errors: Record<string, boolean> = {};
  if (formData.categories.length === 0) errors.categories = true;
  if (!formData.description.trim()) errors.description = true;
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  if (!newPinLocation || !editingItem) return;

  const updates = {
    title: formData.description.trim(),
    description: '',
    category: formData.categories.join(','),
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
        ? rowToItem({ ...updates, id: editingItem.id, created_at: '', owner_id: editingItem.owner_id } as GiveawayItemRow)
        : i
    ));
    setShowForm(false);
    setNewPinLocation(null);
    setFormErrors({});
    setEditingItem(null);
  }
};
```

**8. Update filtering logic** (line 253-255):

Change:
```typescript
const filteredItems = activeCategory === 'all'
  ? items
  : items.filter(item => item.category === activeCategory);
```
To:
```typescript
const filteredItems = activeCategory === 'all'
  ? items
  : items.filter(item => item.categories.includes(activeCategory));
```

**9. Update GiveawayForm props in JSX** (around line 310):

Change:
```tsx
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
```
To:
```tsx
<GiveawayForm
  formData={formData}
  formErrors={formErrors}
  descriptionInputRef={descriptionInputRef}
  onFormDataChange={setFormData}
  onFormErrorChange={setFormErrors}
  onRepositionPin={repositionPin}
  onCancel={cancelAdd}
  onSubmit={editingItem ? updateItem : submitItem}
  editItem={editingItem}
/>
```

- [ ] **Step 2: Verify the app compiles**

Run: `npm run build`
Expected: No TypeScript errors, successful build.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up multi-category form state, filtering, and submit logic"
```

---

### Task 8: Manual smoke test

- [ ] **Step 1: Run the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the following flows work**

1. **Create flow:** Click "List Your Giveaway" → sign in → drop pin → select multiple categories → enter description → submit. Verify stacked marker appears on map.
2. **Popup:** Click the new marker → verify category pills, description, and optional location hint display correctly.
3. **Edit flow:** Click Edit on your marker → verify categories are pre-selected → change categories → save. Verify marker updates.
4. **Filter:** Click a category in sidebar → verify only pins containing that category appear. Click "All" → verify all pins appear.
5. **Delete:** Click your marker → Remove listing → confirm → verify pin disappears.
6. **Long-press drag:** Long-press your marker → drag to new position → verify it saves.

- [ ] **Step 3: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke test"
```
