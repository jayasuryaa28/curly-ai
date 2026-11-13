'use client';

import { useState } from 'react';

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}

export default function CreationsView({ creations = [], onRemix, onDeleteCreation, onClearAll, onGoToCreate }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-orange-400 text-xl sparkle-anim">🖼️</span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-400 font-mono">
              Personal Vault
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Creations
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-xl">
            {creations.length > 0
              ? `You have ${creations.length} saved creation${creations.length === 1 ? '' : 's'} in your local gallery.`
              : 'Your generation history will be stored here automatically.'}
          </p>
        </div>

        {creations.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onGoToCreate?.()}
              className="px-4 py-2 rounded-2xl orange-btn-gradient text-xs font-extrabold text-white cursor-pointer"
            >
              + New Creation
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear your creations history?')) {
                  onClearAll?.();
                }
              }}
              className="px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-rose-500/20 text-white/60 hover:text-rose-300 border border-white/10 text-xs font-bold transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ── Empty State ── */}
      {creations.length === 0 ? (
        <div className="w-full py-16 sm:py-24 rounded-3xl bg-[#0c101a]/70 border border-white/10 flex flex-col items-center justify-center text-center p-6 backdrop-blur-xl shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <span className="text-3xl text-orange-400">🎨</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            No creations yet!
          </h2>
          <p className="text-xs sm:text-sm text-white/50 max-w-md mb-6 leading-relaxed">
            Generate your first high-res AI image, video, or lip-sync animation in Curly AI Studio to see it here.
          </p>
          <button
            onClick={() => onGoToCreate?.()}
            className="px-6 py-3 rounded-full orange-btn-gradient text-xs font-extrabold text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            ‹ Start Creating Now ✨
          </button>
        </div>
      ) : (
        /* ── Creations Gallery Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {creations.map((item, index) => (
            <div
              key={item.id || index}
              className="group rounded-3xl bg-[#0c101a] border border-white/10 hover:border-orange-500/50 shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10"
            >
              {/* Media Preview */}
              <div className="relative aspect-square w-full overflow-hidden bg-black/60 flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.prompt || 'Creation'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-orange-400 border border-orange-500/30">
                    {item.model || 'AI Model'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/70">
                    {item.aspect_ratio || '1:1'}
                  </span>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => downloadImage(item.url, `curly-creation-${item.id || index}.jpg`)}
                    className="p-2.5 rounded-xl bg-orange-500 text-white font-bold hover:scale-110 active:scale-95 transition-transform shadow-lg cursor-pointer"
                    title="Download High-Res"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRemix?.(item.prompt)}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold hover:scale-110 active:scale-95 transition-transform shadow-lg cursor-pointer"
                    title="Remix in Studio"
                  >
                    ⚡
                  </button>
                </div>
              </div>

              {/* Information & Action Footer */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <p className="text-xs text-white/80 line-clamp-2 leading-relaxed font-medium">
                  "{item.prompt || 'AI generated frame'}"
                </p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-white/40 text-[10px] font-mono">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id || index, item.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedId === (item.id || index) ? '✓' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCreation?.(item.id || index)}
                      className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete from history"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
