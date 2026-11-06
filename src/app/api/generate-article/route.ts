import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getSiteData } from '@/lib/storage';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

const CURATED_TOY_IMAGES = [
  'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=1000&q=85',
];

const AUTHORS = [
  'Emma Reynolds',
  'Lucas Bennett',
  'Sophia Carter',
  'Daniel Brooks',
  'Olivia Mitchell',
];

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 65);
}

async function downloadAndCompressToWebP(
  imageUrls: string[],
  prefix: string
): Promise<{ url: string; summary: string }> {
  let imgBuffer: Buffer | null = null;
  let fallbackUrl = imageUrls[0] || CURATED_TOY_IMAGES[0];

  for (const candidate of imageUrls) {
    try {
      const res = await fetch(candidate, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ToysPortal/1.0)',
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 1500) {
          imgBuffer = Buffer.from(ab);
          fallbackUrl = candidate;
          break;
        }
      }
    } catch {
      // try next candidate
    }
  }

  if (!imgBuffer) {
    return { url: fallbackUrl, summary: 'External image fallback' };
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const originalSize = imgBuffer.byteLength;
  const webpBuffer = await sharp(imgBuffer)
    .resize(640, 360, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: 78, effort: 5 })
    .toBuffer();

  const compressedSize = webpBuffer.byteLength;
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'art';
  const filename = `${safePrefix}-${Date.now().toString(36)}.webp`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), webpBuffer);

  const savedPct =
    originalSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  return {
    url: `/api/uploads/${filename}`,
    summary: `${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB WebP (-${savedPct}%)`,
  };
}

interface GeneratedArticleFields {
  title: string;
  subtitle: string;
  metaDescription: string;
  category: string;
  readingTime: string;
  author: string;
  content: string;
}

function buildSystemPrompt(
  topicOrTitle: string,
  style: 'review' | 'story' | 'guide',
  ytAuthor?: string
): string {
  const styleDesc =
    style === 'review'
      ? 'an enthusiastic, detailed hands-on toy review and top picks showcase'
      : style === 'story'
        ? 'an exciting, family-friendly playtime adventure story and indoor/outdoor racing showcase'
        : 'a comprehensive parent buying guide focusing on STEM learning, durability, battery tech, and age-appropriate safety';

  return `You are a professional family & toy magazine editor writing for a premium English web portal about toy cars, RC vehicles, monster trucks, track sets, and educational STEM playsets.
Write ${styleDesc} based on this topic/video subject: "${topicOrTitle}"${ytAuthor ? ` (inspired by creator/channel: ${ytAuthor})` : ''}.

Requirements for Google AdX compliance & high eCPM contextual value:
1. Write 450 to 600 words of original, engaging, family-safe English content.
2. Naturally weave in high-value contextual keywords (e.g. rechargeable 2.4GHz RC system, STEM motor skills, die-cast alloy chassis, hobby-grade suspension, family bonding, obstacle course).
3. The HTML "content" field MUST start with an engaging opening paragraph wrapped in:
   <p class="lead font-medium text-lg text-gray-700 leading-relaxed mb-6">...</p>
   (This first paragraph is crucial because it appears right above the "Read more..." button for visitors).
4. Follow the opening paragraph with 3 or 4 <h2> subheadings (each starting with a relevant emoji like 🏎️, 🔋, 🏆, 🛠️, or 💡), multiple informative <p> paragraphs, and at least one <ul> with 3-4 <li> bullet points using <strong> bold highlights.
5. Return ONLY valid JSON matching this exact structure (no markdown code fences):
{
  "title": "Catchy, click-worthy headline (50-75 characters)",
  "subtitle": "Compelling 1-sentence subtitle summarizing the article",
  "metaDescription": "SEO meta description (130-155 characters)",
  "category": "RC & Toy Cars",
  "readingTime": "4 min read",
  "author": "Emma Reynolds",
  "content": "<p class=\\"lead font-medium text-lg text-gray-700 leading-relaxed mb-6\\">...</p><h2>...</h2><p>...</p>"
}`;
}

function parseJsonSafely(rawText: string): GeneratedArticleFields | null {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    const jsonSlice = cleaned.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonSlice);
    if (parsed && typeof parsed.title === 'string' && typeof parsed.content === 'string') {
      return {
        title: parsed.title,
        subtitle:
          parsed.subtitle ||
          'Discover why kids and collectors love these high-energy toy vehicles and track sets.',
        metaDescription:
          parsed.metaDescription ||
          parsed.subtitle ||
          'Explore top-rated toy cars, RC trucks, and creative racing playsets for kids of all ages.',
        category: parsed.category || 'Toys & Games',
        readingTime: parsed.readingTime || '4 min read',
        author: parsed.author || AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
        content: parsed.content,
      };
    }
  } catch {
    // ignore parse error
  }
  return null;
}

