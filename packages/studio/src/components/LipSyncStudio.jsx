"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { processLipSync, uploadFile } from '../kie.js';
import {
    lipsyncModels,
    imageLipSyncModels,
    videoLipSyncModels,
    getLipSyncModelById,
    getResolutionsForLipSyncModel,
} from '../models.js';

// ---------------------------------------------------------------------------
// Upload button states
// ---------------------------------------------------------------------------
const UPLOAD_STATE = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    READY: 'ready',
};

function MediaPickerButton({ accept, label, icon, onUpload, onClear, uploadState, progress, fileName, previewUrl, isVideo, apiKey }) {
    const inputRef = useRef(null);

    const handleClick = (e) => {
        e.stopPropagation();
        if (uploadState === UPLOAD_STATE.READY) {
            onClear();
            return;
        }
        inputRef.current?.click();
    };

    const handleChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        await onUpload(file);
    };

    const borderClass =
        uploadState === UPLOAD_STATE.READY
            ? 'border-primary/60 bg-primary/10'
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/40';

    return (
        <button
            type="button"
            title={
                uploadState === UPLOAD_STATE.READY
                    ? `${fileName} — click to clear`
                    : `Upload ${label.toLowerCase()} file`
            }
            onClick={handleClick}
            className={`flex-shrink-0 w-14 h-14 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden group ${borderClass}`}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleChange}
            />

            {/* Idle state */}
            {uploadState === UPLOAD_STATE.IDLE && (
                <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                    {icon}
                    <span className="text-[9px] text-muted group-hover:text-primary font-bold transition-colors">
                        {label.toUpperCase()}
                    </span>
                </div>
            )}

            {/* Uploading indicator */}
            {uploadState === UPLOAD_STATE.UPLOADING && (
                <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/60 z-10 animate-pulse">
                    <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
                    <span className="text-[8px] font-black text-primary">{progress}%</span>
                </div>
            )}

            {/* Ready state */}
            {uploadState === UPLOAD_STATE.READY && (
                <div className="flex flex-col items-center justify-center gap-1 w-full h-full absolute inset-0 bg-primary/10">
                    {previewUrl ? (
                         isVideo ? (
                             <video src={previewUrl} className="w-full h-full object-cover" muted />
                         ) : (
                             <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                         )
                    ) : (
                        <>
                            {icon}
                            <span className="text-[9px] text-primary font-bold">READY</span>
                        </>
                    )}
                </div>
            )}
        </button>
    );
}

