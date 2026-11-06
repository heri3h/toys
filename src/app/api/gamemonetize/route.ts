import { NextResponse, connection } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

sharp.cache(false);
sharp.concurrency(1);

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

export interface RawGameMonetizeItem {
  id: string;
  title: string;
  description: string;
  instructions: string;
  url: string;
  category: string;
  tags: string;
  thumb: string;
  width: string;
  height: string;
}

const FALLBACK_GAMES: RawGameMonetizeItem[] = [
  {
    id: 'gm_car_stunt_1',
    title: 'Mega Ramp Car Stunts 3D',
    description:
      'Experience high-flying monster truck and supercar jumps across sky-high mega ramps! Choose your favorite turbo racing car, hit the nitro booster, and land impossible 360-degree flips.',
    instructions: 'Use Arrow Keys or WASD to drive and steer. Press Spacebar for handbrake and Shift for Nitro Boost.',
    url: 'https://html5.gamemonetize.com/7y2r8p9x3v4m1n6q5w8e2r4t6y8u0i1o/',
    category: 'Racing',
    tags: 'Car, Racing, Stunt, 3D, Monster Truck',
    thumb: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=500&q=80',
    width: '800',
    height: '600',
  },
  {
    id: 'gm_rc_drift_2',
    title: 'Toy Car Drift Racers',
    description:
      'Race miniature RC toy cars around bedroom tracks, kitchen tables, and backyard obstacle courses! Collect coins to unlock faster monster trucks and sleek sports cars.',
    instructions: 'Tap Left/Right on mobile or use Arrow Keys on desktop to drift around sharp corners.',
    url: 'https://html5.gamemonetize.com/3k9m2n4b6v8c1x5z7l0p9o8i7u6y5t4r/',
    category: 'Racing',
    tags: 'Toy, Car, Drift, Kids, Arcade',
    thumb: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=500&q=80',
    width: '800',
    height: '600',
  },
  {
    id: 'gm_monster_truck_3',
    title: 'Offroad Monster Truck Hero',
    description:
      'Crush obstacles with giant suspension tires in this action-packed monster truck driving game! Climb steep hills, cross muddy rivers, and reach the finish line without flipping over.',
    instructions: 'Use Gas and Brake pedals on screen or Up/Down Arrow Keys to balance your truck.',
    url: 'https://html5.gamemonetize.com/9p0o8i7u6y5t4r3e2w1q0z9x8c7v6b5n/',
    category: 'Driving',
    tags: 'Monster Truck, Driving, Offroad, Boys',
    thumb: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80',
    width: '800',
    height: '600',
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export async function GET(req: Request) {
  await connection();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'All';
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const page = searchParams.get('page') || '1';

  try {
    // GameMonetize feed.php expects numeric category IDs or no category param;
    // passing a string like category=Racing returns []. So we fetch a larger batch
    // and filter by the textual `category` and `tags` fields returned in JSON.
    const feedUrl = new URL('https://gamemonetize.com/feed.php');
    feedUrl.searchParams.set('format', '0');
    feedUrl.searchParams.set('num', '200');
    feedUrl.searchParams.set('page', page);

    const res = await fetch(feedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ToysPortal/1.0)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`GameMonetize HTTP ${res.status}`);
    }

    const rawList = (await res.json()) as RawGameMonetizeItem[];
    let items = Array.isArray(rawList) && rawList.length > 0 ? rawList : FALLBACK_GAMES;

    if (category && category !== 'All') {
      const catLower = category.toLowerCase();
      const filteredByCat = items.filter(
        (g) =>
          g.category?.toLowerCase().includes(catLower) ||
          g.tags?.toLowerCase().includes(catLower)
      );
      if (filteredByCat.length > 0) {
        items = filteredByCat;
      }
    }

    if (query) {
      items = items.filter(
        (g) =>
          g.title?.toLowerCase().includes(query) ||
          g.tags?.toLowerCase().includes(query) ||
          g.category?.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      items: items.slice(0, 60),
    });
  } catch (err) {
    console.error('GameMonetize feed fetch error, using fallback:', err);
    return NextResponse.json({
      success: true,
      items: FALLBACK_GAMES,
      fallback: true,
    });
  }
}

/**
 * POST /api/gamemonetize
 * Downloads a GameMonetize thumbnail, crops/resizes it to a 300x300 1:1 square,
 * compresses it to WebP in the unified `data/uploads/` folder, and returns the local URL.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, thumbUrl } = body as { id: string; thumbUrl: string };

    if (!thumbUrl) {
      return NextResponse.json({ error: 'Missing thumbUrl' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const safeId = String(id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `game-${safeId}-${Date.now().toString(36)}.webp`;
    const filePath = path.join(UPLOADS_DIR, filename);

    const imgRes = await fetch(thumbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ToysPortal/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!imgRes.ok) {
      throw new Error(`Failed to fetch thumbnail: ${imgRes.status}`);
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const originalSize = inputBuffer.length;

    // Resize & center-crop to a crisp 1:1 Square (300x300) and compress to WebP
    const outputBuffer = await sharp(inputBuffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer();

    fs.writeFileSync(filePath, outputBuffer);

    const compressedSize = outputBuffer.length;
    const savedPct =
      originalSize > 0
        ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
        : 0;

    return NextResponse.json({
      success: true,
      url: `/api/uploads/${filename}`,
      originalSize,
      compressedSize,
      summary: `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} WebP (-${savedPct}%)`,
    });
  } catch (err) {
    console.error('Error compressing GameMonetize thumbnail:', err);
    return NextResponse.json(
      { error: 'Failed to download and compress game thumbnail' },
      { status: 500 }
    );
  }
}
