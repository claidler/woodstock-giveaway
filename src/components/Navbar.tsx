import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Category } from '../types';
import { categoryOptions, CATEGORY_STYLES } from '../constants';

interface NavbarProps {
  onStartAddFlow: () => void;
  session: Session | null;
  onSignOut: () => void;
  onShowAuth: () => void;
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function Navbar({ onStartAddFlow, session, onSignOut, onShowAuth, activeCategory, onCategoryChange }: NavbarProps) {
  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initial = (displayName[0] || '?').toUpperCase();
  const [filterOpen, setFilterOpen] = useState(false);
  const hasFilter = activeCategory !== 'all';
  const allFilters = [{ id: 'all' as const, icon: 'map', label: 'All Items' }, ...categoryOptions];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#faf4ed]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-16 md:h-20 shadow-none border-b border-[#ebe4df]/50">
      <div className="flex items-center gap-3">
        <span className="text-lg md:text-2xl font-serif italic font-semibold text-[#d7827e] tracking-tight">The Great Woodstock Giveaway</span>
        {/* Mobile filter button */}
        <div className="md:hidden relative">
          <button
            onClick={() => setFilterOpen(o => !o)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors relative ${
              hasFilter ? 'text-[#d7827e] bg-[#d7827e]/10' : 'text-[#575279]/50'
            }`}
          >
            <span className="material-symbols-outlined text-xl" style={hasFilter ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              filter_alt
            </span>
            {hasFilter && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#d7827e] border-2 border-[#faf4ed]" />
            )}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute left-0 top-full mt-2 z-50 bg-[#faf4ed] rounded-2xl shadow-xl border border-[#ebe4df] p-4 w-64 animate-fade-in">
                <h3 className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest mb-3 px-1">Filter by Tag</h3>
                <div className="grid grid-cols-3 gap-2">
                  {allFilters.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const catColour = cat.id !== 'all' ? CATEGORY_STYLES[cat.id as Category].bg : '#d7827e';
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          onCategoryChange(cat.id as Category | 'all');
                          setFilterOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1
                          ${isActive
                            ? 'bg-white shadow-sm'
                            : 'bg-white/40 border-transparent active:bg-white'}`}
                        style={isActive ? { borderColor: `${catColour}40` } : undefined}
                      >
                        <span
                          className="material-symbols-outlined text-xl"
                          style={{ fontVariationSettings: "'FILL' 1", color: isActive ? catColour : '#9893a5' }}
                        >
                          {cat.icon}
                        </span>
                        <span className="text-[10px] font-medium opacity-80">{cat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={onStartAddFlow} className="hidden md:block bg-[#d7827e] text-[#faf4ed] px-6 py-2 rounded-lg font-serif font-medium text-sm hover:opacity-90 active:scale-95 transition-all">
          List Your Giveaway
        </button>
        {user ? (
          <div className="hidden md:flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df] bg-[#907aa9] flex items-center justify-center text-[#faf4ed]">
                <span className="font-serif font-semibold">{initial}</span>
              </div>
            )}
            <button onClick={onSignOut} className="text-xs text-[#9893a5] hover:text-[#d7827e] transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={onShowAuth} className="hidden md:flex items-center gap-2 border border-[#ebe4df] bg-white/50 text-[#575279] px-5 py-2 rounded-lg font-serif font-medium text-sm hover:border-[#d7827e]/30 hover:text-[#d7827e] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-base">person</span>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
