import { Suspense } from 'react';
import { connection } from 'next/server';
import { getSiteData } from '@/lib/storage';
import { ArticlePageContent } from '@/components/ArticlePageContent';
import type { Metadata } from 'next';

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const data = getSiteData();
  const article = data.articles.find((a) => a.slug === slug) || data.articles[0];

  return {
    title: article ? `${article.title} - ${data.settings.siteName}` : data.settings.siteName,
    description: article?.metaDescription || data.settings.siteName,
    openGraph: {
      title: article?.title,
      description: article?.metaDescription,
      images: article?.ogImage ? [{ url: article.ogImage }] : [],
    },
  };
}

async function DynamicSlugContent({ params }: SlugPageProps) {
  await connection();
  const { slug } = await params;
  const siteData = getSiteData();
  return <ArticlePageContent initialData={siteData} activeSlug={slug} />;
}

export default function ArticleSlugPage({ params }: SlugPageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading...</div>}>
      <DynamicSlugContent params={params} />
    </Suspense>
  );
}
