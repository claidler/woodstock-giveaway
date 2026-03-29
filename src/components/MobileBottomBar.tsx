import type { Session } from '@supabase/supabase-js';

interface MobileBottomBarProps {
  onStartAddFlow: () => void;
  onRecentreMap: () => void;
  session: Session | null;
  onSignOut: () => void;
  onShowAuth: () => void;
}

export default function MobileBottomBar({ onStartAddFlow, onRecentreMap, session, onSignOut, onShowAuth }: MobileBottomBarProps) {
  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initial = (displayName[0] || '?').toUpperCase();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#faf4ed]/95 backdrop-blur-md h-20 border-t border-[#ebe4df] flex justify-around items-center px-6 z-50">
      <button onClick={onRecentreMap} className="flex flex-col items-center gap-1.5 text-[#d7827e]">
        <span className="material-symbols-outlined">map</span>
        <span className="text-[9px] font-semibold tracking-wider uppercase">Map</span>
      </button>
      <div onClick={onStartAddFlow} className="w-14 h-14 bg-[#d7827e] rounded-full -mt-12 flex items-center justify-center text-[#faf4ed] shadow-xl ring-4 ring-[#faf4ed] cursor-pointer active:scale-90 transition-transform">
        <span className="material-symbols-outlined text-2xl">add</span>
      </div>
      {user ? (
        <button onClick={onSignOut} className="flex flex-col items-center gap-1.5 text-[#575279]/70">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#907aa9] flex items-center justify-center text-[#faf4ed] text-[10px] font-serif font-semibold">
              {initial}
            </div>
          )}
          <span className="text-[9px] font-semibold tracking-wider uppercase">Sign out</span>
        </button>
      ) : (
        <button onClick={onShowAuth} className="flex flex-col items-center gap-1.5 text-[#575279]/40">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[9px] font-semibold tracking-wider uppercase">Sign in</span>
        </button>
      )}
    </div>
  );
}
