'use client';

import { useState, useEffect, useCallback } from 'react';
import ImageStudio from '../packages/studio/src/components/ImageStudio';
import VideoStudio from '../packages/studio/src/components/VideoStudio';
import LipSyncStudio from '../packages/studio/src/components/LipSyncStudio';
import CinemaStudio from '../packages/studio/src/components/CinemaStudio';
import ApiKeyModal from './ApiKeyModal';
import UniqueLogo from './UniqueLogo';
import ExploreView from './ExploreView';
import CreationsView from './CreationsView';

const TABS = [
  {
    id: 'image',
    label: 'Image Studio',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    )
  },
  {
    id: 'video',
    label: 'Video Studio',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    )
  },
  {
    id: 'lipsync',
    label: 'Lip Sync',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </svg>
    )
  },
  {
    id: 'cinema',
    label: 'Cinema Studio',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    )
  },
  {
    id: 'models',
    label: 'Models',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    )
  },
];

const SIDEBAR_ITEMS = [
  {
    id: 'create',
    label: 'Create',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    )
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    )
  },
  {
    id: 'creations',
    label: 'My Creations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    )
  },
  {
    id: 'models',
    label: 'Models',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  },
];

const FEATURED_MODELS_LIST = [
  { category: 'Image Generation', name: 'Nano Banana', tag: 'Fastest 4K', desc: 'Google Gemini 3.1 architecture with multi-reference edit up to 14 images' },
  { category: 'Image Generation', name: 'Flux.1 Dev / Pro', tag: 'Photoreal', desc: 'Highest text prompt accuracy, typography rendering, and cinematic lighting' },
  { category: 'Image Generation', name: 'Recraft v3', tag: 'Vector & Graphic', desc: 'World leader in typography, icons, vector art, and logo design' },
  { category: 'Video Generation', name: 'Seedance 2.0', tag: 'ByteDance Flagship', desc: 'Dynamic fluid motion, camera pans, and extend mode capability' },
  { category: 'Video Generation', name: 'Kling v2.1 Pro', tag: 'Cinematic Physics', desc: 'Realistic cloth, liquid, and character motion up to 1080p 60fps' },
  { category: 'Video Generation', name: 'Sora 2 / Veo 3', tag: 'Hollywood Grade', desc: 'High visual coherence and complex camera crane / tracking movements' },
  { category: 'Lip Sync & Talking Avatar', name: 'OmniHuman 1.5 & Infinite Talk', tag: 'Speech Sync', desc: 'Photo portrait or video synced with audio voice track' },
];

const STORAGE_KEY = 'kie_key';
const CREATIONS_STORAGE_KEY = 'curly_creations';

