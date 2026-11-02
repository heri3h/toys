'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteData, AdSlotConfig, Article, FeaturedItem } from '@/types';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  FileText,
  DollarSign,
  Sliders,
  ExternalLink,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  PlaySquare,
  Lock,
  LogOut,
  Star,
  Copy,
  Check,
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState<'ads' | 'article' | 'featured' | 'settings'>('ads');
  const [selectedArticleIdx, setSelectedArticleIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Raw text state for editing ad sizes comfortably
  const [sizeInputs, setSizeInputs] = useState<Record<string, string>>({});
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('toys_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    fetchData();
  }, []);

  const formatSizesToString = (sizes: number[][]): string => {
    if (!sizes || sizes.length === 0) return '';
    return sizes.map(([w, h]) => `${w}x${h}`).join(', ');
  };

  const parseStringToSizes = (str: string): number[][] => {
    if (!str.trim()) return [];
    return str
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((pair) => {
        const [w, h] = pair.toLowerCase().split('x').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          return [w, h];
        }
        return null;
      })
      .filter((item): item is number[] => item !== null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-data', { cache: 'no-store' });
      const json: SiteData = await res.json();
      setData(json);

      // Initialize size string inputs
      const initialSizes: Record<string, string> = {};
      (Object.keys(json.ads) as Array<keyof SiteData['ads']>).forEach((key) => {
        initialSizes[key] = formatSizesToString(json.ads[key].sizes);
      });
      setSizeInputs(initialSizes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPassword = data?.settings?.adminPassword || 'admin123';
    if (passwordInput === expectedPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('toys_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Password salah. Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('toys_admin_auth');
    setPasswordInput('');
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/site-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaveStatus('Changes successfully saved & published!');
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus('Failed to save changes.');
      }
    } catch {
      setSaveStatus('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SiteData['settings']>(
    key: K,
    value: SiteData['settings'][K]
  ) => {
    if (!data) return;
    setData({
      ...data,
      settings: {
        ...data.settings,
        [key]: value,
      },
    });
  };

  const updateAdSlot = (slotKey: keyof SiteData['ads'], updates: Partial<AdSlotConfig>) => {
    if (!data) return;
    setData({
      ...data,
      ads: {
        ...data.ads,
        [slotKey]: {
          ...data.ads[slotKey],
          ...updates,
        },
      },
    });
  };

  const handleSizeInputChange = (slotKey: keyof SiteData['ads'], rawValue: string) => {
    setSizeInputs((prev) => ({ ...prev, [slotKey]: rawValue }));
    const parsedSizes = parseStringToSizes(rawValue);
    updateAdSlot(slotKey, { sizes: parsedSizes });
  };

  const addPresetSize = (slotKey: keyof SiteData['ads'], preset: [number, number]) => {
    if (!data) return;
    const current = data.ads[slotKey].sizes || [];
    const exists = current.some(([w, h]) => w === preset[0] && h === preset[1]);
    if (exists) return;
    const nextSizes = [...current, preset];
    updateAdSlot(slotKey, { sizes: nextSizes });
    setSizeInputs((prev) => ({
      ...prev,
      [slotKey]: formatSizesToString(nextSizes),
    }));
  };

  // Article Management
  const updateArticle = (idx: number, field: keyof Article, value: string) => {
    if (!data || !data.articles[idx]) return;
    const updatedArticles = [...data.articles];
    updatedArticles[idx] = {
      ...updatedArticles[idx],
      [field]: value,
    };
    setData({
      ...data,
      articles: updatedArticles,
    });
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const addNewArticle = () => {
    if (!data) return;
    const newId = String(Date.now());
    const newTitle = `New Toy Cars Story #${data.articles.length + 1}`;
    const newArticle: Article = {
      id: newId,
      slug: `${slugify(newTitle)}-${newId.slice(-4)}`,
      title: newTitle,
      subtitle: 'Exciting adventures and top toy car picks for kids of all ages.',
      metaDescription: 'Explore the best new toy cars, RC trucks, and racing tracks.',
      ogImage:
        'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=1200&q=80',
      category: 'Toys & Games',
      readingTime: '4 min read',
      publishedDate: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      author: 'Emma Reynolds',
      content: `<p class="lead font-medium text-lg text-gray-700 leading-relaxed mb-6">Write your opening paragraph here. Keep the first paragraph engaging right above the Read More button!</p>\n\n<h2>🏎️ Section Heading</h2>\n<p>Add more detailed story content here...</p>`,
    };
    const nextArticles = [...data.articles, newArticle];
    setData({ ...data, articles: nextArticles });
    setSelectedArticleIdx(nextArticles.length - 1);
  };

  const deleteArticle = (idx: number) => {
    if (!data || data.articles.length <= 1) {
      alert('Minimal harus ada 1 artikel utama.');
      return;
    }
    const nextArticles = data.articles.filter((_, i) => i !== idx);
    setData({ ...data, articles: nextArticles });
    setSelectedArticleIdx(Math.max(0, idx - 1));
  };

  const makePrimaryArticle = (idx: number) => {
    if (!data || idx === 0) return;
    const nextArticles = [...data.articles];
    const [picked] = nextArticles.splice(idx, 1);
    nextArticles.unshift(picked);
    setData({ ...data, articles: nextArticles });
    setSelectedArticleIdx(0);
  };

  // Featured Videos / Cards Management
  const updateFeaturedItem = (idx: number, field: keyof FeaturedItem, value: string) => {
    if (!data) return;
    const list = [...(data.featuredItems || [])];
    if (!list[idx]) return;
    list[idx] = { ...list[idx], [field]: value };
    setData({ ...data, featuredItems: list });
  };

  const addFeaturedItem = () => {
    if (!data) return;
    const list = [...(data.featuredItems || [])];
    list.push({
      id: `feat_${Date.now()}`,
      title: 'Awesome Toy Cars in Action',
      image:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      targetUrl: '/?gclid=1',
    });
    setData({ ...data, featuredItems: list });
  };

  const removeFeaturedItem = (idx: number) => {
    if (!data) return;
    const list = (data.featuredItems || []).filter((_, i) => i !== idx);
    setData({ ...data, featuredItems: list });
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}?gclid=1`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span>Loading Dashboard Config...</span>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Command Center</h1>
              <p className="text-xs text-slate-400">Masukkan password untuk mengakses Dashboard</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
              />
              {authError && <p className="text-xs text-rose-400 mt-1.5">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-md"
            >
              Masuk ke Dashboard
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
              &larr; Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentArticle = data.articles[selectedArticleIdx] || data.articles[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            AD
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Monetization &amp; AdX Command Center
            </h1>
            <p className="text-xs text-slate-400">
              Manage AdX slots, multi-articles, featured cards &amp; arbitrage rules
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {saveStatus && (
            <span
              className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                saveStatus.includes('success')
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {saveStatus}
            </span>
          )}

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/?gclid=test_campaign_123"
            target="_blank"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors border border-amber-500/30 font-medium"
          >
            <span>Test Paid Mode (?gclid=1)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-md bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-colors border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs (Sidebar) */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('ads')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
              activeTab === 'ads'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold leading-none">AdX Placements</p>
              <p className="text-[11px] opacity-75 mt-1">Slots, sizes &amp; TCPM floor</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('article')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
              activeTab === 'article'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold leading-none">Articles ({data.articles.length})</p>
              <p className="text-[11px] opacity-75 mt-1">Add, edit stories &amp; URL slugs</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('featured')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
              activeTab === 'featured'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <PlaySquare className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold leading-none">Featured Cards</p>
              <p className="text-[11px] opacity-75 mt-1">Bottom video thumbnails &amp; links</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold leading-none">Traffic &amp; Settings</p>
              <p className="text-[11px] opacity-75 mt-1">GCLID rules, branding &amp; security</p>
            </div>
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="md:col-span-3">
          {/* TAB 1: ADX PLACEMENTS */}
          {activeTab === 'ads' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Google AdX Slots Configuration</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Atur Ad Unit Path, ukuran iklan (Sizes), dan Target Pricing (TCPM) untuk setiap penempatan.
                </p>
              </div>

              <div className="space-y-4">
                {(Object.keys(data.ads) as Array<keyof SiteData['ads']>).map((slotKey) => {
                  const slot = data.ads[slotKey];
                  const presets: Array<[number, number]> = [
                    [300, 250],
                    [336, 280],
                    [300, 600],
                    [160, 600],
                    [320, 100],
                    [300, 300],
                  ];
                  return (
                    <div
                      key={slotKey}
                      className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{slot.name}</span>
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            {slot.id}
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <span className="text-slate-400">Enabled:</span>
                          <input
                            type="checkbox"
                            checked={slot.enabled}
                            onChange={(e) => updateAdSlot(slotKey, { enabled: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-400 mb-1">Ad Unit Path</label>
                          <input
                            type="text"
                            value={slot.slotPath}
                            onChange={(e) => updateAdSlot(slotKey, { slotPath: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-blue-500 outline-none"
                            placeholder="/22282810983/slot_name"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Target Pricing (TCPM)</label>
                          <input
                            type="text"
                            value={slot.tcpm}
                            onChange={(e) => updateAdSlot(slotKey, { tcpm: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-blue-500 outline-none"
                            placeholder="125000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Ad Sizes (format: <code>300x250, 336x280</code>)
                          </label>
                          <input
                            type="text"
                            value={sizeInputs[slotKey] ?? formatSizesToString(slot.sizes)}
                            onChange={(e) => handleSizeInputChange(slotKey, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-blue-500 outline-none"
                            placeholder="300x250, 336x280"
                          />
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] text-slate-500">+ Quick Add:</span>
                            {presets.map(([w, h]) => (
                              <button
                                key={`${w}x${h}`}
                                type="button"
                                onClick={() => addPresetSize(slotKey, [w, h])}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                              >
                                {w}x{h}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between pt-5">
                          <div className="text-[11px] text-slate-500">
                            Parsed JSON:{' '}
                            <code className="text-slate-300 font-mono">
                              {JSON.stringify(slot.sizes)}
                            </code>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 mt-2">
                            <input
                              type="checkbox"
                              checked={slot.lazyLoad}
                              onChange={(e) =>
                                updateAdSlot(slotKey, { lazyLoad: e.target.checked })
                              }
                              className="rounded bg-slate-800 border-slate-700 text-blue-600 w-3.5 h-3.5"
                            />
                            <span>Lazy Load ad unit</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & MULTI-ARTICLE MANAGER */}
          {activeTab === 'article' && (
            <div className="space-y-6">
              {/* Article List & Switcher */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">Daftar Artikel</h2>
                    <p className="text-xs text-slate-400">
                      Artikel urutan pertama (#1) otomatis menjadi artikel utama di Homepage (<code>/</code>).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addNewArticle}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Artikel Baru</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {data.articles.map((art, idx) => {
                    const isSelected = idx === selectedArticleIdx;
                    const isPrimary = idx === 0;
                    return (
                      <div
                        key={art.id || idx}
                        onClick={() => setSelectedArticleIdx(idx)}
                        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500/60 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold truncate">{art.title}</p>
                              {isPrimary && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-semibold">
                                  Homepage Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              /{art.slug}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => copyLink(art.slug)}
                            title="Copy URL (?gclid=1)"
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            {copiedSlug === art.slug ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedSlug === art.slug ? 'Copied' : 'Copy Link'}</span>
                          </button>

                          <Link
                            href={`/${art.slug}?gclid=1`}
                            target="_blank"
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => makePrimaryArticle(idx)}
                              title="Jadikan Artikel Utama di Homepage"
                              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            >
                              <Star className="w-3 h-3" />
                              <span>Set Utama</span>
                            </button>
                          )}

                          {data.articles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteArticle(idx)}
                              title="Hapus Artikel"
                              className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Article Editor */}
              {currentArticle && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Edit Artikel #{selectedArticleIdx + 1}
                      </h3>
                      <p className="text-xs text-slate-400">
                        URL Aktif: <code>/{currentArticle.slug}</code>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-slate-300 font-semibold mb-1">
                          Article Headline (Title)
                        </label>
                        <input
                          type="text"
                          value={currentArticle.title || ''}
                          onChange={(e) => updateArticle(selectedArticleIdx, 'title', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-300 font-semibold">URL Slug</label>
                          <button
                            type="button"
                            onClick={() =>
                              updateArticle(
                                selectedArticleIdx,
                                'slug',
                                slugify(currentArticle.title || 'article')
                              )
                            }
                            className="text-[10px] text-blue-400 hover:underline"
                          >
                            Auto-generate
                          </button>
                        </div>
                        <input
                          type="text"
                          value={currentArticle.slug || ''}
                          onChange={(e) =>
                            updateArticle(selectedArticleIdx, 'slug', slugify(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Subtitle / Excerpt
                      </label>
                      <textarea
                        rows={2}
                        value={currentArticle.subtitle || ''}
                        onChange={(e) =>
                          updateArticle(selectedArticleIdx, 'subtitle', e.target.value)
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        SEO Meta Description
                      </label>
                      <textarea
                        rows={2}
                        value={currentArticle.metaDescription || ''}
                        onChange={(e) =>
                          updateArticle(selectedArticleIdx, 'metaDescription', e.target.value)
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Category</label>
                        <input
                          type="text"
                          value={currentArticle.category || ''}
                          onChange={(e) =>
                            updateArticle(selectedArticleIdx, 'category', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Published Date
                        </label>
                        <input
                          type="text"
                          value={currentArticle.publishedDate || ''}
                          onChange={(e) =>
                            updateArticle(selectedArticleIdx, 'publishedDate', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Reading Time
                        </label>
                        <input
                          type="text"
                          value={currentArticle.readingTime || ''}
                          onChange={(e) =>
                            updateArticle(selectedArticleIdx, 'readingTime', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Author Name
                        </label>
                        <input
                          type="text"
                          value={currentArticle.author || ''}
                          onChange={(e) =>
                            updateArticle(selectedArticleIdx, 'author', e.target.value)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Cover / OG Image URL
                      </label>
                      <input
                        type="text"
                        value={currentArticle.ogImage || ''}
                        onChange={(e) =>
                          updateArticle(selectedArticleIdx, 'ogImage', e.target.value)
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none font-mono"
                      />
                      {currentArticle.ogImage && (
                        <div className="mt-2 w-36 h-20 rounded border border-slate-700 overflow-hidden bg-slate-950">
                          <img
                            src={currentArticle.ogImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        Isi Artikel (Visual Blog Editor &amp; Format Penulisan)
                      </label>
                      <RichTextEditor
                        value={currentArticle.content || ''}
                        onChange={(html) => updateArticle(selectedArticleIdx, 'content', html)}
                        onUpdateReadingTime={(rt) =>
                          updateArticle(selectedArticleIdx, 'readingTime', rt)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEATURED VIDEOS & CARDS */}
          {activeTab === 'featured' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Featured Videos &amp; Games (Bagian Bawah)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Kartu rekomendasi yang di-load otomatis saat pengunjung melakukan skrol ke bawah.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFeaturedItem}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kartu</span>
                </button>
              </div>

              <div className="space-y-4">
                {(data.featuredItems || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start"
                  >
                    <div className="w-full md:w-44 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">Kartu #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFeaturedItem(idx)}
                          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Judul Kartu / Video</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateFeaturedItem(idx, 'title', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Thumbnail Image URL</label>
                          <input
                            type="text"
                            value={item.image}
                            onChange={(e) => updateFeaturedItem(idx, 'image', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-400">Target Link saat Diklik</label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateFeaturedItem(idx, 'targetUrl', e.target.value);
                                }
                              }}
                              value=""
                              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 border border-slate-700 outline-none"
                            >
                              <option value="">Pilih dari Artikel...</option>
                              {data.articles.map((a) => (
                                <option key={a.id} value={`/${a.slug}?gclid=1`}>
                                  /{a.slug}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={item.targetUrl || ''}
                            onChange={(e) => updateFeaturedItem(idx, 'targetUrl', e.target.value)}
                            placeholder="/slug-artikel?gclid=1"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TRAFFIC, BRANDING & ARBITRAGE RULES */}
          {activeTab === 'settings' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Branding, Traffic &amp; Arbitrage Settings
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Konfigurasi identitas situs, perilaku trafik iklan (<code>?gclid=1</code>), tracking ID, dan password admin.
                </p>
              </div>

              <div className="space-y-4">
                {/* Branding & Domain */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-slate-200">Identitas &amp; Domain Situs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Site Name (Header Text)</label>
                      <input
                        type="text"
                        value={data.settings.siteName}
                        onChange={(e) => updateSetting('siteName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200"
                        placeholder="qidtime.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Primary Domain URL</label>
                      <input
                        type="text"
                        value={data.settings.domainUrl}
                        onChange={(e) => updateSetting('domainUrl', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                        placeholder="https://toys.gledeg.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Rule: Overlay Spinner */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">
                      Ad Traffic Loading Overlay (Spinner)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Menampilkan animasi loading saat pengunjung masuk lewat <code>?gclid=</code> sebelum menampilkan isi.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={data.settings.enableAdTrafficOverlay}
                    onChange={(e) => updateSetting('enableAdTrafficOverlay', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-slate-800 border-slate-700"
                  />
                </div>

                {/* Rule: Overlay Duration */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">
                      Overlay Display Duration (Seconds)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Berapa detik loading spinner muncul sebelum menghilang.
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={data.settings.overlayTimeoutSeconds}
                    onChange={(e) =>
                      updateSetting('overlayTimeoutSeconds', parseInt(e.target.value) || 3)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                {/* Rule: Truncate Content On Ad Traffic Only */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">
                      Truncate Article &amp; Show &apos;Read More&apos; on Ad Traffic Only
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Jika dicentang, pengunjung organik melihat artikel penuh sedangkan trafik iklan (<code>?gclid=1</code>) melihat versi terpotong dengan tombol <em>Read more...</em>
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={data.settings.truncateOnAdTrafficOnly}
                    onChange={(e) => updateSetting('truncateOnAdTrafficOnly', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-slate-800 border-slate-700"
                  />
                </div>

                {/* Rule: Auto-Scroll on Mobile */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">
                      Mobile Auto-Scroll to Top Ad
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Otomatis mengarahkan layar HP ke posisi iklan atas setelah loading overlay selesai.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={data.settings.mobileAutoScrollToTopAd}
                    onChange={(e) => updateSetting('mobileAutoScrollToTopAd', e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 bg-slate-800 border-slate-700"
                  />
                </div>

                {/* Analytics / Conversion IDs */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-slate-200">
                    Tracking &amp; Conversion IDs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Google Analytics ID</label>
                      <input
                        type="text"
                        value={data.settings.gaMeasurementId}
                        onChange={(e) => updateSetting('gaMeasurementId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                        placeholder="G-XXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Google Ads Account ID</label>
                      <input
                        type="text"
                        value={data.settings.googleAdsId}
                        onChange={(e) => updateSetting('googleAdsId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                        placeholder="AW-XXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Google Ads Conversion Label
                      </label>
                      <input
                        type="text"
                        value={data.settings.googleAdsConversionLabel || ''}
                        onChange={(e) => updateSetting('googleAdsConversionLabel', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                        placeholder="kt1RCNLmgpUZEKmp16w9"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Password Security */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-slate-200">
                    Keamanan Dashboard (Admin Password)
                  </h3>
                  <div className="max-w-sm text-xs">
                    <label className="block text-slate-400 mb-1">
                      Password Login <code>/dashboard</code>
                    </label>
                    <input
                      type="text"
                      value={data.settings.adminPassword || ''}
                      onChange={(e) => updateSetting('adminPassword', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                      placeholder="admin123"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Jangan lupa klik <strong>Save All Changes</strong> setelah mengubah password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
