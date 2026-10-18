import React from 'react';
import Link from 'next/link';
import { SiteSettings } from '@/types';
import { Settings, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  settings: SiteSettings;
  isAdTraffic?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ settings, isAdTraffic }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            {settings.siteName}
          </span>
        </Link>

        {/* Status & Dashboard Nav */}
        <div className="flex items-center gap-3">
          {isAdTraffic && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Ad Traffic Active
            </span>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            Admin Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
};