export default function StandaloneShell() {
  const [apiKey, setApiKey] = useState(null);
  const [activeTab, setActiveTab] = useState('image');
  const [currentView, setCurrentView] = useState('create'); // 'create' | 'explore' | 'creations'
  const [creations, setCreations] = useState([]);
  const [sharedPrompt, setSharedPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showEditKeyModal, setShowEditKeyModal] = useState(false);
  const [showModelsModal, setShowModelsModal] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [authErrorBanner, setAuthErrorBanner] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored.trim());
    } else {
      setApiKey('preview_session_active');
    }

    try {
      const storedCreations = localStorage.getItem(CREATIONS_STORAGE_KEY);
      if (storedCreations) {
        setCreations(JSON.parse(storedCreations));
      }
    } catch {}

    const handleAuthError = (e) => {
      const msg = e.detail?.message || 'Authentication failed (401 Unauthorized)';
      setAuthErrorBanner(msg);
    };

    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const handleKeySave = useCallback((key) => {
    const clean = key.trim();
    localStorage.setItem(STORAGE_KEY, clean);
    setApiKey(clean);
    setShowEditKeyModal(false);
    setAuthErrorBanner(null);
  }, []);

  const handleKeyRemove = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
    setShowSettings(false);
    setShowEditKeyModal(false);
  }, []);

  // Creation history management
  const handleNewCreation = useCallback((creation) => {
    setCreations((prev) => {
      const filtered = prev.filter((c) => c.id !== creation.id && c.url !== creation.url);
      const updated = [creation, ...filtered].slice(0, 100);
      try {
        localStorage.setItem(CREATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleDeleteCreation = useCallback((target) => {
    setCreations((prev) => {
      const updated = prev.filter((c, idx) => c.id !== target && idx !== target);
      try {
        localStorage.setItem(CREATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleClearCreations = useCallback(() => {
    setCreations([]);
    localStorage.removeItem(CREATIONS_STORAGE_KEY);
  }, []);

  const handleUsePrompt = (promptText) => {
    setSharedPrompt(promptText);
    setCurrentView('create');
    setActiveTab('image');
  };

  const handleSidebarClick = (id) => {
    if (id === 'models') {
      setShowModelsModal(true);
    } else if (id === 'settings') {
      setShowSettings(true);
    } else {
      setCurrentView(id);
      if (id === 'create') {
        setActiveTab('image');
      }
    }
    setIsMobileSidebarOpen(false);
  };

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center animate-spin shadow-[0_0_30px_rgba(249,115,22,0.3)]">
          <span className="text-orange-400 text-2xl">✦</span>
        </div>
        <p className="text-white/50 text-xs font-mono uppercase tracking-widest animate-pulse">
          Loading Curly AI Studio...
        </p>
      </div>
    );
  }

  if (!apiKey) {
    return <ApiKeyModal onSave={handleKeySave} />;
  }

  return (
    <div className="h-screen w-screen flex bg-[#07090e] text-white font-sans overflow-hidden relative">

      {/* ── ATMOSPHERIC SUNSET MIST & AMBIENT GLOW ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 sunset-glow-bg opacity-75" />

      {/* ── Top Auth Alert Banner (if 401 occurs) ── */}
      {authErrorBanner && (
        <div className="fixed top-0 left-0 right-0 bg-rose-500/20 border-b border-rose-500/30 px-4 py-2.5 flex items-center justify-between z-50 text-xs text-rose-200 animate-fade-in-up backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-bold text-sm animate-bounce">⚠️</span>
            <span>{authErrorBanner} — Please check your Kie.ai API key from https://kie.ai</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditKeyModal(true)}
              className="bg-orange-500 text-white font-bold px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors shadow-sm cursor-pointer"
            >
              Update Key
            </button>
            <button
              onClick={() => setAuthErrorBanner(null)}
              className="text-white/60 hover:text-white px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── LEFT SIDEBAR (GENEROUS SPACING & NALLA BOLD) ─────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 sm:w-68 bg-[#090c14]/98 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top: Unique Curly AI Logo with Generous 3-Space Gap */}
        <div className="pt-6 px-5 pb-3 mb-6 border-b border-white/[0.06]">
          <div onClick={() => { setCurrentView('create'); setActiveTab('image'); }} className="cursor-pointer">
            <UniqueLogo />
          </div>
        </div>

        {/* Middle: Navigation Items with Generous 2-Space Gap & Nalla Bold */}
        <nav className="flex-1 px-4 space-y-3.5">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSidebarClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13px] font-black tracking-wide transition-all duration-200 cursor-pointer text-left ${
                  isActive
                    ? 'orange-btn-gradient text-white shadow-xl shadow-orange-500/35 font-black scale-[1.02] ring-1 ring-orange-300/40'
                    : 'text-white/80 font-extrabold hover:text-white hover:bg-white/[0.07] hover:translate-x-1'
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-orange-400'}`}>
                  {item.icon}
                </span>
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom: Spacious Cloud GPU Engine Status (No cutoff) */}
        <div className="p-3.5 mx-4 mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-black text-white tracking-wide whitespace-nowrap">Kie Cloud GPU</div>
              <div className="text-[10px] text-white/50 font-mono">200+ Online</div>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            title="Manage API & Settings"
            className="text-[10px] text-orange-400 hover:text-orange-300 font-black bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 transition-all cursor-pointer hover:bg-orange-500/20 shrink-0"
          >
            Active
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── RIGHT MAIN WORKSPACE (DYNAMIC TOP MENU & AMBIENCE) ───── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">

        {/* ── TOP HEADER (DYNAMIC GLOWING 5-TAB CAPSULE + GEAR) ────── */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#080b12]/95 backdrop-blur-2xl border-b border-white/[0.06] z-30 min-h-[64px]">
          
          {/* Left: Mobile hamburger menu or Desktop Studio Indicator */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white cursor-pointer md:hidden"
            >
              ☰
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
              <span className="text-[11px] font-black text-orange-400 font-mono tracking-wider uppercase">Curly Studio</span>
            </div>
            <span className="font-bold text-sm tracking-wide text-white md:hidden">Curly AI</span>
          </div>

          {/* Desktop Center Pill Navigation - Dynamic Animated Glass Capsule (5 Tabs) */}
          <div className="hidden md:flex flex-1 justify-center">
            <nav className="flex items-center gap-1.5 p-1.5 rounded-full border border-white/10 bg-[#0a0e17]/85 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300">
              {TABS.map((tab) => {
                const isActive = currentView === 'create' && activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'models') {
                        setShowModelsModal(true);
                      } else {
                        setActiveTab(tab.id);
                        setCurrentView('create');
                      }
                    }}
                    className={`relative px-4 py-2 text-xs font-black rounded-full transition-all duration-300 flex items-center gap-2 cursor-pointer whitespace-nowrap group ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-[0_0_25px_rgba(249,115,22,0.5)] ring-1 ring-orange-300/60 scale-[1.03]'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.08] hover:scale-[1.02]'
                    }`}
                  >
                    <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-orange-400'}`}>
                      {tab.icon}
                    </span>
                    <span className="tracking-wide">{tab.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls (Notification Bell & Animated Setting Symbol Gear) */}
          <div className="flex items-center justify-end gap-3 min-w-[140px]">
            {/* Notification Bell */}
            <button
              onClick={() => setShowModelsModal(true)}
              title="200+ AI Models Available"
              className="relative w-9 h-9 rounded-full bg-white/[0.04] hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-[9px] font-black text-white flex items-center justify-center shadow-md animate-pulse">
                0
              </span>
            </button>

            {/* Corner Settings Symbol (Smooth Rotating Gear Icon) */}
            <button
              onClick={() => setShowSettings(true)}
              title="Studio Settings & API Key"
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/50 flex items-center justify-center text-white/80 hover:text-orange-400 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 group"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-500 ease-out">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── MAIN CONTENT AREA (DYNAMIC VIEW ROUTING) ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
          {/* Create Studio View */}
          {currentView === 'create' && (
            <>
              {activeTab === 'image'   && (
                <ImageStudio
                  apiKey={apiKey}
                  onGenerationComplete={handleNewCreation}
                  historyItems={creations}
                  initialPrompt={sharedPrompt}
                  onOpenModelsModal={() => setShowModelsModal(true)}
                />
              )}
              {activeTab === 'video'   && <VideoStudio   apiKey={apiKey} />}
              {activeTab === 'lipsync' && <LipSyncStudio apiKey={apiKey} />}
              {activeTab === 'cinema'  && <CinemaStudio  apiKey={apiKey} />}
            </>
          )}

          {/* Explore Community Inspirations View */}
          {currentView === 'explore' && (
            <ExploreView onUsePrompt={handleUsePrompt} />
          )}

          {/* My Creations Vault View */}
          {currentView === 'creations' && (
            <CreationsView
              creations={creations}
              onRemix={handleUsePrompt}
              onDeleteCreation={handleDeleteCreation}
              onClearAll={handleClearCreations}
              onGoToCreate={() => {
                setCurrentView('create');
                setActiveTab('image');
              }}
            />
          )}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 200+ MODELS DIRECTORY MODAL ──────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showModelsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="w-full max-w-2xl bg-[#0d121c] border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(249,115,22,0.2)] relative overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                  <span className="text-xl text-orange-400">🥞</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">200+ Supported AI Models</h2>
                  <p className="text-xs text-white/50">Official Cloud GPU acceleration powered by Kie.ai</p>
                </div>
              </div>
              <button
                onClick={() => setShowModelsModal(false)}
                className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-3">
              {FEATURED_MODELS_LIST.map((m, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-orange-500/30 transition-all flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-white">{m.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-extrabold border border-orange-500/30">
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">{m.desc}</p>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1 block">
                      {m.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-white/50">All models directly usable from the prompt bar</span>
              <button
                onClick={() => setShowModelsModal(false)}
                className="px-5 py-2 rounded-xl orange-btn-gradient text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── SETTINGS & KEY MANAGEMENT MODAL ──────────────────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in-up">
          <div className="w-full max-w-md bg-[#0d121c] border border-orange-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl text-orange-400">⚙️</span>
                <h2 className="text-base font-bold text-white">Curly AI Settings</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/40 hover:text-white p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Cloud API Key</div>
                  <div className="text-[11px] font-mono text-white/50">
                    {apiKey ? `${apiKey.slice(0, 6)}••••••••${apiKey.slice(-4)}` : 'None'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowEditKeyModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-xs font-bold text-white mb-1">Mobile / Network URL</div>
                <div className="text-[11px] text-white/60 mb-2">Access this studio on your mobile phone or tablet:</div>
                <code className="text-[11px] bg-black/40 px-2 py-1 rounded-lg text-orange-400 font-mono block select-all">
                  http://10.42.146.235:3000/studio
                </code>
              </div>

              <button
                onClick={handleKeyRemove}
                className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Log Out & Clear Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit API Key Modal ── */}
      {showEditKeyModal && (
        <ApiKeyModal
          initialKey={apiKey}
          isChange={true}
          onSave={handleKeySave}
          onClose={() => setShowEditKeyModal(false)}
        />
      )}
    </div>
  );
}
