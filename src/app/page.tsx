import { Suspense } from 'react';
import { getSiteData } from '@/lib/storage';
import { ArticlePageContent } from '@/components/ArticlePageContent';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const data = getSiteData();
  const article = data.articles[0];
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const siteData = getSiteData();
  const resolvedSearchParams = await searchParams;
  const gclidParam = resolvedSearchParams?.gclid;
  const isAdTraffic = Boolean(gclidParam);

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading site...</div>}>
      <ArticlePageContent initialData={siteData} isAdTrafficInitial={isAdTraffic} />
    </Suspense>
  );
}
