'use client';

import React from 'react';
import Link from 'next/link';
import { SiteSettings } from '@/types';
import { Settings, Sparkles } from 'lucide-react';

interface NavbarProps {
  settings: SiteSettings;
  isAdTraffic?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ settings, isAdTraffic }) => {
  return (
    <header className="bg-white border-b border-gray-100 py-2 px-4 shadow-xs">
      <div className="max-w-[800px] mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-extrabold text-lg tracking-tight text-gray-900">
            {settings.siteName}
          </span>
        </Link>

        {/* Small subtle dashboard button so it doesn't push viewport */}
        <div className="flex items-center gap-2">
          {isAdTraffic && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Paid Mode
            </span>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
