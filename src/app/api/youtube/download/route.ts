import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoIdOrUrl = searchParams.get('videoId') || searchParams.get('url') || '';
    const rawTitle = searchParams.get('title') || 'youtube-thumbnail';

    const ytId = extractYouTubeId(videoIdOrUrl);
    if (!ytId) {
      return NextResponse.json(
        { error: 'ID atau URL YouTube tidak valid.' },
        { status: 400 }
      );
    }

    // Try best available thumbnail resolution from YouTube
    // maxresdefault is 1280x720, sddefault is 640x480, hqdefault is 480x360
    const candidateUrls = [
      `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`,
      `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
    ];

    let imageBuffer: ArrayBuffer | null = null;
    let chosenUrl = '';

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          // YouTube returns a 1097-byte placeholder when maxres is unavailable
          if (buf.byteLength > 1500) {
            imageBuffer = buf;
            chosenUrl = url;
            break;
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    if (!imageBuffer) {
      return NextResponse.json(
        { error: 'Gagal mengunduh thumbnail dari server YouTube.' },
        { status: 404 }
      );
    }

    const cleanTitle = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || `youtube-${ytId}`;

    const filename = `${cleanTitle}-thumbnail.jpg`;

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Error downloading YouTube thumbnail:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses unduhan thumbnail.' },
      { status: 500 }
    );
  }
}
