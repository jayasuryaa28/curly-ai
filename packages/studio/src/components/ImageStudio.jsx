"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { generateImage, generateI2I, uploadFile } from "../kie.js";
import {
  t2iModels,
  i2iModels,
  getAspectRatiosForModel,
  getResolutionsForModel,
  getQualityFieldForModel,
  getAspectRatiosForI2IModel,
  getResolutionsForI2IModel,
  getQualityFieldForI2IModel,
  getMaxImagesForI2IModel,
} from "../models.js";

// ─── helpers ────────────────────────────────────────────────────────────────


async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

// ─── UploadButton (inline picker) ───────────────────────────────────────────

function UploadButton({ apiKey, maxImages, onSelect, onClear }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]); // [{url, thumbnail}]
  const [uploadHistory, setUploadHistory] = useState([]); // [{id, name, url, thumbnail}]
  const [lastUploadProgress, setLastUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [panelOpen]);

  // When maxImages changes, trim excess selections
  useEffect(() => {
    if (selectedEntries.length > maxImages) {
      const trimmed = selectedEntries.slice(0, maxImages);
      setSelectedEntries(trimmed);
      if (trimmed.length === 0) onClear?.();
    }
    if (fileInputRef.current) {
      fileInputRef.current.multiple = maxImages > 1;
    }
  }, [maxImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const fireOnSelect = useCallback(
    (entries) => {
      if (!entries.length) return;
      const urls = entries.map((e) => e.url);
      onSelect({ url: urls[0], urls, thumbnail: entries[0].url });
    },
    [onSelect]
  );

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = "";

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const tooLarge = files.filter(f => f.size > MAX_IMAGE_SIZE);
    if (tooLarge.length > 0) {
      alert(`The following images are too large (max 10MB): ${tooLarge.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const toUpload =
        maxImages === 1 ? files.slice(0, 1) : files.slice(0, maxImages - selectedEntries.length || 1);

      await Promise.all(
        toUpload.map(async (file) => {
          const id = Date.now().toString() + Math.random();

          // Add a placeholder to history immediately without local preview
          const placeholder = { id, name: file.name, url: null, progress: 0 };
          setUploadHistory((prev) => [placeholder, ...prev]);

          try {
            const uploadedUrl = await uploadFile(apiKey, file, (pct) => {
              setLastUploadProgress(pct);
              setUploadHistory((prev) =>
                prev.map((h) => (h.id === id ? { ...h, progress: pct } : h))
              );
            });

            // Update history with real URL and Mark as 100%
            setUploadHistory((prev) =>
              prev.map((h) => {
                if (h.id === id) {
                  return { ...h, url: uploadedUrl, progress: 100 };
                }
                return h;
              })
            );

            // Auto-select if there's room
            if (selectedEntries.length < maxImages) {
              const newEntry = { url: uploadedUrl };
              setSelectedEntries((prev) => [...prev, newEntry]);

              if (maxImages === 1) {
                fireOnSelect([newEntry]);
                setPanelOpen(false);
              }
            }
          } catch (err) {
            console.error("[UploadButton] Upload failed for", file.name, err);
            setUploadHistory((prev) => prev.filter((h) => h.id !== id));
            throw err;
          }
        })
      );
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setLastUploadProgress(0);
    }
  };

  const handleCellClick = (entry) => {
    const selIdx = selectedEntries.findIndex((e) => e.url === entry.url);
    const isSelected = selIdx !== -1;
    const atMax = maxImages > 1 && !isSelected && selectedEntries.length >= maxImages;
    if (atMax) return;

    if (maxImages === 1) {
      const newSelected = [{ url: entry.url, localUrl: entry.localUrl }];
      setSelectedEntries(newSelected);
      fireOnSelect(newSelected);
      setPanelOpen(false);
    } else {
      let next;
      if (isSelected) {
        next = selectedEntries.filter((_, i) => i !== selIdx);
        if (next.length === 0) onClear?.();
      } else {
        next = [...selectedEntries, { url: entry.url, localUrl: entry.localUrl }];
      }
      setSelectedEntries(next);
    }
  };

  const handleRemoveFromHistory = (e, entry) => {
    e.stopPropagation();
    if (entry.localUrl) URL.revokeObjectURL(entry.localUrl);
    setUploadHistory((prev) => prev.filter((h) => h.id !== entry.id));
    
    const next = selectedEntries.filter((s) => s.url !== entry.url);
    if (next.length !== selectedEntries.length) {
      setSelectedEntries(next);
      if (next.length === 0) onClear?.();
    }
  };

  const handleDone = (e) => {
    e.stopPropagation();
    fireOnSelect(selectedEntries);
    setPanelOpen(false);
  };

  const reset = () => {
    setSelectedEntries([]);
    setPanelOpen(false);
  };

  // expose reset via ref pattern — parent calls reset() directly
  // (handled by parent through uploadedImageUrls state reset)

  const isMulti = maxImages > 1;
  const count = selectedEntries.length;
  const hasSelection = count > 0;

  // Trigger icon content
  let triggerContent;
  if (hasSelection || uploading) {
    const mainEntry = selectedEntries[0] || uploadHistory[0];
    const canAddMore = isMulti && count < maxImages;
    let badge;
    if (uploading && !hasSelection) {
      badge = (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
          <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
          <span className="text-[8px] font-black text-primary">{lastUploadProgress}%</span>
        </div>
      );
    } else if (count > 1) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <span className="text-[9px] font-black text-black leading-none">{count}</span>
        </div>
      );
    } else if (canAddMore) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-white/80 rounded-full flex items-center justify-center px-0.5 border border-primary/60">
          <span className="text-[9px] font-black text-black leading-none">+</span>
        </div>
      );
    } else {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    triggerContent = (
      <>
        {uploading && hasSelection && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
            <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
            <span className="text-[8px] font-black text-primary">{lastUploadProgress}%</span>
          </div>
        )}
        {mainEntry?.url ? (
          <img src={mainEntry.url} alt="" className={`w-full h-full object-cover transition-all duration-300 ${uploading && hasSelection ? 'blur-[2px] scale-110 opacity-60' : 'blur-0 scale-100 opacity-100'}`} />
        ) : (
           <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse">
             <div className="w-4 h-4 rounded-full border border-primary/20 border-t-primary animate-spin mb-0.5" />
             <span className="text-[8px] font-black text-primary">{lastUploadProgress}%</span>
           </div>
        )}
        {!uploading && badge}
      </>
    );
  } else {
    triggerContent = (
      <div className="relative flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/70 group-hover:text-orange-400 transition-colors"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="absolute -top-1 -right-1.5 text-xs font-black text-orange-400 leading-none">✦</span>
      </div>
    );
  }

  const triggerTitle = hasSelection
    ? count > 1
      ? `${count} of ${maxImages} images selected — click to manage`
      : isMulti
      ? `1 image selected — click to add more (up to ${maxImages})`
      : "Reference image"
    : isMulti
    ? `Add up to ${maxImages} images`
    : "Reference image";

  return (
    <div className="relative shrink-0">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isMulti}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        title={triggerTitle}
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((o) => !o);
        }}
        className={`w-11 h-11 shrink-0 rounded-2xl border transition-all flex items-center justify-center relative overflow-hidden bg-white/[0.05] hover:bg-orange-500/10 group cursor-pointer ${
          hasSelection
            ? "border-orange-500 shadow-md shadow-orange-500/30"
            : "border-white/10 hover:border-orange-500/50"
        }`}
      >
        {triggerContent}
      </button>

      {/* Panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-[calc(100%+8px)] left-0 bg-[#111] rounded-3xl p-3 shadow-4xl border border-white/10 w-72"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                Reference Images
              </span>
              {isMulti && (
                <span className="text-[9px] text-muted">
                  Select up to {maxImages} images
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMulti && hasSelection && (
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
                >
                  ✓ Done ({count})
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all border border-primary/20"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isMulti ? "Upload files" : "Upload new"}
              </button>
            </div>
          </div>

          {/* Grid or empty state */}
          {uploadHistory.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 opacity-40">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-secondary"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-secondary">No uploads yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
              {uploadHistory.map((entry) => {
                const selIdx = selectedEntries.findIndex((e) => e.url === entry.url);
                const isSelected = selIdx !== -1;
                const atMax = isMulti && !isSelected && selectedEntries.length >= maxImages;

                return (
                  <div
                    key={entry.id}
                    title={entry.name}
                    onClick={() => entry.url && handleCellClick(entry)}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer group/cell aspect-square transition-all ${
                      isSelected ? "border-primary shadow-glow" : "border-white/10 hover:border-white/30"
                    } ${atMax ? "opacity-40 cursor-not-allowed" : ""} ${!entry.url ? "cursor-wait" : ""}`}
                  >
                    {entry.url ? (
                      <img
                        src={entry.url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
                         <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-1" />
                         <span className="text-[10px] font-black text-primary">{entry.progress}%</span>
                      </div>
                    )}

                    {/* Hover overlay with delete */}
                    {entry.url && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-end justify-end p-1">
                        <button
                          type="button"
                          title="Remove from history"
                          onClick={(e) => handleRemoveFromHistory(e, entry)}
                          className="w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center transition-colors"
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Selection badge */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1">
                        {isMulti ? (
                          <span className="text-[10px] font-black text-black">{selIdx + 1}</span>
                        ) : (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom bar for multi-select */}
          {isMulti && hasSelection && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-secondary">
                {count} of {maxImages} selected
              </span>
              <button
                type="button"
                onClick={handleDone}
                className="px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
              >
                Use Selected
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ModelDropdown ────────────────────────────────────────────────────────────

function ModelDropdown({ models, selectedModel, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="px-2 pb-3 mb-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 focus:outline-none"
          />
        </div>
      </div>
      <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 shrink-0">
        Available models
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(m);
              onClose();
            }}
            className={`flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${
              selectedModel === m.id ? "bg-white/5 border-white/5" : ""
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 ${
                  m.family === "kontext"
                    ? "bg-blue-500/10 text-blue-400"
                    : m.family === "effects"
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-primary/10 text-primary"
                } border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase`}
              >
                {m.name.charAt(0)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-white tracking-tight">{m.name}</span>
              </div>
            </div>
            {selectedModel === m.id && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" strokeWidth="4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SimpleDropdown ───────────────────────────────────────────────────────────

function SimpleDropdown({ title, options, selected, onSelect, onClose }) {
  return (
    <>
      <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <div
            key={opt}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opt);
              onClose();
            }}
            className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
          >
            <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100">
              {opt}
            </span>
            {selected === opt && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" strokeWidth="4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── ImagineLab Style Presets & Ideas ─────────────────────────────────────────

const STYLE_PRESETS = [
  { id: 'cinematic', label: 'Cinematic', icon: '🎬', tag: 'cinematic film still, anamorphic lens, 8k, volumetric dramatic lighting', img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=500&q=80' },
  { id: 'realistic', label: 'Realistic', icon: '📷', tag: 'photorealistic, ultra realistic, highly detailed, real world texture, 8k resolution', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80' },
  { id: 'anime', label: 'Anime', icon: '🌸', tag: 'anime style, vibrant colors, clean cel shading, high quality illustration, Makoto Shinkai aesthetic', img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=500&q=80' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '👾', tag: 'cyberpunk neon city, neon reflections on wet asphalt, futuristic dusk atmosphere', img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=500&q=80' },
  { id: 'fantasy', label: 'Fantasy', icon: '🏰', tag: 'epic fantasy realm, mythical aesthetics, intricate golden details, magical twilight glow', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=500&q=80' },
  { id: 'minimal', label: 'Minimal', icon: '🍃', tag: 'minimalist composition, clean background, elegant simplicity, calm soothing mood', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80' },
];

const STYLE_CHIPS = [
  { id: 'surreal', label: 'Surreal', icon: '✦', snippet: 'surreal dreamscape, ethereal art, magical realism' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎬', snippet: 'cinematic film still, 35mm lens flare' },
  { id: 'photo', label: 'Photorealistic', icon: '📷', snippet: 'photorealistic 8k, authentic texture' },
  { id: 'anime', label: 'Anime Style', icon: '🐱', snippet: 'anime aesthetic, Makoto Shinkai style' },
  { id: 'studio', label: 'Studio Lighting', icon: '☀️', snippet: 'professional studio lighting, softbox illumination' },
  { id: 'more', label: 'More', icon: '⚏', snippet: '' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageStudio({ apiKey, onGenerationComplete, historyItems, initialPrompt = '', onOpenModelsModal }) {
  // ── Model / mode state ──────────────────────────────────────────────────
  const [imageMode, setImageMode] = useState(false); // false=t2i, true=i2i
  const [selectedModelId, setSelectedModelId] = useState(t2iModels[0].id);
  const [selectedModelName, setSelectedModelName] = useState(t2iModels[0].name);
  const [selectedAr, setSelectedAr] = useState(
    t2iModels[0].inputs?.aspect_ratio?.default || "1:1"
  );
  const [selectedQuality, setSelectedQuality] = useState(() => {
    const resolutions = getResolutionsForModel(t2iModels[0].id);
    return resolutions[0] || null;
  });
  const [maxImages, setMaxImages] = useState(1);

  // ── Prompt / upload state ───────────────────────────────────────────────
  const [prompt, setPrompt] = useState(initialPrompt || "");

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
        }
      }, 50);
    }
  }, [initialPrompt]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(null); // 'model' | 'ar' | 'quality' | null
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [activeStylePreset, setActiveStylePreset] = useState('cinematic');
  const [activeChips, setActiveChips] = useState(['surreal']);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const handleSelectStylePreset = (preset) => {
    setActiveStylePreset((prev) => (prev === preset.id ? null : preset.id));
    setPrompt((prev) => {
      const clean = prev.trim();
      if (!clean) return preset.tag;
      if (clean.toLowerCase().includes(preset.tag.toLowerCase())) return clean;
      return `${clean}, ${preset.tag}`;
    });
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, 50);
  };

  const handleToggleChip = (chip) => {
    if (chip.id === 'more') {
      setShowSettingsDrawer((prev) => !prev);
      return;
    }
    const isCurrentlyActive = activeChips.includes(chip.id);
    if (isCurrentlyActive) {
      setActiveChips((prev) => prev.filter((c) => c !== chip.id));
    } else {
      setActiveChips((prev) => [...prev, chip.id]);
      if (chip.snippet) {
        setPrompt((prev) => {
          const clean = prev.trim();
          if (!clean) return chip.snippet;
          if (clean.toLowerCase().includes(chip.snippet.toLowerCase())) return clean;
          return `${clean}, ${chip.snippet}`;
        });
      }
    }
  };

  const handleMagicEnhance = () => {
    const enhancers = [
      '8k resolution, volumetric cinematic lighting, photorealistic textures, master composition',
      'hyperdetailed, ultra-sharp focus, award-winning photography, studio depth of field',
      'dramatic anamorphic lens flare, professional color grading, intricate fine details'
    ];
    const picked = enhancers[Math.floor(Math.random() * enhancers.length)];
    setPrompt((prev) => {
      const clean = prev.trim();
      if (!clean) return `A breathtaking masterpiece, ${picked}`;
      return `${clean}, ${picked}`;
    });
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
    }, 50);
  };


  // ── Canvas / history state ──────────────────────────────────────────────
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);
  const [localHistory, setLocalHistory] = useState([]); // [{id,url,prompt,model,aspect_ratio,timestamp}]

  // Use prop history if provided, otherwise local
  const history = historyItems ?? localHistory;

  // ── Refs ────────────────────────────────────────────────────────────────
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const uploadPickerResetRef = useRef(null); // not used directly — managed via key

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [dropdownOpen]);

  // ── Textarea auto-resize ─────────────────────────────────────────────────
  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = window.innerWidth < 768 ? 150 : 250;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  // ── Derived: current model lists & helpers ───────────────────────────────
  const currentModels = imageMode ? i2iModels : t2iModels;
  const currentAspectRatios = imageMode
    ? getAspectRatiosForI2IModel(selectedModelId)
    : getAspectRatiosForModel(selectedModelId);
  const currentResolutions = imageMode
    ? getResolutionsForI2IModel(selectedModelId)
    : getResolutionsForModel(selectedModelId);
  const currentQualityField = imageMode
    ? getQualityFieldForI2IModel(selectedModelId)
    : getQualityFieldForModel(selectedModelId);
  const showQualityBtn = currentResolutions.length > 0;

  // ── Upload picker callbacks ──────────────────────────────────────────────
  const handleUploadSelect = useCallback(
    ({ url, urls }) => {
      const newUrls = urls || [url];
      setUploadedImageUrls(newUrls);

      if (!imageMode) {
        const firstI2I = i2iModels[0];
        const ars = getAspectRatiosForI2IModel(firstI2I.id);
        const resolutions = getResolutionsForI2IModel(firstI2I.id);
        setImageMode(true);
        setSelectedModelId(firstI2I.id);
        setSelectedModelName(firstI2I.name);
        setSelectedAr(ars[0] || "1:1");
        setSelectedQuality(resolutions[0] || null);
        setMaxImages(getMaxImagesForI2IModel(firstI2I.id));
      }
    },
    [imageMode]
  );

  const handleUploadClear = useCallback(() => {
    setUploadedImageUrls([]);
    setImageMode(false);
    const firstT2I = t2iModels[0];
    const ars = getAspectRatiosForModel(firstT2I.id);
    const resolutions = getResolutionsForModel(firstT2I.id);
    setSelectedModelId(firstT2I.id);
    setSelectedModelName(firstT2I.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setMaxImages(1);
  }, []);

  // ── Model selection ──────────────────────────────────────────────────────
  const handleModelSelect = (m) => {
    const ars = imageMode
      ? getAspectRatiosForI2IModel(m.id)
      : getAspectRatiosForModel(m.id);
    const resolutions = imageMode
      ? getResolutionsForI2IModel(m.id)
      : getResolutionsForModel(m.id);
    setSelectedModelId(m.id);
    setSelectedModelName(m.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    if (imageMode) setMaxImages(getMaxImagesForI2IModel(m.id));
  };

  // ── History helpers ──────────────────────────────────────────────────────
  const addToHistory = useCallback(
    (entry) => {
      if (!historyItems) {
        setLocalHistory((prev) => [entry, ...prev.slice(0, 49)]);
      }
      setActiveHistoryIdx(0);
      setCurrentImageUrl(entry.url);
    },
    [historyItems]
  );

  // ── View state: 'prompt' | 'canvas' ─────────────────────────────────────
  const showCanvas = currentImageUrl !== null;

  const resetToPrompt = () => {
    setCurrentImageUrl(null);
    setPrompt("");
    setUploadedImageUrls([]);
    setImageMode(false);
    const firstT2I = t2iModels[0];
    const ars = getAspectRatiosForModel(firstT2I.id);
    const resolutions = getResolutionsForModel(firstT2I.id);
    setSelectedModelId(firstT2I.id);
    setSelectedModelName(firstT2I.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setMaxImages(1);
  };

  // ── Generation ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (generating) return;

    if (imageMode) {
      if (uploadedImageUrls.length === 0) {
        alert("Please upload a reference image first.");
        return;
      }
    } else {
      if (!prompt.trim()) {
        alert("Please enter a prompt to generate an image.");
        return;
      }
    }

    setGenerating(true);
    setGenerateError(null);

    try {
      let res;
      if (imageMode) {
        const genParams = {
          model: selectedModelId,
          images_list: uploadedImageUrls,
          image_url: uploadedImageUrls[0],
          aspect_ratio: selectedAr,
        };
        if (prompt.trim()) genParams.prompt = prompt.trim();
        if (currentQualityField && selectedQuality) {
          genParams[currentQualityField] = selectedQuality;
        }
        res = await generateI2I(apiKey, genParams);
      } else {
        const genParams = {
          model: selectedModelId,
          prompt: prompt.trim(),
          aspect_ratio: selectedAr,
        };
        if (currentQualityField && selectedQuality) {
          genParams[currentQualityField] = selectedQuality;
        }
        res = await generateImage(apiKey, genParams);
      }

      if (res && res.url) {
        const entry = {
          id: res.id || Date.now().toString(),
          url: res.url,
          prompt: prompt.trim(),
          model: selectedModelName || selectedModelId,
          aspect_ratio: selectedAr,
          timestamp: new Date().toISOString(),
          type: "image",
        };
        addToHistory(entry);
        try {
          const stored = localStorage.getItem('curly_creations');
          const existing = stored ? JSON.parse(stored) : [];
          const updated = [entry, ...existing.filter((e) => e.id !== entry.id && e.url !== entry.url)].slice(0, 100);
          localStorage.setItem('curly_creations', JSON.stringify(updated));
        } catch {}
        onGenerationComplete?.(entry);
      } else {
        throw new Error("No image URL returned by API");
      }
    } catch (e) {
      console.warn("[ImageStudio] Generation failed:", e?.message || e);
      if (e.isAuthError || e.message?.includes('401') || e.message?.toLowerCase().includes('unauthorized')) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-error', { detail: { message: e.message } }));
        }
      }
      setGenerateError(e.message?.slice(0, 80) || 'Generation failed');
      setTimeout(() => setGenerateError(null), 5000);
    } finally {
      setGenerating(false);
    }
  };

  const placeholderText =
    uploadedImageUrls.length > 1
      ? `${uploadedImageUrls.length} images selected — describe the transformation (optional)`
      : imageMode
      ? "Describe how to transform this image (optional)"
      : "Describe what you want to create...";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-full flex-1 flex flex-col items-center justify-center bg-transparent relative p-4 md:p-8 py-6 sm:py-10 overflow-y-auto custom-scrollbar overflow-x-hidden">

      {/* ── CANVAS VIEW ─────────────────────────────────────────────────── */}
      {showCanvas && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-10">
          {/* History sidebar */}
          {history.length > 0 && (
            <div className="hidden md:flex fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-40 flex-col items-center py-4 gap-3 overflow-y-auto">
              <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">
                History
              </div>
              <div className="flex flex-col gap-2 w-full px-2">
                {history.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    onClick={() => {
                      setCurrentImageUrl(entry.url);
                      setActiveHistoryIdx(idx);
                    }}
                    className={`relative group/thumb cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      idx === activeHistoryIdx
                        ? "border-primary shadow-glow"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={entry.url}
                      alt={entry.prompt?.substring(0, 30) || "Generated"}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title="Download"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(entry.url, `kie-${entry.id || idx}.jpg`);
                        }}
                        className="p-1.5 bg-primary rounded-lg text-black hover:scale-110 transition-transform"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main image */}
          <div className="relative group">
            <img
              src={currentImageUrl}
              alt={history[activeHistoryIdx]?.prompt || "Generated image"}
              className="max-h-[60vh] max-w-[80vw] rounded-3xl shadow-3xl border border-white/10 interactive-glow object-contain"
            />
          </div>

          {/* Canvas controls */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white disabled:opacity-50"
            >
              ↻ Regenerate
            </button>
            <button
              type="button"
              onClick={() => {
                const entry = history[activeHistoryIdx];
                downloadImage(currentImageUrl, `kie-${entry?.id || "image"}.jpg`);
              }}
              className="bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-glow active:scale-95"
            >
              ↓ Download
            </button>
            <button
              type="button"
              onClick={resetToPrompt}
              className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white"
            >
              + New
            </button>
          </div>
        </div>
      )}

      {/* ── PROMPT & IMAGINELAB WORKSPACE VIEW (MATCHES TARGET IMAGE 2) ── */}
      {!showCanvas && (
        <div className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center mx-auto my-auto px-4 py-4 sm:py-6 animate-fade-in-up">

          {/* Centered Golden Sparkle Icon */}
          <div className="w-8 h-8 mx-auto mb-2 text-orange-400 text-3xl flex items-center justify-center sparkle-anim">
            ✦
          </div>

          {/* Headline (Matches Image 2 Exactly: "Create Stunning Visuals with AI✦") */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center tracking-tight mb-2.5 flex items-center justify-center gap-2.5 flex-wrap">
            <span>Create Stunning Visuals</span>
            <span className="relative text-orange-500 flex items-center gap-1">
              <span>with AI</span>
              <span className="text-orange-400 text-3xl sm:text-4xl">✦</span>
              <svg className="absolute -bottom-1.5 left-0 w-full h-2 text-orange-500/80" viewBox="0 0 120 8" fill="none">
                <path d="M2 6C35 2 85 2 118 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-white/60 text-center mb-8 max-w-xl mx-auto font-normal">
            Turn your ideas into images, videos and more — simple, fast and creative.
          </p>

          {/* ── 6 Style Selection Cards (Matches Image 1 Exactly) ── */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 sm:gap-4 mb-8 sm:mb-9 max-w-5xl mx-auto">
            {STYLE_PRESETS.map((preset) => {
              const isSelected = activeStylePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectStylePreset(preset)}
                  className={`group relative rounded-2xl h-28 sm:h-32 p-2 flex flex-col justify-end items-center transition-all duration-300 cursor-pointer overflow-hidden border ${
                    isSelected
                      ? 'border-2 border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.5)] scale-[1.03] ring-1 ring-orange-500/50'
                      : 'border-white/10 hover:border-orange-500/60 hover:scale-[1.02] shadow-md'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.3) 45%, rgba(0, 0, 0, 0.05) 100%), url(${preset.img})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Centered Frosted Dark Pill Badge at Bottom */}
                  <div className={`px-3 py-1 rounded-full text-center flex items-center justify-center gap-1.5 backdrop-blur-md transition-all duration-200 border w-auto ${
                    isSelected
                      ? 'bg-black/90 text-white border-orange-500/60 shadow-sm'
                      : 'bg-black/75 text-white/90 border-white/10 group-hover:bg-black/90 group-hover:text-white'
                  }`}>
                    <span className="text-xs">{preset.icon}</span>
                    <span className="text-[11px] font-bold tracking-wide">
                      {preset.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Generating State Visual Feedback ── */}
          {generating && (
            <div className="w-full max-w-5xl mb-6 p-6 rounded-3xl bg-black/70 border border-orange-500/40 flex flex-col items-center justify-center gap-4 backdrop-blur-xl shadow-2xl animate-fade-in-up">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin shadow-[0_0_25px_rgba(249,115,22,0.6)]" />
                <span className="text-2xl text-orange-400 sparkle-anim">✦</span>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white tracking-wide mb-1">
                  Synthesizing High-Res Visual Frame...
                </div>
                <div className="text-xs text-orange-400/80 font-mono">
                  Cloud GPU rendering via {selectedModelName}
                </div>
              </div>
            </div>
          )}

          {/* ── THE UNIFIED PROMPT WORKSPACE CARD (MATCHES TARGET DESIGN EXACTLY) ── */}
          <div className="w-full max-w-5xl mx-auto rounded-[32px] sm:rounded-[36px] border border-orange-500/50 bg-[#090d16]/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_40px_rgba(249,115,22,0.18)] transition-all hover:border-orange-500/75 hover:shadow-[0_0_55px_rgba(249,115,22,0.25)] relative z-30">
            
            {/* ── ROW 1: Prompt Input Row (Upload + Divider + Textarea + Magic/Settings) ── */}
            <div className="w-full flex items-center gap-3.5">
              
              {/* Upload Button */}
              <UploadButton
                apiKey={apiKey}
                maxImages={maxImages}
                onSelect={handleUploadSelect}
                onClear={handleUploadClear}
              />

              {/* Vertical subtle divider */}
              <div className="w-[1px] h-6 bg-white/20 shrink-0" />

              {/* Textarea Input - Seamlessly integrated */}
              <div className="flex-1 flex items-center min-h-[38px]">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onInput={handleTextareaInput}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={placeholderText}
                  rows={1}
                  className="w-full bg-transparent border-none text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none resize-none py-1.5 leading-relaxed min-h-[38px] max-h-[140px] overflow-y-auto custom-scrollbar"
                />
              </div>

              {/* Right Action Icons: Magic Enhancer & Settings Sliders */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleMagicEnhance}
                  title="Magic Enhance Prompt"
                  className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/50 flex items-center justify-center text-orange-400 hover:text-orange-300 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.4L12 21.6l-2.4-7.2L2.4 12l7.2-2.4L12 2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                  title="Advanced Settings"
                  className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Optional Settings Drawer (if toggled) */}
            {showSettingsDrawer && (
              <div className="mt-4 p-4 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-between gap-4 text-xs animate-fade-in-up backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="text-white/50">Quality Resolution:</span>
                  <span className="font-bold text-orange-400">{selectedQuality || 'Auto 4K'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50">Input Mode:</span>
                  <span className="font-bold text-white">{imageMode ? 'Image-to-Image / Multi-Ref' : 'Text-to-Image'}</span>
                </div>
                <div className="text-white/40 font-mono text-[10px]">
                  Ctrl+Enter ↵ to run
                </div>
              </div>
            )}

            {/* ── ROW 2: Style Preset Buttons (Centered with generous gaps) ── */}
            <div className="w-full flex items-center justify-center gap-2.5 sm:gap-3 my-5 sm:my-6 overflow-x-auto pb-1 select-none custom-scrollbar">
              {STYLE_CHIPS.map((chip) => {
                const isActive = activeChips.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleToggleChip(chip)}
                    className={`px-4 py-2 rounded-full flex items-center gap-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'orange-btn-gradient text-white shadow-lg shadow-orange-500/35 scale-[1.02] ring-1 ring-orange-300/40'
                        : 'bg-[#0e1320] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/10'
                    }`}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── ROW 3: Bottom Controls (Model Selector, Aspect Ratio, and Generate Button) ── */}
            <div className="w-full flex items-center justify-between gap-4 pt-1 relative select-none">
              
              {/* Left Selectors */}
              <div className="flex items-center gap-2.5 relative">
                
                {/* Model Selector Dropdown Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "model" ? null : "model"));
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0e1320] hover:bg-white/[0.08] rounded-2xl transition-all border border-white/10 hover:border-orange-500/40 text-xs font-bold text-white cursor-pointer shadow-sm"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <span className="max-w-[150px] truncate">{selectedModelName}</span>
                    <span className="text-[10px] text-white/40">⌄</span>
                  </button>

                  {dropdownOpen === "model" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#0d121c] rounded-3xl p-3 shadow-2xl border border-orange-500/30 w-[calc(100vw-3rem)] max-w-xs animate-fade-in-up"
                    >
                      <ModelDropdown
                        models={currentModels}
                        selectedModel={selectedModelId}
                        onSelect={handleModelSelect}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>

                {/* Aspect Ratio Dropdown Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "ar" ? null : "ar"));
                    }}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-[#0e1320] hover:bg-white/[0.08] rounded-2xl transition-all border border-white/10 hover:border-orange-500/40 text-xs font-bold text-white cursor-pointer shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                    <span>{selectedAr}</span>
                    <span className="text-[10px] text-white/40">⌄</span>
                  </button>

                  {dropdownOpen === "ar" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#0d121c] rounded-3xl p-3 shadow-2xl border border-orange-500/30 max-w-[200px] animate-fade-in-up"
                    >
                      <SimpleDropdown
                        title="Aspect Ratio"
                        options={currentAspectRatios}
                        selected={selectedAr}
                        onSelect={(val) => setSelectedAr(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button (Matches Image 1 Exactly: "‹ Generate ✦") */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="orange-btn-gradient px-8 py-3 rounded-full font-black text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(249,115,22,0.55)] hover:shadow-[0_0_40px_rgba(249,115,22,0.85)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {generating ? (
                  <>
                    <span className="animate-spin inline-block text-white">◌</span>
                    <span>Generating...</span>
                  </>
                ) : generateError ? (
                  `Error: ${generateError}`
                ) : (
                  <>
                    <span className="text-base font-bold opacity-80">‹</span>
                    <span className="tracking-wide">Generate</span>
                    <span className="text-sm">✦</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
