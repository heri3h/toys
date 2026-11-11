import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

sharp.cache(false);
sharp.concurrency(1);

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

function extractYouTubeId(input?: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export interface YouTubeSearchResultItem {
  videoId: string;
  url: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  published: string;
  description: string;
  thumbnail: string;
}

function collectVideoRenderers(node: any, out: any[] = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.videoRenderer && node.videoRenderer.videoId) {
    out.push(node.videoRenderer);
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectVideoRenderers(item, out);
    }
  } else {
    for (const key of Object.keys(node)) {
      collectVideoRenderers(node[key], out);
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get('q') || 'rc monster truck toy cars').trim();
    const query = rawQuery || 'rc monster truck toy cars';

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query
    )}&sp=EgIQAQ%253D%253D`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Gagal menghubungi pencarian YouTube.' },
        { status: 502 }
      );
    }

    const html = await res.text();
    const match =
      html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/) ||
      html.match(/window\["ytInitialData"\]\s*=\s*(\{[\s\S]*?\});/);

    if (!match || !match[1]) {
      return NextResponse.json({ items: [] });
    }

    const initialData = JSON.parse(match[1]);
    const renderers = collectVideoRenderers(initialData);

    const seen = new Set<string>();
    const items: YouTubeSearchResultItem[] = [];

    for (const v of renderers) {
      const videoId = String(v.videoId || '').trim();
      if (!videoId || seen.has(videoId)) continue;

      const duration =
        v.lengthText?.simpleText ||
        v.thumbnailOverlays?.find((o: any) => o.thumbnailOverlayTimeStatusRenderer)
          ?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ||
        '';

      // Skip live broadcasts without duration
      if (!duration) continue;

      seen.add(videoId);

      const title =
        v.title?.runs?.map((r: any) => r.text).join('') ||
        v.title?.simpleText ||
        `YouTube Video (${videoId})`;

      const channel =
        v.ownerText?.runs?.[0]?.text ||
        v.longBylineText?.runs?.[0]?.text ||
        v.shortBylineText?.runs?.[0]?.text ||
        'YouTube';

      const views =
        v.shortViewCountText?.simpleText ||
        v.viewCountText?.simpleText ||
        '';

      const published = v.publishedTimeText?.simpleText || '';

      const snippetRuns =
        v.detailedMetadataSnippets?.[0]?.snippetText?.runs ||
        v.descriptionSnippet?.runs ||
        [];
      const description = snippetRuns.map((r: any) => r.text).join('').trim();

      items.push({
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title,
        channel,
        duration,
        views,
        published,
        description,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });

      if (items.length >= 18) break;
    }

    return NextResponse.json({ items, query });
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return NextResponse.json(
      { error: 'Gagal mencari video dari YouTube.', items: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    const ytId = extractYouTubeId(url);
    if (!ytId) {
      return NextResponse.json(
        { error: 'Link atau ID YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { status: 400 }
      );
    }

    const cleanWatchUrl = `https://www.youtube.com/watch?v=${ytId}`;

    // 1. Fetch Title & Author via YouTube oEmbed
    let title = `YouTube Video (${ytId})`;
    let author = '';
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanWatchUrl)}&format=json`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ToysPortal/1.0)',
          },
          cache: 'no-store',
        }
      );
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) title = oembedData.title;
        if (oembedData.author_name) author = oembedData.author_name;
      }
    } catch {
      // Fallback if oEmbed fails
    }

    // 2. Download best available YouTube thumbnail & compress to 16:9 WebP in data/uploads/
    const candidateThumbUrls = [
      `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`,
      `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
    ];

    let imgBuffer: Buffer | null = null;
    for (const thumbCandidate of candidateThumbUrls) {
      try {
        const res = await fetch(thumbCandidate, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ToysPortal/1.0)',
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          if (arrayBuffer.byteLength > 1500) {
            imgBuffer = Buffer.from(arrayBuffer);
            break;
          }
        }
      } catch {
        // Try next candidate
      }
    }

    let thumbnailUrl = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
    let originalSize = 0;
    let compressedSize = 0;
    let summary = '';

    if (imgBuffer) {
      originalSize = imgBuffer.byteLength;
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      // Compress and crop to strict 16:9 rectangular WebP (640x360)
      const webpBuffer = await sharp(imgBuffer)
        .resize(640, 360, {
          fit: 'cover',
          position: 'centre',
        })
        .webp({ quality: 78, effort: 5 })
        .toBuffer();

      compressedSize = webpBuffer.byteLength;
      const safeId = ytId.replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `yt-${safeId}-${Date.now().toString(36)}.webp`;
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, webpBuffer);

      thumbnailUrl = `/api/uploads/${filename}`;
      const savedPct =
        originalSize > 0
          ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
          : 0;
      summary = `${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB WebP 16:9 (-${savedPct}%)`;
    }

    return NextResponse.json({
      success: true,
      ytId,
      videoUrl: cleanWatchUrl,
      title,
      author,
      thumbnailUrl,
      originalSize,
      compressedSize,
      summary,
    });
  } catch (error) {
    console.error('Error processing YouTube URL:', error);
    return NextResponse.json({ error: 'Gagal memproses link YouTube' }, { status: 500 });
  }
}
