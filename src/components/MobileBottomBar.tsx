import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Session } from '@supabase/supabase-js';
import type { Category } from '../types';
import { categoryOptions, CATEGORY_STYLES } from '../constants';

interface MobileBottomBarProps {
  onStartAddFlow: () => void;
  session: Session | null;
  onSignOut: () => void;
  onShowAuth: () => void;
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export default function MobileBottomBar({ onStartAddFlow, session, onSignOut, onShowAuth, activeCategory, onCategoryChange }: MobileBottomBarProps) {
  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initial = (displayName[0] || '?').toUpperCase();
  const [filterOpen, setFilterOpen] = useState(false);
  const hasFilter = activeCategory !== 'all';
  const allFilters = [{ id: 'all' as const, icon: 'map', label: 'All Items' }, ...categoryOptions];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgb(249,245,234)] h-20 border-t border-[#ebe4df] flex justify-around items-center px-6 z-50">
      <div className="relative">
        <button onClick={() => setFilterOpen(o => !o)} className={`flex flex-col items-center gap-1.5 ${hasFilter ? 'text-[#bd5f5f]' : 'text-[#bd5f5f]/60'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">Filter</span>
          {hasFilter && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ea9d34] border-2 border-[#f9f5ea]" />
          )}
        </button>
        {filterOpen && createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setFilterOpen(false)} />
            <div className="fixed left-4 right-4 bottom-24 z-[70] bg-[#f9f5ea]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#ebe4df] p-4 animate-fade-in">
              <h3 className="text-[10px] font-bold text-[#9893a5] uppercase tracking-widest mb-3 px-0.5">Filter by Tag</h3>
              <div className="grid grid-cols-4 gap-2">
                {allFilters.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const catColour = cat.id !== 'all' ? CATEGORY_STYLES[cat.id as Category].bg : '#bd5f5f';
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        onCategoryChange(cat.id as Category | 'all');
                        setFilterOpen(false);
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5
                        ${isActive
                          ? 'bg-white shadow-sm'
                          : 'bg-white/40 border-transparent active:bg-white'}`}
                      style={isActive ? { borderColor: `${catColour}40` } : undefined}
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1", color: isActive ? catColour : '#9893a5' }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-[9px] font-medium opacity-80 leading-tight">{cat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
      <div onClick={onStartAddFlow} className="w-14 h-14 bg-[#bd5f5f] rounded-full -mt-12 flex items-center justify-center text-[rgb(249,245,234)] shadow-xl ring-4 ring-[rgb(249,245,234)] cursor-pointer active:scale-90 transition-transform">
        <span className="material-symbols-outlined text-2xl">add</span>
      </div>
      {user ? (
        <button onClick={onSignOut} className="flex flex-col items-center gap-1.5 text-[#bd5f5f]/60">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#907aa9] flex items-center justify-center text-[#f9f5ea] text-[10px] font-serif font-semibold">
              {initial}
            </div>
          )}
          <span className="text-[9px] font-semibold tracking-wider uppercase">Sign out</span>
        </button>
      ) : (
        <button onClick={onShowAuth} className="flex flex-col items-center gap-1.5 text-[#bd5f5f]/40">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">Sign in</span>
        </button>
      )}
    </div>
  );
}
