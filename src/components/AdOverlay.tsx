'use client';

import React from 'react';

interface AdOverlayProps {
  show: boolean;
  onFinished?: () => void;
}

export const AdOverlay: React.FC<AdOverlayProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div
      id="game-overlay"
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-500"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated spinner matching original site */}
        <div className="w-14 h-14 rounded-full border-4 border-gray-200 border-t-emerald-600 animate-spin" />
        <p className="mt-4 text-sm font-medium tracking-wide text-gray-700 animate-pulse">
          Loading destination...
        </p>
      </div>
    </div>
  );
};
