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
                      className="flex items-center gap-1 text-[11px] text-[#9893a5] hover:text-[#bd5f5f] transition-colors py-1"
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
                      className="text-[11px] font-semibold text-[#f9f5ea] bg-[#bd5f5f] px-2.5 py-1 rounded-lg hover:opacity-90 active:scale-95 transition-all"
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
