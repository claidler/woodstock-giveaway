import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


type Category = 'furniture' | 'clothing' | 'entertainment' | 'pets' | 'kids';


interface GiveawayItem {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  category: Category;
  timePosted: string;
  locationDetails: string;
}


const WOODSTOCK_CENTER: [number, number] = [51.847, -1.354];


const mockItems: GiveawayItem[] = [
  {
    id: '1',
    title: 'Oak Writing Desk',
    description: 'Slightly worn but sturdy. Left it by the front gate.',
    lat: 51.848,
    lng: -1.352,
    category: 'furniture',
    timePosted: 'Available now',
    locationDetails: 'Near Blenheim Palace gates'
  },
  {
    id: '2',
    title: 'Toddler Clothes (Age 3-4)',
    description: 'Rafe outgrew these! Mostly winter coats and jumpers.',
    lat: 51.8465,
    lng: -1.356,
    category: 'kids',
    timePosted: '15m ago',
    locationDetails: 'Old Woodstock'
  },
  {
    id: '3',
    title: 'Box of 80s Slasher DVDs',
    description: 'Having a clear out. Includes some classics and Scream boxset.',
    lat: 51.845,
    lng: -1.353,
    category: 'entertainment',
    timePosted: '1h ago',
    locationDetails: 'Market Street'
  },
  {
    id: '4',
    title: 'Unused Dog Toys',
    description: 'Hobbes completely ignored these. Brand new.',
    lat: 51.8475,
    lng: -1.355,
    category: 'pets',
    timePosted: 'Just now',
    locationDetails: 'Park Street'
  },
  {
    id: '5',
    title: 'Vintage Knits & Sweaters',
    description: 'Assorted warm winter clothing.',
    lat: 51.849,
    lng: -1.351,
    category: 'clothing',
    timePosted: '2h ago',
    locationDetails: 'Hensington Road'
  }
];


const getIconForCategory = (category: Category) => {
  const styles = {
    furniture: { icon: 'chair', bg: 'bg-[#d7827e]' },
    clothing: { icon: 'apparel', bg: 'bg-[#907aa9]' },
    entertainment: { icon: 'movie', bg: 'bg-[#ea9d34]' },
    pets: { icon: 'pets', bg: 'bg-[#575279]' },
    kids: { icon: 'child_care', bg: 'bg-[#d7827e]' },
  };


  const style = styles[category] || styles.furniture;


  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative group cursor-pointer -mt-5 -ml-5">
        <div class="w-10 h-10 ${style.bg} text-[#faf4ed] rounded-full flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">${style.icon}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};


export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');


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


  const filteredItems = activeCategory === 'all' 
    ? mockItems 
    : mockItems.filter(item => item.category === activeCategory);


  return (
    <div className="bg-[#faf4ed] text-[#575279] overflow-hidden font-sans min-h-screen flex flex-col">
      <style>{`
        h1, h2, h3, h4, .font-serif { font-family: 'Noto Serif', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .leaflet-popup-content-wrapper { background-color: #fffaf3; color: #575279; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .leaflet-popup-tip { background-color: #fffaf3; }
        .leaflet-container { font-family: 'Inter', sans-serif; }
      `}</style>


      <nav className="fixed top-0 w-full z-50 bg-[#faf4ed]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-20 shadow-none border-b border-[#ebe4df]/50">
        <div className="flex items-center gap-12">
          <span className="text-2xl font-serif italic font-semibold text-[#d7827e] tracking-tight">The Common</span>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#" className="text-[#d7827e] border-b border-[#d7827e] pb-1 font-serif font-medium tracking-tight">Woodstock Map</a>
            <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">My Street</a>
            <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">Community Rules</a>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button className="hidden md:block bg-[#d7827e] text-[#faf4ed] px-6 py-2 rounded-lg font-serif font-medium text-sm hover:opacity-90 active:scale-95 transition-all">
            List Your Giveaway
          </button>
          <div className="flex items-center gap-4 text-[#575279]/70">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#d7827e] transition-colors">notifications</span>
            <div className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df] overflow-hidden cursor-pointer bg-[#907aa9] flex items-center justify-center text-[#faf4ed]">
              <span className="font-serif font-semibold">C</span>
            </div>
          </div>
        </div>
      </nav>


      <div className="flex flex-1 pt-20 h-screen relative">
        
        <aside className="hidden md:flex flex-col w-80 bg-[#f4ede8] p-8 gap-8 z-40 border-r border-[#ebe4df] overflow-y-auto">
          <div>
            <h2 className="text-2xl font-serif font-semibold tracking-tight">Woodstock Clearout</h2>
            <p className="text-[10px] text-[#9893a5] uppercase tracking-[0.2em] mt-2">Local Neighborhood Echo</p>
          </div>


          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9893a5]/60 text-lg">search</span>
            <input 
              type="text" 
              placeholder="Search items..." 
              className="w-full bg-white/50 border border-[#ebe4df] rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/60"
            />
          </div>


          <div>
            <h3 className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest mb-4 px-1">Filter by Tag</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'all', icon: 'map', label: 'All Items' },
                { id: 'furniture', icon: 'chair', label: 'Furniture' },
                { id: 'clothing', icon: 'apparel', label: 'Clothing' },
                { id: 'entertainment', icon: 'movie', label: 'Media & Games' },
              ].map((cat) => (
                <div 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as Category | 'all')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-2
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
               <h4 className="font-serif font-semibold text-sm mb-2">Woodstock Rules</h4>
               <p className="text-xs text-[#9893a5] leading-relaxed">Please only take items if you genuinely need them. Don't block pavements, and if your items aren't taken by Sunday evening, please bring them back inside.</p>
             </div>
          </div>
        </aside>


        <main className="flex-1 relative bg-[#faf4ed] h-full w-full z-0">
          
          <MapContainer 
            center={WOODSTOCK_CENTER} 
            zoom={15} 
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {filteredItems.map(item => (
              <Marker 
                key={item.id} 
                position={[item.lat, item.lng]}
                icon={getIconForCategory(item.category)}
              >
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
              </Marker>
            ))}
          </MapContainer>


          <div className="absolute top-6 right-6 z-10">
            <button className="bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-xl shadow-sm text-[#575279]/60 hover:text-[#d7827e] transition-colors">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>


          <div className="hidden md:flex absolute bottom-8 left-8 right-8 z-10 pointer-events-none justify-between items-end gap-10">
            <div className="w-full max-w-2xl flex gap-6 pointer-events-auto">
               <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 flex gap-4 items-center group cursor-pointer hover:bg-white transition-all hover:-translate-y-1 flex-1">
                  <div className="w-16 h-16 rounded-lg bg-[#f4ede8] flex items-center justify-center text-[#d7827e] flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl">add_box</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-serif font-semibold">Leaving something out?</h4>
                    <p className="text-xs text-[#9893a5] mt-0.5">Drop a pin to let neighbors know.</p>
                  </div>
               </div>
            </div>
          </div>
        </main>
      </div>


      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf4ed]/95 backdrop-blur-md h-20 border-t border-[#ebe4df] flex justify-around items-center px-6 z-50">
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#d7827e]">
          <span className="material-symbols-outlined">map</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">Map</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">format_list_bulleted</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">List</span>
        </a>
        <div className="w-14 h-14 bg-[#d7827e] rounded-full -mt-12 flex items-center justify-center text-[#faf4ed] shadow-xl ring-4 ring-[#faf4ed]">
          <span className="material-symbols-outlined text-2xl">add</span>
        </div>
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">bookmark</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">Saved</span>
        </a>
        <a href="#" className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">You</span>
        </a>
      </div>
    </div>
  );
}