'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteData } from '@/types';
import { AdUnit } from '@/components/AdUnit';
import { AdOverlay } from '@/components/AdOverlay';
import { Navbar } from '@/components/Navbar';
import { ChevronDown, Play } from 'lucide-react';

interface ArticlePageContentProps {
  initialData: SiteData;
  isAdTrafficInitial?: boolean;
}

export const ArticlePageContent: React.FC<ArticlePageContentProps> = ({
  initialData,
  isAdTrafficInitial = false,
}) => {
  const searchParams = useSearchParams();
  const gclid = searchParams.get('gclid');
  const isAdTraffic = Boolean(gclid) || isAdTrafficInitial;

  const [overlayActive, setOverlayActive] = useState<boolean>(false);
  const [isTruncated, setIsTruncated] = useState<boolean>(true); // Truncated by default

  const { settings, ads, articles } = initialData;
  const currentArticle = articles[0] || {
    title: 'Vroom Vroom! The Most Fun Car Toys Every Kid Will Love',
    category: 'Kids',
    readingTime: '4 min read',
    publishedDate: '31-05-2025',
    author: 'Admin',
    content: '<p>Loading...</p>',
  };

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

  // Thumbnails matching the source site
  const relatedThumbnails = [
    {
      title: 'Car Toys That Make Playtime Awesome',
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Zoom Into Adventure with These Cool Toy Cars',
      image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: "Why Kids Can't Get Enough of Toy Cars",
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-sans text-[#1a1a1a]">
      {/* Loading Overlay */}
      <AdOverlay show={overlayActive} />

      <div className="max-w-[1360px] mx-auto px-2 py-4 flex flex-col lg:flex-row gap-5 justify-center items-start">
        {/* Left Sticky Sidebar (AdX Left) */}
        {ads.sidebarLeft.enabled && (
          <aside className="hidden xl:block w-[300px] flex-shrink-0">
            <div className="sticky top-4">
              <AdUnit config={ads.sidebarLeft} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}

        {/* Center Container matching .theme-container (max-width: 680px) */}
        <div className="w-full max-w-[680px] bg-white rounded-xl shadow-md p-4 sm:p-6">
          
          {/* Header with Site Name and Dashboard link */}
          <header className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <a href="/" className="font-extrabold text-xl tracking-tight text-neutral-900">
              {settings.siteName}
            </a>
            <Navbar settings={settings} isAdTraffic={isAdTraffic} />
          </header>

          {/* AdX Home Top */}
          <div id="adx-home-top-wrapper" className="mb-3">
            <AdUnit config={ads.homeTop} isAdTraffic={isAdTraffic} className="!my-0" />
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
                onClick={() => setIsTruncated(false)}
                className="w-full mt-2 py-2.5 text-center text-[#3b9cc1] hover:text-[#0096C7] font-semibold text-base transition-colors flex items-center justify-center gap-1.5 border border-dashed border-cyan-200 rounded-md hover:bg-cyan-50/50"
              >
                <span>Read more...</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {/* Mid Ad & Expanded Content */}
            {!isTruncated && (
              <div className="my-5">
                <AdUnit config={ads.homeMore} isAdTraffic={isAdTraffic} />
              </div>
            )}
          </div>

          {/* Video Cards / Play Thumbs Section (Matching original) */}
          <div className="mt-6 space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">
              Featured Videos & Games
            </h3>
            {relatedThumbnails.map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer aspect-video bg-neutral-900"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />
                {/* Play Button Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-10 rounded-xl bg-black/80 group-hover:bg-red-600 transition-colors flex items-center justify-center text-white shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
                {/* Title Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-white text-xs sm:text-sm font-semibold truncate">
                    {item.title}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom In-Article Ad */}
          {!isTruncated && ads.inArticle.enabled && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <AdUnit config={ads.inArticle} isAdTraffic={isAdTraffic} />
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar (AdX Right) */}
        {ads.sidebarRight.enabled && (
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-4">
              <AdUnit config={ads.sidebarRight} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}
      </div>

    </div>
  );
};
