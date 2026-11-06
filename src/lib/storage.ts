import fs from 'fs';
import path from 'path';
import { SiteData } from '@/types';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'site-data.json');

const DEFAULT_DATA: SiteData = {
  settings: {
    siteName: "toys.gledeg.com",
    domainUrl: "https://toys.gledeg.com",
    gaMeasurementId: "G-TZ7MNVNL43",
    googleAdsId: "AW-16468268201",
    googleAdsConversionLabel: "kt1RCNLmgpUZEKmp16w9",
    enableAdTrafficOverlay: true,
    overlayTimeoutSeconds: 3,
    mobileAutoScrollToTopAd: true,
    truncateOnAdTrafficOnly: true,
    adminPassword: "admin123",
  },
  ads: {
    homeTop: {
      id: "home_top",
      name: "1. Header / Home Top Ad (Above the Fold)",
      slotPath: "/22282810983/lw5wflkevg_xqc_home_top",
      sizes: [[300, 250], [336, 280], [300, 300], [320, 100]],
      tcpm: "125000",
      enabled: true,
      lazyLoad: false,
    },
    homeMore: {
      id: "home_more",
      name: "2. Mid Content Ad (Antara Video & Game / Read More)",
      slotPath: "/22282810983/lw5wflkevg_xqc_home_more",
      sizes: [[300, 250], [336, 280]],
      tcpm: "150000",
      enabled: true,
      lazyLoad: true,
    },
    inArticle: {
      id: "in_article",
      name: "3. Bottom Content Ad (Bawah Daftar Game)",
      slotPath: "/22282810983/lw5wflkevg_xqc_content",
      sizes: [[300, 250], [336, 280]],
      tcpm: "80000",
      enabled: true,
      lazyLoad: true,
    },
    bottomAnchor: {
      id: "bottom_anchor",
      name: "4. Sticky Bottom Anchor Ad (Ala AdSense - Mobile & Desktop)",
      slotPath: "/22282810983/lw5wflkevg_xqc_bottom_anchor",
      sizes: [[728, 90], [320, 100], [320, 50], [300, 50]],
      tcpm: "95000",
      enabled: true,
      lazyLoad: false,
    },
    interstitial: {
      id: "interstitial",
      name: "5. Full-page Interstitial / Vignette Ad",
      slotPath: "/22282810983/lw5wflkevg_xqc_int",
      sizes: [],
      tcpm: "2000000",
      enabled: true,
      lazyLoad: false,
    },
    sidebarLeft: {
      id: "sidebar_left",
      name: "6. Sidebar Left Sticky Ad (Desktop)",
      slotPath: "/22282810983/lw5wflkevg_xqc_sidebar_left",
      sizes: [[300, 600], [160, 600], [300, 250]],
      tcpm: "6000",
      enabled: true,
      lazyLoad: false,
    },
    sidebarRight: {
      id: "sidebar_right",
      name: "7. Sidebar Right Sticky Ad (Desktop)",
      slotPath: "/22282810983/lw5wflkevg_xqc_sidebar_right",
      sizes: [[300, 600], [160, 600], [300, 250]],
      tcpm: "5000",
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
  ],
  featuredItems: [
    {
      id: "feat_1",
      title: "Car Toys That Make Playtime Awesome",
      image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80",
      targetUrl: "/watch/feat_1",
      duration: "01:48",
      views: "42.8K views",
      description: "Watch how high-torque pullback racing cars and miniature stunt vehicles conquer living room tracks! These durable die-cast and RC models combine fast action with safe, kid-friendly design for hours of indoor and outdoor fun."
    },
    {
      id: "feat_2",
      title: "Zoom Into Adventure with These Cool Toy Cars",
      image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80",
      targetUrl: "/watch/feat_2",
      duration: "02:15",
      views: "31.4K views",
      description: "From off-road monster trucks with oversized suspension springs to sleek turbo racers, see why kids love building custom obstacle courses and racing head-to-head with friends."
    },
    {
      id: "feat_3",
      title: "Why Kids Can't Get Enough of Toy Cars",
      image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
      targetUrl: "/watch/feat_3",
      duration: "01:32",
      views: "58.9K views",
      description: "Discover the top-rated toy vehicles of the season! Interactive headlights, realistic engine sounds, and rechargeable 2.4GHz remote controls make these toy cars an unforgettable gift for kids of every age."
    },
  ],
  games: [
    {
      id: "gm_car_stunt_1",
      title: "Mega Ramp Car Stunts 3D",
      image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=400&h=400&q=80",
      embedUrl: "https://html5.gamemonetize.com/7y2r8p9x3v4m1n6q5w8e2r4t6y8u0i1o/",
      category: "Racing",
      plays: "64.2K plays",
      description: "Experience high-flying monster truck and supercar jumps across sky-high mega ramps! Choose your favorite turbo racing car, hit the nitro booster, and land impossible 360-degree flips.",
      instructions: "Use Arrow Keys or WASD to drive and steer. Press Spacebar for handbrake and Shift for Nitro Boost."
    },
    {
      id: "gm_rc_drift_2",
      title: "Toy Car Drift Racers",
      image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&h=400&q=80",
      embedUrl: "https://html5.gamemonetize.com/3k9m2n4b6v8c1x5z7l0p9o8i7u6y5t4r/",
      category: "Racing",
      plays: "51.8K plays",
      description: "Race miniature RC toy cars around bedroom tracks, kitchen tables, and backyard obstacle courses! Collect coins to unlock faster monster trucks and sleek sports cars.",
      instructions: "Tap Left/Right on mobile or use Arrow Keys on desktop to drift around sharp corners."
    },
    {
      id: "gm_monster_truck_3",
      title: "Offroad Monster Truck Hero",
      image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&h=400&q=80",
      embedUrl: "https://html5.gamemonetize.com/9p0o8i7u6y5t4r3e2w1q0z9x8c7v6b5n/",
      category: "Driving",
      plays: "48.5K plays",
      description: "Crush obstacles with giant suspension tires in this action-packed monster truck driving game! Climb steep hills, cross muddy rivers, and reach the finish line without flipping over.",
      instructions: "Use Gas and Brake pedals on screen or Up/Down Arrow Keys to balance your truck."
    }
  ],
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
    const parsed = JSON.parse(raw) as SiteData;
    if (!parsed.featuredItems || parsed.featuredItems.length === 0) {
      parsed.featuredItems = DEFAULT_DATA.featuredItems;
    }
    if (!parsed.games) {
      parsed.games = DEFAULT_DATA.games;
    }
    if (!parsed.settings.adminPassword) {
      parsed.settings.adminPassword = DEFAULT_DATA.settings.adminPassword;
    }
    let needsSave = false;
    const orderedKeys: Array<keyof SiteData['ads']> = [
      'homeTop',
      'homeMore',
      'inArticle',
      'bottomAnchor',
      'interstitial',
      'sidebarLeft',
      'sidebarRight',
    ];
    const currentAds = (parsed.ads || {}) as Partial<SiteData['ads']>;
    const normalizedAds = {} as SiteData['ads'];
    for (const k of orderedKeys) {
      if (!currentAds[k]) {
        normalizedAds[k] = DEFAULT_DATA.ads[k];
        needsSave = true;
      } else {
        if (currentAds[k]!.name !== DEFAULT_DATA.ads[k].name) {
          needsSave = true;
        }
        const shouldUpgradeBottomSizes =
          k === 'bottomAnchor' &&
          currentAds[k]!.slotPath === DEFAULT_DATA.ads.bottomAnchor.slotPath &&
          !currentAds[k]!.sizes?.some(([w]) => w === 728);
        normalizedAds[k] = {
          ...DEFAULT_DATA.ads[k],
          ...currentAds[k],
          name: DEFAULT_DATA.ads[k].name,
          sizes: shouldUpgradeBottomSizes
            ? DEFAULT_DATA.ads.bottomAnchor.sizes
            : currentAds[k]!.sizes || DEFAULT_DATA.ads[k].sizes,
        };
      }
    }
    parsed.ads = normalizedAds;
    if (!parsed.settings.siteName || parsed.settings.siteName.toLowerCase().includes('qidtime')) {
      parsed.settings.siteName = 'toys.gledeg.com';
      needsSave = true;
    }
    if (!parsed.settings.domainUrl || parsed.settings.domainUrl.toLowerCase().includes('qidtime')) {
      parsed.settings.domainUrl = 'https://toys.gledeg.com';
      needsSave = true;
    }
    if (Array.isArray(parsed.featuredItems)) {
      parsed.featuredItems = parsed.featuredItems.map((item, idx) => {
        if (item.targetUrl && item.targetUrl.includes('gclid')) {
          needsSave = true;
          const base = item.targetUrl.split('?')[0];
          return {
            ...item,
            targetUrl: !base || base === '/' ? `/watch/${item.id || `feat_${idx + 1}`}` : base,
          };
        }
        return item;
      });
    }
    if (needsSave) {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
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
