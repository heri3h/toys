'use client';

import React, { useEffect, useRef } from 'react';
import { AdSlotConfig } from '@/types';

declare global {
  interface Window {
    googletag: {
      cmd: Array<() => void>;
      defineSlot: (path: string, size: number[][] | string, id: string) => any;
      pubads: () => any;
      enableServices: () => void;
      display: (id: string | any) => void;
    };
  }
}

interface AdUnitProps {
  config: AdSlotConfig;
  className?: string;
  isAdTraffic?: boolean;
}

export const AdUnit: React.FC<AdUnitProps> = ({ config, className = '', isAdTraffic = false }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const slotDivId = `adx-${config.id}-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    if (!config.enabled) return;

    // Load GPT if not already added
    if (typeof window !== 'undefined' && !window.googletag) {
      window.googletag = { cmd: [] } as any;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
      document.head.appendChild(script);
    }

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

  if (!config.enabled) return null;

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
