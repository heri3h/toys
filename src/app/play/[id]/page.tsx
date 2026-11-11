import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { getSiteData } from '@/lib/storage';
import { GamePlayContent } from '@/components/GamePlayContent';
import { Metadata } from 'next';

interface PlayPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PlayPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const siteData = getSiteData();
  const list = siteData.games || [];
  const game = list.find((g) => g.id === id) || list[0];

  if (!game) {
    return { title: 'Play Games' };
  }

  return {
    title: `Play ${game.title} - ${siteData.settings.siteName}`,
    description:
      game.description ||
      `Play ${game.title} online for free in your browser. No download required!`,
    openGraph: {
      title: game.title,
      images: game.image ? [{ url: game.image }] : [],
    },
  };
}

async function DynamicGameReader({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  await connection();
  const { id } = await paramsPromise;
  const siteData = getSiteData();
  const list = siteData.games || [];

  const currentIdx = Math.max(
    0,
    list.findIndex((g) => g.id === id)
  );
  const currentGame = list[currentIdx] || {
    id: 'gm_car_stunt_1',
    title: 'Mega Ramp Car Stunts 3D',
    image:
      'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=400&h=400&q=80',
    embedUrl: 'https://html5.gamemonetize.com/7y2r8p9x3v4m1n6q5w8e2r4t6y8u0i1o/',
    category: 'Racing',
    plays: '64.2K plays',
    description:
      'Experience high-flying monster truck and supercar jumps across sky-high mega ramps!',
    instructions: 'Use Arrow Keys or WASD to drive and steer.',
  };

  const otherGames = list.filter((_, idx) => idx !== currentIdx);

  return (
    <GamePlayContent
      siteData={siteData}
      currentGame={currentGame}
      otherGames={otherGames.length > 0 ? otherGames : [currentGame]}
      requestedId={id}
    />
  );
}

export default function PlayGamePage({ params }: PlayPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-gray-300 border-t-emerald-600 animate-spin" />
        </div>
      }
    >
      <DynamicGameReader paramsPromise={params} />
    </Suspense>
  );
}
