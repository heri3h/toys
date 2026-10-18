'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteData } from '@/types';
import { AdUnit } from '@/components/AdUnit';
import { AdOverlay } from '@/components/AdOverlay';
import { Navbar } from '@/components/Navbar';
import { Clock, Calendar, User, ChevronDown } from 'lucide-react';

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
    // If ad traffic detected
    if (isAdTraffic && settings.enableAdTrafficOverlay) {
      setOverlayActive(true);
      const timer = setTimeout(() => {
        setOverlayActive(false);

        // Mobile smooth auto-scroll to top ad
        if (settings.mobileAutoScrollToTopAd && window.innerWidth < 768) {
          const topAd = document.getElementById('adx-home-top-wrapper');
          if (topAd) {
            topAd.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
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
    <div className="min-h-screen bg-neutral-100/60 font-sans text-neutral-800">
      {/* Loading Overlay for Ad Traffic */}
      <AdOverlay show={overlayActive} />

      {/* Header */}
      <Navbar settings={settings} isAdTraffic={isAdTraffic} />

      {/* Sub-header / Notice Banner */}
      {isAdTraffic && (
        <div className="bg-amber-500/10 border-b border-amber-200/80 px-4 py-2 text-center text-xs text-amber-800 font-medium">
          🎯 <strong>Targeted Landing:</strong> You arrived via paid campaign (<code className="bg-amber-100 px-1 py-0.5 rounded">gclid={gclid}</code>). Dynamic ad layout active.
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="max-w-[1400px] mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 justify-center">
        
        {/* Left Sticky Sidebar (AdX Left) */}
        {ads.sidebarLeft.enabled && (
          <aside className="hidden xl:block w-[300px] flex-shrink-0">
            <div className="sticky top-20">
              <AdUnit config={ads.sidebarLeft} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}

        {/* Center Content Column */}
        <main className="w-full max-w-[800px] bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-8">
          
          {/* Category Badge & Meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mb-3">
            <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded">
              {currentArticle.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {currentArticle.publishedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {currentArticle.readingTime}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> {currentArticle.author}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
            {currentArticle.title}
          </h1>

          {/* Subtitle */}
          {currentArticle.subtitle && (
            <p className="text-base sm:text-lg text-neutral-600 mb-6">
              {currentArticle.subtitle}
            </p>
          )}

          {/* Top Home Ad (Key Monetization Slot) */}
          <div id="adx-home-top-wrapper" className="my-4">
            <AdUnit config={ads.homeTop} isAdTraffic={isAdTraffic} />
          </div>

          {/* Featured Image */}
          {currentArticle.ogImage && (
            <div className="my-6 rounded-lg overflow-hidden border border-neutral-200">
              <img
                src={currentArticle.ogImage}
                alt={currentArticle.title}
                className="w-full h-auto object-cover max-h-[420px]"
              />
            </div>
          )}

          {/* Article Body Content */}
          <div className="relative">
            <div
              className={`prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-p:leading-relaxed transition-all duration-500 ${
                isTruncated ? 'max-h-[360px] overflow-hidden' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: currentArticle.content }}
            />

            {/* In-Article / Mid Content Ad (Always present or shown after first paras) */}
            <div className="my-6">
              <AdUnit config={ads.homeMore} isAdTraffic={isAdTraffic} />
            </div>

            {/* Read More Trigger & Gradient Mask */}
            {isTruncated && (
              <div className="absolute inset-x-0 bottom-0 pt-32 pb-4 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end z-10">
                <button
                  onClick={() => setIsTruncated(false)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-full shadow-lg shadow-blue-500/20 flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Read full story...</span>
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom In-Article Ad */}
          {!isTruncated && ads.inArticle.enabled && (
            <div className="mt-8 border-t border-neutral-100 pt-6">
              <AdUnit config={ads.inArticle} isAdTraffic={isAdTraffic} />
            </div>
          )}
        </main>

        {/* Right Sticky Sidebar (AdX Right) */}
        {ads.sidebarRight.enabled && (
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-20">
              <AdUnit config={ads.sidebarRight} isAdTraffic={isAdTraffic} />
            </div>
          </aside>
        )}
      </div>

      {/* Sticky Bottom Anchor Ad */}
      {ads.anchorBottom.enabled && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-neutral-300 z-40 py-2 shadow-2xl flex justify-center">
          <div className="w-full max-w-2xl px-2">
            <AdUnit config={ads.anchorBottom} isAdTraffic={isAdTraffic} className="!my-0" />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pb-24 border-t border-neutral-200 bg-white py-8 text-center text-xs text-neutral-500">
        <p>© 2026 {settings.siteName}. All rights reserved.</p>
        <p className="mt-1 text-neutral-400">
          International Content Publishing Network • High Yield Monitized Portal
        </p>
      </footer>
    </div>
  );
};
