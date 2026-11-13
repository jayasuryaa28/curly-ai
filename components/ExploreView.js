'use client';

import { useState } from 'react';

const EXPLORE_CATEGORIES = [
  'All',
  'Cinematic Film',
  'Photorealistic',
  'Anime & Manga',
  'Sci-Fi & Cyberpunk',
  'Fantasy & Mythical',
  'Architecture',
  '3D & Surreal',
];

const EXPLORE_CARDS = [
  {
    id: 1,
    category: 'Sci-Fi & Cyberpunk',
    title: 'Neon Tokyo Rain Strider',
    prompt: 'Cinematic wide shot of a lone cybernetic wanderer standing in a rain-drenched Neo-Tokyo alley at midnight, neon reflections on asphalt, holographic advertisements, steam vents, 8k resolution, Kodak Vision3 500T',
    model: 'Flux.1 Dev',
    ar: '16:9',
    img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    likes: '1.4k',
  },
  {
    id: 2,
    category: 'Fantasy & Mythical',
    title: 'Ethereal Solar Goddess',
    prompt: 'Renaissance oil painting of an ethereal sun goddess adorned with intricate golden filigree and woven botanical flowers, soft golden hour rim light, Vermeer lighting, ultra-detailed fine art masterpiece',
    model: 'Nano Banana',
    ar: '1:1',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    likes: '2.1k',
  },
  {
    id: 3,
    category: 'Sci-Fi & Cyberpunk',
    title: 'Deep Moon Solitude',
    prompt: 'Astronaut walking across an expansive frozen alien crater on Europa, gazing up at a gigantic luminous ringed gas giant in deep star-filled cosmos, photorealistic sci-fi render, Hasselblad 80mm lens',
    model: 'Flux.1 Pro',
    ar: '16:9',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    likes: '3.8k',
  },
  {
    id: 4,
    category: 'Architecture',
    title: 'Gilded Sunrise Sanctuary',
    prompt: 'Majestic golden baroque temple palace reflected in crystal clear marble water pools at sunrise, dramatic volumetric clouds, architectural digest photography, symmetry, hyper-detailed masonry',
    model: 'Recraft v3',
    ar: '16:9',
    img: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80',
    likes: '950',
  },
  {
    id: 5,
    category: 'Cinematic Film',
    title: 'Golden Hour Coastal Cruiser',
    prompt: 'Vintage 1969 Ferrari sports car parked on a scenic Pacific Coast Highway cliff overlooking golden ocean sunset, authentic 35mm film grain, warm anamorphic lens flare, timeless cinematic atmosphere',
    model: 'Kling v2.1',
    ar: '16:9',
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    likes: '1.8k',
  },
  {
    id: 6,
    category: 'Anime & Manga',
    title: 'Neon Beat Skyline',
    prompt: 'Anime girl wearing glowing audio headphones listening to lo-fi music overlooking futuristic neon city skyline at dusk, purple and cyan reflections, Makoto Shinkai aesthetic, vibrant cel shading',
    model: 'Midjourney v6',
    ar: '1:1',
    img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    likes: '4.2k',
  },
  {
    id: 7,
    category: 'Photorealistic',
    title: 'Bioluminescent Alien Flora',
    prompt: 'Extreme macro photography of an otherworldly crystalline flower blooming on an exoplanet, bioluminescent dew droplets glowing in ultraviolet and cyan, velvety petals, shallow depth of field',
    model: 'Nano Banana',
    ar: '1:1',
    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    likes: '1.2k',
  },
  {
    id: 8,
    category: '3D & Surreal',
    title: 'Floating Cloud Metropolis',
    prompt: 'Surreal floating architectural city island suspended high in cumulus sunset clouds, sleek glass skyscrapers, waterfalls spilling into infinity, golden warm atmosphere, octane render 8k',
    model: 'Flux.1 Dev',
    ar: '16:9',
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    likes: '2.5k',
  },
];

export default function ExploreView({ onUsePrompt }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filteredCards = EXPLORE_CARDS.filter((card) => {
    const matchesCat = activeCategory === 'All' || card.category === activeCategory;
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
            <span className="text-orange-400 text-xl sparkle-anim">🧭</span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange-400 font-mono">
              Community Inspirations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Explore AI Masterpieces
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-xl">
            Curated prompt recipes and high-res creations across 200+ models. Click Remix to generate in studio.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts, styles, models..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">
            🔍
          </span>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 custom-scrollbar">
        {EXPLORE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'orange-btn-gradient text-white shadow-md shadow-orange-500/30 font-bold'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/65 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Showcase Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className="group rounded-3xl bg-[#0c101a] border border-white/10 hover:border-orange-500/50 shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10"
          >
            {/* Visual Image Thumbnail */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/40">
              <img
                src={card.img}
                alt={card.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              {/* Top Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-orange-400 border border-orange-500/30">
                  {card.model}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/70">
                  {card.ar}
                </span>
              </div>

              {/* Bottom Card Title */}
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-sm font-extrabold text-white drop-shadow-md truncate">
                  {card.title}
                </h3>
              </div>
            </div>

            {/* Prompt Excerpt & Action Footer */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                "{card.prompt}"
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(card.id, card.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-bold text-white/70 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === card.id ? '✓ Copied' : '📋 Copy'}
                </button>

                <button
                  type="button"
                  onClick={() => onUsePrompt?.(card.prompt)}
                  className="px-3.5 py-1.5 rounded-xl orange-btn-gradient text-[11px] font-extrabold text-white flex items-center gap-1 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                >
                  <span>⚡ Remix</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
