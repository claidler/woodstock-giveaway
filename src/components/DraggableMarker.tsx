import { useRef, useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { dropPinIcon } from '../icons';

interface DraggableMarkerProps {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}

export default function DraggableMarker({ position, onDragEnd }: DraggableMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const pos = marker.getLatLng();
        onDragEnd(pos.lat, pos.lng);
      }
    },
  }), [onDragEnd]);

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={dropPinIcon}
    />
  );
}
