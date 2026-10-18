'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteData, AdSlotConfig } from '@/types';
import {
  Layers,
  FileText,
  DollarSign,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState<'ads' | 'article' | 'settings'>('ads');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        setSaveStatus('Changes successfully saved!');
        setTimeout(() => setSaveStatus(null), 3000);
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

  const updateArticle = (field: string, value: string) => {
    if (!data || !data.articles[0]) return;
    const updatedArticles = [...data.articles];
    updatedArticles[0] = {
      ...updatedArticles[0],
      [field]: value,
    };
    setData({
      ...data,
      articles: updatedArticles,
    });
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span>Loading Dashboard Config...</span>
        </div>
      </div>
    );
  }

  const currentArticle = data.articles[0] || ({} as any);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            AD
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Monetization & AdX Command Center
            </h1>
            <p className="text-xs text-slate-400">Manage high-yield arbitrage & articles</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span
              className={`text-xs px-3 py-1 rounded-md font-medium ${
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
            <DollarSign className="w-4 h-4" />
            <div>
              <p className="font-semibold leading-none">AdX Placements</p>
              <p className="text-[11px] opacity-75 mt-0.5">Slots, sizes, and TCPM targeting</p>
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
            <FileText className="w-4 h-4" />
            <div>
              <p className="font-semibold leading-none">Content & Article</p>
              <p className="text-[11px] opacity-75 mt-0.5">Edit live story, SEO & images</p>
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
            <Sliders className="w-4 h-4" />
            <div>
              <p className="font-semibold leading-none">Traffic & Arbitrage Rules</p>
              <p className="text-[11px] opacity-75 mt-0.5">GCLID overlay, auto-scroll, analytics</p>
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
                  Configure real Ad Unit Paths and Floor Prices (TCPM) for high eCPM international monetization.
                </p>
              </div>

              <div className="space-y-4">
                {(Object.keys(data.ads) as Array<keyof SiteData['ads']>).map((slotKey) => {
                  const slot = data.ads[slotKey];
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

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <div>
                          Sizes:{' '}
                          <code className="text-slate-300 font-mono">
                            {JSON.stringify(slot.sizes)}
                          </code>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.lazyLoad}
                            onChange={(e) => updateAdSlot(slotKey, { lazyLoad: e.target.checked })}
                            className="rounded bg-slate-800 border-slate-700 text-blue-600 w-3.5 h-3.5"
                          />
                          <span>Lazy Load ad unit</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & ARTICLE */}
          {activeTab === 'article' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Live Story & Content Editor</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Edit headlines, featured cover images, metadata, and HTML article body.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Article Headline</label>
                  <input
                    type="text"
                    value={currentArticle.title || ''}
                    onChange={(e) => updateArticle('title', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subtitle / Excerpt</label>
                  <textarea
                    rows={2}
                    value={currentArticle.subtitle || ''}
                    onChange={(e) => updateArticle('subtitle', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Category</label>
                    <input
                      type="text"
                      value={currentArticle.category || ''}
                      onChange={(e) => updateArticle('category', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reading Time</label>
                    <input
                      type="text"
                      value={currentArticle.readingTime || ''}
                      onChange={(e) => updateArticle('readingTime', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Author Name</label>
                    <input
                      type="text"
                      value={currentArticle.author || ''}
                      onChange={(e) => updateArticle('author', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cover / OG Image URL</label>
                  <input
                    type="text"
                    value={currentArticle.ogImage || ''}
                    onChange={(e) => updateArticle('ogImage', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none font-mono"
                  />
                  {currentArticle.ogImage && (
                    <div className="mt-2 w-32 h-20 rounded border border-slate-700 overflow-hidden">
                      <img
                        src={currentArticle.ogImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Article HTML Content
                  </label>
                  <textarea
                    rows={12}
                    value={currentArticle.content || ''}
                    onChange={(e) => updateArticle('content', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-200 focus:border-blue-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports HTML tags (<code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>). The Read More button & ad slots are dynamically positioned around this content.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRAFFIC & ARBITRAGE RULES */}
          {activeTab === 'settings' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Paid Traffic & Arbitrage Automation</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Replicate specific behaviors observed on high-performing ad traffic landings (`?gclid=1`).
                </p>
              </div>

              <div className="space-y-4">
                {/* Rule: Overlay Spinner */}
                <div className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">
                      Ad Traffic Loading Overlay (Spinner)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Displays a translucent loading spinner when user enters via <code>?gclid=</code> before revealing content.
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
                      How many seconds the spinner stays visible before fade-out.
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
                      Truncate Article & Show &apos;Read More&apos; on Ad Traffic Only
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      When checked, organic traffic sees the full story immediately, while paid traffic (<code>?gclid=1</code>) gets the truncated version with &apos;Read more...&apos; button to maximize ad viewability.
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
                      Automatically scrolls the mobile screen directly into view of the top AdX placement after overlay hides.
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
                    Tracking & Conversion IDs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
