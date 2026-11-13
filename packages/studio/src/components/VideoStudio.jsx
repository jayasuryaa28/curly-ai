"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateVideo, generateI2V, uploadFile } from '../kie.js';
import {
    t2vModels,
    i2vModels,
    v2vModels,
    getAspectRatiosForVideoModel,
    getDurationsForModel,
    getResolutionsForVideoModel,
    getAspectRatiosForI2VModel,
    getDurationsForI2VModel,
    getResolutionsForI2VModel,
    getModesForModel,
} from '../models.js';

// ── tiny helpers ──────────────────────────────────────────────────────────────

function getQualitiesForModel(modelList, modelId) {
    const model = modelList.find(m => m.id === modelId);
    return model?.inputs?.quality?.enum || [];
}

async function downloadFile(url, filename) {
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

// ── SVG icons (kept inline to avoid extra deps) ───────────────────────────────

const CheckSvg = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" strokeWidth="4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const VideoIconSvg = ({ className }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const VideoReadySvg = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        <polyline points="7 10 10 13 15 8" stroke="#d9ff00" strokeWidth="2.5" />
    </svg>
);

// ── Dropdown components ───────────────────────────────────────────────────────

function DropdownItem({ label, selected, onClick }) {
    return (
        <div
            className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
            onClick={onClick}
        >
            <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100 capitalize">{label}</span>
            {selected && <CheckSvg />}
        </div>
    );
}

function ModelDropdown({ imageMode, selectedModel, onSelect, onClose }) {
    const [search, setSearch] = useState('');

    const generationModels = imageMode ? i2vModels : t2vModels;

    const lf = search.toLowerCase();
    const filteredMain = generationModels.filter(
        m => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf)
    );
    const filteredV2V = v2vModels.filter(
        m => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf)
    );

    const getIconColor = (m, isV2V) => {
        if (isV2V) return 'bg-orange-500/10 text-orange-400';
        if (m.id.includes('kling')) return 'bg-blue-500/10 text-blue-400';
        if (m.id.includes('veo')) return 'bg-purple-500/10 text-purple-400';
        if (m.id.includes('sora')) return 'bg-rose-500/10 text-rose-400';
        return 'bg-primary/10 text-primary';
    };

    const renderItem = (m, isV2V = false) => (
        <div
            key={m.id}
            className={`flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? 'bg-white/5 border-white/5' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSelect(m, isV2V); onClose(); }}
        >
            <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 ${getIconColor(m, isV2V)} border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase`}>
                    {m.name.charAt(0)}
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white tracking-tight">{m.name}</span>
                    {isV2V && <span className="text-[9px] text-orange-400/70">Upload a video to use</span>}
                </div>
            </div>
            {selectedModel === m.id && <CheckSvg />}
        </div>
    );

    return (
        <div className="flex flex-col h-full max-h-[70vh]">
            <div className="px-2 pb-3 mb-2 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
                    />
                </div>
            </div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 shrink-0">
                Video models
            </div>
            <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
                {filteredMain.map(m => renderItem(m, false))}
                {filteredV2V.length > 0 && (
                    <>
                        <div className="text-[10px] font-bold text-orange-400/70 uppercase tracking-widest px-3 py-2 mt-1 border-t border-white/5">
                            Video Tools
                        </div>
                        {filteredV2V.map(m => renderItem(m, true))}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Control button ────────────────────────────────────────────────────────────

function ControlBtn({ icon, label, onClick, style }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={style}
            className="flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap"
        >
            {icon}
            <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{label}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="opacity-20 group-hover:opacity-100 transition-opacity">
                <path d="M6 9l6 6 6-6" />
            </svg>
        </button>
    );
}

// ── Dropdown panel ─────────────────────────────────────────────────────────────
// Rendered inside a `relative` wrapper div; floats above the anchor button.


// ── Main component ────────────────────────────────────────────────────────────

export default function VideoStudio({ apiKey, onGenerationComplete, historyItems }) {
    // ── mode state ──
    const [imageMode, setImageMode] = useState(false);   // i2v
    const [v2vMode, setV2vMode] = useState(false);

    // ── model / params ──
    const defaultModel = t2vModels[0];
    const [selectedModel, setSelectedModel] = useState(defaultModel.id);
    const [selectedModelName, setSelectedModelName] = useState(defaultModel.name);
    const [selectedAr, setSelectedAr] = useState(defaultModel.inputs?.aspect_ratio?.default || '16:9');
    const [selectedDuration, setSelectedDuration] = useState(defaultModel.inputs?.duration?.default || 5);
    const [selectedResolution, setSelectedResolution] = useState(defaultModel.inputs?.resolution?.default || '');
    const [selectedQuality, setSelectedQuality] = useState(defaultModel.inputs?.quality?.default || '');
    const [selectedMode, setSelectedMode] = useState('');

    // ── upload progress ──
    const [imageProgress, setImageProgress] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0);

    // ── control visibility ──
    const [showAr, setShowAr] = useState(true);
    const [showDuration, setShowDuration] = useState(true);
    const [showResolution, setShowResolution] = useState(false);
    const [showQuality, setShowQuality] = useState(false);
    const [showMode, setShowMode] = useState(false);

    // ── uploads ──
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
    const [videoUploading, setVideoUploading] = useState(false);
    const [uploadedVideoName, setUploadedVideoName] = useState(null);

    // ── generation / canvas ──
    const [generating, setGenerating] = useState(false);
    const [generateError, setGenerateError] = useState(null);
    const [canvasUrl, setCanvasUrl] = useState(null);
    const [canvasModel, setCanvasModel] = useState(null);
    const [showCanvas, setShowCanvas] = useState(false);
    const [lastGenerationId, setLastGenerationId] = useState(null);
    const [lastGenerationModel, setLastGenerationModel] = useState(null);

    // ── history ──
    const [localHistory, setLocalHistory] = useState([]);
    const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);

    // ── dropdown ──
    const [openDropdown, setOpenDropdown] = useState(null); // 'model'|'ar'|'duration'|'resolution'|'quality'|'mode'|null

    // ── prompt ──
    const [prompt, setPrompt] = useState('');
    const [promptDisabled, setPromptDisabled] = useState(false);

    // ── refs ──
    const containerRef = useRef(null);
    const textareaRef = useRef(null);
    const dropdownRef = useRef(null);
    const imageFileInputRef = useRef(null);
    const videoFileInputRef = useRef(null);
    const resultVideoRef = useRef(null);

    // ── derived data ──
    const history = historyItems ?? localHistory;

    const getCurrentModels = useCallback(() => {
        if (v2vMode) return v2vModels;
        return imageMode ? i2vModels : t2vModels;
    }, [imageMode, v2vMode]);

    const getCurrentAspectRatios = useCallback((id) =>
        imageMode ? getAspectRatiosForI2VModel(id) : getAspectRatiosForVideoModel(id),
        [imageMode]);

    const getCurrentDurations = useCallback((id) =>
        imageMode ? getDurationsForI2VModel(id) : getDurationsForModel(id),
        [imageMode]);

    const getCurrentResolutions = useCallback((id) =>
        imageMode ? getResolutionsForI2VModel(id) : getResolutionsForVideoModel(id),
        [imageMode]);

    const getCurrentModel = useCallback(() =>
        getCurrentModels().find(m => m.id === selectedModel),
        [getCurrentModels, selectedModel]);

    // ── update controls when model/mode changes ──────────────────────────────
    const applyControlsForModel = useCallback((modelId, isImageMode, isV2vMode) => {
        if (isV2vMode) {
            setShowAr(false); setShowDuration(false); setShowResolution(false);
            setShowQuality(false); setShowMode(false);
            return;
        }

        const modelList = isImageMode ? i2vModels : t2vModels;
        const model = modelList.find(m => m.id === modelId);

        const ars = isImageMode ? getAspectRatiosForI2VModel(modelId) : getAspectRatiosForVideoModel(modelId);
        if (ars.length > 0) { setSelectedAr(ars[0]); setShowAr(true); } else { setShowAr(false); }

        const durations = isImageMode ? getDurationsForI2VModel(modelId) : getDurationsForModel(modelId);
        if (durations.length > 0) { setSelectedDuration(durations[0]); setShowDuration(true); } else { setShowDuration(false); }

        const resolutions = isImageMode ? getResolutionsForI2VModel(modelId) : getResolutionsForVideoModel(modelId);
        if (resolutions.length > 0) { setSelectedResolution(resolutions[0]); setShowResolution(true); } else { setShowResolution(false); }

        const qualities = getQualitiesForModel(modelList, modelId);
        if (qualities.length > 0) {
            setSelectedQuality(model?.inputs?.quality?.default || qualities[0]);
            setShowQuality(true);
        } else { setSelectedQuality(''); setShowQuality(false); }

        const modes = getModesForModel(modelId);
        if (modes.length > 0) {
            setSelectedMode(model?.inputs?.mode?.default || modes[0]);
            setShowMode(true);
        } else { setSelectedMode(''); setShowMode(false); }
    }, []);

    // Initialise controls for default model on mount
    useEffect(() => {
        applyControlsForModel(defaultModel.id, false, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── close dropdown on outside click ─────────────────────────────────────
    useEffect(() => {
        if (!openDropdown) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpenDropdown(null);
            }
        };
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, [openDropdown]);

    // ── textarea auto-resize ──────────────────────────────────────────────────
    const handlePromptInput = (e) => {
        setPrompt(e.target.value);
        const el = e.target;
        el.style.height = 'auto';
        const maxH = window.innerWidth < 768 ? 150 : 250;
        el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
    };

    // ── image upload ─────────────────────────────────────────────────────────
    const handleImageFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
          alert("Image exceeds 10MB limit.");
          return;
        }
        setImageUploading(true);
        setImageProgress(0);
        
        try {
            const url = await uploadFile(apiKey, file, (pct) => {
                setImageProgress(pct);
            });
            setUploadedImageUrl(url);

            // Clear v2v if active
            setUploadedVideoUrl(null);
            setUploadedVideoName(null);
            setV2vMode(false);

            if (!imageMode) {
                const firstI2V = i2vModels[0];
                setImageMode(true);
                setSelectedModel(firstI2V.id);
                setSelectedModelName(firstI2V.name);
                applyControlsForModel(firstI2V.id, true, false);
            }
            setPromptDisabled(false);
        } catch (err) {
            console.error('[VideoStudio] Image upload failed:', err);
            alert(`Image upload failed: ${err.message}`);
        } finally {
            setImageUploading(false);
            setImageProgress(0);
            if (imageFileInputRef.current) imageFileInputRef.current.value = '';
        }
    };

    const clearImageUpload = () => {
        setUploadedImageUrl(null);
        setImageMode(false);
        const first = t2vModels[0];
        setSelectedModel(first.id);
        setSelectedModelName(first.name);
        applyControlsForModel(first.id, false, false);
        setPromptDisabled(false);
    };

    // ── video upload ─────────────────────────────────────────────────────────
    const handleVideoFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
          alert("Video exceeds 50MB limit.");
          return;
        }
        setVideoUploading(true);
        setVideoProgress(0);
        try {
            const url = await uploadFile(apiKey, file, (pct) => {
                setVideoProgress(pct);
            });
            setUploadedVideoUrl(url);
            setUploadedVideoName(file.name);

            // Clear image mode if active
            if (imageMode) {
                setUploadedImageUrl(null);
                setImageMode(false);
            }
            setV2vMode(true);
            const firstV2V = v2vModels[0];
            setSelectedModel(firstV2V.id);
            setSelectedModelName(firstV2V.name);
            applyControlsForModel(firstV2V.id, false, true);
            setPrompt('');
            setPromptDisabled(true);
        } catch (err) {
            console.error('[VideoStudio] Video upload failed:', err);
            alert(`Video upload failed: ${err.message}`);
        } finally {
            setVideoUploading(false);
            setVideoProgress(0);
            if (videoFileInputRef.current) videoFileInputRef.current.value = '';
        }
    };

    const clearVideoUpload = () => {
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
        setV2vMode(false);
        const first = t2vModels[0];
        setSelectedModel(first.id);
        setSelectedModelName(first.name);
        applyControlsForModel(first.id, false, false);
        setPromptDisabled(false);
    };

    // ── model selection from dropdown ─────────────────────────────────────────
    const handleModelSelect = useCallback((m, isV2V) => {
        if (isV2V) {
            setV2vMode(true);
            setImageMode(false);
            setUploadedImageUrl(null);
            setUploadedImagePreview(null);
            setSelectedModel(m.id);
            setSelectedModelName(m.name);
            applyControlsForModel(m.id, false, true);
            setPrompt('');
            setPromptDisabled(true);
        } else {
            if (v2vMode) {
                setV2vMode(false);
                setUploadedVideoUrl(null);
                setUploadedVideoName(null);
                setPromptDisabled(false);
            }
            setSelectedModel(m.id);
            setSelectedModelName(m.name);
            applyControlsForModel(m.id, imageMode, false);
        }
    }, [v2vMode, imageMode, applyControlsForModel]);

    // ── add to local history ──────────────────────────────────────────────────
    const addToLocalHistory = useCallback((entry) => {
        setLocalHistory(prev => [entry, ...prev].slice(0, 30));
        setActiveHistoryIdx(0);
    }, []);

    // ── show result in canvas ─────────────────────────────────────────────────
    const showVideoInCanvas = useCallback((url, model) => {
        setCanvasUrl(url);
        setCanvasModel(model);
        setShowCanvas(true);
    }, []);

    // ── generate ──────────────────────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        const currentModel = getCurrentModel();
        const isExtendMode = currentModel?.requiresRequestId;
        const trimmedPrompt = prompt.trim();

        if (v2vMode) {
            if (!uploadedVideoUrl) { alert('Please upload a video first.'); return; }
        } else if (isExtendMode) {
            if (!lastGenerationId) { alert('No Seedance 2.0 generation found to extend. Generate a video first.'); return; }
        } else if (imageMode) {
            if (!uploadedImageUrl) { alert('Please upload a start frame image first.'); return; }
        } else {
            if (!trimmedPrompt) { alert('Please enter a prompt to generate a video.'); return; }
        }

        setGenerating(true);
        setGenerateError(null);

        let hadError = false;

        try {
            let res;

            if (v2vMode) {
                // V2V: use generateVideo with video_url (the v2v models use the video endpoint)
                res = await generateVideo(apiKey, {
                    model: selectedModel,
                    video_url: uploadedVideoUrl,
                });
                if (!res?.url) throw new Error('No video URL returned by API');

                const genId = res.id || Date.now().toString();
                setLastGenerationId(null);
                setLastGenerationModel(null);
                const entry = { id: genId, url: res.url, prompt: '', model: selectedModel, timestamp: new Date().toISOString() };
                addToLocalHistory(entry);
                showVideoInCanvas(res.url, selectedModel);
                if (onGenerationComplete) onGenerationComplete({ url: res.url, model: selectedModel, prompt: '', type: 'video' });

            } else if (imageMode) {
                const i2vParams = { model: selectedModel, image_url: uploadedImageUrl };
                if (trimmedPrompt) i2vParams.prompt = trimmedPrompt;
                i2vParams.aspect_ratio = selectedAr;
                const durations = getDurationsForI2VModel(selectedModel);
                if (durations.length > 0) i2vParams.duration = selectedDuration;
                const resolutions = getResolutionsForI2VModel(selectedModel);
                if (resolutions.length > 0) i2vParams.resolution = selectedResolution;
                if (selectedQuality) i2vParams.quality = selectedQuality;
                if (selectedMode) i2vParams.mode = selectedMode;

                res = await generateI2V(apiKey, i2vParams);
                if (!res?.url) throw new Error('No video URL returned by API');

                const genId = res.id || Date.now().toString();
                if (selectedModel === 'seedance-v2.0-i2v') {
                    setLastGenerationId(genId);
                    setLastGenerationModel(selectedModel);
                } else {
                    setLastGenerationId(null);
                    setLastGenerationModel(null);
                }
                const entry = { id: genId, url: res.url, prompt: trimmedPrompt, model: selectedModel, aspect_ratio: selectedAr, duration: selectedDuration, timestamp: new Date().toISOString() };
                addToLocalHistory(entry);
                showVideoInCanvas(res.url, selectedModel);
                if (onGenerationComplete) onGenerationComplete({ url: res.url, model: selectedModel, prompt: trimmedPrompt, type: 'video' });

            } else {
                // T2V (including extend mode)
                const params = { model: selectedModel };
                if (trimmedPrompt) params.prompt = trimmedPrompt;

                if (isExtendMode) {
                    params.request_id = lastGenerationId;
                } else {
                    params.aspect_ratio = selectedAr;
                }

                const durations = getDurationsForModel(selectedModel);
                if (durations.length > 0) params.duration = selectedDuration;
                const resolutions = getResolutionsForVideoModel(selectedModel);
                if (resolutions.length > 0) params.resolution = selectedResolution;
                if (selectedQuality) params.quality = selectedQuality;
                if (selectedMode) params.mode = selectedMode;

                res = await generateVideo(apiKey, params);
                if (!res?.url) throw new Error('No video URL returned by API');

                const genId = res.id || Date.now().toString();
                if (selectedModel === 'seedance-v2.0-t2v' || selectedModel === 'seedance-v2.0-i2v') {
                    setLastGenerationId(genId);
                    setLastGenerationModel(selectedModel);
                } else {
                    setLastGenerationId(null);
                    setLastGenerationModel(null);
                }
                const entry = { id: genId, url: res.url, prompt: trimmedPrompt, model: selectedModel, aspect_ratio: selectedAr, duration: selectedDuration, timestamp: new Date().toISOString() };
                addToLocalHistory(entry);
                showVideoInCanvas(res.url, selectedModel);
                if (onGenerationComplete) onGenerationComplete({ url: res.url, model: selectedModel, prompt: trimmedPrompt, type: 'video' });
            }
        } catch (e) {
            hadError = true;
            console.warn('[VideoStudio]', e?.message || e);
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
    }, [
        apiKey, prompt, v2vMode, imageMode, selectedModel, selectedAr, selectedDuration,
        selectedResolution, selectedQuality, selectedMode, uploadedImageUrl, uploadedVideoUrl,
        lastGenerationId, getCurrentModel, addToLocalHistory, showVideoInCanvas, onGenerationComplete,
    ]);

    // ── reset to prompt bar ───────────────────────────────────────────────────
    const resetToPromptBar = useCallback(() => {
        setShowCanvas(false);
    }, []);

    const handleNewPrompt = useCallback(() => {
        resetToPromptBar();
        setPrompt('');
        setUploadedImageUrl(null);
        setUploadedImagePreview(null);
        setImageMode(false);
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
        setV2vMode(false);
        const first = t2vModels[0];
        setSelectedModel(first.id);
        setSelectedModelName(first.name);
        applyControlsForModel(first.id, false, false);
        setPromptDisabled(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
    }, [resetToPromptBar, applyControlsForModel]);

    const handleExtend = useCallback(() => {
        if (!lastGenerationId) return;
        resetToPromptBar();
        setPrompt('');
        setUploadedImageUrl(null);
        setUploadedImagePreview(null);
        setImageMode(false);
        setSelectedModel('seedance-v2.0-extend');
        setSelectedModelName('Seedance 2.0 Extend');
        applyControlsForModel('seedance-v2.0-extend', false, false);
        setPromptDisabled(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
    }, [lastGenerationId, resetToPromptBar, applyControlsForModel]);

    // ── derived UI values ────────────────────────────────────────────────────
    const isSeedance2Canvas = canvasModel === 'seedance-v2.0-t2v' || canvasModel === 'seedance-v2.0-i2v';
    const currentModelObj = getCurrentModel();
    const isExtendMode = currentModelObj?.requiresRequestId;

    const promptPlaceholder = v2vMode
        ? 'Video ready — click Generate to remove watermark'
        : imageMode
            ? 'Describe the motion or effect (optional)'
            : isExtendMode
                ? 'Optional: describe how to continue the video...'
                : 'Describe the video you want to create';

    const toggleDropdown = (type) => (e) => {
        e.stopPropagation();
        setOpenDropdown(prev => prev === type ? null : type);
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden"
        >
            {/* ── History Sidebar ── */}
            {history.length > 0 && (
                <div className="hidden md:flex fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-40 flex-col items-center py-4 gap-3 overflow-y-auto transition-all duration-500">
                    <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">History</div>
                    <div className="flex flex-col gap-2 w-full px-2">
                        {history.map((entry, idx) => (
                            <div
                                key={entry.id || idx}
                                className={`relative group/thumb cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${activeHistoryIdx === idx ? 'border-primary shadow-glow' : 'border-white/10 hover:border-white/30'}`}
                                onClick={(e) => {
                                    if (e.target.closest('.hist-download')) {
                                        downloadFile(entry.url, `video-${entry.id || idx}.mp4`);
                                        return;
                                    }
                                    setActiveHistoryIdx(idx);
                                    if (entry.model === 'seedance-v2.0-t2v' || entry.model === 'seedance-v2.0-i2v') {
                                        setLastGenerationId(entry.id);
                                        setLastGenerationModel(entry.model);
                                    } else {
                                        setLastGenerationId(null);
                                        setLastGenerationModel(null);
                                    }
                                    showVideoInCanvas(entry.url, entry.model);
                                }}
                            >
                                <video src={entry.url} preload="metadata" muted className="w-full aspect-square object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button className="hist-download p-1.5 bg-primary rounded-lg text-black hover:scale-110 transition-transform" title="Download">
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

            {/* ── Canvas / Result View ── */}
            {showCanvas && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-10 transition-all duration-1000">
                    <div className="relative group">
                        <video
                            ref={resultVideoRef}
                            key={canvasUrl}
                            src={canvasUrl}
                            className="max-h-[60vh] max-w-[80vw] rounded-3xl shadow-3xl border border-white/10 interactive-glow object-contain"
                            controls
                            loop
                            autoPlay
                            muted
                            playsInline
                        />
                    </div>
                    <div className="mt-6 flex gap-3 justify-center">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white"
                        >
                            ↻ Regenerate
                        </button>
                        {isSeedance2Canvas && (
                            <button
                                type="button"
                                onClick={handleExtend}
                                className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-primary/30 text-primary backdrop-blur-lg"
                                title="Extend this video using Seedance 2.0 Extend"
                            >
                                ↗ Extend
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                const entry = history.find(e => e.url === canvasUrl);
                                downloadFile(canvasUrl, `video-${entry?.id || 'clip'}.mp4`);
                            }}
                            className="bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-glow active:scale-95"
                        >
                            ↓ Download
                        </button>
                        <button
                            type="button"
                            onClick={handleNewPrompt}
                            className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white"
                        >
                            + New
                        </button>
                    </div>
                </div>
            )}

            {/* ── Hero + Prompt Bar (hidden when canvas is showing) ── */}
            {!showCanvas && (
                <>
                    {/* Top Studio Stage Indicator */}
                    <div className="w-full max-w-4xl flex items-center justify-between mb-3 px-2 animate-fade-in-up">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_#d9ff00] animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest text-white/90">
                                {v2vMode ? 'Video-to-Video Engine' : imageMode ? 'Image-to-Video Motion Studio' : 'Text-to-Video Cinema Studio'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-[#d9ff00] border border-[#d9ff00]/20">
                                {selectedModelName}
                            </span>
                        </div>
                        <div className="hidden sm:flex text-[11px] text-white/40 items-center gap-2 font-mono">
                            <span>Aspect: {selectedAr}</span>
                            <span>•</span>
                            <span>Duration: {selectedDuration}s</span>
                            {selectedResolution && <><span>•</span><span>{selectedResolution}</span></>}
                        </div>
                    </div>

                    {/* Interactive Stage Viewport */}
                    <div className="w-full max-w-4xl mb-5 relative group animate-fade-in-up">
                        <div className="w-full min-h-[200px] sm:min-h-[260px] rounded-3xl bg-gradient-to-b from-white/[0.04] to-black/60 border border-white/10 flex flex-col items-center justify-center p-5 sm:p-6 relative overflow-hidden backdrop-blur-md shadow-2xl">
                            
                            {/* Ambient neon backdrop */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                            {generating ? (
                                <div className="flex flex-col items-center justify-center gap-4 z-10">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin shadow-[0_0_20px_#d9ff00]" />
                                        <span className="text-xl">🎬</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-white tracking-wide mb-1">
                                            Generating Cinema Video Frames...
                                        </div>
                                        <div className="text-xs text-white/50 font-mono">
                                            Rendering via {selectedModelName} Cloud GPU
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center z-10 max-w-lg w-full">
                                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 shadow-inner">
                                        <span className="text-lg">🎬</span>
                                    </div>
                                    <h2 className="text-sm sm:text-base font-bold text-white mb-1">
                                        Video Motion Studio Ready
                                    </h2>
                                    <p className="text-[11px] text-white/45 mb-3.5">
                                        Select a cinematic motion scene below or enter your prompt in the command bar.
                                    </p>
                                    
                                    {/* Quick Preset Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-[11px]">
                                        {[
                                            { icon: '🚁', title: 'FPV Drone Flight', p: 'High speed FPV drone dive down a snowy mountain ridge into an emerald pine forest at sunset, 4k 60fps' },
                                            { icon: '🌌', title: 'Cosmic Nebula', p: 'Camera floating forward through a glowing purple and turquoise interstellar nebula with swirling star dust' },
                                            { icon: '⚡', title: 'Cyberpunk Chase', p: 'Sleek futuristic hover-car speeding down a neon rainy Tokyo highway at night, lens flares, photoreal' },
                                            { icon: '🌊', title: 'Pacific Wave Barrel', p: 'Slow motion inside a massive crystal clear turquoise ocean wave barrel, golden hour light reflecting' },
                                        ].map((item, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    setPrompt(item.p);
                                                    setTimeout(() => {
                                                        if (textareaRef.current) {
                                                            textareaRef.current.style.height = 'auto';
                                                            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                                                        }
                                                    }, 50);
                                                }}
                                                className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-primary/40 text-left transition-all group/card cursor-pointer"
                                            >
                                                <span className="text-sm block mb-0.5">{item.icon}</span>
                                                <span className="font-bold text-white/80 group-hover/card:text-primary transition-colors block truncate text-[11px]">
                                                    {item.title}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prompt Bar */}
                    <div className="w-full max-w-4xl relative z-40 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="w-full bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 flex flex-col gap-3 md:gap-5 shadow-3xl">

                            {/* Top row: image picker + video picker + textarea */}
                            <div className="flex items-start gap-5 px-2">

                                {/* Image upload button */}
                                <div className="relative mt-1.5">
                                    <input
                                        ref={imageFileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageFileChange}
                                    />
                                    <button
                                        type="button"
                                        title={uploadedImageUrl ? 'Clear image' : 'Upload image for Image-to-Video'}
                                        onClick={() => uploadedImageUrl ? clearImageUpload() : imageFileInputRef.current?.click()}
                                        className={`w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden ${uploadedImageUrl ? 'border-primary/60 bg-primary/10' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40'} group`}
                                    >
                                        {imageUploading ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                                                <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
                                                <span className="text-[8px] font-black text-primary">{imageProgress}%</span>
                                            </div>
                                        ) : null}
                                        
                                        {uploadedImageUrl ? (
                                            <img src={uploadedImageUrl} alt="" className={`w-full h-full object-cover rounded-xl ${imageUploading ? 'opacity-40 blur-[2px]' : 'opacity-100'}`} />
                                        ) : !imageUploading && (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted group-hover:text-primary transition-colors">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Video upload button */}
                                <div className="relative mt-1.5">
                                    <input
                                        ref={videoFileInputRef}
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={handleVideoFileChange}
                                    />
                                    <button
                                        type="button"
                                        title={uploadedVideoUrl ? `${uploadedVideoName} — click to clear` : 'Upload video to remove watermark'}
                                        onClick={() => uploadedVideoUrl ? clearVideoUpload() : videoFileInputRef.current?.click()}
                                        className={`w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden ${uploadedVideoUrl ? 'border-primary/60 bg-white/5' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40'} group`}
                                    >
                                        {videoUploading ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                                                <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
                                                <span className="text-[8px] font-black text-primary">{videoProgress}%</span>
                                            </div>
                                        ) : uploadedVideoUrl ? (
                                            <video src={uploadedVideoUrl} className={`w-full h-full object-cover rounded-xl ${videoUploading ? 'opacity-40 blur-[2px]' : 'opacity-100'}`} muted />
                                        ) : (
                                            <VideoIconSvg className="text-muted group-hover:text-primary transition-colors" />
                                        )}
                                    </button>
                                </div>

                                {/* Prompt textarea */}
                                <div className="flex-1 flex flex-col relative">
                                    <div className="flex items-start">
                                        <textarea
                                            ref={textareaRef}
                                            value={prompt}
                                            onChange={handlePromptInput}
                                            onKeyDown={(e) => {
                                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleGenerate();
                                                }
                                            }}
                                            placeholder={promptPlaceholder}
                                            disabled={promptDisabled}
                                            rows={1}
                                            className="flex-1 bg-transparent border-none text-white text-base md:text-xl placeholder:text-muted focus:outline-none resize-none pt-2.5 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar disabled:opacity-40 pr-7"
                                        />
                                        {prompt && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPrompt('');
                                                    if (textareaRef.current) textareaRef.current.style.height = 'auto';
                                                }}
                                                className="text-white/30 hover:text-white mt-2 p-1 text-xs rounded-full hover:bg-white/10 transition-colors"
                                                title="Clear prompt"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {/* Creative inspiration tags & Surprise Me */}
                                    <div className="flex items-center gap-1.5 pt-2 flex-wrap text-[11px] select-none">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const samples = [
                                                    "Cinematic slow motion drone shot flying through a neon-lit futuristic metropolis at twilight, flying vehicles gliding between skyscrapers, 4k 60fps",
                                                    "A mystical glowing spirit fox running gracefully across a mirror-like frozen lake under the northern lights, mist rising, cinematic depth of field",
                                                    "Epic time-lapse of a massive thunderstorm forming over a desert canyon, purple lightning forks illuminating sandstone cliffs, ultra photorealistic",
                                                    "Macro camera zooming smoothly into a mechanical iris aperture, revealing intricate golden clockwork gears ticking in harmony, 8k studio lighting",
                                                    "A sleek vintage sports car speeding along a winding coastal highway at sunset, ocean waves crashing below, warm golden cinematic lens flare"
                                                ];
                                                const picked = samples[Math.floor(Math.random() * samples.length)];
                                                setPrompt(picked);
                                                setTimeout(() => {
                                                    if (textareaRef.current) {
                                                        textareaRef.current.style.height = 'auto';
                                                        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                                                    }
                                                }, 50);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-bold transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                                        >
                                            <span>🎲 Surprise Me</span>
                                        </button>

                                        {['Slow Motion', 'Drone Flythrough', 'Cinematic 60fps', 'Hyper-lapse', 'Volumetric Fog'].map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    setPrompt((prev) => {
                                                        const trimmed = prev.trim();
                                                        if (!trimmed) return tag;
                                                        if (trimmed.toLowerCase().includes(tag.toLowerCase())) return trimmed;
                                                        return `${trimmed}, ${tag}`;
                                                    });
                                                    setTimeout(() => {
                                                        if (textareaRef.current) {
                                                            textareaRef.current.style.height = 'auto';
                                                            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                                                        }
                                                    }, 50);
                                                }}
                                                className="px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/5 transition-all text-[10px]"
                                            >
                                                + {tag}
                                            </button>
                                        ))}
                                        <span className="hidden sm:inline text-[9px] text-white/30 ml-auto font-mono">
                                            Ctrl+Enter ↵
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Extend banner */}
                            {isExtendMode && (
                                <div className="flex items-center gap-2 px-4 py-2 mx-2 mt-2 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                    <span>Extending previous Seedance 2.0 generation — add an optional prompt to guide the continuation</span>
                                </div>
                            )}

                            {/* Bottom row: controls + generate */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-2 pt-4 border-t border-white/5">
                                <div className="flex items-center gap-1.5 md:gap-2.5 relative flex-wrap">

                                    {/* Model btn */}
                                    <div className="relative">
                                        <ControlBtn
                                            icon={
                                                <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
                                                    <span className="text-[10px] font-black text-black">V</span>
                                                </div>
                                            }
                                            label={selectedModelName}
                                            onClick={toggleDropdown('model')}
                                        />
                                        {openDropdown === 'model' && (
                                            <div ref={dropdownRef} onClick={e => e.stopPropagation()} className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#111] rounded-3xl p-3 border border-white/10 flex flex-col w-[calc(100vw-3rem)] max-w-xs">
                                                <ModelDropdown
                                                    imageMode={imageMode}
                                                    selectedModel={selectedModel}
                                                    onSelect={handleModelSelect}
                                                    onClose={() => setOpenDropdown(null)}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Aspect ratio btn */}
                                    {showAr && (
                                        <div className="relative">
                                            <ControlBtn
                                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60 text-secondary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>}
                                                label={selectedAr}
                                                onClick={toggleDropdown('ar')}
                                            />
                                            {openDropdown === 'ar' && (
                                                <div ref={dropdownRef} onClick={e => e.stopPropagation()} className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#111] rounded-3xl p-3 border border-white/10 flex flex-col w-52 max-w-[240px]">
                                                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Aspect Ratio</div>
                                                    <div className="flex flex-col gap-1">
                                                        {getCurrentAspectRatios(selectedModel).map(r => (
                                                            <div
                                                                key={r}
                                                                className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
                                                                onClick={(e) => { e.stopPropagation(); setSelectedAr(r); setOpenDropdown(null); }}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-6 h-6 border-2 border-white/20 rounded-md shadow-inner flex items-center justify-center group-hover:border-primary/50 transition-colors">
                                                                        <div className="w-3 h-3 bg-white/10 rounded-sm" />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity">{r}</span>
                                                                </div>
                                                                {selectedAr === r && <CheckSvg />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Duration btn */}
                                    {showDuration && (
                                        <div className="relative">
                                            <ControlBtn
                                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60 text-secondary"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                                                label={`${selectedDuration}s`}
                                                onClick={toggleDropdown('duration')}
                                            />
                                            {openDropdown === 'duration' && (
                                                <div ref={dropdownRef} onClick={e => e.stopPropagation()} className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#111] rounded-3xl p-3 border border-white/10 flex flex-col w-52 max-w-[240px]">
                                                    <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Duration</div>
                                                    <div className="flex flex-col gap-1">
                                                        {getCurrentDurations(selectedModel).map(d => (
                                                            <DropdownItem key={d} label={`${d}s`} selected={selectedDuration === d} onClick={(e) => { e.stopPropagation(); setSelectedDuration(d); setOpenDropdown(null); }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Resolution btn */}
                                    {showResolution && (
                                        <div className="relative">
                                            <ControlBtn
                                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60 text-secondary"><path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" /></svg>}
                                                label={selectedResolution || '720p'}
                                                onClick={toggleDropdown('resolution')}
                                            />
                                            {openDropdown === 'resolution' && (
                                                <div ref={dropdownRef} onClick={e => e.stopPropagation()} className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#111] rounded-3xl p-3 border border-white/10 flex flex-col w-52 max-w-[240px]">
                                                    <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Resolution</div>
                                                    <div className="flex flex-col gap-1">
                                                        {getCurrentResolutions(selectedModel).map(r => (
                                                            <DropdownItem key={r} label={r} selected={selectedResolution === r} onClick={(e) => { e.stopPropagation(); setSelectedResolution(r); setOpenDropdown(null); }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Quality btn */}
                                    {showQuality && (
                                        <div className="relative">
                                            <ControlBtn
                                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60 text-secondary"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>}
                                                label={selectedQuality || 'basic'}
                                                onClick={toggleDropdown('quality')}
                                            />
                                            {openDropdown === 'quality' && (
                                                <div ref={dropdownRef} onClick={e => e.stopPropagation()} className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#111] rounded-3xl p-3 border border-white/10 flex flex-col w-52 max-w-[240px]">
                                                    <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Quality</div>
                                                    <div className="flex flex-col gap-1">
                                                        {getQualitiesForModel(getCurrentModels(), selectedModel).map(q => (
                                                            <DropdownItem key={q} label={q} selected={selectedQuality === q} onClick={(e) => { e.stopPropagation(); setSelectedQuality(q); setOpenDropdown(null); }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mode btn */}
                                    {showMode && (
                                        <div className="relative">
                                            <ControlBtn
                                                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60 text-secondary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                                                label={selectedMode || 'normal'}
                                                onClick={toggleDropdown('mode')}
                                            />
                                            {openDropdown === 'mode' && (
                                                <div ref={dropdownRef} onClick={e => e.stopPropagation()} className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-[#111] rounded-3xl p-3 border border-white/10 flex flex-col w-52 max-w-[240px]">
                                                    <div className="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Mode</div>
                                                    <div className="flex flex-col gap-1">
                                                        {getModesForModel(selectedModel).map(m => (
                                                            <DropdownItem key={m} label={m} selected={selectedMode === m} onClick={(e) => { e.stopPropagation(); setSelectedMode(m); setOpenDropdown(null); }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Generate button */}
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="bg-primary text-black px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-base hover:shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto shadow-lg disabled:opacity-60 disabled:scale-100"
                                >
                                    {generating ? (
                                        <><span className="animate-spin inline-block text-black">◌</span> Generating...</>
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
        </div>
    );
}
