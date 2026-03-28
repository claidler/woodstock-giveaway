import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapRefCaptureProps {
  mapRef: React.MutableRefObject<L.Map | null>;
}

export default function MapRefCapture({ mapRef }: MapRefCaptureProps) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    // Disable Leaflet's custom tap handler so the browser's native
    // tap-to-click works with touch-action: manipulation on the root.
    if ((map as any).tap) {
      (map as any).tap.disable();
    }
  }, [map, mapRef]);
  return null;
}