async function generateWithGemini(
  apiKey: string,
  prompt: string
): Promise<{ data: GeneratedArticleFields; modelUsed: string } | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            responseMimeType: 'application/json',
          },
        }),
        cache: 'no-store',
      });

      if (!res.ok) continue;
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string') {
        const parsed = parseJsonSafely(text);
        if (parsed) {
          return { data: parsed, modelUsed: `Google ${model}` };
        }
      }
    } catch {
      // try next model
    }
  }
  return null;
}

async function generateWithFreeAi(
  prompt: string
): Promise<{ data: GeneratedArticleFields; modelUsed: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful magazine editor that outputs only valid JSON objects.',
          },
          { role: 'user', content: prompt },
        ],
        model: 'openai',
        jsonMode: true,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const parsed = parseJsonSafely(text);
      if (parsed) {
        return { data: parsed, modelUsed: 'AI Writer (Free Cloud)' };
      }
    }
  } catch {
    // fallback to local composer
  }
  return null;
}

function buildSmartLocalArticle(
  rawSubject: string,
  style: 'review' | 'story' | 'guide',
  ytAuthor?: string
): GeneratedArticleFields {
  const cleanSubject = rawSubject
    .replace(/#\w+/g, '')
    .replace(/\|.*$/, '')
    .trim();

  const titleByStyle = {
    review: `${cleanSubject}: Hands-On Review & Performance Guide`,
    story: `Inside the Action: ${cleanSubject} Playtime Adventure`,
    guide: `Parent’s Buying Guide: Choosing the Best ${cleanSubject}`,
  };

  const subtitleByStyle = {
    review: `We tested the speed, suspension durability, and battery life of ${cleanSubject} to see why kids can't stop playing with it.`,
    story: `From living room carpet tracks to backyard obstacle courses, see how ${cleanSubject} turns ordinary afternoons into high-speed fun.`,
    guide: `Everything parents need to know about safety, STEM coordination benefits, and rechargeable power when picking ${cleanSubject}.`,
  };

  const author = AUTHORS[Math.floor(Math.random() * AUTHORS.length)];

  const content = `<p class="lead font-medium text-lg text-gray-700 leading-relaxed mb-6">When it comes to unforgettable indoor and outdoor play, <strong>${cleanSubject}</strong> stands out as one of the most exciting highlights of the season${ytAuthor ? ` (as featured by <em>${ytAuthor}</em>)` : ''}. Combining rugged build quality, responsive steering, and eye-catching detail, it captures the imagination of young drivers and hobbyists from the very first lap. 🏁</p>

<h2>🏎️ High-Torque Engineering Meets Kid-Friendly Control</h2>
<p>Modern toy vehicles have evolved far beyond simple push-along models. What makes <strong>${cleanSubject}</strong> so engaging is the balance between high-energy speed and intuitive handling. Whether navigating tight hallway corners, climbing overliving-room cushion ramps, or racing head-to-head on modular track sets, the chassis stays planted and predictable.</p>
<p>Parents and educators frequently point out that active vehicle play is more than just entertainment—it naturally builds spatial awareness, hand-eye coordination, and early STEM curiosity about gears, friction, and momentum.</p>

<h2>🔋 Key Features That Make It a Crowd Favorite</h2>
<p>Before adding a new vehicle or playset to your collection, it helps to look closely at the engineering details that separate premium toys from basic plastic models:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
  <li><strong>Impact-Resistant ABS &amp; Alloy Frame:</strong> Designed to absorb bumps, jumps, and crash landings without cracking or losing wheel alignment.</li>
  <li><strong>All-Terrain Grip Tires:</strong> High-traction rubberized treads transition smoothly from hardwood floors and tiles to backyard grass and pavement.</li>
  <li><strong>Interference-Free 2.4GHz &amp; Friction Power:</strong> Allows multiple cars to race side-by-side simultaneously without signal cross-talk or lag.</li>
  <li><strong>Long-Lasting Rechargeable Fun:</strong> Quick USB charging packs deliver extended playtime sessions so the adventure never ends early.</li>
</ul>

<h2>🛠️ Creative Ways to Build a Home Obstacle Course</h2>
<p>One of the best ways to maximize playtime with <strong>${cleanSubject}</strong> is setting up custom challenges around the house. Using everyday items like cardboard tunnels, hardcover books as incline ramps, and plastic cups as slalom cones, kids can design their own championship circuits in minutes.</p>
<p>Timing each run with a stopwatch or hosting family tournament brackets encourages friendly competition, problem-solving, and hours of screen-free excitement.</p>

<h2>💡 Final Verdict: Who Will Love It Most?</h2>
<p>Whether you are shopping for a birthday centerpiece, upgrading a weekend RC fleet, or looking for an engaging toy that keeps kids active, <strong>${cleanSubject}</strong> delivers outstanding value and replayability. Watch the featured video clips and try our interactive racing games below to see even more action!</p>`;

  return {
    title: titleByStyle[style],
    subtitle: subtitleByStyle[style],
    metaDescription: subtitleByStyle[style].slice(0, 155),
    category: style === 'guide' ? 'Buying Guide' : 'RC & Toy Cars',
    readingTime: '4 min read',
    author,
    content,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      source = 'topic',
      youtubeUrl = '',
      topic = '',
      style = 'review',
      alsoAddToFeaturedVideos = true,
      geminiApiKey: bodyApiKey,
    } = body as {
      source?: 'youtube' | 'topic';
      youtubeUrl?: string;
      topic?: string;
      style?: 'review' | 'story' | 'guide';
      alsoAddToFeaturedVideos?: boolean;
      geminiApiKey?: string;
    };

    const siteData = getSiteData();
    const activeGeminiKey = (bodyApiKey ?? siteData.settings.geminiApiKey ?? '').trim();

    let subjectText = topic.trim();
    let ytAuthor = '';
    let ytId: string | null = null;
    let cleanWatchUrl = '';
    let coverResult: { url: string; summary: string };

    if (source === 'youtube') {
      ytId = extractYouTubeId(youtubeUrl);
      if (!ytId) {
        return NextResponse.json(
          { error: 'Link YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=...' },
          { status: 400 }
        );
      }

      cleanWatchUrl = `https://www.youtube.com/watch?v=${ytId}`;
      subjectText = `Awesome Toy Car Action (${ytId})`;

      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanWatchUrl)}&format=json`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ToysPortal/1.0)' },
            cache: 'no-store',
          }
        );
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.title) subjectText = oembedData.title;
          if (oembedData.author_name) ytAuthor = oembedData.author_name;
        }
      } catch {
        // ignore oEmbed error
      }

      coverResult = await downloadAndCompressToWebP(
        [
          `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`,
          `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        ],
        `yt-art-${ytId}`
      );
    } else {
      if (!subjectText) {
        return NextResponse.json(
          { error: 'Masukkan topik artikel atau klik tombol Ide Topik Acak.' },
          { status: 400 }
        );
      }

      const randomImg =
        CURATED_TOY_IMAGES[Math.floor(Math.random() * CURATED_TOY_IMAGES.length)];
      coverResult = await downloadAndCompressToWebP([randomImg], 'ai-art');
    }

    const prompt = buildSystemPrompt(subjectText, style, ytAuthor);

    // 3-Tier Generation Cascade:
    // 1. Google Gemini API (if key configured)
    // 2. Pollinations Free AI (no key required)
    // 3. Smart Dynamic Composer (instant fallback)
    let generated: GeneratedArticleFields | null = null;
    let engineUsed = 'Smart Composer';

    if (activeGeminiKey) {
      const geminiRes = await generateWithGemini(activeGeminiKey, prompt);
      if (geminiRes) {
        generated = geminiRes.data;
        engineUsed = geminiRes.modelUsed;
      }
    }

    if (!generated) {
      const freeAiRes = await generateWithFreeAi(prompt);
      if (freeAiRes) {
        generated = freeAiRes.data;
        engineUsed = freeAiRes.modelUsed;
      }
    }

    if (!generated) {
      generated = buildSmartLocalArticle(subjectText, style, ytAuthor);
      engineUsed = 'Smart Local Engine';
    }

    const newId = String(Date.now());
    const articleSlug = `${slugify(generated.title || subjectText)}-${newId.slice(-4)}`;
    const publishedDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const newArticle = {
      id: newId,
      slug: articleSlug,
      title: generated.title,
      subtitle: generated.subtitle,
      metaDescription: generated.metaDescription,
      ogImage: coverResult.url,
      category: generated.category,
      readingTime: generated.readingTime,
      publishedDate,
      author: generated.author,
      content: generated.content,
    };

    let youtubeVideoCard = null;
    if (source === 'youtube' && ytId && alsoAddToFeaturedVideos) {
      const vidId = `feat_${Date.now()}`;
      youtubeVideoCard = {
        id: vidId,
        title: subjectText,
        image: coverResult.url,
        videoUrl: cleanWatchUrl,
        targetUrl: `/watch/${vidId}`,
        duration: '03:15',
        views: `${(Math.floor(Math.random() * 75) + 18).toFixed(1)}K views`,
        description: generated.subtitle,
      };
    }

    return NextResponse.json({
      success: true,
      engineUsed,
      compressionSummary: coverResult.summary,
      article: newArticle,
      youtubeVideoCard,
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json({ error: 'Gagal membuat artikel otomatis' }, { status: 500 });
  }
}
