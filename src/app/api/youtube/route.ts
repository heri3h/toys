import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

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
