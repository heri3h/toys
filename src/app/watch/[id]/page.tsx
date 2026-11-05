import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { getSiteData } from '@/lib/storage';
import { VideoWatchContent } from '@/components/VideoWatchContent';
import { Metadata } from 'next';

interface WatchPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const siteData = getSiteData();
  const list = siteData.featuredItems || [];
  const item = list.find((f) => f.id === id) || list[0];

  if (!item) {
    return { title: 'Toy Videos' };
  }

  return {
    title: `${item.title} - ${siteData.settings.siteName}`,
    description:
      item.description ||
      `Watch ${item.title} and explore the best toy cars, RC trucks, and racing sets for kids.`,
    openGraph: {
      title: item.title,
      images: item.image ? [{ url: item.image }] : [],
    },
  };
}

async function DynamicWatchReader({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  await connection();
  const { id } = await paramsPromise;
  const siteData = getSiteData();
  const list = siteData.featuredItems || [];

  const currentIdx = Math.max(
    0,
    list.findIndex((f) => f.id === id)
  );
  const currentVideo = list[currentIdx] || {
    id: 'feat_1',
    title: 'Car Toys That Make Playtime Awesome',
    image:
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    duration: '01:48',
    views: '42.8K views',
  };

  const nextVideo = list[(currentIdx + 1) % Math.max(1, list.length)] || currentVideo;
  const otherVideos = list.filter((_, idx) => idx !== currentIdx);

  return (
    <VideoWatchContent
      siteData={siteData}
      currentVideo={currentVideo}
      nextVideo={nextVideo}
      otherVideos={otherVideos.length > 0 ? otherVideos : [currentVideo]}
    />
  );
}

export default function WatchPage({ params }: WatchPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-3 border-gray-300 border-t-red-600 animate-spin" />
        </div>
      }
    >
      <DynamicWatchReader paramsPromise={params} />
    </Suspense>
  );
}
