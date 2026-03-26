import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { Category, GiveawayItem } from './types';
import { WOODSTOCK_CENTER, mockItems } from './constants';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MapClickHandler from './components/MapClickHandler';
import MapRefCapture from './components/MapRefCapture';
import LongPressMarker from './components/LongPressMarker';
import DraggableMarker from './components/DraggableMarker';
import GiveawayForm from './components/GiveawayForm';
import MobileBottomBar from './components/MobileBottomBar';
import PinDropBanner from './components/PinDropBanner';
import MarkerDragBanner from './components/MarkerDragBanner';


export default function App() {
  const [items, setItems] = useState<GiveawayItem[]>(mockItems);
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [placingPin, setPlacingPin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'furniture' as Category, locationDetails: '' });
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const handleMoveStart = useCallback((id: string) => setMovingItemId(id), []);
  const handleMoveEnd = useCallback((id: string, lat: number, lng: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, lat, lng } : i));
    setMovingItemId(null);
  }, []);

  const startAddFlow = () => {
    setPlacingPin(true);
    setNewPinLocation(null);
    setShowForm(false);
    setFormData({ title: '', description: '', category: 'furniture', locationDetails: '' });
    setFormErrors({});
  };

  const handleMapClick = (lat: number, lng: number) => {
    setNewPinLocation({ lat, lng });
    setPlacingPin(false);
    setShowForm(true);
  };

  const handlePinDrag = (lat: number, lng: number) => {
    setNewPinLocation({ lat, lng });
  };

  const repositionPin = () => {
    setShowForm(false);
    setPlacingPin(true);
  };

  const cancelAdd = () => {
    setPlacingPin(false);
    setShowForm(false);
    setNewPinLocation(null);
    setFormErrors({});
  };

  const submitItem = () => {
    const errors: Record<string, boolean> = {};
    if (!formData.title.trim()) errors.title = true;
    if (!formData.description.trim()) errors.description = true;
    if (!formData.locationDetails.trim()) errors.locationDetails = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!newPinLocation) return;

    const newItem: GiveawayItem = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      lat: newPinLocation.lat,
      lng: newPinLocation.lng,
      category: formData.category,
      timePosted: 'Just now',
      locationDetails: formData.locationDetails.trim(),
    };
    setItems(prev => [newItem, ...prev]);
    setShowForm(false);
    setNewPinLocation(null);
    setFormErrors({});
  };

  useEffect(() => {
    const links = [
      'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
    ];

    links.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMovingItemId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(item => item.category === activeCategory);

  const isAddFlow = placingPin || showForm;

  return (
    <div className="bg-[#faf4ed] text-[#575279] overflow-hidden font-sans h-screen flex flex-col touch-manipulation">
      <style>{`
        html, body, #root { touch-action: manipulation; overscroll-behavior: none; }
        h1, h2, h3, h4, .font-serif { font-family: 'Noto Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .leaflet-popup-content-wrapper { background-color: #fffaf3; color: #575279; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .leaflet-popup-tip { background-color: #fffaf3; }
        .leaflet-container { font-family: 'Inter', sans-serif; touch-action: pan-x pan-y; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes markerPing { 0% { transform: scale(1); opacity: 0.35; } 75%, 100% { transform: scale(2.2); opacity: 0; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        .marker-ping { animation: markerPing 1.4s cubic-bezier(0,0,0.2,1) infinite; }
      `}</style>

      <Navbar onAddClick={startAddFlow} />

      <div className="flex flex-1 pt-16 md:pt-20 relative overflow-hidden">
        <Sidebar activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

        <main className="flex-1 relative bg-[#faf4ed] w-full z-0 pb-20 md:pb-0" style={{ minHeight: 0 }}>
          <MapContainer
            center={WOODSTOCK_CENTER}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            <MapRefCapture mapRef={mapRef} />
            <MapClickHandler active={placingPin} onMapClick={handleMapClick} movingItemId={movingItemId} onCancelMove={() => setMovingItemId(null)} />

            {filteredItems.map(item => (
              <LongPressMarker
                key={item.id}
                item={item}
                isMoving={movingItemId === item.id}
                mapRef={mapRef}
                onMoveStart={handleMoveStart}
                onMoveEnd={handleMoveEnd}
              />
            ))}

            {newPinLocation && (
              <DraggableMarker
                position={[newPinLocation.lat, newPinLocation.lng]}
                onDragEnd={handlePinDrag}
              />
            )}
          </MapContainer>

          <div className="absolute top-4 right-4 z-10">
            <button className="bg-white/90 backdrop-blur-md w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-xl shadow-sm text-[#575279]/60 hover:text-[#d7827e] transition-colors">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>

          {!isAddFlow && (
            <div className="hidden md:flex absolute bottom-8 left-8 right-8 z-10 pointer-events-none justify-between items-end gap-10">
              <div className="w-full max-w-2xl flex gap-6 pointer-events-auto">
                 <div onClick={startAddFlow} className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 flex gap-4 items-center group cursor-pointer hover:bg-white transition-all hover:-translate-y-1 flex-1">
                    <div className="w-16 h-16 rounded-lg bg-[#f4ede8] flex items-center justify-center text-[#d7827e] flex-shrink-0 group-hover:bg-[#d7827e] group-hover:text-[#faf4ed] transition-colors">
                      <span className="material-symbols-outlined text-3xl">add_box</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-serif font-semibold">Leaving something out?</h4>
                      <p className="text-xs text-[#9893a5] mt-0.5">Drop a pin to let neighbours know.</p>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {placingPin && <PinDropBanner onCancel={cancelAdd} />}

      {movingItemId && !placingPin && <MarkerDragBanner />}

      {showForm && newPinLocation && (
        <GiveawayForm
          formData={formData}
          formErrors={formErrors}
          onFormDataChange={setFormData}
          onFormErrorChange={setFormErrors}
          onSubmit={submitItem}
          onReposition={repositionPin}
          onCancel={cancelAdd}
        />
      )}

      <MobileBottomBar onAddClick={startAddFlow} />
    </div>
  );
}
