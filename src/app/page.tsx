import { Suspense } from 'react';
import { connection } from 'next/server';
import { getSiteData } from '@/lib/storage';
import { ArticlePageContent } from '@/components/ArticlePageContent';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const data = getSiteData();
  const article = data.articles[0];
  return {
    title: article ? `${article.title} - ${data.settings.siteName}` : data.settings.siteName,
    description: article?.metaDescription || data.settings.siteName,
    openGraph: {
      title: article?.title,
      description: article?.metaDescription,
      images: article?.ogImage ? [{ url: article?.ogImage }] : [],
    },
  };
}

async function DynamicHomeContent() {
  await connection();
  const siteData = getSiteData();
  return <ArticlePageContent initialData={siteData} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading...</div>}>
      <DynamicHomeContent />
    </Suspense>
  );
}
