'use client';

import React, { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteData, GameItem } from '@/types';
import { AdUnit } from './AdUnit';
import {
  Play,
  Gamepad2,
  Maximize2,
  ArrowLeft,
  ThumbsUp,
  Sparkles,
  Info,
} from 'lucide-react';

interface GamePlayContentProps {
  siteData: SiteData;
  currentGame: GameItem;
  otherGames: GameItem[];
}

export const GamePlayContent: React.FC<GamePlayContentProps> = ({
  siteData,
  currentGame,
  otherGames,
}) => {
  const searchParams = useSearchParams();
  const { settings, ads, featuredItems } = siteData;

  const gclid = searchParams.get('gclid');
  const isAdTraffic = Boolean(gclid);
  const gclidSuffix = `?gclid=${encodeURIComponent(gclid || '1')}`;

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(2180);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    const el = gameContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] font-sans">
      {/* Top Sticky Brand Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <a
            href={`/${gclidSuffix}`}
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </a>
          <a
            href={`/${gclidSuffix}`}
            className="text-base font-bold tracking-tight text-gray-800 hover:text-emerald-600 transition-colors"
          >
            {settings.siteName}
          </a>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            🎮 H5 Arcade
          </span>
        </div>
      </header>

      {/* Main 3-Column Arbitrage Layout */}
      <div className="max-w-[1320px] mx-auto px-2 sm:px-4 py-4 flex justify-center items-stretch gap-4">
        {/* Left Sticky Sidebar */}
        {ads.sidebarLeft.enabled && (
          <aside className="hidden lg:block w-[300px] flex-shrink-0 self-stretch">
            <div className="sticky top-14 z-10">
              <AdUnit config={ads.sidebarLeft} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}

        {/* Center Game Column */}
        <div className="w-full max-w-[660px] bg-white rounded-xl shadow-xs border border-gray-100 p-4 sm:p-6 space-y-6">
          {/* Top Ad Slot (With generous bottom margin before Game Box for AdX Accidental Click Safety) */}
          {ads.homeTop.enabled && (
            <div className="pb-3 border-b border-gray-100">
              <AdUnit config={ads.homeTop} isAdTraffic={isAdTraffic} />
            </div>
          )}

          {/* CLICK-TO-PLAY GAME STAGE */}
          <div
            ref={gameContainerRef}
            className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-xl aspect-[4/3] sm:aspect-video flex flex-col"
          >
            {!isGameStarted ? (
              /* Pre-Game Gate: Zero iframe overhead until user clicks Play! */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                {/* Blurred Background Poster */}
                <img
                  src={currentGame.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950/95" />

                {/* Foreground 1:1 Square Game Icon & Call to Action */}
                <div className="relative z-10 flex flex-col items-center max-w-sm space-y-4">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 aspect-square rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900">
                    <img
                      src={currentGame.image}
                      alt={currentGame.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      <span>{currentGame.category || 'Racing'} • HTML5 Instant Play</span>
                    </span>
                    <h1 className="text-lg sm:text-xl font-extrabold text-white">
                      {currentGame.title}
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGameStarted(true)}
                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>PLAY GAME NOW</span>
                  </button>

                  <p className="text-[11px] text-slate-400">
                    Works directly in your browser • No download required
                  </p>
                </div>
              </div>
            ) : (
              /* Active HTML5 Game Iframe Container */
              <div className="relative w-full h-full flex flex-col bg-black">
                <iframe
                  src={currentGame.embedUrl}
                  title={currentGame.title}
                  allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
                  allowFullScreen
                  className="w-full flex-1 border-0"
                />
              </div>
            )}
          </div>

          {/* Game Controls & Title Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                {currentGame.title}
              </h2>
              <p className="text-xs text-gray-500">
                {currentGame.category || 'Racing & Driving'} • {currentGame.plays || '58.4K plays'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLiked(!liked);
                  setLikeCount((c) => (liked ? c - 1 : c + 1));
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  liked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{likeCount.toLocaleString()}</span>
              </button>

              <button
                type="button"
                onClick={handleFullscreen}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Game Description & Instructions (100% Google AdX Content Policy Safe) */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 text-sm text-gray-700 leading-relaxed">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>About {currentGame.title} &amp; How to Play</span>
            </div>
            <p>
              {currentGame.description ||
                'Jump behind the wheel in this fast-paced racing and stunt adventure! Test your driving reflexes, dodge obstacles, and unlock cool new vehicles right in your browser.'}
            </p>
            {currentGame.instructions && (
              <div className="pt-2 border-t border-gray-200/70">
                <p className="text-xs font-bold text-gray-600 mb-1">Controls / Instructions:</p>
                <p className="text-xs text-gray-600">{currentGame.instructions}</p>
              </div>
            )}
          </div>

          {/* Mid-Page Ad Slot */}
          {ads.homeMore.enabled && (
            <div className="py-2">
              <AdUnit config={ads.homeMore} isAdTraffic={isAdTraffic} />
            </div>
          )}

          {/* SECTION 1: MORE GAMES TO PLAY (Square 1:1 Grid) */}
          {otherGames.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-emerald-600" />
                  <span>More Games You&apos;ll Love</span>
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold">Instant Play</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {otherGames.map((game, idx) => (
                  <a
                    key={game.id || idx}
                    href={`/play/${game.id || idx}${gclidSuffix}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-gray-200 shadow-xs hover:shadow-lg transition-all"
                  >
                    <img
                      src={game.image}
                      alt={game.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      🎮 Play
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                      <p className="text-white text-xs font-bold truncate">{game.title}</p>
                      <p className="text-emerald-300 text-[10px] font-medium truncate">
                        {game.category || 'Racing'} • {game.plays || '45K plays'}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: FEATURED VIDEOS (Rectangular 16:9 List) */}
          {featuredItems && featuredItems.length > 0 && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-red-600 fill-current" />
                  <span>Featured Toy Videos</span>
                </h3>
                <span className="text-xs text-gray-400">HD Clips</span>
              </div>

              <div className="space-y-3">
                {featuredItems.map((vid, idx) => (
                  <a
                    key={vid.id || idx}
                    href={`/watch/${vid.id || `feat_${idx + 1}`}${gclidSuffix}`}
                    className="group flex flex-col sm:flex-row gap-3 p-2.5 rounded-xl border border-gray-200 hover:border-red-300 transition-all"
                  >
                    <div className="relative w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                      <img
                        src={vid.image}
                        alt={vid.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-7 rounded-lg bg-red-600/90 flex items-center justify-center text-white shadow">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-semibold">
                        {vid.duration || '01:45'}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                        {vid.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {vid.description || 'Watch these awesome toy cars in high-speed action!'}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Bottom In-Article Ad */}
          {ads.inArticle.enabled && (
            <div className="pt-3 border-t border-gray-100">
              <AdUnit config={ads.inArticle} isAdTraffic={isAdTraffic} />
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar */}
        {ads.sidebarRight.enabled && (
          <aside className="hidden lg:block w-[300px] flex-shrink-0 self-stretch">
            <div className="sticky top-14 z-10">
              <AdUnit config={ads.sidebarRight} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