// ---------------------------------------------------------------------------
// Inline dropdown
// ---------------------------------------------------------------------------
function Dropdown({ isOpen, items, selectedId, onSelect, onClose, anchorRef }) {
    const dropRef = useRef(null);
    const [style, setStyle] = useState({});

    useEffect(() => {
        if (!isOpen || !anchorRef?.current || !dropRef.current) return;

        const rect = anchorRef.current.getBoundingClientRect();
        const ddHeight = dropRef.current.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;

        let top, bottom, maxHeight;
        if (spaceBelow >= ddHeight || spaceBelow >= spaceAbove) {
            top = rect.bottom + 8;
            bottom = 'auto';
            maxHeight = Math.max(150, spaceBelow - 8);
        } else {
            top = 'auto';
            bottom = window.innerHeight - rect.top + 8;
            maxHeight = Math.max(150, spaceAbove - 8);
        }
        const left = Math.min(rect.left, window.innerWidth - 220);
        setStyle({ top, bottom, left, maxHeight });
    }, [isOpen, anchorRef]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (!dropRef.current?.contains(e.target) && !anchorRef?.current?.contains(e.target)) {
                onClose();
            }
        };
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, [isOpen, onClose, anchorRef]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropRef}
            style={{ position: 'fixed', zIndex: 100, minWidth: 200, overflowY: 'auto', ...style }}
            className="bg-[#111] border border-white/10 rounded-2xl shadow-3xl p-2 custom-scrollbar"
        >
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => { onSelect(item); onClose(); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10 ${
                        item.id === selectedId ? 'text-primary font-bold bg-primary/5' : 'text-white font-medium'
                    }`}
                >
                    <div>{item.name}</div>
                    {item.description && (
                        <div className="text-xs text-muted mt-0.5">
                            {item.description.slice(0, 60)}...
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// History sidebar thumbnail
// ---------------------------------------------------------------------------
function HistoryThumb({ entry, isActive, onSelect, onDownload }) {
    return (
        <div
            onClick={onSelect}
            className={`relative group/thumb cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                isActive ? 'border-primary shadow-glow' : 'border-white/10 hover:border-white/30'
            }`}
        >
            <video src={entry.url} preload="metadata" muted className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDownload(entry); }}
                    className="p-1.5 bg-primary rounded-lg text-black hover:scale-110 transition-transform"
                    title="Download"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
const MicIcon = ({ className = 'text-muted group-hover:text-primary transition-colors' }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
);

const VideoIcon = ({ className = 'text-muted group-hover:text-primary transition-colors' }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LipSyncStudio({ apiKey, onGenerationComplete, historyItems }) {
    // ── Mode & model state ──────────────────────────────────────────────────
    const [inputMode, setInputMode] = useState('image'); // 'image' | 'video'

    const currentModels = inputMode === 'image' ? imageLipSyncModels : videoLipSyncModels;
    const firstModel = currentModels[0];

    const [selectedModelId, setSelectedModelId] = useState(firstModel?.id ?? '');
    const [selectedResolution, setSelectedResolution] = useState(
        firstModel?.inputs?.resolution?.default ?? '480p'
    );

    // ── Upload state ────────────────────────────────────────────────────────
    const [imageState, setImageState] = useState(UPLOAD_STATE.IDLE);
    const [imageName, setImageName] = useState('');
    const [imageUrl, setImageUrl] = useState(null);

    const [videoState, setVideoState] = useState(UPLOAD_STATE.IDLE);
    const [videoName, setVideoName] = useState('');
    const [videoUrl, setVideoUrl] = useState(null);

    const [audioState, setAudioState] = useState(UPLOAD_STATE.IDLE);
    const [audioName, setAudioName] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);

    // ── Individual progress states ──
    const [imageProgress, setImageProgress] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0);
    const [audioProgress, setAudioProgress] = useState(0);

    // ── Prompt ──────────────────────────────────────────────────────────────
    const [prompt, setPrompt] = useState('');

    // ── Generation / UI state ───────────────────────────────────────────────
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState(null);
    const [view, setView] = useState('input'); // 'input' | 'result'
    const [activeResultUrl, setActiveResultUrl] = useState(null);

    // ── History ─────────────────────────────────────────────────────────────
    // If historyItems prop is provided, use it; otherwise use internal state.
    const [internalHistory, setInternalHistory] = useState([]);
    const history = historyItems ?? internalHistory;
    const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);

    // ── Dropdown state ──────────────────────────────────────────────────────
    const [openDropdown, setOpenDropdown] = useState(null); // 'model' | 'resolution' | null
    const modelBtnRef = useRef(null);
    const resolutionBtnRef = useRef(null);

    // ── Video ref for result ────────────────────────────────────────────────
    const resultVideoRef = useRef(null);

    // ── Derived model info ──────────────────────────────────────────────────
    const selectedModel = lipsyncModels.find((m) => m.id === selectedModelId);
    const resolutionOptions = getResolutionsForLipSyncModel(selectedModelId);
    const showResolution = resolutionOptions.length > 0;
    const showPrompt = !!selectedModel?.hasPrompt;

    // ── Sync model when mode changes ────────────────────────────────────────
    useEffect(() => {
        const models = inputMode === 'image' ? imageLipSyncModels : videoLipSyncModels;
        const first = models[0];
        if (!first) return;
        setSelectedModelId(first.id);
        setSelectedResolution(first.inputs?.resolution?.default ?? '480p');
    }, [inputMode]);

    // ── Upload handlers ─────────────────────────────────────────────────────
    const handleImageUpload = useCallback(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
            alert("Image exceeds 10MB limit.");
            return;
        }
        setImageState(UPLOAD_STATE.UPLOADING);
        setImageProgress(0);
        try {
            const url = await uploadFile(apiKey, file, (pct) => {
                setImageProgress(pct);
            });
            setImageUrl(url);
            setImageName(file.name);
            setImageState(UPLOAD_STATE.READY);
        } catch (err) {
            setImageState(UPLOAD_STATE.IDLE);
            alert(`Image upload failed: ${err.message}`);
        } finally {
            setImageProgress(0);
        }
    }, [apiKey]);

    const handleVideoPick = useCallback(async (file) => {
        if (file.size > 50 * 1024 * 1024) {
            alert("Video exceeds 50MB limit.");
            return;
        }
        setVideoState(UPLOAD_STATE.UPLOADING);
        setVideoProgress(0);
        try {
            const url = await uploadFile(apiKey, file, (pct) => {
                setVideoProgress(pct);
            });
            setVideoUrl(url);
            setVideoName(file.name);
            setVideoState(UPLOAD_STATE.READY);
        } catch (err) {
            setVideoState(UPLOAD_STATE.IDLE);
            alert(`Video upload failed: ${err.message}`);
        } finally {
            setVideoProgress(0);
        }
    }, [apiKey]);

    const handleAudioPick = useCallback(async (file) => {
        if (file.size > 10 * 1024 * 1024) {
            alert("Audio file exceeds 10MB limit.");
            return;
        }
        setAudioState(UPLOAD_STATE.UPLOADING);
        setAudioProgress(0);
        try {
            const url = await uploadFile(apiKey, file, (pct) => {
                setAudioProgress(pct);
            });
            setAudioUrl(url);
            setAudioName(file.name);
            setAudioState(UPLOAD_STATE.READY);
        } catch (err) {
            setAudioState(UPLOAD_STATE.IDLE);
            alert(`Audio upload failed: ${err.message}`);
        } finally {
            setAudioProgress(0);
        }
    }, [apiKey]);

    // ── Mode toggle ─────────────────────────────────────────────────────────
    const switchToImage = () => {
        if (inputMode === 'image') return;
        setInputMode('image');
        setVideoUrl(null);
        setVideoState(UPLOAD_STATE.IDLE);
        setVideoName('');
    };

    const switchToVideo = () => {
        if (inputMode === 'video') return;
        setInputMode('video');
        setImageUrl(null);
        setImageState(UPLOAD_STATE.IDLE);
        setImageName('');
    };

    // ── Model selection ─────────────────────────────────────────────────────
    const handleModelSelect = (model) => {
        setSelectedModelId(model.id);
        const resolutions = getResolutionsForLipSyncModel(model.id);
        if (resolutions.length > 0) {
            setSelectedResolution(model.inputs?.resolution?.default ?? resolutions[0]);
        }
    };

    // ── History helpers ─────────────────────────────────────────────────────
    const addToInternalHistory = useCallback((entry) => {
        setInternalHistory((prev) => [entry, ...prev].slice(0, 30));
    }, []);

    const downloadFile = async (url, filename) => {
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
    };

    // ── Generation ──────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!audioUrl) { alert('Please upload an audio file first.'); return; }
        if (inputMode === 'image' && !imageUrl) { alert('Please upload a portrait image first.'); return; }
        if (inputMode === 'video' && !videoUrl) { alert('Please upload a source video first.'); return; }

        setIsGenerating(true);
        setGenerateError(null);

        try {
            const lipsyncParams = {
                model: selectedModelId,
                audio_url: audioUrl,
            };
            if (inputMode === 'image') lipsyncParams.image_url = imageUrl;
            else lipsyncParams.video_url = videoUrl;
            if (prompt && selectedModel?.hasPrompt) lipsyncParams.prompt = prompt;
            if (showResolution) lipsyncParams.resolution = selectedResolution;
            if (selectedModel?.hasSeed) lipsyncParams.seed = -1;

            const res = await processLipSync(apiKey, lipsyncParams);

            if (!res?.url) throw new Error('No video URL returned by API');

            const genId = res.id || Date.now().toString();
            const entry = {
                id: genId,
                url: res.url,
                prompt,
                model: selectedModelId,
                timestamp: new Date().toISOString(),
            };

            if (!historyItems) addToInternalHistory(entry);

            setActiveResultUrl(res.url);
            setActiveHistoryIdx(0);
            setView('result');

            if (onGenerationComplete) {
                onGenerationComplete({ url: res.url, model: selectedModelId, prompt, type: 'lipsync' });
            }
        } catch (e) {
            console.warn('[LipSyncStudio]', e?.message || e);
            if (e.isAuthError || e.message?.includes('401') || e.message?.toLowerCase().includes('unauthorized')) {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('auth-error', { detail: { message: e.message } }));
                }
            }
            setGenerateError(e.message?.slice(0, 80) ?? 'Unknown error');
            setTimeout(() => setGenerateError(null), 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Reset to input view ─────────────────────────────────────────────────
    const handleNew = () => {
        setView('input');
        setActiveResultUrl(null);
        setPrompt('');
        setImageUrl(null); setImageState(UPLOAD_STATE.IDLE); setImageName('');
        setVideoUrl(null); setVideoState(UPLOAD_STATE.IDLE); setVideoName('');
        setAudioUrl(null); setAudioState(UPLOAD_STATE.IDLE); setAudioName('');
    };

    // ── Media status labels ─────────────────────────────────────────────────
    const mediaStatusText = inputMode === 'image'
        ? (imageState === UPLOAD_STATE.READY ? `✓ ${imageName}` : 'No image')
        : (videoState === UPLOAD_STATE.READY ? `✓ ${videoName}` : 'No video');
    const mediaStatusClass = (inputMode === 'image' ? imageState : videoState) === UPLOAD_STATE.READY
        ? 'text-primary' : 'text-muted';

    const audioStatusText = audioState === UPLOAD_STATE.READY ? `✓ ${audioName}` : 'No audio';
    const audioStatusClass = audioState === UPLOAD_STATE.READY ? 'text-primary' : 'text-muted';

    const hasHistory = history.length > 0;

    // ── Dropdown item lists ─────────────────────────────────────────────────
    const modelDropdownItems = currentModels;
    const resolutionDropdownItems = resolutionOptions.map((r) => ({ id: r, name: r }));

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden">

            {/* ── History sidebar ── */}
            {hasHistory && (
                <div className="hidden md:flex fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-40 flex-col items-center py-4 gap-3 overflow-y-auto transition-all duration-500">
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">History</div>
                    <div className="flex flex-col gap-2 w-full px-2">
                        {history.map((entry, idx) => (
                            <HistoryThumb
                                key={entry.id ?? idx}
                                entry={entry}
                                isActive={idx === activeHistoryIdx}
                                onSelect={() => {
                                    setActiveResultUrl(entry.url);
                                    setActiveHistoryIdx(idx);
                                    setView('result');
                                }}
                                onDownload={(e) => downloadFile(e.url, `lipsync-${e.id ?? idx}.mp4`)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Input view ── */}
            {view === 'input' && (
                <>
                    {/* Top Studio Stage Indicator */}
                    <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-2 animate-fade-in-up">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#d9ff00] animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest text-white/90">
                                {inputMode === 'image' ? 'Portrait Audio-Sync Studio' : 'Video Voiceover Lip-Sync'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-[#d9ff00] border border-[#d9ff00]/20">
                                {selectedModel?.name || selectedModelId}
                            </span>
                        </div>
                        <div className="hidden sm:flex text-[11px] text-white/40 items-center gap-2 font-mono">
                            <span>Audio Driven</span>
                            <span>•</span>
                            <span>HD Talking Avatar</span>
                        </div>
                    </div>

                    {/* Interactive Stage Viewport */}
                    <div className="w-full max-w-4xl mb-5 relative group animate-fade-in-up">
                        <div className="w-full min-h-[190px] sm:min-h-[240px] rounded-3xl bg-gradient-to-b from-white/[0.04] to-black/60 border border-white/10 flex flex-col items-center justify-center p-5 sm:p-6 relative overflow-hidden backdrop-blur-md shadow-2xl">
                            
                            {/* Ambient neon backdrop */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                            {isGenerating ? (
                                <div className="flex flex-col items-center justify-center gap-4 z-10">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin shadow-[0_0_20px_#d9ff00]" />
                                        <span className="text-xl">🎙</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-white tracking-wide mb-1">
                                            Synchronizing Lip Movement & Audio...
                                        </div>
                                        <div className="text-xs text-white/50 font-mono">
                                            Rendering via {selectedModel?.name || 'OmniHuman'} Cloud GPU
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center z-10 max-w-lg w-full">
                                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 shadow-inner">
                                        <span className="text-lg">👄</span>
                                    </div>
                                    <h2 className="text-sm sm:text-base font-bold text-white mb-1">
                                        Lip Sync Avatar Stage Ready
                                    </h2>
                                    <p className="text-[11px] text-white/45 mb-3.5">
                                        Upload a portrait image (or video) and your speech audio file below to animate.
                                    </p>
                                    
                                    <div className="flex items-center justify-center gap-3 text-xs text-white/60">
                                        <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-1.5">
                                            <span>📸</span>
                                            <span>Portrait Image</span>
                                        </div>
                                        <span className="text-white/20">+</span>
                                        <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-1.5">
                                            <span>🎵</span>
                                            <span>Voice Audio</span>
                                        </div>
                                        <span className="text-white/20">=</span>
                                        <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[#d9ff00] font-bold flex items-center gap-1.5">
                                            <span>✨</span>
                                            <span>Talking Video</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input bar */}
                    <div className="w-full max-w-4xl relative z-40 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="w-full bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 flex flex-col gap-3 md:gap-5 shadow-3xl">

                            {/* Mode toggle row */}
                            <div className="flex items-center gap-2 px-2">
                                <span className="text-xs text-muted font-bold uppercase tracking-widest mr-2">Input:</span>
                                <button
                                    type="button"
                                    onClick={switchToImage}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                        inputMode === 'image'
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-white/10 text-muted hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    🖼 Portrait Image
                                </button>
                                <button
                                    type="button"
                                    onClick={switchToVideo}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                        inputMode === 'video'
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-white/10 text-muted hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    🎬 Video
                                </button>
                            </div>

                            {/* Uploads row */}
                            <div className="flex items-start gap-3 px-2">
                                {/* Image picker — only in image mode */}
                                {inputMode === 'image' && (
                                    <MediaPickerButton
                                        accept="image/*"
                                        label="Image"
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted group-hover:text-primary transition-colors">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        }
                                        onUpload={handleImageUpload}
                                        onClear={() => { 
                                            setImageUrl(null); 
                                            setImageState(UPLOAD_STATE.IDLE); 
                                            setImageName(''); 
                                        }}
                                        uploadState={imageState}
                                        progress={imageProgress}
                                        fileName={imageName}
                                        previewUrl={imageUrl}
                                        isVideo={false}
                                        apiKey={apiKey}
                                    />
                                )}

                                {/* Video picker — only in video mode */}
                                {inputMode === 'video' && (
                                    <MediaPickerButton
                                        accept="video/*"
                                        label="Video"
                                        icon={<VideoIcon />}
                                        onUpload={handleVideoPick}
                                        onClear={() => { 
                                            setVideoUrl(null); 
                                            setVideoState(UPLOAD_STATE.IDLE); 
                                            setVideoName(''); 
                                        }}
                                        uploadState={videoState}
                                        progress={videoProgress}
                                        fileName={videoName}
                                        previewUrl={videoUrl}
                                        isVideo={true}
                                        apiKey={apiKey}
                                    />
                                )}

                                {/* Audio picker — always visible */}
                                <MediaPickerButton
                                    accept="audio/*"
                                    label="Audio"
                                    icon={<MicIcon />}
                                    onUpload={handleAudioPick}
                                    onClear={() => { setAudioUrl(null); setAudioState(UPLOAD_STATE.IDLE); setAudioName(''); }}
                                    uploadState={audioState}
                                    progress={audioProgress}
                                    fileName={audioName}
                                    previewUrl={null}
                                    isVideo={false}
                                    apiKey={apiKey}
                                />

                                {/* Prompt textarea */}
                                {showPrompt && (
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Optional: describe the talking style or motion..."
                                        className="flex-1 bg-transparent text-white placeholder-muted/50 text-sm resize-none outline-none min-h-[56px] leading-relaxed pt-1"
                                        rows={2}
                                    />
                                )}
                            </div>

                            {/* Status labels */}
                            <div className="flex items-center gap-3 px-2 text-xs text-muted">
                                <span className={mediaStatusClass}>{mediaStatusText}</span>
                                <span>·</span>
                                <span className={audioStatusClass}>{audioStatusText}</span>
                            </div>

                            {/* Bottom controls row */}
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap px-2">
                                {/* Model selector */}
                                <div className="relative">
                                    <button
                                        ref={modelBtnRef}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdown(openDropdown === 'model' ? null : 'model');
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 transition-all text-xs font-bold text-white group"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                        <span>{selectedModel?.name ?? 'Select model'}</span>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted group-hover:text-white transition-colors">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                    <Dropdown
                                        isOpen={openDropdown === 'model'}
                                        items={modelDropdownItems}
                                        selectedId={selectedModelId}
                                        onSelect={handleModelSelect}
                                        onClose={() => setOpenDropdown(null)}
                                        anchorRef={modelBtnRef}
                                    />
                                </div>

                                {/* Resolution selector */}
                                {showResolution && (
                                    <div className="relative">
                                        <button
                                            ref={resolutionBtnRef}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenDropdown(openDropdown === 'resolution' ? null : 'resolution');
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 transition-all text-xs font-bold text-white group"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                                <line x1="8" y1="21" x2="16" y2="21" />
                                                <line x1="12" y1="17" x2="12" y2="21" />
                                            </svg>
                                            <span>{selectedResolution}</span>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted group-hover:text-white transition-colors">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                        <Dropdown
                                            isOpen={openDropdown === 'resolution'}
                                            items={resolutionDropdownItems}
                                            selectedId={selectedResolution}
                                            onSelect={(item) => setSelectedResolution(item.id)}
                                            onClose={() => setOpenDropdown(null)}
                                            anchorRef={resolutionBtnRef}
                                        />
                                    </div>
                                )}

                                {/* Generate button */}
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="ml-auto px-6 py-2.5 bg-primary text-black font-black text-sm rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isGenerating ? (
                                        <><span className="animate-spin inline-block mr-2 text-black">◌</span>Generating...</>
                                    ) : generateError ? (
                                        `Error: ${generateError}`
                                    ) : (
                                        'Generate ✨'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Result canvas view ── */}
            {view === 'result' && activeResultUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-10 transition-all duration-1000">
                    <div className="relative group">
                        <video
                            ref={resultVideoRef}
                            src={activeResultUrl}
                            className="max-h-[60vh] max-w-[80vw] rounded-3xl shadow-3xl border border-white/10 interactive-glow object-contain"
                            controls
                            loop
                            autoPlay
                            playsInline
                        />
                    </div>
                    <div className="mt-6 flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white disabled:opacity-50"
                        >
                            ↻ Regenerate
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const entry = history.find((e) => e.url === activeResultUrl);
                                downloadFile(activeResultUrl, `lipsync-${entry?.id ?? 'clip'}.mp4`);
                            }}
                            className="bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-glow active:scale-95"
                        >
                            ↓ Download
                        </button>
                        <button
                            type="button"
                            onClick={handleNew}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white"
                        >
                            + New
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
