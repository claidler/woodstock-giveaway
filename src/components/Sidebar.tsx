import type { Category } from '../types';
import { categoryOptions, CATEGORY_STYLES } from '../constants';

interface SidebarProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const allFilters = [{ id: 'all' as const, icon: 'map', label: 'All Items' }, ...categoryOptions];

  return (
    <aside className="hidden md:flex flex-col w-80 bg-[#f4ede8] p-8 gap-8 z-40 border-r border-[#ebe4df] overflow-y-auto">
      <div>
        <h3 className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest mb-4 px-1">Filter by Tag</h3>
        <div className="grid grid-cols-3 gap-2">
          {allFilters.map((cat) => {
            const isActive = activeCategory === cat.id;
            const catColour = cat.id !== 'all' ? CATEGORY_STYLES[cat.id as Category].bg : '#bd5f5f';
            return (
              <div
                key={cat.id}
                onClick={() => onCategoryChange(cat.id as Category | 'all')}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-1.5
                  ${isActive
                    ? 'bg-white shadow-sm'
                    : 'bg-white/40 border-transparent hover:bg-white hover:border-[#bd5f5f]/20'}`}
                style={isActive ? { borderColor: `${catColour}40` } : undefined}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: isActive ? catColour : '#9893a5' }}>
                  {cat.icon}
                </span>
                <span className="text-[11px] font-medium opacity-80">{cat.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto">
         <div className="bg-[#f9f5ea] p-5 rounded-2xl shadow-sm border border-white/50">
           <h4 className="font-serif font-semibold text-sm mb-2">How it works</h4>
           <ul className="text-xs text-[#9893a5] leading-relaxed space-y-2">
             <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#bd5f5f] text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>Tap "List Your Giveaway" and drop a pin to share what you have.</li>
             <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#bd5f5f] text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>Browse the map to find giveaways near you.</li>
             <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[#bd5f5f] text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>filter_alt</span>Use tags above to filter by category.</li>
           </ul>
         </div>
      </div>
    </aside>
  );
}
