'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteData, FeaturedItem } from '@/types';
import { AdUnit, MobileBottomAnchorAd, InterstitialAdUnit } from './AdUnit';
import { FeaturedGamesGrid } from './FeaturedGamesGrid';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  ThumbsUp,
  ArrowLeft,
  Eye,
  Clock,
} from 'lucide-react';

interface VideoWatchContentProps {
  siteData: SiteData;
  currentVideo: FeaturedItem;
  nextVideo: FeaturedItem;
  otherVideos: FeaturedItem[];
}

function extractYouTubeId(input?: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match standard YouTube URLs
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // If user pasted an 11-character YouTube ID directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export const VideoWatchContent: React.FC<VideoWatchContentProps> = ({
  siteData,
  currentVideo,
  nextVideo,
  otherVideos,
}) => {
  const searchParams = useSearchParams();
  const { settings, ads, articles, games } = siteData;
  const primaryArticle = articles[0];

  const gclid = searchParams.get('gclid');
  const isAdTraffic = Boolean(gclid);

  const youtubeId = extractYouTubeId(currentVideo.videoUrl);
  const isMp4Video = Boolean(
    !youtubeId && currentVideo.videoUrl && currentVideo.videoUrl.trim()
  );

  // Player states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ytFacadeClicked, setYtFacadeClicked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1420);
  const [showUpNextOverlay, setShowUpNextOverlay] = useState(false);
  const [randomVideos, setRandomVideos] = useState(() => otherVideos.slice(0, 4));

  // Reset state when switching videos & shuffle Up Next 4 videos
  useEffect(() => {
    setYtFacadeClicked(false);
    setProgress(0);
    setShowUpNextOverlay(false);
    setIsPlaying(true);
    setRandomVideos([...otherVideos].sort(() => Math.random() - 0.5).slice(0, 4));
  }, [currentVideo.id, otherVideos]);

  // Simulated 20-second progress bar when no .mp4 or YouTube URL is set yet
  useEffect(() => {
    if (youtubeId || isMp4Video) return;
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setShowUpNextOverlay(true);
          setIsPlaying(false);
          return 100;
        }
        return prev + 1; // 100 steps * 200ms = 20 seconds of high AdX viewability
      });
    }, 200);

    return () => clearInterval(interval);
  }, [youtubeId, isMp4Video, isPlaying]);

  const togglePlay = () => {
    if (isMp4Video && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        setShowUpNextOverlay(false);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else if (!youtubeId) {
      if (progress >= 100) {
        setProgress(0);
        setShowUpNextOverlay(false);
        setIsPlaying(true);
      } else {
        setIsPlaying(!isPlaying);
      }
    }
  };

  const toggleMute = () => {
    if (isMp4Video && videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const formatTimeFromProgress = (pct: number) => {
    const totalSec = 20;
    const cur = Math.round((pct / 100) * totalSec);
    return `00:${cur < 10 ? `0${cur}` : cur}`;
  };

  const nextVideoHref = `/watch/${nextVideo.id}`;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] font-sans">
      {/* Top Sticky Brand Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Story</span>
          </a>
          <a
            href="/"
            className="text-base font-bold tracking-tight text-gray-800 hover:text-blue-600 transition-colors"
          >
            {settings.siteName}
          </a>
          <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            ▶ Toy TV
          </span>
        </div>
      </header>

      {/* Main 3-Column Arbitrage Layout */}
      <div className="max-w-[1320px] mx-auto px-2 sm:px-4 py-4 flex justify-center items-stretch gap-4">
        {/* Left Sticky Sidebar (slot: side) */}
        <aside className="hidden lg:block w-[300px] flex-shrink-0 self-stretch">
          <div className="sticky top-14 z-10">
            <AdUnit slotKey="side" placement="desktop-only" isAdTraffic={isAdTraffic} />
          </div>
        </aside>

        {/* Center Video Watch Column */}
        <div className="w-full max-w-[660px] bg-white rounded-xl shadow-xs border border-gray-100 p-4 sm:p-6 space-y-5">
          {/* Top Ad Slot right above Video Player (slot: header) */}
          <div className="pb-1">
            <AdUnit slotKey="header" isAdTraffic={isAdTraffic} />
          </div>

          {/* VIDEO PLAYER BOX (Option B: YouTube Anti-Leak Iframe OR MP4 OR Smart Motion Player) */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-gray-900 select-none">
            {youtubeId ? (
              !ytFacadeClicked ? (
                /* Click-to-Play Facade so AdX ads render 100% first without YouTube JS contention */
                <div
                  onClick={() => setYtFacadeClicked(true)}
                  className="group relative w-full h-full cursor-pointer overflow-hidden"
                >
                  <img
                    src={currentVideo.image}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider shadow">
                      ▶ Tap to Start Video
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-18 h-13 rounded-2xl bg-red-600 group-hover:bg-red-500 flex items-center justify-center text-white shadow-2xl transform group-hover:scale-110 transition-all">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono">
                    {currentVideo.duration || '01:48'}
                  </div>
                </div>
              ) : (
                /* YouTube Iframe with Anti-Leak Invisible Shields */
                <div className="relative w-full h-full">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title={currentVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                  {/* Anti-Leak Shield #1: Blocks top title link that would exit user to YouTube app */}
                  <div
                    className="absolute top-0 inset-x-0 h-14 z-10 bg-transparent"
                    title={currentVideo.title}
                  />
                  {/* Anti-Leak Shield #2: Blocks bottom-right YouTube logo link */}
                  <div
                    className="absolute bottom-0 right-10 w-28 h-12 z-10 bg-transparent"
                    title="Playing on Toy TV"
                  />
                </div>
              )
            ) : isMp4Video ? (
              <video
                ref={videoRef}
                src={currentVideo.videoUrl}
                poster={currentVideo.image}
                autoPlay
                muted={isMuted}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                  if (videoRef.current && videoRef.current.duration) {
                    setProgress(
                      (videoRef.current.currentTime / videoRef.current.duration) * 100
                    );
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setShowUpNextOverlay(true);
                }}
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              /* Smart Animated Motion Preview when no .mp4 or YouTube URL is set yet */
              <div
                onClick={togglePlay}
                className="relative w-full h-full cursor-pointer overflow-hidden"
              >
                <img
                  src={currentVideo.image}
                  alt={currentVideo.title}
                  className={`w-full h-full object-cover transition-transform duration-1000 ease-linear ${
                    isPlaying ? 'scale-110' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30" />

                {/* Top LIVE / HD Indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider shadow">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Playing Clip</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    HD 1080p
                  </span>
                </div>

                {/* Center Play/Pause Overlay when paused */}
                {!isPlaying && !showUpNextOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                  </div>
                )}

                {/* Bottom Player Controls Bar */}
                <div
                  className="absolute inset-x-0 bottom-0 p-3 space-y-2 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Progress Bar */}
                  <div
                    className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickPct = Math.max(
                        0,
                        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
                      );
                      setProgress(clickPct);
                      setShowUpNextOverlay(false);
                    }}
                  >
                    <div
                      className="h-full bg-red-600 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="hover:text-red-400 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      <a
                        href={nextVideoHref}
                        title="Next Video"
                        className="hover:text-red-400 transition-colors"
                      >
                        <SkipForward className="w-4 h-4" />
                      </a>

                      <span className="font-mono text-[11px] text-gray-200">
                        {formatTimeFromProgress(progress)} / {currentVideo.duration || '01:45'}
                      </span>
                    </div>

                    <a
                      href={nextVideoHref}
                      className="text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded transition-colors"
                    >
                      Next Clip &rarr;
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Unmute Button for MP4 Video */}
            {isMp4Video && isMuted && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-red-600 text-white text-xs font-semibold shadow-lg transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                <span>Tap for Sound</span>
              </button>
            )}
            {isMp4Video && !isMuted && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}

            {/* "UP NEXT" END SCREEN OVERLAY */}
            {showUpNextOverlay && (
              <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center p-5 text-center space-y-3 animate-fadeIn">
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">
                  Up Next in Toy Cars
                </span>
                <p className="text-white font-bold text-sm sm:text-base max-w-md line-clamp-2">
                  {nextVideo.title}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={nextVideoHref}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-xl transition-transform hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Next Video</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setProgress(0);
                      setShowUpNextOverlay(false);
                      setIsPlaying(true);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play();
                      }
                    }}
                    className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
                  >
                    Replay
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Title, Views & Interactive Engagement Bar */}
          <div className="border-b border-gray-100 pb-4 space-y-3">
            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">
              {currentVideo.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                  <Eye className="w-3.5 h-3.5 text-red-500" />
                  <span>{currentVideo.views || '42.8K views'}</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentVideo.duration || '01:45'}</span>
                </span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">Kids &amp; Family Safe</span>
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{likeCount.toLocaleString()}</span>
                </button>

                <a
                  href={nextVideoHref}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Next Video</span>
                  <SkipForward className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Mid-Page Ad Slot (slot: feed) directly above Up Next Videos */}
          <div className="py-1">
            <AdUnit slotKey="feed" isAdTraffic={isAdTraffic} />
          </div>

          {/* SECTION 1: UP NEXT / MORE VIDEOS LIST (2x2 Grid = 2 Rows, 4 Random Videos) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-4 h-4 text-red-600 fill-current" />
                <span>Up Next: More Toy Videos</span>
              </h3>
              <span className="text-xs text-gray-400">HD Clips</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              {randomVideos.map((vid, idx) => {
                const vidHref = `/watch/${vid.id || `feat_${idx + 1}`}`;
                return (
                  <a
                    key={vid.id || idx}
                    href={vidHref}
                    className="block group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer aspect-video bg-neutral-900"
                  >
                    <img
                      src={vid.image}
                      alt={vid.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-600/90 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow">
                      ▶ Video
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-8 sm:w-12 sm:h-9 rounded-xl bg-red-600/95 group-hover:bg-red-600 group-hover:scale-110 transition-all flex items-center justify-center text-white shadow-xl">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-end justify-between gap-1.5">
                      <div className="min-w-0">
                        <p className="text-white text-[11px] sm:text-xs font-semibold truncate">
                          {vid.title}
                        </p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-semibold shrink-0">
                        {vid.duration || '02:05'}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Companion Editorial Description (Ensures 100% Google AdX Content Policy Compliance) */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2.5 text-sm text-gray-700 leading-relaxed">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              About This Toy Car Feature
            </h2>
            <p>
              {currentVideo.description ||
                'Watch how high-torque pullback racing cars, remote-controlled drift vehicles, and sturdy monster trucks bring hours of creative action to kids of all ages. Built with durable materials and responsive suspension, these toy vehicles turn any living room or backyard into an exciting race track.'}
            </p>
            <p className="text-xs text-gray-500">
              Want to read the full buying guide and safety tips for every age group?{' '}
              <a
                href={`/${primaryArticle?.slug || ''}`}
                className="text-blue-600 font-semibold hover:underline"
              >
                Read the complete article here &rarr;
              </a>
            </p>
          </div>

          {/* SECTION 2: FEATURED GAMES (4-Column Square 1:1 Grid, 8 Initial Items + Infinite Scroll) */}
          <div className="pt-4 border-t border-gray-100">
            <FeaturedGamesGrid games={games || []} />
          </div>

          {/* Bottom Content Ad on Mobile/Tablet (slot: side) */}
          <div className="lg:hidden pt-3 border-t border-gray-100">
            <AdUnit slotKey="side" placement="mobile-only" isAdTraffic={isAdTraffic} />
          </div>
        </div>

        {/* Right Sticky Sidebar (slot: side2) */}
        <aside className="hidden lg:block w-[300px] flex-shrink-0 self-stretch">
          <div className="sticky top-14 z-10">
            <AdUnit slotKey="side2" placement="desktop-only" isAdTraffic={isAdTraffic} />
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Anchor Ad (slot: anchor from pricing_config.json) */}
      <MobileBottomAnchorAd isAdTraffic={isAdTraffic} />

      {/* Full-Page Interstitial / Vignette Ad (slot: interstitial from pricing_config.json) */}
      <InterstitialAdUnit />
    </div>
  );
};
