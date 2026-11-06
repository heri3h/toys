'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SiteData, AdSlotConfig, Article, FeaturedItem, GameItem } from '@/types';
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
  Upload,
  Zap,
  Gamepad2,
  Search,
  Sparkles,
  Shuffle,
  KeyRound,
} from 'lucide-react';
import { compressImageToWebP } from '@/lib/imageCompressor';

const RANDOM_ARTICLE_TOPICS = [
  'High-Speed 4WD RC Monster Trucks with Off-Road Suspension',
  'Ultimate Glow-in-the-Dark Loop Racing Track Sets for Kids',
  'Die-Cast Alloy Supercar Collectors Guide & Stunt Ramps',
  'Remote Control Amphibious Stunt Cars That Drive on Water & Land',
  'STEM Building Block Racing Cars & Motorized Gear Kits',
  '2.4GHz Drift RC Sports Cars for Living Room Hardwood Racing',
  'Heavy-Duty RC Construction Excavator & Dump Truck Playsets',
  'Rechargeable Wall-Climbing Gravity Defying RC Stunt Cars',
  'Multi-Level Toy Parking Garage Playsets with Spiral Ramps',
  'Transformable Robot Racing Cars with Interactive LED Lights',
  'High-Torque Pullback Off-Road Buggies for Backyard Obstacle Courses',
  'Mega Dino Truck Haulers & Dinosaur Rescue Vehicle Sets',
];

interface RawGameMonetizeItem {
  id: string;
  title: string;
  description: string;
  instructions: string;
  url: string;
  category: string;
  tags: string;
  thumb: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState<
    'ads' | 'article' | 'featured' | 'games' | 'settings'
  >('ads');
  const [selectedArticleIdx, setSelectedArticleIdx] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState<string | null>(null);
  const [compressionPreset, setCompressionPreset] = useState<'fast' | 'optimal' | 'hd'>('optimal');
  const [compressionStats, setCompressionStats] = useState<Record<string, string>>({});

  // GameMonetize Catalog states
  const [gmCatalog, setGmCatalog] = useState<RawGameMonetizeItem[]>([]);
  const [gmLoading, setGmLoading] = useState(false);
  const [gmCategory, setGmCategory] = useState('Racing');
  const [gmQuery, setGmQuery] = useState('');
  const [gmPage, setGmPage] = useState(1);
  const [compressingGameId, setCompressingGameId] = useState<string | null>(null);

  // YouTube Auto-Fetch & WebP Compression states
  const [ytQuickUrl, setYtQuickUrl] = useState('');
  const [fetchingYt, setFetchingYt] = useState<string | null>(null);

  // Auto-Article Generator (Option 1: YouTube & Option 2: AI Topic) states
  const [genYtUrl, setGenYtUrl] = useState('');
  const [genAlsoAddVideo, setGenAlsoAddVideo] = useState(true);
  const [genTopic, setGenTopic] = useState(RANDOM_ARTICLE_TOPICS[0]);
  const [genStyle, setGenStyle] = useState<'review' | 'story' | 'guide'>('review');
  const [generatingArticle, setGeneratingArticle] = useState<'youtube' | 'topic' | null>(null);
  const [showGeminiKeyBox, setShowGeminiKeyBox] = useState(false);

  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Raw text state for editing ad sizes comfortably
  const [sizeInputs, setSizeInputs] = useState<Record<string, string>>({});
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const uploadImageFile = async (
    rawFile: File,
    targetId: string,
    maxWidth = 800
  ): Promise<string | null> => {
    setUploadingThumb(targetId);
    try {
      const qualityMap = {
        fast: 0.65,
        optimal: 0.8,
        hd: 0.9,
      };
      const compressed = await compressImageToWebP(rawFile, {
        maxWidth,
        maxHeight: maxWidth,
        quality: qualityMap[compressionPreset],
      });

      setCompressionStats((prev) => ({
        ...prev,
        [targetId]: compressed.summary,
      }));

      const formData = new FormData();
      formData.append('file', compressed.file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.url) {
        return json.url as string;
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingThumb(null);
    }
    return null;
  };

  const uploadVideoFile = async (file: File, targetId: string): Promise<string | null> => {
    setUploadingThumb(targetId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.url) {
        return json.url as string;
      }
    } catch (err) {
      console.error('Video upload error:', err);
    } finally {
      setUploadingThumb(null);
    }
    return null;
  };

