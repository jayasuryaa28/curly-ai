'use client';

const WORKFLOWS = [
  {
    id: 'upscale',
    title: 'Ultra-HD 4K Concept & Upscale Pipeline',
    desc: 'Generate photorealistic concepts using Flux Dev, enhance texture details, and upscale to 4K publication quality.',
    category: 'Image Pipeline',
    time: '~15s',
    nodes: [
      { step: '1', title: 'Text Prompt', desc: 'Creative Prompt Engine' },
      { step: '2', title: 'Flux Dev', desc: 'Photoreal Base Render' },
      { step: '3', title: '4K Enhancement', desc: 'Clarity & Super-Res' },
    ],
    models: ['Flux.1 Dev', 'Recraft v3'],
    targetTab: 'image',
  },
  {
    id: 'video',
    title: 'Still-to-Cinematic 60fps Motion Video',
    desc: 'Transform a single high-resolution image into an animated 1080p movie scene with dynamic physics and camera tracking.',
    category: 'Video Pipeline',
    time: '~45s',
    nodes: [
      { step: '1', title: 'Concept Frame', desc: 'High-Res Art Source' },
      { step: '2', title: 'Depth & Camera', desc: 'Motion Vectorization' },
      { step: '3', title: 'Kling 2.1 Pro', desc: '1080p 60fps Render' },
    ],
    models: ['Kling v2.1 Pro', 'Seedance 2.0'],
    targetTab: 'video',
  },
  {
    id: 'lipsync',
    title: 'Photo-to-Voice Talking Avatar Pipeline',
    desc: 'Sync any human portrait or character drawing with real audio voice recordings for realistic talking avatars.',
    category: 'Avatar Pipeline',
    time: '~25s',
    nodes: [
      { step: '1', title: 'Photo Portrait', desc: 'Face Mesh Extraction' },
      { step: '2', title: 'Audio Track', desc: 'Phoneme Alignment' },
      { step: '3', title: 'OmniHuman 1.5', desc: 'Natural Lip-Sync Video' },
    ],
    models: ['OmniHuman 1.5', 'Infinite Talk'],
    targetTab: 'lipsync',
  },
  {
    id: 'cinema',
    title: 'Director Mode Multi-Shot Cinema Scene',
    desc: 'Compose a complete cinematic sequence with wide establishing shots, medium character angles, and close-ups.',
    category: 'Director Pipeline',
    time: '~60s',
    nodes: [
      { step: '1', title: 'Script Beat', desc: 'Storyboard Breakdown' },
      { step: '2', title: 'Camera Moves', desc: 'Pan, Dolly, Crane' },
      { step: '3', title: 'Cinema Studio', desc: 'Hollywood Grade Output' },
    ],
    models: ['Veo 3', 'Sora 2', 'Kling Pro'],
    targetTab: 'cinema',
  },
];

export default function WorkflowsView({ onLaunchWorkflow }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-orange-400 text-xl sparkle-anim">🔗</span>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-400 font-mono">
            Automated Pipelines
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          AI Creative Workflows
        </h1>
        <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-xl">
          Multi-model orchestrated chains. Launch any pipeline directly into your Curly AI studio.
        </p>
      </div>

      {/* ── Workflow Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {WORKFLOWS.map((wf) => (
          <div
            key={wf.id}
            className="rounded-3xl bg-[#0c101a] border border-white/10 hover:border-orange-500/50 p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10"
          >
            <div>
              {/* Category & Time */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {wf.category}
                </span>
                <span className="text-xs text-white/40 font-mono flex items-center gap-1">
                  ⏱️ {wf.time}
                </span>
              </div>

              {/* Title & Desc */}
              <h2 className="text-base sm:text-lg font-black text-white mb-1.5">
                {wf.title}
              </h2>
              <p className="text-xs text-white/60 leading-relaxed mb-4">
                {wf.desc}
              </p>

              {/* Step-by-Step Node Diagram */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
                {wf.nodes.map((node, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1 min-w-[85px]">
                    <div className="flex flex-col items-center text-center flex-1">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-black text-[11px] flex items-center justify-center mb-1">
                        {node.step}
                      </div>
                      <span className="text-[11px] font-bold text-white truncate max-w-full">
                        {node.title}
                      </span>
                      <span className="text-[9px] text-white/40 truncate max-w-full">
                        {node.desc}
                      </span>
                    </div>
                    {i < wf.nodes.length - 1 && (
                      <span className="text-orange-500/60 text-xs font-black">
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Models & Action Button */}
            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {wf.models.map((m, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.04] text-white/70 border border-white/5"
                  >
                    {m}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onLaunchWorkflow?.(wf.targetTab)}
                className="px-4 py-2 rounded-xl orange-btn-gradient text-xs font-extrabold text-white transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-orange-500/20 whitespace-nowrap"
              >
                Launch ⚡
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
