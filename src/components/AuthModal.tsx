import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-[#575279]/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#fffaf3] w-full md:max-w-sm md:mx-4 rounded-t-3xl md:rounded-3xl shadow-2xl border-t md:border border-[#ebe4df]/50 animate-slide-up">
        {/* Drag handle for mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#ebe4df]" />
        </div>

        <div className="px-6 pt-4 md:pt-6 pb-6 md:pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-serif font-semibold text-[#575279]">Sign in to continue</h3>
              <p className="text-xs text-[#9893a5] mt-0.5">Sign in to list and manage your giveaways.</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f4ede8] flex items-center justify-center text-[#9893a5] hover:text-[#575279] hover:bg-[#ebe4df] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {magicLinkSent ? (
            <div className="text-center py-4">
              <span className="material-symbols-outlined text-4xl text-[#d7827e] mb-2 block">mark_email_read</span>
              <p className="text-sm font-serif font-semibold text-[#575279]">Check your email</p>
              <p className="text-xs text-[#9893a5] mt-1">We sent a sign-in link to <strong>{email}</strong></p>
              <button onClick={onClose} className="mt-4 text-xs text-[#9893a5] hover:text-[#d7827e] transition-colors">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                  className="w-full bg-white border border-[#ebe4df] rounded-xl py-3 px-4 text-base md:text-sm focus:ring-1 focus:ring-[#d7827e]/30 focus:border-[#d7827e]/30 focus:outline-none transition-all placeholder:text-[#9893a5]/50"
                />
                <button
                  onClick={handleMagicLink}
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#d7827e] text-[#faf4ed] py-3 rounded-xl font-serif font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </div>

              {error && (
                <p className="text-[11px] text-[#d7827e] mt-3 text-center">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
