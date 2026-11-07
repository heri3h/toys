'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export type MbelikSlotKey = 'header' | 'feed' | 'side' | 'side2';

declare global {
  interface Window {
    MBELIK_AD_UNITS?: {
      header: string;
      feed: string;
      side: string;
      side2: string;
      interstitial: string;
      anchor: string;
    };
    mbelikKeys?: {
      keyBnr: string;
      keyInt: string;
      keyAnc: string;
    };
    mbelikResolveSlotKey?: (slotPath: string, fmtName: 'bnr' | 'int' | 'anc') => string;
    mbelikPricingVal?: string;
    mbelikSlotInt?: any;
    googletag: {
      cmd: Array<() => void>;
      defineSlot: (path: string, size: number[][] | string, id: string) => any;
      defineOutOfPageSlot: (path: string, format?: any) => any;
      enums?: {
        OutOfPageFormat?: {
          INTERSTITIAL?: any;
          BOTTOM_ANCHOR?: any;
          TOP_ANCHOR?: any;
        };
      };
      pubads: () => any;
      enableServices: () => void;
      display: (id: string | any) => void;
    };
  }
}

const DEFAULT_AD_UNITS: Record<MbelikSlotKey | 'interstitial' | 'anchor', string> = {
  header: '/22806125615/play-1',
  feed: '/22806125615/play-2',
  side: '/22806125615/play-3',
  side2: '/22806125615/play-4',
  interstitial: '/22806125615/play-5',
  anchor: '/22806125615/play-6',
};

const SLOT_DEFAULT_SIZES: Record<MbelikSlotKey, number[][]> = {
  header: [
    [970, 250],
    [728, 90],
    [336, 280],
    [300, 250],
    [320, 100],
    [320, 50],
    [250, 50],
  ],
  feed: [
    [336, 280],
    [300, 250],
    [320, 100],
    [320, 50],
  ],
  side: [
    [300, 600],
    [336, 280],
    [300, 250],
  ],
  side2: [
    [300, 600],
    [300, 250],
    [160, 600],
  ],
};

function ensureGptLoaded() {
  if (typeof window !== 'undefined' && !window.googletag) {
    window.googletag = { cmd: [] } as any;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    document.head.appendChild(script);
  }
}

function getResponsiveSizes(
  configuredSizes: number[][],
  maxWidth: number,
  isMobileViewport: boolean,
  slotKey: MbelikSlotKey
): number[][] {
  let pool = configuredSizes;
  // On mobile in-page bottom slot ('side'), prefer medium rectangles over 300x600 skyscraper
  if (isMobileViewport && slotKey === 'side') {
    pool = [
      [336, 280],
      [300, 250],
      [320, 100],
      [320, 50],
    ];
  }
  const fitting = pool.filter(([w]) => w <= maxWidth);
  if (fitting.length > 0) return fitting;
  const sorted = [...pool].sort((a, b) => a[0] - b[0]);
  return [sorted[0]];
}

