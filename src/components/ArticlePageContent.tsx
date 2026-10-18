'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteData } from '@/types';
import { AdUnit } from '@/components/AdUnit';
import { AdOverlay } from '@/components/AdOverlay';
import { Navbar } from '@/components/Navbar';
import { ChevronDown } from 'lucide-react';

interface ArticlePageContentProps {
  initialData: SiteData;
}

export const ArticlePageContent: React.FC<ArticlePageContentProps> = ({ initialData }) => {
  const searchParams = useSearchParams();
  const gclid = searchParams.get('gclid');
  const isAdTraffic = Boolean(gclid);

  const [overlayActive, setOverlayActive] = useState<boolean>(false);
  const [isTruncated, setIsTruncated] = useState<boolean>(false);

  const { settings, ads, articles } = initialData;
  const currentArticle = articles[0] || {
    title: 'Featured Article',
    category: 'General',
    readingTime: '3 min read',
    publishedDate: 'Today',
    author: 'Staff Writer',
    content: '<p>No content available.</p>',
  };

  useEffect(() => {
    // If ad traffic detected, show short overlay
    if (isAdTraffic && settings.enableAdTrafficOverlay) {
      setOverlayActive(true);
      const timer = setTimeout(() => {
        setOverlayActive(false);
      }, settings.overlayTimeoutSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [isAdTraffic, settings]);

  useEffect(() => {
    // Determine truncate status
    if (settings.truncateOnAdTrafficOnly) {
      setIsTruncated(isAdTraffic);
    } else {
      setIsTruncated(true);
    }
  }, [isAdTraffic, settings.truncateOnAdTrafficOnly]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-neutral-800">
      {/* Loading Overlay for Ad Traffic */}
      <AdOverlay show={overlayActive} />

      {/* Ultra Compact Header */}
      <Navbar settings={settings} isAdTraffic={isAdTraffic} />

      {/* Main 3-Column Container */}
      <div className="max-w-[1360px] mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col lg:flex-row gap-4 justify-center items-start">
        
        {/* Left Sticky Sidebar (AdX Left) */}
        {ads.sidebarLeft.enabled && (
          <aside className="hidden xl:block w-[300px] flex-shrink-0">
            <div className="sticky top-4">
              <AdUnit config={ads.sidebarLeft} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}

        {/* Center Content Card */}
        <main className="w-full max-w-[740px] bg-white rounded-lg shadow-xs border border-gray-200/80 p-3 sm:p-5">
          
          {/* Top Home Ad (Immediate viewable ad above title) */}
          <div id="adx-home-top-wrapper" className="mb-2">
            <AdUnit config={ads.homeTop} isAdTraffic={isAdTraffic} className="!my-0 !mb-2" />
          </div>

          {/* Article Title */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-neutral-900 leading-snug mb-1">
            {currentArticle.title}
          </h1>

          {/* Meta Bar */}
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-2">
            <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {currentArticle.category}
            </span>
            <span>•</span>
            <span>{currentArticle.publishedDate}</span>
          </div>

          {/* Description Snippet & Above-The-Fold Read More */}
          <div className="relative">
            {/* Kept ultra compact when truncated (~75px) so the button is guaranteed above the fold */}
            <div
              className={`prose prose-neutral max-w-none text-xs sm:text-sm text-neutral-700 leading-relaxed relative ${
                isTruncated ? 'max-h-[75px] overflow-hidden' : ''
              }`}
            >
              <div dangerouslySetInnerHTML={{ __html: currentArticle.content }} />
              
              {/* Fade out mask */}
              {isTruncated && (
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
              )}
            </div>

            {/* Read More Button - 100% visible on screen without scrolling */}
            {isTruncated && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => setIsTruncated(false)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Read more...</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cover Image & Full Content (Displayed upon clicking Read More) */}
            {!isTruncated && (
              <>
                {currentArticle.ogImage && (
                  <div className="my-4 rounded overflow-hidden border border-neutral-200">
                    <img
                      src={currentArticle.ogImage}
                      alt={currentArticle.title}
                      className="w-full h-auto object-cover max-h-[380px]"
                    />
                  </div>
                )}

                <div className="my-4">
                  <AdUnit config={ads.homeMore} isAdTraffic={isAdTraffic} />
                </div>
              </>
            )}
          </div>

          {/* Bottom In-Article Ad */}
          {!isTruncated && ads.inArticle.enabled && (
            <div className="mt-6 border-t border-neutral-100 pt-4">
              <AdUnit config={ads.inArticle} isAdTraffic={isAdTraffic} />
            </div>
          )}
        </main>

        {/* Right Sticky Sidebar (AdX Right) */}
        {ads.sidebarRight.enabled && (
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-4">
              <AdUnit config={ads.sidebarRight} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}
      </div>

      {/* Sticky Bottom Anchor Ad */}
      {ads.anchorBottom.enabled && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-neutral-300 z-40 py-1 shadow-2xl flex justify-center">
          <div className="w-full max-w-2xl px-2">
            <AdUnit config={ads.anchorBottom} isAdTraffic={isAdTraffic} className="!my-0" />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 pb-20 border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-400">
        <p>© 2026 {settings.siteName}. All rights reserved.</p>
      </footer>
    </div>
  );
};
