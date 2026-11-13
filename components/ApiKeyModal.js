'use client';

import { useState } from 'react';

export default function ApiKeyModal({ onSave, initialKey = '', onClose, isChange = false }) {
  const [key, setKey] = useState(initialKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const cleanKey = (raw) => (raw || '').trim().replace(/^['"]|['"]$/g, '').replace(/^Bearer\s+/i, '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = cleanKey(key);
    if (!trimmed) {
      setError('Please enter your API key to proceed');
      return;
    }
    setSavedSuccess(true);
    setTimeout(() => {
      onSave(trimmed);
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 z-50 animate-fade-in-up">
      <div className="w-full max-w-lg bg-[#0d121c] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(249,115,22,0.2)] relative overflow-hidden">
        
        {/* Glow background accent */}
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if optional modal */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500/25 to-amber-500/15 border border-orange-500/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,0.25)]">
            <span className="text-3xl text-orange-400">✦</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase font-sans">
            {isChange ? 'Update Studio API Key' : 'Curly AI Studio'}
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1.5 max-w-sm leading-relaxed">
            The studio backend connects to <strong className="text-orange-400">Kie.ai Cloud API</strong> for 200+ models.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                Kie.ai API Key
              </label>
              <a
                href="https://kie.ai"
                target="_blank"
                rel="noreferrer"
                className="text-[12px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 transition-colors"
              >
                Get Free Key on Kie.ai ↗
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError('');
                }}
                placeholder="Paste Kie.ai API key here..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-4 pr-24 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/40 transition-all font-mono"
                autoFocus
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="px-2.5 py-1 text-xs text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={savedSuccess}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm orange-btn-gradient cursor-pointer flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            {savedSuccess ? (
              <>
                <span className="animate-spin">◌</span>
                <span>Connecting to Kie.ai...</span>
              </>
            ) : (
              <>
                <span>Save API Key</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-2 text-[11px] text-white/40">
          <p className="flex items-center gap-2">
            <span className="text-orange-400">🔒</span>
            Stored locally in your browser. Never sent anywhere except direct API calls.
          </p>
          <p className="flex items-center gap-2">
            <span className="text-orange-400">💡</span>
            Supports Flux, Kling, Sora, Nano Banana, Veo, Midjourney and 200+ models.
          </p>
        </div>
      </div>
    </div>
  );
}
