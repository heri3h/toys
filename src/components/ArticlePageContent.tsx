'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteData } from '@/types';
import { AdUnit, MobileBottomAnchorAd, InterstitialAdUnit } from '@/components/AdUnit';
import { AdOverlay } from '@/components/AdOverlay';
import { Navbar } from '@/components/Navbar';
import { ChevronDown, Play, Gamepad2 } from 'lucide-react';

interface ArticlePageContentProps {
  initialData: SiteData;
  isAdTrafficInitial?: boolean;
  activeSlug?: string;
}

export const ArticlePageContent: React.FC<ArticlePageContentProps> = ({
  initialData,
  isAdTrafficInitial = false,
  activeSlug,
}) => {
  const searchParams = useSearchParams();
  const gclid = searchParams.get('gclid');
  const articleParam = searchParams.get('article');
  const isAdTraffic = Boolean(gclid) || isAdTrafficInitial;

  const [overlayActive, setOverlayActive] = useState<boolean>(false);
  const [isTruncated, setIsTruncated] = useState<boolean>(true); // Truncated by default
  const [hasScrolled, setHasScrolled] = useState<boolean>(false); // Bottom section loads only when scrolled

  const { settings, ads, articles, featuredItems, games } = initialData;
  const targetSlug = activeSlug || articleParam;
  const currentArticle =
    (targetSlug ? articles.find((a) => a.slug === targetSlug) : articles[0]) ||
    articles[0] || {
      title: 'Vroom Vroom! The Most Fun Car Toys Every Kid Will Love',
      category: 'Kids',
      readingTime: '4 min read',
      publishedDate: '31-05-2025',
      author: 'Admin',
      content: '<p>Loading...</p>',
    };

  useEffect(() => {
    if (hasScrolled) return;

    const onScroll = () => {
      if (window.scrollY > 10) {
        setHasScrolled(true);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        setHasScrolled(true);
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      if (touchStartY - currentY > 10) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    if (window.scrollY > 10) {
      setHasScrolled(true);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [hasScrolled]);

  useEffect(() => {
    // Show spinner overlay when paid traffic is detected
    if (isAdTraffic && settings.enableAdTrafficOverlay) {
      setOverlayActive(true);
      const timer = setTimeout(() => {
        setOverlayActive(false);
      }, settings.overlayTimeoutSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [isAdTraffic, settings]);

  useEffect(() => {
    if (settings.truncateOnAdTrafficOnly) {
      setIsTruncated(isAdTraffic);
    } else {
      setIsTruncated(true);
    }
  }, [isAdTraffic, settings.truncateOnAdTrafficOnly]);

  // Thumbnails from dashboard config or defaults (randomly shuffled, max 4 items in 2x2 grid)
  const baseThumbnails =
    featuredItems && featuredItems.length > 0
      ? featuredItems
      : [
          {
            id: 'feat_1',
            title: 'Car Toys That Make Playtime Awesome',
            image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
            targetUrl: '/watch/feat_1',
          },
          {
            id: 'feat_2',
            title: 'Zoom Into Adventure with These Cool Toy Cars',
            image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80',
            targetUrl: '/watch/feat_2',
          },
          {
            id: 'feat_3',
            title: "Why Kids Can't Get Enough of Toy Cars",
            image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
            targetUrl: '/watch/feat_3',
          },
          {
            id: 'feat_4',
            title: 'High-Speed RC Monster Truck Stunts',
            image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=600&q=80',
            targetUrl: '/watch/feat_4',
          },
        ];

  const [relatedThumbnails, setRelatedThumbnails] = useState(() =>
    baseThumbnails.slice(0, 4)
  );

  useEffect(() => {
    const shuffled = [...baseThumbnails]
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    setRelatedThumbnails(shuffled);
  }, [featuredItems]);

  return (
    <div className="min-h-[102vh] bg-[#f0f0f0] font-sans text-[#1a1a1a]">
      {/* Loading Overlay */}
      <AdOverlay show={overlayActive} />

      <div className="max-w-[1360px] mx-auto px-2 py-4 flex flex-col lg:flex-row gap-5 justify-center items-stretch">
        {/* Left Sticky Sidebar (slot: side) */}
        <aside className="hidden lg:block w-[300px] flex-shrink-0 self-stretch">
          <div className="sticky top-4 z-10">
            <AdUnit slotKey="side" placement="desktop-only" isAdTraffic={isAdTraffic} />
          </div>
        </aside>

        {/* Center Container matching .theme-container (max-width: 680px) */}
        <div className="w-full max-w-[680px] bg-white rounded-xl shadow-md p-4 sm:p-6">
          
          {/* Header with Site Name and Dashboard link */}
          <header className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <a href="/" className="font-extrabold text-xl tracking-tight text-neutral-900">
              {settings.siteName}
            </a>
            <Navbar settings={settings} isAdTraffic={isAdTraffic} />
          </header>

          {/* AdX Header Top (slot: header) */}
          <div id="adx-home-top-wrapper" className="mb-3">
            <AdUnit slotKey="header" isAdTraffic={isAdTraffic} className="!my-0" />
          </div>

          {/* Article Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] leading-tight mb-2">
            {currentArticle.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
            <span className="bg-cyan-50 text-cyan-800 font-semibold px-2 py-0.5 rounded text-[11px]">
              {currentArticle.category}
            </span>
            <span>•</span>
            <span>{currentArticle.publishedDate}</span>
          </div>

          {/* Description Container with Read More Button */}
          <div className="theme-description-wrapper relative">
            <div
              className={`prose prose-neutral max-w-none text-sm text-[#4a4a4a] leading-relaxed transition-all duration-300 relative ${
                isTruncated ? 'max-h-[110px] overflow-hidden' : ''
              }`}
            >
              <div dangerouslySetInnerHTML={{ __html: currentArticle.content }} />

              {/* Gradient Mask when truncated */}
              {isTruncated && (
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              )}
            </div>

            {/* The "Read more..." Button - Visible immediately above the fold */}
            {isTruncated && (
              <button
                onClick={() => {
                  setIsTruncated(false);
                  setHasScrolled(true);
                }}
                className="w-full mt-2 py-2.5 text-center text-[#3b9cc1] hover:text-[#0096C7] font-semibold text-base transition-colors flex items-center justify-center gap-1.5 border border-dashed border-cyan-200 rounded-md hover:bg-cyan-50/50"
              >
                <span>Read more...</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {/* Mid Ad (slot: feed) when Read More is clicked */}
            {!isTruncated && (
              <div className="my-5">
                <AdUnit slotKey="feed" isAdTraffic={isAdTraffic} />
              </div>
            )}
          </div>

          {/* Bottom Section (Featured Videos & Featured Games) - Only loaded after user scrolls */}
          {hasScrolled && (
            <div className="transition-opacity duration-500 ease-in opacity-100 space-y-6">
              {/* SECTION 1: FEATURED VIDEOS (2x2 Grid = 2 Rows, 4 Random Videos) */}
              <div className="mt-6 space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-red-600 fill-current" />
                    <span>Featured Videos</span>
                  </h3>
                  <span className="text-[11px] text-gray-400 font-medium">HD Clips</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                  {relatedThumbnails.map((item, idx) => {
                    const defaultWatchPath = `/watch/${item.id || `feat_${idx + 1}`}`;
                    const cleanedTarget = item.targetUrl ? item.targetUrl.split('?')[0] : '';
                    const href =
                      !cleanedTarget || cleanedTarget === '/' ? defaultWatchPath : cleanedTarget;

                    return (
                      <a
                        key={item.id || idx}
                        href={href}
                        className="block group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer aspect-video bg-neutral-900"
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                          loading="lazy"
                          decoding="async"
                        />
                        {/* Top-left "WATCH" Badge */}
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-red-600/90 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow">
                          ▶ Video
                        </div>
                        {/* Play Button Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-8 sm:w-12 sm:h-9 rounded-xl bg-red-600/95 group-hover:bg-red-600 group-hover:scale-110 transition-all flex items-center justify-center text-white shadow-xl">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                        {/* Title + Duration Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-end justify-between gap-1.5">
                          <div className="min-w-0">
                            <p className="text-white text-[11px] sm:text-xs font-semibold truncate">
                              {item.title}
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-semibold shrink-0">
                            {item.duration || '01:45'}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Mid Ad (slot: feed) automatically appears between Featured Videos & Featured Games when user scrolls without clicking Read More */}
              {isTruncated && (
                <div className="pt-2 border-t border-gray-100">
                  <AdUnit slotKey="feed" isAdTraffic={isAdTraffic} />
                </div>
              )}

              {/* SECTION 2: FEATURED GAMES (Square 1:1 Grid from GameMonetize Database) */}
              {games && games.length > 0 && (
                <div className="pt-5 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-emerald-600" />
                      <span>Featured Games (Instant Play)</span>
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                      No Download
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    {games.map((game, idx) => {
                      const gameHref = `/play/${game.id || idx}`;
                      return (
                        <a
                          key={game.id || idx}
                          href={gameHref}
                          className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-gray-200 shadow-xs hover:shadow-lg transition-all cursor-pointer"
                        >
                          <img
                            src={game.image}
                            alt={game.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                          />
                          {/* Top Badge */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                            🎮 Play
                          </div>

                          {/* Center Hover Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>

                          {/* Bottom Title Overlay */}
                          <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                            <p className="text-white text-xs font-bold truncate">{game.title}</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Content Ad (slot: side on mobile/tablet where left sidebar is hidden) */}
              <div className="lg:hidden mt-6 pt-4 border-t border-gray-100">
                <AdUnit slotKey="side" placement="mobile-only" isAdTraffic={isAdTraffic} />
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar (slot: side2) */}
        <aside className="hidden lg:block w-[300px] flex-shrink-0 self-stretch">
          <div className="sticky top-4 z-10">
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