  const fetchGameCatalog = async (cat = gmCategory, q = gmQuery, page = gmPage) => {
    setGmLoading(true);
    try {
      const params = new URLSearchParams({
        category: cat,
        q,
        page: String(page),
      });
      const res = await fetch(`/api/gamemonetize?${params.toString()}`);
      const json = await res.json();
      if (json.items) {
        setGmCatalog(json.items);
      }
    } catch (err) {
      console.error('Error loading GameMonetize catalog:', err);
    } finally {
      setGmLoading(false);
    }
  };

  useEffect(() => {
    const savedAuth = sessionStorage.getItem('toys_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    fetchData();
    fetchGameCatalog('Racing', '', 1);
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
    const newId = `feat_${Date.now()}`;
    list.push({
      id: newId,
      title: 'Awesome Toy Cars in Action',
      image:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      targetUrl: `/watch/${newId}`,
      duration: '01:45',
      views: '38.4K views',
      description:
        'Watch how high-speed pullback racing cars and remote-controlled monster trucks conquer indoor obstacle courses with ease!',
    });
    setData({ ...data, featuredItems: list });
  };

  const removeFeaturedItem = (idx: number) => {
    if (!data) return;
    const list = (data.featuredItems || []).filter((_, i) => i !== idx);
    setData({ ...data, featuredItems: list });
  };

  // Games Database Management (GameMonetize 1-Click Thumbnail Selection + Auto-WebP)
  const autoSaveSiteData = async (nextData: SiteData, statusMsg: string) => {
    setData(nextData);
    try {
      const res = await fetch('/api/site-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextData),
      });
      if (res.ok) {
        setSaveStatus(statusMsg);
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error('Auto-save error:', err);
    }
  };

  const pickRandomTopic = () => {
    const others = RANDOM_ARTICLE_TOPICS.filter((t) => t !== genTopic);
    const picked = others[Math.floor(Math.random() * others.length)] || RANDOM_ARTICLE_TOPICS[0];
    setGenTopic(picked);
  };

  const generateArticleAuto = async (source: 'youtube' | 'topic') => {
    if (!data || generatingArticle) return;
    if (source === 'youtube' && !genYtUrl.trim()) {
      alert('Masukkan link YouTube terlebih dahulu.');
      return;
    }
    if (source === 'topic' && !genTopic.trim()) {
      alert('Masukkan topik artikel atau klik tombol Acak Topik.');
      return;
    }

    setGeneratingArticle(source);
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          youtubeUrl: genYtUrl.trim(),
          topic: genTopic.trim(),
          style: genStyle,
          alsoAddToFeaturedVideos: genAlsoAddVideo,
          geminiApiKey: data.settings.geminiApiKey || '',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Gagal membuat artikel otomatis.');
        return;
      }

      const nextArticles = [...data.articles, json.article as Article];
      const nextFeatured = json.youtubeVideoCard
        ? [json.youtubeVideoCard as FeaturedItem, ...(data.featuredItems || [])]
        : data.featuredItems;

      if (json.compressionSummary) {
        setCompressionStats((prev) => ({
          ...prev,
          article_og: json.compressionSummary,
        }));
      }

      const nextData: SiteData = {
        ...data,
        articles: nextArticles,
        featuredItems: nextFeatured,
      };

      if (source === 'youtube') {
        setGenYtUrl('');
      }

      setSelectedArticleIdx(nextArticles.length - 1);
      await autoSaveSiteData(
        nextData,
        `Artikel "${json.article.title}" berhasil dibuat (${json.engineUsed}) & disimpan!`
      );
    } catch (err) {
      console.error('Error generating article:', err);
      alert('Terjadi kesalahan saat membuat artikel.');
    } finally {
      setGeneratingArticle(null);
    }
  };

  const quickAddYouTubeVideo = async () => {
    if (!data || !ytQuickUrl.trim() || fetchingYt) return;
    setFetchingYt('quick');
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ytQuickUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Gagal mengambil data dari link YouTube.');
        return;
      }

      const newId = `feat_${Date.now()}`;
      const newCard: FeaturedItem = {
        id: newId,
        title: json.title || 'YouTube Video',
        image: json.thumbnailUrl,
        videoUrl: json.videoUrl,
        targetUrl: `/watch/${newId}`,
        duration: '03:20',
        views: `${(Math.floor(Math.random() * 80) + 15).toFixed(1)}K views`,
        description: json.author
          ? `Watch "${json.title}" by ${json.author} — action-packed highlights and full interactive video preview.`
          : `Watch "${json.title}" — action-packed highlights and full interactive video preview.`,
      };

