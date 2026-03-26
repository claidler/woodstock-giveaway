import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapRefCaptureProps {
  mapRef: React.MutableRefObject<L.Map | null>;
}

export default function MapRefCapture({ mapRef }: MapRefCaptureProps) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}
