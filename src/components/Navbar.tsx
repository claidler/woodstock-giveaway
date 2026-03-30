import type { Session } from '@supabase/supabase-js';

interface NavbarProps {
  onStartAddFlow: () => void;
  session: Session | null;
  onSignOut: () => void;
  onShowAuth: () => void;
}

export default function Navbar({ onStartAddFlow, session, onSignOut, onShowAuth }: NavbarProps) {
  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initial = (displayName[0] || '?').toUpperCase();

  return (
    <nav className="fixed top-0 w-full z-50 bg-[rgb(189,95,95)] flex justify-between items-center px-4 md:px-8 h-16 md:h-20 overflow-hidden shadow-none">
      <div className="flex items-center">
        <img src="/title-banner.png" alt="Sat 9 May — The Great Woodstock Giveaway" className="h-14 md:h-16 object-contain translate-y-[3px] md:translate-y-[5px]" />
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={onStartAddFlow} className="hidden md:block bg-[rgb(249,245,234)] text-[rgb(189,95,95)] px-6 py-2 rounded-lg font-serif font-medium text-sm hover:opacity-90 active:scale-95 transition-all">
          List Your Giveaway
        </button>
        {user ? (
          <div className="hidden md:flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df]" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full ring-1 ring-[#ebe4df] bg-[#907aa9] flex items-center justify-center text-[#f9f5ea]">
                <span className="font-serif font-semibold">{initial}</span>
              </div>
            )}
            <button onClick={onSignOut} className="text-xs text-[rgb(249,245,234)]/70 hover:text-[rgb(249,245,234)] transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={onShowAuth} className="hidden md:flex items-center gap-2 border border-[rgb(249,245,234)]/30 bg-white/10 text-[rgb(249,245,234)] px-5 py-2 rounded-lg font-serif font-medium text-sm hover:bg-white/20 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-base">person</span>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
