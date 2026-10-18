import fs from 'fs';
import path from 'path';
import { SiteData } from '@/types';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'site-data.json');

const DEFAULT_DATA: SiteData = {
  settings: {
    siteName: "qidtime.com",
    domainUrl: "https://cars-toys.qidtime.com",
    gaMeasurementId: "G-TZ7MNVNL43",
    googleAdsId: "AW-16468268201",
    googleAdsConversionLabel: "kt1RCNLmgpUZEKmp16w9",
    enableAdTrafficOverlay: true,
    overlayTimeoutSeconds: 3,
    mobileAutoScrollToTopAd: true,
    truncateOnAdTrafficOnly: true,
  },
  ads: {
    sidebarLeft: {
      id: "sidebar_left",
      name: "Sidebar Left Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_sidebar_left",
      sizes: [[300, 600], [160, 600], [300, 250]],
      tcpm: "6000",
      enabled: true,
      lazyLoad: false,
    },
    sidebarRight: {
      id: "sidebar_right",
      name: "Sidebar Right Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_sidebar_right",
      sizes: [[300, 600], [160, 600], [300, 250]],
      tcpm: "5000",
      enabled: true,
      lazyLoad: false,
    },
    homeTop: {
      id: "home_top",
      name: "Header / Home Top Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_home_top",
      sizes: [[300, 250], [336, 280], [300, 300], [320, 100]],
      tcpm: "125000",
      enabled: true,
      lazyLoad: false,
    },
    homeMore: {
      id: "home_more",
      name: "Home More (Mid-Article) Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_home_more",
      sizes: [[300, 250], [336, 280]],
      tcpm: "150000",
      enabled: true,
      lazyLoad: true,
    },
    inArticle: {
      id: "in_article",
      name: "In-Article Content Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_content",
      sizes: [[300, 250], [336, 280]],
      tcpm: "80000",
      enabled: true,
      lazyLoad: true,
    },
    anchorBottom: {
      id: "anchor_bottom",
      name: "Sticky Bottom Anchor Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_anchor",
      sizes: [],
      tcpm: "100000",
      enabled: true,
      lazyLoad: false,
    },
    interstitial: {
      id: "interstitial",
      name: "Full-page Interstitial Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_int",
      sizes: [],
      tcpm: "2000000",
      enabled: true,
      lazyLoad: false,
    },
  },
  articles: [
    {
      id: "1",
      slug: "car-toys-every-kid-will-love",
      title: "Vroom Vroom! The Most Fun Car Toys Every Kid Will Love",
      subtitle: "Discover high-speed race cars, imaginative play sets, and monster trucks for all ages.",
      metaDescription: "There's something magical about car toys that makes every kid's eyes light up. Whether it's a shiny race car zooming across the floor or a chunky dump truck, explore top picks!",
      ogImage: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80",
      category: "Toys & Games",
      readingTime: "4 min read",
      publishedDate: "October 16, 2026",
      author: "Emma Reynolds",
      content: `<p class="lead font-medium text-lg text-gray-700 leading-relaxed mb-6">There’s something truly magical about car toys that makes every kid’s eyes light up. Whether it’s a shiny race car zooming across the living room hardwood or a chunky dump truck rumbling over a pillow mountain, toy cars never go out of style. They’re not just fun—they help kids imagine, explore, and even learn coordination skills! 🧠</p>

<h2>🏎️ Fast and Furious: Racing Cars for Speed Lovers</h2>
<p>If your little one has a need for speed, streamlined racing cars and pullback speedsters are guaranteed crowd-pleasers. From die-cast classics to motorized drift machines, these cars handle tight kitchen corners with ease.</p>
<p>Modern pullback vehicles boast high-torque gearboxes that can launch vehicles across twenty feet of smooth flooring with just a gentle backward pull.</p>

<h2>🚜 Heavy Lifters: Construction and Big Wheels</h2>
<p>Not every kid wants pure velocity; some want raw power! Miniature excavators, front-end loaders, and massive monster trucks with suspension springs offer tactile joy. Watch them scoop up blocks, bulldoze toy armies, and engineer complex carpet road networks.</p>

<h2>🔋 The Tech Upgrade: Smart RC Cars</h2>
<p>Remote-controlled vehicles have leveled up tremendously in recent years. With 2.4GHz interference-free transmitters, rechargeable Li-ion battery packs, and even stunt capabilities like 360-degree flips and wall climbing, today's RC cars captivate both kids and adults alike.</p>

<h2>💡 Choosing the Right Toy for the Right Age</h2>
<p>When selecting the ultimate toy vehicle, safety and scale matter most:</p>
<ul class="list-disc pl-6 space-y-2 mb-4">
  <li><strong>Toddlers (1–3 years):</strong> Chunky plastic with rounded edges, no tiny swallowable parts, and soft wheels.</li>
  <li><strong>Preschoolers (3–5 years):</strong> Interactive sound effects, flashing headlights, friction motors, and playsets with ramps.</li>
  <li><strong>Big Kids (6+ years):</strong> Die-cast collectibles, scale model builds, and programmable RC speed machines.</li>
</ul>

<p>No matter which model revs up in your household, car toys offer timeless bonding and imaginative storytelling for generations!</p>`
    }
  ]
};

export function getSiteData(): SiteData {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      const dir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading site data:", error);
    return DEFAULT_DATA;
  }
}

export function saveSiteData(data: SiteData): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Error saving site data:", error);
    return false;
  }
}
