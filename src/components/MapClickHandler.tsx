import { useMapEvents } from 'react-leaflet';
import { WOODSTOCK_CENTER } from '../constants';

interface MapClickHandlerProps {
  active: boolean;
  onMapClick: (lat: number, lng: number) => void;
  movingItemId: string | null;
  onCancelMove: () => void;
}

export default function MapClickHandler({ active, onMapClick, movingItemId, onCancelMove }: MapClickHandlerProps) {
  const map = useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      } else if (movingItemId) {
        onCancelMove();
      } else {
        map.flyTo(WOODSTOCK_CENTER, 15, { duration: 0.5 });
      }
    },
  });
  return null;
}
