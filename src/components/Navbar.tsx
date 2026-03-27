interface NavbarProps {
  onStartAddFlow: () => void;
}

export default function Navbar({ onStartAddFlow }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#faf4ed]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-16 md:h-20 shadow-none border-b border-[#ebe4df]/50">
      <div className="flex items-center gap-12">
        <span className="text-lg md:text-2xl font-serif italic font-semibold text-[#d7827e] tracking-tight">The Woodstock Giveaway</span>
        <div className="hidden md:flex gap-8 items-center">
          <a href="#" className="text-[#d7827e] border-b border-[#d7827e] pb-1 font-serif font-medium tracking-tight">Woodstock Map</a>
          <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">My Street</a>
          <a href="#" className="text-[#575279] opacity-70 font-serif font-medium tracking-tight hover:opacity-100 hover:text-[#d7827e] transition-all">Community Rules</a>
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <button onClick={onStartAddFlow} className="hidden md:block bg-[#d7827e] text-[#faf4ed] px-6 py-2 rounded-lg font-serif font-medium text-sm hover:opacity-90 active:scale-95 transition-all">
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
  );
}
