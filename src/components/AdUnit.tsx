'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AdSlotConfig } from '@/types';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

declare global {
  interface Window {
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

function ensureGptLoaded() {
  if (typeof window !== 'undefined' && !window.googletag) {
    window.googletag = { cmd: [] } as any;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    document.head.appendChild(script);
  }
}

interface AdUnitProps {
  config: AdSlotConfig;
  className?: string;
  isAdTraffic?: boolean;
}

export const AdUnit: React.FC<AdUnitProps> = ({ config, className = '', isAdTraffic = false }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [slotDivId] = useState(
    () => `adx-${config?.id || 'slot'}-${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    if (!config || !config.enabled) return;

    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          if (config.sizes && config.sizes.length > 0) {
            const slot = window.googletag
              .defineSlot(config.slotPath, config.sizes, slotDivId)
              ?.addService(window.googletag.pubads());

            if (slot && config.tcpm) {
              slot.setTargeting('liseer_pricing', config.tcpm);
            }
            window.googletag.enableServices();
            window.googletag.display(slotDivId);
          }
        } catch (e) {
          console.warn('Ad slot initialization failed:', e);
        }
      });
    }
  }, [config, slotDivId]);

  if (!config || !config.enabled) return null;

  return (
    <div
      ref={adRef}
      className={`ad-container my-4 text-center overflow-hidden transition-all duration-300 ${className}`}
    >
      <div className="text-[10px] tracking-wider uppercase text-gray-400 mb-1 font-mono">
        ADVERTISEMENT {config.tcpm ? `• TCPM: ${config.tcpm}` : ''}
      </div>

      {/* Visual placeholder box in case live AdX is in test/fill mode */}
      <div
        id={slotDivId}
        className="mx-auto flex flex-col items-center justify-center min-h-[100px] border border-dashed border-gray-300 bg-gray-50/70 rounded p-2 text-xs text-gray-500"
        style={{
          minWidth: config.sizes?.[0]?.[0] ? `${Math.min(config.sizes[0][0], 300)}px` : '300px',
          minHeight: config.sizes?.[0]?.[1] ? `${Math.min(config.sizes[0][1], 250)}px` : '100px',
        }}
      >
        <span className="font-semibold text-gray-600">{config.name}</span>
        <span className="text-[11px] text-gray-400 font-mono mt-0.5">{config.slotPath}</span>
        {isAdTraffic && (
          <span className="mt-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
            Paid Traffic Mode
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Unit #4: Mobile Sticky Bottom Anchor Ad (Ala AdSense)
 * Sticks to the bottom of the mobile screen with a collapsible tab & close button.
 */
export const MobileBottomAnchorAd: React.FC<{
  config?: AdSlotConfig;
  isAdTraffic?: boolean;
}> = ({ config, isAdTraffic = false }) => {
  const [closed, setClosed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [slotDivId] = useState(
    () => `adx-bottom-anchor-${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    if (!config || !config.enabled || closed) return;

    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          const sizesToUse =
            config.sizes && config.sizes.length > 0
              ? config.sizes
              : [
                  [320, 50],
                  [320, 100],
                  [300, 50],
                ];
          const slot = window.googletag
            .defineSlot(config.slotPath, sizesToUse, slotDivId)
            ?.addService(window.googletag.pubads());

          if (slot && config.tcpm) {
            slot.setTargeting('liseer_pricing', config.tcpm);
          }
          window.googletag.enableServices();
          window.googletag.display(slotDivId);
        } catch (e) {
          console.warn('Bottom anchor ad initialization failed:', e);
        }
      });
    }
  }, [config, slotDivId, closed]);

  if (!config || !config.enabled || closed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden pointer-events-none">
      <div className="max-w-[680px] mx-auto flex flex-col items-center pointer-events-auto">
        {/* AdSense-style top handle tab */}
        <div className="w-full flex items-center justify-between px-3 py-1 bg-white/95 backdrop-blur border-t border-x border-gray-200 rounded-t-xl shadow-sm">
          <span className="text-[9px] font-mono uppercase tracking-wider text-gray-400">
            Ad • {config.tcpm ? `TCPM ${config.tcpm}` : 'Sponsored'}
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
          <div className="w-full bg-white/98 backdrop-blur border-t border-gray-100 py-1.5 px-2 shadow-2xl flex justify-center">
            <div
              id={slotDivId}
              className="mx-auto flex flex-col items-center justify-center border border-dashed border-gray-300 bg-gray-50/80 rounded px-3 py-1.5 text-[11px] text-gray-500"
              style={{
                minWidth: config.sizes?.[0]?.[0]
                  ? `${Math.min(config.sizes[0][0], 320)}px`
                  : '320px',
                minHeight: config.sizes?.[0]?.[1]
                  ? `${Math.min(config.sizes[0][1], 100)}px`
                  : '50px',
              }}
            >
              <span className="font-semibold text-gray-600 leading-tight">{config.name}</span>
              <span className="text-[10px] text-gray-400 font-mono leading-tight">
                {config.slotPath} {isAdTraffic ? '• Paid Traffic' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Unit #5: Full-Page Interstitial / Vignette Ad (GPT Out-Of-Page)
 */
export const InterstitialAdUnit: React.FC<{
  config?: AdSlotConfig;
}> = ({ config }) => {
  useEffect(() => {
    if (!config || !config.enabled || !config.slotPath) return;

    ensureGptLoaded();

    if (window.googletag && window.googletag.cmd) {
      window.googletag.cmd.push(() => {
        try {
          const format = window.googletag.enums?.OutOfPageFormat?.INTERSTITIAL;
          if (format && window.googletag.defineOutOfPageSlot) {
            const interstitialSlot = window.googletag.defineOutOfPageSlot(config.slotPath, format);
            if (interstitialSlot) {
              if (config.tcpm) {
                interstitialSlot.setTargeting('liseer_pricing', config.tcpm);
              }
              interstitialSlot.addService(window.googletag.pubads());
              window.googletag.enableServices();
              window.googletag.display(interstitialSlot);
            }
          }
        } catch (e) {
          console.warn('Interstitial slot initialization failed:', e);
        }
      });
    }
  }, [config]);

  return null;
};

