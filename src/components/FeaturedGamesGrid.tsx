'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameItem } from '@/types';
import { Gamepad2, Play } from 'lucide-react';

interface FeaturedGamesGridProps {
  games: GameItem[];
  title?: string;
  badgeText?: string;
  excludeGameId?: string;
}

const BATCH_SIZE = 8; // 4 columns x 2 rows = 8 games per batch

export const FeaturedGamesGrid: React.FC<FeaturedGamesGridProps> = ({
  games,
  title = 'Featured Games (Instant Play)',
  badgeText = 'No Download',
  excludeGameId,
}) => {
  const savedIdsRef = useRef<Set<string>>(new Set((games || []).map((g) => g.id)));

  // Filter out current game if on /play/[id]
  const baseGames = React.useMemo(() => {
    const list = games || [];
    if (!excludeGameId) return list;
    const filtered = list.filter((g) => g.id !== excludeGameId);
    return filtered.length > 0 ? filtered : list;
  }, [games, excludeGameId]);

  const [allGames, setAllGames] = useState<GameItem[]>(() => baseGames);
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [apiPage, setApiPage] = useState<number>(1);
  const [hasMoreApi, setHasMoreApi] = useState<boolean>(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Shuffle games on client mount or when baseGames / excludeGameId changes
  useEffect(() => {
    savedIdsRef.current = new Set((games || []).map((g) => g.id));
    const shuffled = [...baseGames].sort(() => Math.random() - 0.5);
    setAllGames(shuffled);
    setVisibleCount(BATCH_SIZE);
    setApiPage(1);
    setHasMoreApi(true);
  }, [baseGames, games]);

  // Fetch additional games from /api/gamemonetize when user scrolls past local saved games
  const fetchMoreFromFeed = useCallback(
    async (pageToFetch: number) => {
      if (isLoadingMore || !hasMoreApi) return;
      setIsLoadingMore(true);
      try {
        const res = await fetch(
          `/api/gamemonetize?category=Racing&page=${pageToFetch}`
        );
        if (!res.ok) {
          setHasMoreApi(false);
          return;
        }
        const data = await res.json();
        const rawItems = Array.isArray(data?.items) ? data.items : [];
        if (rawItems.length === 0) {
          setHasMoreApi(false);
          return;
        }

        const mapped: GameItem[] = rawItems.map(
          (item: {
            id: string;
            title: string;
            thumb: string;
            url: string;
            category?: string;
            description?: string;
            instructions?: string;
          }) => ({
            id: item.id.startsWith('gm_') ? item.id : `gm_${item.id}`,
            title: item.title,
            image: item.thumb,
            embedUrl: item.url,
            category: item.category || 'Racing',
            description: item.description || '',
            instructions: item.instructions || '',
          })
        );

        setAllGames((prev) => {
          const existingIds = new Set(prev.map((g) => g.id));
          const uniqueNew = mapped
            .filter((g) => !existingIds.has(g.id) && g.id !== excludeGameId)
            .sort(() => Math.random() - 0.5);

          if (uniqueNew.length === 0) {
            setHasMoreApi(false);
            return prev;
          }
          return [...prev, ...uniqueNew];
        });
        setApiPage(pageToFetch + 1);
      } catch {
        setHasMoreApi(false);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [excludeGameId, hasMoreApi, isLoadingMore]
  );

  // Ensure at least 8 games are available initially even if site-data.json has fewer than 8
  useEffect(() => {
    if (allGames.length < BATCH_SIZE && hasMoreApi && !isLoadingMore) {
      fetchMoreFromFeed(1);
    }
  }, [allGames.length, hasMoreApi, isLoadingMore, fetchMoreFromFeed]);

  // IntersectionObserver for Infinite Scroll (+8 games per scroll)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        if (visibleCount < allGames.length) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        } else if (hasMoreApi && !isLoadingMore) {
          fetchMoreFromFeed(apiPage).then(() => {
            setVisibleCount((prev) => prev + BATCH_SIZE);
          });
        }
      },
      { rootMargin: '220px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, allGames.length, hasMoreApi, isLoadingMore, apiPage, fetchMoreFromFeed]);

  const visibleGames = allGames.slice(0, visibleCount);

  if (visibleGames.length === 0 && !isLoadingMore) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <Gamepad2 className="w-4 h-4 text-emerald-600" />
          <span>{title}</span>
        </h3>
        <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
          {badgeText}
        </span>
      </div>

      {/* 4-Column Square 1:1 Grid (8 items per load) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {visibleGames.map((game, idx) => {
          const isSavedInSiteData = savedIdsRef.current.has(game.id);
          let gameHref = `/play/${game.id || idx}`;

          // If dynamically loaded from GameMonetize feed and not yet in siteData.games,
          // pass lightweight metadata so /play/[id] can render the exact game seamlessly
          if (!isSavedInSiteData && game.embedUrl) {
            const params = new URLSearchParams();
            params.set('title', game.title);
            params.set('embed', game.embedUrl);
            params.set('thumb', game.image);
            if (game.category) params.set('cat', game.category);
            gameHref = `/play/${game.id}?${params.toString()}`;
          }

          return (
            <a
              key={`${game.id || idx}-${idx}`}
              href={gameHref}
              className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 border border-gray-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <img
                src={game.image}
                alt={game.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
              />
              {/* Top Play Badge */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600/95 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shadow">
                🎮 Play
              </div>

              {/* Center Hover Play Button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Title Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                <p className="text-white text-[10px] sm:text-xs font-bold truncate">
                  {game.title}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {/* Infinite Scroll Sentinel */}
      {(visibleCount < allGames.length || hasMoreApi) && (
        <div
          ref={sentinelRef}
          className="py-2 flex items-center justify-center text-xs text-gray-400"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-emerald-600 animate-spin" />
              <span>Loading more games...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
