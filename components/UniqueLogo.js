'use client';

export default function UniqueLogo({ size = 'default' }) {
  const isSmall = size === 'small';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* ── Custom Curly AI Vector Mark ── */}
      <div className={`relative ${isSmall ? 'w-8 h-8 rounded-xl' : 'w-10 h-10 rounded-2xl'} p-[1px] bg-gradient-to-br from-orange-500 via-amber-400 to-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.35)] shrink-0 group cursor-pointer transition-transform hover:scale-105`}>
        <div className="w-full h-full bg-[#0a0d14] rounded-[inherit] flex items-center justify-center relative overflow-hidden">
          {/* Subtle neon ambient inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-amber-500/10" />
          
          {/* Unique Curly Spiral + AI Neural Spark Vector */}
          <svg
            viewBox="0 0 40 40"
            className={`${isSmall ? 'w-5 h-5' : 'w-6 h-6'} text-orange-400 relative z-10 transition-transform group-hover:rotate-12 duration-300`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="curlyGrad" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff7a00" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Outer Curly Swoop (Flowing Stylized "C" Ribbon) */}
            <path
              d="M31 13C29 8 23 5 17 6.5C10 8.5 6 15 6 22C6 29 11 34 18 34C25 34 31 29 32 23C32.5 19.5 30 17 26.5 17C23 17 21 19.5 21 22C21 24.5 22.5 26 24.5 26"
              stroke="url(#curlyGrad)"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Neural Sparkle Star at the Curl Core */}
            <path
              d="M26 12L27 15L30 16L27 17L26 20L25 17L22 16L25 15L26 12Z"
              fill="url(#curlyGrad)"
            />
            <circle cx="26" cy="16" r="1.5" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* ── Brand Typography ── */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-black text-lg tracking-tight text-white font-sans">
            Curly
          </span>
          <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/40">
            AI
          </span>
        </div>
        <p className="text-[10px] font-bold tracking-widest text-orange-400/90 uppercase font-mono">
          Creative Studio
        </p>
      </div>
    </div>
  );
}
