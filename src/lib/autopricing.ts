import fs from 'fs';
import path from 'path';

export const DEFAULT_PRICING_CONFIG = {
  target_mr: 65.0,
  emergency_mr_threshold: 15.0,
  device_settings: {
    desktop: {
      cpm_multiplier: 1.25,
      min_floor: 10000,
    },
    mobile: {
      cpm_multiplier: 1.0,
      min_floor: 5000,
    },
  },
  format_settings: {
    interstitial: {
      multiplier: 1.1,
      high_mr_threshold: 75.0,
      emergency_mr_threshold: 50.0,
    },
    anchor: {
      multiplier: 1.1,
      high_mr_threshold: 65.0,
      emergency_mr_threshold: 35.0,
    },
    banner: {
      multiplier: 1.05,
      high_mr_threshold: 70.0,
      emergency_mr_threshold: 30.0,
    },
  },
  adjustments: {
    high_mr_threshold: 85.0,
    high_mr_boost_pct: 25.0,
    med_mr_threshold: 50.0,
    med_mr_boost_pct: 10.0,
    low_mr_threshold: 40.0,
    low_mr_penalty_pct: -15.0,
  },
  rules: [
    { cpm: 5000, target_key: '5000', floor_key: 'f4000' },
    { cpm: 7500, target_key: '7500', floor_key: 'f7000' },
    { cpm: 10000, target_key: '10000', floor_key: 'f9000' },
    { cpm: 12500, target_key: '12500', floor_key: 'f12000' },
    { cpm: 15000, target_key: '15000', floor_key: 'f15000' },
    { cpm: 17500, target_key: '17500', floor_key: 'f17000' },
    { cpm: 20000, target_key: '20000', floor_key: 'f20000' },
    { cpm: 22500, target_key: '22500', floor_key: 'f23000' },
    { cpm: 25000, target_key: '25000', floor_key: 'f25000' },
    { cpm: 30000, target_key: '30000', floor_key: 'f27000' },
    { cpm: 35000, target_key: '35000', floor_key: 'f30000' },
    { cpm: 40000, target_key: '40000', floor_key: 'f35000' },
    { cpm: 45000, target_key: '45000', floor_key: 'f40000' },
    { cpm: 50000, target_key: '50000', floor_key: 'f45000' },
    { cpm: 55000, target_key: '55000', floor_key: 'f50000' },
    { cpm: 60000, target_key: '60000', floor_key: 'f55000' },
    { cpm: 65000, target_key: '65000', floor_key: 'f60000' },
    { cpm: 70000, target_key: '70000', floor_key: 'f65000' },
    { cpm: 75000, target_key: '75000', floor_key: 'f70000' },
    { cpm: 80000, target_key: '80000', floor_key: 'f75000' },
    { cpm: 100000, target_key: '100000', floor_key: 'f80000' },
    { cpm: 130000, target_key: '130000', floor_key: 'f100000' },
    { cpm: 155000, target_key: '155000', floor_key: 'f125000' },
    { cpm: 200000, target_key: '200000', floor_key: 'f160000' },
    { cpm: 350000, target_key: '350000', floor_key: 'f280000' },
    { cpm: 525000, target_key: '525000', floor_key: 'f420000' },
    { cpm: 700000, target_key: '700000', floor_key: 'f560000' },
  ],
};

function tryReadJsonFile(candidates: string[]): any | null {
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
      }
    } catch {
      // Ignore permission or parse errors and continue to next candidate
    }
  }
  return null;
}

