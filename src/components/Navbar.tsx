'use client';

import React from 'react';
import { SiteSettings } from '@/types';

interface NavbarProps {
  settings: SiteSettings;
  isAdTraffic?: boolean;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return (
    <nav className="flex items-center gap-3 text-xs font-medium text-neutral-500">
      <a href="/" className="hover:text-neutral-900 transition-colors">
        Home
      </a>
    </nav>
  );
};
