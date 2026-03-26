import { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { GiveawayItem } from '../types';
import { getIconForCategory, getMovingIconForCategory } from '../icons';

interface LongPressMarkerProps {
  item: GiveawayItem;
  isMoving: boolean;
  mapRef: React.MutableRefObject<L.Map | null>;
  onMoveStart: (id: string) => void;
  onMoveEnd: (id: string, lat: number, lng: number) => void;
}

export default function LongPressMarker({ item, isMoving, mapRef, onMoveStart, onMoveEnd }: LongPressMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const dragging = useRef(false);

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
  }, [item.id, isMoving]);

  return (
    <Marker
      ref={markerRef}
      position={[item.lat, item.lng]}
      icon={isMoving ? getMovingIconForCategory(item.category) : getIconForCategory(item.category)}
    >
      {!isMoving && (
        <Popup className="custom-popup">
          <div className="p-1 min-w-[200px]">
            <span className="text-[9px] font-bold text-[#d7827e] uppercase tracking-widest block mb-1">
              {item.category}
            </span>
            <h4 className="text-base font-serif font-semibold mb-1 leading-tight">{item.title}</h4>
            <p className="text-xs text-[#575279]/80 mb-3">{item.description}</p>
            <div className="flex justify-between items-center text-[10px] text-[#9893a5] border-t border-[#ebe4df] pt-2">
              <span className="italic">{item.locationDetails}</span>
              <span>{item.timePosted}</span>
            </div>
          </div>
        </Popup>
      )}
    </Marker>
  );
}