      const nextList = [newCard, ...(data.featuredItems || [])];
      if (json.summary) {
        setCompressionStats((prev) => ({
          ...prev,
          feat_0: json.summary,
        }));
      }
      setYtQuickUrl('');
      await autoSaveSiteData(
        { ...data, featuredItems: nextList },
        `Video YouTube "${json.title}" ditambahkan & thumbnail dikompres (${json.summary || 'WebP 16:9'})!`
      );
    } catch (err) {
      console.error('Error quick-adding YouTube video:', err);
      alert('Terjadi kesalahan saat memproses link YouTube.');
    } finally {
      setFetchingYt(null);
    }
  };

  const syncYouTubeCard = async (idx: number) => {
    if (!data || fetchingYt) return;
    const item = (data.featuredItems || [])[idx];
    if (!item || !item.videoUrl?.trim()) {
      alert('Masukkan link YouTube terlebih dahulu pada kolom Link YouTube.');
      return;
    }

    setFetchingYt(`feat_${idx}`);
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.videoUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Bukan link YouTube yang valid.');
        return;
      }

      const nextList = [...(data.featuredItems || [])];
      nextList[idx] = {
        ...nextList[idx],
        title: json.title || nextList[idx].title,
        image: json.thumbnailUrl || nextList[idx].image,
        videoUrl: json.videoUrl || nextList[idx].videoUrl,
        description:
          nextList[idx].description ||
          `Watch "${json.title}" — action-packed highlights and full interactive video preview.`,
      };

      if (json.summary) {
        setCompressionStats((prev) => ({
          ...prev,
          [`feat_${idx}`]: json.summary,
        }));
      }

      await autoSaveSiteData(
        { ...data, featuredItems: nextList },
        `Judul & Thumbnail YouTube diperbarui (${json.summary || 'WebP 16:9'})!`
      );
    } catch (err) {
      console.error('Error syncing YouTube card:', err);
    } finally {
      setFetchingYt(null);
    }
  };

  const toggleGameFromCatalog = async (gm: RawGameMonetizeItem) => {
    if (!data || compressingGameId) return;
    const currentGames = [...(data.games || [])];
    const existingIdx = currentGames.findIndex(
      (g) => g.id === `gm_${gm.id}` || g.embedUrl === gm.url
    );

    // If already in database, clicking the thumbnail removes it
    if (existingIdx !== -1) {
      const nextGames = currentGames.filter((_, i) => i !== existingIdx);
      const nextData = { ...data, games: nextGames };
      await autoSaveSiteData(nextData, `Game "${gm.title}" dihapus dari database.`);
      return;
    }

    // Otherwise, download thumbnail, crop 1:1 square & compress to WebP in data/uploads/
    setCompressingGameId(gm.id);
    try {
      let localThumbUrl = gm.thumb;
      const res = await fetch('/api/gamemonetize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gm.id, thumbUrl: gm.thumb }),
      });
      const json = await res.json();
      if (json.url) {
        localThumbUrl = json.url;
        if (json.summary) {
          setCompressionStats((prev) => ({
            ...prev,
            [`gm_${gm.id}`]: json.summary,
          }));
        }
      }

      const newGame: GameItem = {
        id: `gm_${gm.id}`,
        title: gm.title,
        image: localThumbUrl,
        originalThumb: gm.thumb,
        embedUrl: gm.url,
        category: gm.category || 'Racing',
        description: gm.description || '',
        instructions: gm.instructions || '',
        plays: `${(Math.floor(Math.random() * 55) + 25).toFixed(1)}K plays`,
      };

      const nextGames = [newGame, ...currentGames];
      const nextData = { ...data, games: nextGames };
      await autoSaveSiteData(
        nextData,
        `success: "${gm.title}" dikompres (WebP 1:1) & ditambahkan ke Database!`
      );
    } catch (err) {
      console.error('Failed to add game from catalog:', err);
    } finally {
      setCompressingGameId(null);
    }
  };

  const removeGameFromDb = async (idx: number) => {
    if (!data) return;
    const nextGames = (data.games || []).filter((_, i) => i !== idx);
    const nextData = { ...data, games: nextGames };
    await autoSaveSiteData(nextData, 'success: Game dihapus dari database.');
  };

  const updateGameItem = (idx: number, field: keyof GameItem, value: string) => {
    if (!data) return;
    const list = [...(data.games || [])];
    if (!list[idx]) return;
    list[idx] = { ...list[idx], [field]: value };
    setData({ ...data, games: list });
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
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
              <p className="font-semibold leading-none">
                Featured Videos ({(data.featuredItems || []).length})
              </p>
              <p className="text-[11px] opacity-75 mt-1">16:9 video thumbs, YouTube &amp; MP4</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
              activeTab === 'games'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Gamepad2 className="w-4 h-4 shrink-0" />
            <div>
              <p className="font-semibold leading-none">
                Games Database ({(data.games || []).length})
              </p>
              <p className="text-[11px] opacity-75 mt-1">
                1:1 GameMonetize catalog &amp; WebP
              </p>
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
          {/* TAB 1: ADX PLACEMENTS (7 AD UNITS) */}
          {activeTab === 'ads' && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Google AdX Slots Configuration (7 Ad Units)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Atur Ad Unit Path, ukuran iklan (Sizes), dan Target Pricing (TCPM) untuk ke-7 slot iklan Mobile &amp; Desktop.
                  </p>
                </div>
                <span className="text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full">
                  Total: 7 Ad Units Aktif
                </span>
              </div>

              <div className="space-y-4">
                {(
                  [
                    'homeTop',
                    'homeMore',
                    'inArticle',
                    'bottomAnchor',
                    'interstitial',
                    'sidebarLeft',
                    'sidebarRight',
                  ] as Array<keyof SiteData['ads']>
                ).map((slotKey, index) => {
                  const slot = data.ads[slotKey];
                  if (!slot) return null;

                  const slotMeta: Record<
                    keyof SiteData['ads'],
                    { badge: string; badgeClass: string; desc: string }
                  > = {
                    homeTop: {
                      badge: '📱 Mobile + 💻 Desktop',
                      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      desc: 'Tampil paling atas (Above the Fold) di bawah header pada halaman Artikel, Video (/watch), dan Game (/play).',
                    },
                    homeMore: {
                      badge: '📱 Mobile + 💻 Desktop',
                      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      desc: 'Otomatis tampil di sela-sela Featured Videos & Featured Games saat scroll (atau setelah Read More), serta tepat di atas daftar Up Next Video/Game.',
                    },
                    inArticle: {
                      badge: '📱 Mobile + 💻 Desktop',
                      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      desc: 'Otomatis tampil di bagian bawah halaman setelah daftar Featured Games begitu user melakukan scroll.',
                    },
                    bottomAnchor: {
                      badge: '📱 Mobile Sticky Bawah (Ala AdSense)',
                      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                      desc: 'Menempel melayang di bagian paling bawah layar HP (Sticky Bottom Anchor) lengkap dengan tombol lipat/tutup ala AdSense.',
                    },
                    interstitial: {
                      badge: '📱💻 Out-of-Page Interstitial',
                      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
                      desc: 'Iklan layar penuh (Vignette / Web Interstitial GPT) saat pengunjung berpindah halaman. Ukuran (Sizes) boleh dikosongkan.',
                    },
                    sidebarLeft: {
                      badge: '💻 Desktop Only',
                      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
                      desc: 'Sticky banner di sisi kiri layar khusus pengunjung PC / Laptop.',
                    },
                    sidebarRight: {
                      badge: '💻 Desktop Only',
                      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
                      desc: 'Sticky banner di sisi kanan layar khusus pengunjung PC / Laptop.',
                    },
                  };

                  const meta = slotMeta[slotKey];
                  const presets: Array<[number, number]> = [
                    [300, 250],
                    [336, 280],
                    [320, 50],
                    [320, 100],
                    [300, 50],
                    [300, 300],
                    [300, 600],
                    [160, 600],
                  ];

                  return (
                    <div
                      key={slotKey}
                      className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded">
                              #{index + 1} / 7
                            </span>
                            <span className="font-bold text-sm text-slate-100">{slot.name}</span>
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                              {slot.id}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${meta.badgeClass}`}
                            >
                              {meta.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{meta.desc}</p>
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
                            placeholder={
                              slotKey === 'interstitial'
                                ? 'Kosongkan untuk Out-of-Page Interstitial'
                                : '300x250, 336x280'
                            }
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
              {/* AUTO-ARTICLE GENERATOR STUDIO (OPTION 1: YOUTUBE & OPTION 2: AI TOPIC) */}
              <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-slate-900/90 border border-indigo-500/30 rounded-xl p-5 space-y-5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h2 className="text-base font-bold text-white">
                        Auto-Article Generator (Tanpa Perlu Menulis Manual)
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                        <Zap className="w-3 h-3" />
                        <span>Auto-WebP Cover (data/uploads)</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Buat artikel bahasa Inggris lengkap (500+ kata, aman untuk AdX &amp; kaya keyword CPC tinggi) hanya dengan 1x klik dari <strong>Link YouTube (Opsi 1)</strong> atau <strong>Topik / Ide Acak AI (Opsi 2)</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGeminiKeyBox(!showGeminiKeyBox)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      data.settings.geminiApiKey
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      {data.settings.geminiApiKey
                        ? '✓ Gemini API Key Aktif'
                        : 'Setting Gemini API Key (Opsional)'}
                    </span>
                  </button>
                </div>

                {/* Inline Collapsible Gemini API Key Box */}
                {showGeminiKeyBox && (
                  <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg p-3.5 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Google AI Studio — Gemini API Key (Free Tier tanpa Billing)</span>
                      </span>
                      <a
                        href="https://aistudio.google.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>Buka aistudio.google.com/api-keys</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        value={data.settings.geminiApiKey || ''}
                        onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                        placeholder="Paste API Key Default dari AI Studio (AIzaSy...) — Kosongkan jika ingin memakai AI Gratis bawaan"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          autoSaveSiteData(data, 'Gemini API Key berhasil disimpan!')
                        }
                        className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                      >
                        Simpan API Key
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Jika diisi, generator otomatis memakai model <strong>Google Gemini 2.5 Flash</strong>. Jika dikosongkan, sistem otomatis memakai <strong>Free Cloud AI &amp; Smart Composer</strong>.
                    </p>
                  </div>
                )}

                {/* Common Style Selector */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Gaya Penulisan Artikel:</span>
                  {(
                    [
                      { id: 'review', label: '🏆 Review & Rekomendasi Mainan' },
                      { id: 'story', label: '🏎️ Cerita Seru & Aksi Bermain' },
                      { id: 'guide', label: '💡 Panduan Orang Tua (Buying Guide)' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setGenStyle(st.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        genStyle === st.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                          : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* 2 Columns: Option 1 (From YouTube Link) & Option 2 (From AI Topic / Random) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* OPSI 1: DARI LINK YOUTUBE */}
                  <div className="bg-slate-950/70 border border-red-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                          <PlaySquare className="w-4 h-4 text-red-400" />
                          <span>Opsi 1: Buat Artikel dari Link YouTube</span>
                        </span>
                        <span className="text-[10px] bg-red-500/15 text-red-300 px-2 py-0.5 rounded font-semibold">
                          Auto Judul + Thumb 16:9
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Paste link video YouTube. Sistem otomatis menarik topik &amp; mengompres thumbnail YouTube jadi cover artikel (<code>.webp</code>), lalu menuliskan artikel lengkapnya.
                      </p>
                      <input
                        type="text"
                        value={genYtUrl}
                        onChange={(e) => setGenYtUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            generateArticleAuto('youtube');
                          }
                        }}
                        placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono outline-none"
                      />
                      <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={genAlsoAddVideo}
                          onChange={(e) => setGenAlsoAddVideo(e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-red-600 w-3.5 h-3.5"
                        />
                        <span>Sekalian masukkan videonya ke daftar <strong>Featured Videos</strong></span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => generateArticleAuto('youtube')}
                      disabled={generatingArticle !== null || !genYtUrl.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      {generatingArticle === 'youtube' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menulis Artikel &amp; Kompres Thumbnail...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Artikel dari YouTube</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* OPSI 2: DARI TOPIK / IDE ACAK AI */}
                  <div className="bg-slate-950/70 border border-indigo-500/30 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <span>Opsi 2: AI Topic &amp; Ide Acak Generator</span>
                        </span>
                        <button
                          type="button"
                          onClick={pickRandomTopic}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 cursor-pointer transition-colors"
                        >
                          <Shuffle className="w-3 h-3" />
                          <span>Acak Ide Topik</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ketik topik singkat atau klik <strong>Acak Ide Topik</strong>. AI akan menulis cerita/ulasan baru yang unik beserta foto cover <code>.webp</code> otomatis.
                      </p>
                      <input
                        type="text"
                        value={genTopic}
                        onChange={(e) => setGenTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            generateArticleAuto('topic');
                          }
                        }}
                        placeholder="Contoh: High-Speed 4WD RC Monster Trucks..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => generateArticleAuto('topic')}
                      disabled={generatingArticle !== null || !genTopic.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      {generatingArticle === 'topic' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>AI Sedang Menulis Artikel...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Artikel AI Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Article List & Switcher */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">Daftar Artikel ({data.articles.length})</h2>
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
                            title="Copy URL"
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
                            href={`/${art.slug}`}
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
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <span>Thumbnail / Cover Image Artikel</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            <Zap className="w-3 h-3" />
                            <span>Auto-Compress WebP</span>
                          </span>
                        </label>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400">Level Kompresi:</span>
                          {(
                            [
                              { id: 'fast', label: 'Super Ringan (65%)' },
                              { id: 'optimal', label: 'Optimal Cepat (80%)' },
                              { id: 'hd', label: 'HD Tajam (90%)' },
                            ] as const
                          ).map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setCompressionPreset(preset.id)}
                              className={`px-2 py-0.5 rounded border text-[10px] font-medium transition-colors ${
                                compressionPreset === preset.id
                                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 items-start">
                        <label className="group relative w-44 aspect-video rounded-lg border border-slate-700 overflow-hidden bg-slate-950 shrink-0 cursor-pointer">
                          {currentArticle.ogImage ? (
                            <img
                              src={currentArticle.ogImage}
                              alt="Preview"
                              className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                              No Thumbnail
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 px-2.5 py-1 rounded shadow">
                              <Upload className="w-3 h-3" />
                              <span>
                                {uploadingThumb === 'article_og'
                                  ? 'Mengompres...'
                                  : 'Ganti Gambar'}
                              </span>
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const url = await uploadImageFile(file, 'article_og', 800);
                              if (url) updateArticle(selectedArticleIdx, 'ogImage', url);
                            }}
                          />
                        </label>

                        <div className="flex-1 w-full space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentArticle.ogImage || ''}
                              onChange={(e) =>
                                updateArticle(selectedArticleIdx, 'ogImage', e.target.value)
                              }
                              placeholder="https://... atau klik Upload Gambar"
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none font-mono"
                            />
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 shadow-xs transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {uploadingThumb === 'article_og'
                                  ? 'Mengompres...'
                                  : 'Upload Gambar'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const url = await uploadImageFile(file, 'article_og', 800);
                                  if (url) updateArticle(selectedArticleIdx, 'ogImage', url);
                                }}
                              />
                            </label>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] text-slate-400">
                              Otomatis dikompres &amp; diubah ke format <strong>.webp</strong> saat upload agar loading halaman super cepat.
                            </p>
                            {compressionStats['article_og'] && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                                <Zap className="w-3 h-3" />
                                <span>Hasil: {compressionStats['article_og']}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
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

          {/* TAB 3 (AND ALSO SHOWN BELOW ARTICLE EDITOR): FEATURED VIDEOS & CARDS */}
          {(activeTab === 'featured' || activeTab === 'article') && (
            <div
              className={`bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-6 ${
                activeTab === 'article' ? 'mt-6' : ''
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">
                      Pengelola Featured Videos (YouTube Embed / MP4)
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <Zap className="w-3 h-3" />
                      <span>Auto-WebP 16:9 (data/uploads)</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Daftar video persegi panjang (16:9) di halaman artikel &amp; halaman <code>/watch/[id]</code>. Mendukung embed YouTube (Click-to-Play + Anti-Leak) maupun upload MP4.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFeaturedItem}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kartu Manual</span>
                </button>
              </div>

              {/* Quick-Add YouTube Bar */}
              <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PlaySquare className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-white">
                      Tambah Cepat Video dari Link YouTube (Otomatis Judul + Kompres Thumbnail 16:9 WebP)
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Simpan ke folder: /api/uploads/*.webp
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={ytQuickUrl}
                    onChange={(e) => setYtQuickUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        quickAddYouTubeVideo();
                      }
                    }}
                    placeholder="Paste link YouTube di sini (contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/...)"
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-red-500 rounded-lg px-3.5 py-2 text-xs text-slate-100 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={quickAddYouTubeVideo}
                    disabled={fetchingYt !== null || !ytQuickUrl.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs shrink-0 transition-colors shadow-sm cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {fetchingYt === 'quick'
                        ? 'Mengambil & Mengompres Thumb...'
                        : '+ Ambil dari YouTube'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(data.featuredItems || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start"
                  >
                    <label className="group relative w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0 cursor-pointer">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 px-2.5 py-1 rounded shadow">
                          <Upload className="w-3 h-3" />
                          <span>
                            {uploadingThumb === `feat_${idx}`
                              ? 'Mengompres...'
                              : 'Ganti Thumbnail'}
                          </span>
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadImageFile(file, `feat_${idx}`, 480);
                          if (url) updateFeaturedItem(idx, 'image', url);
                        }}
                      />
                    </label>

                    <div className="flex-1 w-full space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-300">
                            Kartu Video #{idx + 1}
                          </span>
                          {compressionStats[`feat_${idx}`] && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                              <Zap className="w-3 h-3" />
                              <span>{compressionStats[`feat_${idx}`]}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/watch/${item.id || `feat_${idx + 1}`}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[11px] font-semibold"
                          >
                            <PlaySquare className="w-3.5 h-3.5" />
                            <span>Preview Watch Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFeaturedItem(idx)}
                            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-slate-400 mb-1">Judul Kartu / Video</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateFeaturedItem(idx, 'title', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Badge Durasi</label>
                          <input
                            type="text"
                            value={item.duration || '01:45'}
                            onChange={(e) => updateFeaturedItem(idx, 'duration', e.target.value)}
                            placeholder="01:45"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Badge Views</label>
                          <input
                            type="text"
                            value={item.views || '42.8K views'}
                            onChange={(e) => updateFeaturedItem(idx, 'views', e.target.value)}
                            placeholder="42.8K views"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Thumbnail Image (URL atau Upload Auto-WebP)
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.image}
                              onChange={(e) => updateFeaturedItem(idx, 'image', e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                            />
                            <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {uploadingThumb === `feat_${idx}` ? 'Mengompres...' : 'Upload'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const url = await uploadImageFile(file, `feat_${idx}`, 480);
                                  if (url) updateFeaturedItem(idx, 'image', url);
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-400">
                              Link YouTube (Anti-Leak) / File .MP4 (Opsi B)
                            </label>
                            <span className="text-[10px] text-emerald-400">
                              YouTube / MP4 / Auto-Motion
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.videoUrl || ''}
                              onChange={(e) => updateFeaturedItem(idx, 'videoUrl', e.target.value)}
                              placeholder="https://youtube.com/watch?v=... atau upload .mp4"
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => syncYouTubeCard(idx)}
                              disabled={fetchingYt !== null}
                              title="Tarik Judul & Kompres Thumbnail 16:9 dari Link YouTube"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold shrink-0 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>
                                {fetchingYt === `feat_${idx}` ? 'Proses...' : 'Tarik YT'}
                              </span>
                            </button>
                            <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {uploadingThumb === `vid_${idx}` ? 'Uploading...' : 'MP4'}
                              </span>
                              <input
                                type="file"
                                accept="video/mp4,video/webm"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const url = await uploadVideoFile(file, `vid_${idx}`);
                                  if (url) updateFeaturedItem(idx, 'videoUrl', url);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">
                            Deskripsi Singkat di Halaman Video (AdX Policy Safe)
                          </label>
                          <textarea
                            rows={2}
                            value={item.description || ''}
                            onChange={(e) => updateFeaturedItem(idx, 'description', e.target.value)}
                            placeholder="Deskripsi singkat tentang mainan di video ini agar halaman video kaya teks untuk AdX..."
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-400">Target Link saat Kartu Diklik</label>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateFeaturedItem(idx, 'targetUrl', e.target.value);
                                }
                              }}
                              value=""
                              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 border border-slate-700 outline-none"
                            >
                              <option value="">Pilih Target Cepat...</option>
                              <option value={`/watch/${item.id || `feat_${idx + 1}`}`}>
                                ▶ Halaman Video Player (/watch/{item.id || `feat_${idx + 1}`})
                              </option>
                              {data.articles.map((a) => (
                                <option key={a.id} value={`/${a.slug}`}>
                                  📄 Artikel: /{a.slug}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={item.targetUrl || `/watch/${item.id || `feat_${idx + 1}`}`}
                            onChange={(e) => updateFeaturedItem(idx, 'targetUrl', e.target.value)}
                            placeholder={`/watch/${item.id || `feat_${idx + 1}`}`}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">
                            Default mengarah ke <code>/watch/{item.id || `feat_${idx + 1}`}</code> (membuka Video Player + 4 slot iklan AdX baru).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3B: GAMES DATABASE & GAMEMONETIZE 1-CLICK CATALOG */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              {/* Active Games Database */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        Database Game Aktif ({(data.games || []).length} Game)
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                        <Zap className="w-3 h-3" />
                        <span>1:1 Square WebP</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Game di bawah ini tampil di bagian <strong>Featured Games (Persegi 1:1)</strong> pada halaman pengunjung dengan konsep <strong>Click-to-Play</strong>.
                    </p>
                  </div>
                </div>

                {(data.games || []).length === 0 ? (
                  <div className="text-center py-8 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-400">
                    Belum ada game di database. Klik salah satu thumbnail dari katalog <strong>GameMonetize</strong> di bawah untuk menambahkan!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(data.games || []).map((game, idx) => (
                      <div
                        key={game.id || idx}
                        className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-sm"
                      >
                        <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                          <img
                            src={game.image}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shadow">
                            #{idx + 1} • 1:1 WebP
                          </div>
                          {compressionStats[game.id] && (
                            <div className="absolute bottom-2 inset-x-2 px-1.5 py-0.5 rounded bg-black/85 text-emerald-400 text-[9px] font-mono text-center truncate">
                              ⚡ {compressionStats[game.id]}
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 space-y-2 text-xs">
                          <input
                            type="text"
                            value={game.title}
                            onChange={(e) => updateGameItem(idx, 'title', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-white"
                          />
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <Link
                              href={`/play/${game.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:underline"
                            >
                              <span>Preview Play</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeGameFromDb(idx)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[10px] font-semibold"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GameMonetize Live Catalog Browser (Click Thumbnail to Add/Remove) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5 text-emerald-400" />
                      <span>Katalog GameMonetize.com (Klik Thumbnail untuk Pilih)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik langsung pada gambar thumbnail game di bawah untuk <strong>otomatis mengunduh, memotong ke Persegi 1:1 (300×300), mengompres ke WebP di <code>data/uploads/</code>, dan menyimpannya ke Database Game</strong>!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fetchGameCatalog(gmCategory, gmQuery, gmPage)}
                    disabled={gmLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${gmLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Katalog</span>
                  </button>
                </div>

                {/* Filter Kategori & Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['Racing', 'Driving', 'Arcade', 'Action', 'Hypercasual', '3D', 'Boys', 'All'].map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setGmCategory(cat);
                            setGmPage(1);
                            fetchGameCatalog(cat, gmQuery, 1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            gmCategory === cat
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchGameCatalog(gmCategory, gmQuery, 1);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={gmQuery}
                        onChange={(e) => setGmQuery(e.target.value)}
                        placeholder="Cari: car, truck, drift..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Cari
                    </button>
                  </form>
                </div>

                {/* Grid Thumbnail Katalog GameMonetize */}
                {gmLoading ? (
                  <div className="py-14 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Mengambil daftar game dari GameMonetize.com...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {gmCatalog.map((gm) => {
                      const isAdded = (data.games || []).some(
                        (g) => g.id === `gm_${gm.id}` || g.embedUrl === gm.url
                      );
                      const isCompressing = compressingGameId === gm.id;

                      return (
                        <button
                          key={gm.id}
                          type="button"
                          onClick={() => toggleGameFromCatalog(gm)}
                          disabled={Boolean(compressingGameId)}
                          className={`group relative text-left rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex flex-col ${
                            isAdded
                              ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                          }`}
                        >
                          <div className="relative aspect-square w-full bg-slate-900 overflow-hidden">
                            <img
                              src={gm.thumb}
                              alt={gm.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Status Overlay */}
                            {isCompressing ? (
                              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-2 text-center gap-1.5">
                                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-300">
                                  Kompres WebP 1:1...
                                </span>
                              </div>
                            ) : isAdded ? (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Terpilih</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold shadow-lg">
                                  + Klik Tambah
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-2.5">
                            <p className="text-xs font-bold text-slate-100 truncate">{gm.title}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {gm.category || 'Racing'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Halaman Katalog #{gmPage}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={gmPage <= 1 || gmLoading}
                      onClick={() => {
                        const prev = Math.max(1, gmPage - 1);
                        setGmPage(prev);
                        fetchGameCatalog(gmCategory, gmQuery, prev);
                      }}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
                    >
                      &larr; Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={gmLoading}
                      onClick={() => {
                        const next = gmPage + 1;
                        setGmPage(next);
                        fetchGameCatalog(gmCategory, gmQuery, next);
                      }}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
                    >
                      Berikutnya &rarr;
                    </button>
                  </div>
                </div>
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
                        placeholder="toys.gledeg.com"
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

                {/* Google AI Studio / Gemini API Key */}
                <div className="border border-amber-500/30 bg-slate-950/60 rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm text-amber-300 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>Google AI Studio — Gemini API Key (Free Tier)</span>
                    </h3>
                    <a
                      href="https://aistudio.google.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Ambil API Key di aistudio.google.com/api-keys</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <label className="block text-slate-400">
                      Gemini API Key Default (Tanpa Billing — Menggunakan Model <code>gemini-2.5-flash</code>)
                    </label>
                    <input
                      type="password"
                      value={data.settings.geminiApiKey || ''}
                      onChange={(e) => updateSetting('geminiApiKey', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono"
                      placeholder="AIzaSy... (Kosongkan jika ingin memakai AI Gratis bawaan)"
                    />
                    <p className="text-[11px] text-slate-500">
                      Digunakan untuk fitur <strong>Auto-Article Generator (Opsi 1 &amp; Opsi 2)</strong> di tab Articles. Jangan lupa klik <strong>Save All Changes</strong> setelah mengisi.
                    </p>
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
