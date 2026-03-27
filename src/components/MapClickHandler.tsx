import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  active: boolean;
  onMapClick: (lat: number, lng: number) => void;
  movingItemId: string | null;
  onCancelMove: () => void;
}

export default function MapClickHandler({ active, onMapClick, movingItemId, onCancelMove }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      } else if (movingItemId) {
        onCancelMove();
      }
    },
  });
  return null;
}