interface AdUnitProps {
  slotKey: MbelikSlotKey;
  className?: string;
  isAdTraffic?: boolean;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotKey, className = '' }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [slotDivId] = useState(
    () => `div-gpt-ad-${slotKey}-${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          const slotPath =
            window.MBELIK_AD_UNITS?.[slotKey] || DEFAULT_AD_UNITS[slotKey];
          const viewportW = typeof window !== 'undefined' ? window.innerWidth : 360;
          const isMobileViewport = viewportW < 1024;
          const containerWidth =
            adRef.current?.clientWidth || Math.max(viewportW - 24, 300);

          const responsiveSizes = getResponsiveSizes(
            SLOT_DEFAULT_SIZES[slotKey],
            containerWidth,
            isMobileViewport,
            slotKey
          );

          const slot = window.googletag
            .defineSlot(slotPath, responsiveSizes, slotDivId)
            ?.addService(window.googletag.pubads());

          const keyBnr =
            window.mbelikResolveSlotKey?.(slotPath, 'bnr') ||
            window.mbelikKeys?.keyBnr ||
            window.mbelikPricingVal ||
            'f10000';

          if (slot) {
            slot.setTargeting('mbelik_pricing', keyBnr);
            console.log(
              `💰 [AutoPricing SetTargeting Sync] Slot: ${slotKey} (${slotPath}) | Key:`,
              keyBnr
            );
          }
          window.googletag.enableServices();
          window.googletag.display(slotDivId);
        } catch (e) {
          console.warn('Ad slot initialization failed:', e);
        }
      });
    }
  }, [slotKey, slotDivId]);

  return (
    <div
      ref={adRef}
      className={`ad-container my-4 text-center overflow-hidden transition-all duration-300 ${className}`}
    >
      <div className="text-[10px] tracking-wider uppercase text-gray-400 mb-1 font-mono">
        ADVERTISEMENT
      </div>
      <div
        id={slotDivId}
        className="mx-auto flex items-center justify-center min-h-[90px] max-w-full"
      />
    </div>
  );
};

/**
 * Sticky Bottom Anchor Ad (Ala AdSense - Mobile & Desktop)
 * Reads `anchor` slot path automatically from `pricing_config.json` (`window.MBELIK_AD_UNITS.anchor`).
 */
export const MobileBottomAnchorAd: React.FC<{
  isAdTraffic?: boolean;
}> = () => {
  const [closed, setClosed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [slotDivId] = useState(
    () => `div-gpt-ad-anchor-${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    if (closed) return;

    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          const slotPath =
            window.MBELIK_AD_UNITS?.anchor || DEFAULT_AD_UNITS.anchor;
          const viewportW = typeof window !== 'undefined' ? window.innerWidth - 16 : 360;
          const baseSizes: number[][] =
            viewportW >= 740
              ? [
                  [728, 90],
                  [320, 100],
                  [320, 50],
                ]
              : [
                  [320, 100],
                  [320, 50],
                  [300, 50],
                  [250, 50],
                ];

          const slot = window.googletag
            .defineSlot(slotPath, baseSizes, slotDivId)
            ?.addService(window.googletag.pubads());

          const keyAnc =
            window.mbelikResolveSlotKey?.(slotPath, 'anc') ||
            window.mbelikKeys?.keyAnc ||
            'f15000';

          if (slot) {
            slot.setTargeting('mbelik_pricing', keyAnc);
            console.log(
              `💰 [AutoPricing SetTargeting Sync] Slot: anchor (${slotPath}) | Key:`,
              keyAnc
            );
          }
          window.googletag.enableServices();
          window.googletag.display(slotDivId);
        } catch (e) {
          console.warn('Bottom anchor ad initialization failed:', e);
        }
      });
    }
  }, [slotDivId, closed]);

  if (closed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="max-w-[760px] mx-auto flex flex-col items-center pointer-events-auto">
        {/* AdSense-style top handle tab */}
        <div className="w-full flex items-center justify-between px-3 py-1 bg-white/95 backdrop-blur border-t border-x border-gray-200 rounded-t-xl shadow-sm">
          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400">
            Ad • Sponsored
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand Ad' : 'Collapse Ad'}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            >
              {collapsed ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setClosed(true)}
              title="Close Ad"
              className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sticky Banner Body */}
        {!collapsed && (
          <div className="w-full bg-white/98 backdrop-blur border-t border-gray-100 py-1.5 px-2 shadow-2xl flex justify-center overflow-hidden">
            <div
              id={slotDivId}
              className="mx-auto flex items-center justify-center min-h-[50px] max-w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Full-Page Interstitial / Vignette Ad (GPT Out-Of-Page)
 * Reads `interstitial` slot path automatically from `pricing_config.json` (`window.MBELIK_AD_UNITS.interstitial`).
 */
export const InterstitialAdUnit: React.FC = () => {
  useEffect(() => {
    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          const slotPath =
            window.MBELIK_AD_UNITS?.interstitial || DEFAULT_AD_UNITS.interstitial;
          const format = window.googletag.enums?.OutOfPageFormat?.INTERSTITIAL;
          if (format && window.googletag.defineOutOfPageSlot) {
            const interstitialSlot = window.googletag.defineOutOfPageSlot(slotPath, format);
            if (interstitialSlot) {
              const keyInt =
                window.mbelikResolveSlotKey?.(slotPath, 'int') ||
                window.mbelikKeys?.keyInt ||
                'f35000';
              interstitialSlot.addService(window.googletag.pubads());
              interstitialSlot.setTargeting('mbelik_pricing', keyInt);
              window.mbelikSlotInt = interstitialSlot;
              console.log(
                `💰 [AutoPricing SetTargeting Sync] Slot: interstitial (${slotPath}) | Key:`,
                keyInt
              );
              window.googletag.enableServices();
              window.googletag.display(interstitialSlot);
            }
          }
        } catch (e) {
          console.warn('Interstitial slot initialization failed:', e);
        }
      });
    }
  }, []);

  return null;
};