export function getAutoPricingPayload() {
  const pricingConfigCandidates = [
    '/home/mbummm/web/toys.gledeg.com/public_html/pricing_config.json',
    '/home/mbummm/web/toys.gledeg.com/node_app/data/pricing_config.json',
    '/home/mbummm/web/gledeg.com/public_html/pricing_config.json',
    '/home/mbummm/web/spotgames.top/public_html/pricing_config.json',
    '/home/mbummm/web/admin.mbelik.com/public_html/pricing_config.json',
    path.join(process.cwd(), 'data', 'pricing_config.json'),
  ];

  const currentPricingCandidates = [
    '/home/mbummm/web/toys.gledeg.com/public_html/current_pricing.json',
    '/home/mbummm/web/toys.gledeg.com/node_app/data/current_pricing.json',
    '/home/mbummm/web/gledeg.com/public_html/current_pricing.json',
    '/home/mbummm/web/spotgames.top/public_html/current_pricing.json',
    path.join(process.cwd(), 'data', 'current_pricing.json'),
  ];

  const cfgJson = tryReadJsonFile(pricingConfigCandidates) || DEFAULT_PRICING_CONFIG;
  const cpJson = tryReadJsonFile(currentPricingCandidates) || null;

  const rawUnits = cfgJson?.ad_units || {};
  const adUnits = {
    header: rawUnits.header || '/22806125615/play-1',
    feed: rawUnits.feed || '/22806125615/play-2',
    side: rawUnits.side1 || rawUnits.side || '/22806125615/play-3',
    side2: rawUnits.side2 || rawUnits.side_2 || '/22806125615/play-4',
    interstitial: rawUnits.interstitial || '/22806125615/play-5',
    anchor: rawUnits.anchor || '/22806125615/play-6',
  };

  let fallbackBnr = 'f10000';
  let fallbackInt = 'f35000';
  let fallbackAnc = 'f15000';

  if (cpJson && cpJson.summary) {
    const s = cpJson.summary;
    const bnrEcpm = parseFloat(s?.bnr?.ecpm ?? s?.mobile?.bnr?.ecpm ?? 0);
    if (bnrEcpm > 0) {
      if (bnrEcpm >= 30000) fallbackBnr = 'f30000';
      else if (bnrEcpm >= 25000) fallbackBnr = 'f25000';
      else if (bnrEcpm >= 20000) fallbackBnr = 'f20000';
      else if (bnrEcpm >= 15000) fallbackBnr = 'f15000';
      else if (bnrEcpm >= 12000) fallbackBnr = 'f12000';
      else if (bnrEcpm >= 9000) fallbackBnr = 'f9000';
      else if (bnrEcpm >= 7000) fallbackBnr = 'f7000';
      else if (bnrEcpm >= 4000) fallbackBnr = 'f4000';
    }

    const intEcpm = parseFloat(s?.int?.ecpm ?? s?.mobile?.int?.ecpm ?? 0);
    if (intEcpm > 0) {
      if (intEcpm >= 35000) fallbackInt = 'f35000';
      else if (intEcpm >= 30000) fallbackInt = 'f30000';
      else if (intEcpm >= 25000) fallbackInt = 'f25000';
      else if (intEcpm >= 20000) fallbackInt = 'f20000';
      else if (intEcpm >= 15000) fallbackInt = 'f15000';
      else if (intEcpm >= 12000) fallbackInt = 'f12000';
      else if (intEcpm >= 9000) fallbackInt = 'f9000';
      else if (intEcpm >= 7000) fallbackInt = 'f7000';
      else if (intEcpm >= 4000) fallbackInt = 'f4000';
    }

    const ancEcpm = parseFloat(s?.anc?.ecpm ?? s?.mobile?.anc?.ecpm ?? 0);
    if (ancEcpm > 0) {
      if (ancEcpm >= 30000) fallbackAnc = 'f30000';
      else if (ancEcpm >= 25000) fallbackAnc = 'f25000';
      else if (ancEcpm >= 20000) fallbackAnc = 'f20000';
      else if (ancEcpm >= 15000) fallbackAnc = 'f15000';
      else if (ancEcpm >= 12000) fallbackAnc = 'f12000';
      else if (ancEcpm >= 9000) fallbackAnc = 'f9000';
      else if (ancEcpm >= 7000) fallbackAnc = 'f7000';
      else if (ancEcpm >= 4000) fallbackAnc = 'f4000';
    }
  }

  return {
    cfgJson,
    cpJson,
    adUnits,
    fallbackBnr,
    fallbackInt,
    fallbackAnc,
  };
}
