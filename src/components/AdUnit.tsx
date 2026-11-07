'use client';

import React, { useEffect, useRef, useState } from 'react';

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
    mbelikSlotSticky?: any;
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
    [336, 280],
    [300, 250],
    [320, 100],
    [320, 50],
    [250, 50],
  ],
  feed: [
    [300, 250],
    [336, 280],
  ],
  side: [
    [300, 250],
    [300, 600],
  ],
  side2: [
    [300, 250],
    [300, 600],
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
  if (isMobileViewport) {
    if (slotKey === 'header') {
      pool = [
        [320, 100],
        [320, 50],
        [300, 250],
        [250, 50],
      ];
    } else if (slotKey === 'side') {
      // On mobile in-page bottom slot ('side'), use medium rectangles instead of 300x600
      pool = [
        [300, 250],
        [336, 280],
      ];
    }
  }
  const fitting = pool.filter(([w]) => w <= maxWidth);
  if (fitting.length > 0) return fitting;
  const sorted = [...pool].sort((a, b) => a[0] - b[0]);
  return [sorted[0]];
}

interface AdUnitProps {
  slotKey: MbelikSlotKey;
  placement?: 'all' | 'desktop-only' | 'mobile-only';
  className?: string;
  isAdTraffic?: boolean;
}

export const AdUnit: React.FC<AdUnitProps> = ({
  slotKey,
  placement = 'all',
  className = '',
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const definedRef = useRef(false);
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const [slotDivId] = useState(
    () => `div-gpt-ad-${slotKey}-${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewportW = window.innerWidth;
    const isDesktop = viewportW >= 1024;

    if (placement === 'desktop-only' && !isDesktop) {
      setShouldRender(false);
      return;
    }
    if (placement === 'mobile-only' && isDesktop) {
      setShouldRender(false);
      return;
    }
    setShouldRender(true);
  }, [placement]);

  useEffect(() => {
    if (!shouldRender || definedRef.current) return;

    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          if (definedRef.current) return;
          // Double guard: never request ad if container is hidden via CSS (display: none)
          if (adRef.current && adRef.current.offsetParent === null) {
            return;
          }

          definedRef.current = true;
          const slotPath =
            window.MBELIK_AD_UNITS?.[slotKey] || DEFAULT_AD_UNITS[slotKey];
          const viewportW = typeof window !== 'undefined' ? window.innerWidth : 360;
          const isMobileViewport = viewportW < 1024;
          const containerWidth =
            adRef.current?.clientWidth || Math.min(Math.max(viewportW - 32, 300), 632);

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
  }, [shouldRender, slotKey, slotDivId]);

  if (!shouldRender) return null;

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
 * Native GPT Sticky Bottom Anchor Ad (`OutOfPageFormat.BOTTOM_ANCHOR`)
 * Identical to `slotSticky` in `AdsHeader.php` on the other domains.
 */
export const MobileBottomAnchorAd: React.FC<{
  isAdTraffic?: boolean;
}> = () => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          const slotPath =
            window.MBELIK_AD_UNITS?.anchor || DEFAULT_AD_UNITS.anchor;
          const format = window.googletag.enums?.OutOfPageFormat?.BOTTOM_ANCHOR;
          if (format && window.googletag.defineOutOfPageSlot) {
            const stickySlot = window.googletag.defineOutOfPageSlot(slotPath, format);
            if (stickySlot) {
              const keyAnc =
                window.mbelikResolveSlotKey?.(slotPath, 'anc') ||
                window.mbelikKeys?.keyAnc ||
                'f15000';
              stickySlot.addService(window.googletag.pubads());
              stickySlot.setTargeting('mbelik_pricing', keyAnc);
              window.mbelikSlotSticky = stickySlot;
              console.log(
                `💰 [AutoPricing SetTargeting Sync] Slot: anchor (${slotPath}) | Key:`,
                keyAnc
              );
              window.googletag.enableServices();
              window.googletag.display(stickySlot);
            }
          }
        } catch (e) {
          console.warn('Bottom anchor ad initialization failed:', e);
        }
      });
    }
  }, []);

  return null;
};

/**
 * Native GPT Full-Page Interstitial / Vignette Ad (`OutOfPageFormat.INTERSTITIAL`)
 * Identical to `slotInt` in `AdsHeader.php` on the other domains.
 */
export const InterstitialAdUnit: React.FC = () => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

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



