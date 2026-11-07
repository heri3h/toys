import React from 'react';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { getAutoPricingPayload } from '@/lib/autopricing';

export async function AdsHeader() {
  await connection();
  const hdrs = await headers();
  const detectedCountry = (
    hdrs.get('cf-ipcountry') ||
    hdrs.get('x-country') ||
    hdrs.get('x-vercel-ip-country') ||
    'ID'
  ).toUpperCase();

  const { cfgJson, cpJson, adUnits, fallbackBnr, fallbackInt, fallbackAnc } = getAutoPricingPayload();

  const defaultSendTo = 'AW-16785269892/nNVJCMe5mowaEITJ68M-';
  const cfgSendTo =
    cfgJson?.conversion?.send_to && String(cfgJson.conversion.send_to).trim()
      ? String(cfgJson.conversion.send_to).trim()
      : defaultSendTo;

  const conversionAw = cfgSendTo.split('/')[0]?.trim() || 'AW-16785269892';

  const inlineScript = `
window.MBELIK_COUNTRY = ${JSON.stringify(detectedCountry)};
window.MBELIK_INLINE_CURRENT_PRICING = ${JSON.stringify(cpJson)};
window.MBELIK_INLINE_PRICING_CONFIG = ${JSON.stringify(cfgJson)};
window.MBELIK_AD_UNITS = ${JSON.stringify(adUnits)};
window.MBELIK_FALLBACK_BNR = ${JSON.stringify(fallbackBnr)};
window.MBELIK_FALLBACK_INT = ${JSON.stringify(fallbackInt)};
window.MBELIK_FALLBACK_ANC = ${JSON.stringify(fallbackAnc)};
window.MBELIK_SEND_TO = ${JSON.stringify(cfgSendTo)};

(function() {
  window.googletag = window.googletag || { cmd: [] };
  var phpFallbackBnr = window.MBELIK_FALLBACK_BNR || "f10000";
  var phpFallbackInt = window.MBELIK_FALLBACK_INT || "f35000";
  var phpFallbackAnc = window.MBELIK_FALLBACK_ANC || "f15000";
  var phpSendTo = window.MBELIK_SEND_TO || "";

  function detectDevice() {
    var ua = navigator.userAgent || navigator.vendor || window.opera || "";
    if (/android/i.test(ua)) return 'mobile';
    if (/iPhone|iPod/i.test(ua)) return 'mobile';
    if (/iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'mobile';
    return 'desktop';
  }

  function findRuleWithStepDown(targetCPM, matchRate, targetMr, rules, emergencyMr, fmtName, fmtThreshold) {
    var emergencyThreshold = (typeof emergencyMr === 'number') ? emergencyMr : 15.0;
    var hardFloorMin = (typeof fmtThreshold === 'number') ? fmtThreshold : 65.0;

    if (matchRate > 0 && matchRate < emergencyThreshold) {
      console.log("⚠️ [AutoPricing] Emergency MR Triggered (" + matchRate + "% < " + emergencyThreshold + "%) -> Fallback to google_optimize");
      return { key: "google_optimize", rule: null };
    }

    var defaultFallback = (fmtName === 'int') ? phpFallbackInt : (fmtName === 'anc') ? phpFallbackAnc : phpFallbackBnr;
    if (!rules || rules.length === 0) return { key: defaultFallback, rule: null };

    var sortedRules = rules.slice().sort(function(a, b) { return a.cpm - b.cpm; });
    var closestIdx = 0;
    var minDiff = Infinity;

    for (var i = 0; i < sortedRules.length; i++) {
      var diff = Math.abs(sortedRules[i].cpm - targetCPM);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    var gap = targetMr - matchRate;
    var chosenIdx = closestIdx;

    if (gap > 10.0) {
      chosenIdx = Math.max(0, closestIdx - 2);
    } else if (gap > 0) {
      chosenIdx = Math.max(0, closestIdx - 1);
    } else {
      chosenIdx = closestIdx;
    }

    var chosenRule = sortedRules[chosenIdx];
    var finalKey = "";

    if (matchRate >= hardFloorMin) {
      finalKey = chosenRule.floor_key || chosenRule.target_key;
    } else {
      finalKey = chosenRule.target_key;
    }

    return { key: finalKey, rule: chosenRule };
  }

  var userDevice = detectDevice();
  var userCountry = window.MBELIK_COUNTRY || 'ID';
  window.mbelikUserDevice = userDevice;

  var keys = (function() {
    var inlineData = window.MBELIK_INLINE_CURRENT_PRICING;
    var inlineCfg = window.MBELIK_INLINE_PRICING_CONFIG;
    if (!inlineData || !inlineCfg) {
      console.log("⚡ [Zero-Fallback AutoPricing] Using Server Default Fallbacks | Country:", userCountry, "| Device:", userDevice, "| Bnr:", phpFallbackBnr, "| Int:", phpFallbackInt, "| Anc:", phpFallbackAnc);
      return { keyBnr: phpFallbackBnr, keyInt: phpFallbackInt, keyAnc: phpFallbackAnc };
    }
    window.mbelikConfig = inlineCfg;

    function computeKeySync(fmtName) {
      var rawEcpm = 0.0;
      var matchRate = 0.0;
      var fmtLongName = (fmtName === 'bnr') ? 'banner' : (fmtName === 'int') ? 'interstitial' : 'anchor';
      var fmtObj = (inlineCfg.format_settings && inlineCfg.format_settings[fmtLongName]) ? inlineCfg.format_settings[fmtLongName] : {};
      var fmtMultiplier = (fmtObj.multiplier !== undefined) ? fmtObj.multiplier : 1.0;
      var fmtThreshold = (fmtObj.high_mr_threshold !== undefined) ? fmtObj.high_mr_threshold : (inlineCfg.target_mr || 65.0);

      if (inlineData.countries && inlineData.countries[userCountry] && inlineData.countries[userCountry][userDevice]) {
        var cData = inlineData.countries[userCountry][userDevice];
        if (cData[fmtName]) {
          rawEcpm = cData[fmtName].ecpm || 0.0;
          matchRate = cData[fmtName].match_rate || 0.0;
        } else {
          rawEcpm = cData.ecpm || 0.0;
          matchRate = cData.match_rate || 0.0;
        }
      } else if (inlineData.summary && inlineData.summary[userDevice]) {
        var sData = inlineData.summary[userDevice];
        if (sData[fmtName]) {
          rawEcpm = sData[fmtName].ecpm || 0.0;
          matchRate = sData[fmtName].match_rate || 0.0;
        } else {
          rawEcpm = sData.ecpm || 0.0;
          matchRate = sData.match_rate || 0.0;
        }
      } else if (inlineData.summary) {
        if (inlineData.summary[fmtName]) {
          rawEcpm = inlineData.summary[fmtName].ecpm || 0.0;
          matchRate = inlineData.summary[fmtName].match_rate || 0.0;
        } else {
          rawEcpm = inlineData.summary.ecpm || 0.0;
          matchRate = inlineData.summary.match_rate || 0.0;
        }
      }

      var adj = inlineCfg.adjustments || {};
      var deviceMultiplier = 1.0;
      if (inlineCfg.device_settings && inlineCfg.device_settings[userDevice] && inlineCfg.device_settings[userDevice].cpm_multiplier) {
        deviceMultiplier = inlineCfg.device_settings[userDevice].cpm_multiplier;
      }

      var tierMultiplier = 1.0;
      if (adj.high_mr_threshold && matchRate >= adj.high_mr_threshold) {
        tierMultiplier = 1.0 + ((adj.high_mr_boost_pct || 25.0) / 100.0);
      } else if (adj.med_mr_threshold && matchRate >= adj.med_mr_threshold) {
        tierMultiplier = 1.0 + ((adj.med_mr_boost_pct || 10.0) / 100.0);
      } else if (adj.low_mr_threshold && matchRate < adj.low_mr_threshold) {
        tierMultiplier = 1.0 + ((adj.low_mr_penalty_pct || -15.0) / 100.0);
      }

      var adjustedEcpm = rawEcpm * tierMultiplier * deviceMultiplier * fmtMultiplier;
      var targetMr = inlineCfg.target_mr || 65.0;
      var emergencyMrThreshold = inlineCfg.emergency_mr_threshold || 15.0;
      var resRule = findRuleWithStepDown(adjustedEcpm, matchRate, targetMr, inlineCfg.rules || [], emergencyMrThreshold, fmtName, fmtThreshold);

      var defaultFmtFallback = (fmtName === 'int') ? phpFallbackInt : (fmtName === 'anc') ? phpFallbackAnc : phpFallbackBnr;
      var key = (resRule && resRule.key) ? resRule.key : defaultFmtFallback;

      console.log("⚡ [Zero-Fallback AutoPricing] Format:", fmtName, "| Country:", userCountry, "| Device:", userDevice, "| Raw eCPM:", rawEcpm, "| MR:", matchRate + "%", "| Multiplier:", fmtMultiplier, "| Key:", key);
      return key;
    }

    return {
      keyBnr: computeKeySync('bnr'),
      keyInt: computeKeySync('int'),
      keyAnc: computeKeySync('anc')
    };
  })();

  window.mbelikKeys = keys;
  window.mbelikPricingVal = keys.keyBnr;
  window.mbelikResolveSlotKey = function(slotPath, fmtName) {
    var baseKey = (fmtName === 'int') ? keys.keyInt : (fmtName === 'anc' ? keys.keyAnc : keys.keyBnr);
    var inlineData = window.MBELIK_INLINE_CURRENT_PRICING;
    if (inlineData && inlineData.overrides && inlineData.overrides[userCountry] && slotPath) {
      var cOv = inlineData.overrides[userCountry];
      var shortName = String(slotPath).replace(/^\\/[^/]+\\//, '');
      var uOv = cOv[slotPath] || cOv[shortName];
      if (uOv && uOv[userDevice] && uOv[userDevice].key) {
        return uOv[userDevice].key;
      }
    }
    return baseKey;
  };
  window.mbelikAccumulator = window.mbelikAccumulator || {
    sessionTotal: parseFloat(sessionStorage.getItem('mbelik_session_total') || '0') || 0
  };

  var currentDomain = window.location.hostname.replace('www.', '');

  window.googletag.cmd.push(function() {
    if (window.__mbelikListenersAttached) return;
    window.__mbelikListenersAttached = true;

    var currentUrl = window.location.href;
    window.googletag.pubads().set('page_url', currentUrl);
    window.googletag.pubads().setTargeting('domain', currentDomain);
    window.googletag.pubads().setTargeting('device_type', userDevice);
    window.googletag.pubads().setTargeting('mbelik_pricing', keys.keyBnr);
    window.googletag.pubads().collapseEmptyDivs();

    window.googletag.pubads().addEventListener('slotRenderEnded', function(event) {
      var slot = event.slot;
      var isLoaded = !event.isEmpty;

      var path = slot.getAdUnitPath();
      var slotId = slot.getSlotElementId();
      var trackingKey = slotId ? (path + " (" + slotId + ")") : path;

      var targetingValues = slot.getTargeting('mbelik_pricing');
      var pricingKey = (targetingValues && targetingValues.length > 0) ? targetingValues[0] : (window.mbelikPricingVal || 'unknown');

      var currentRule = null;
      var cfg = window.mbelikConfig || window.MBELIK_INLINE_PRICING_CONFIG;
      if (cfg && cfg.rules) {
        for (var i = 0; i < cfg.rules.length; i++) {
          var r = cfg.rules[i];
          if (r.target_key === pricingKey || r.floor_key === pricingKey) {
            currentRule = r;
            break;
          }
        }
      }

      var estimatedECPM = 0.0;
      if (currentRule && currentRule.cpm) {
        estimatedECPM = currentRule.cpm;
      } else if (pricingKey === 'google_optimize') {
        var adUnitsCfg = window.MBELIK_AD_UNITS || {};
        var isIntSlot = (adUnitsCfg.interstitial && path === adUnitsCfg.interstitial) || path.indexOf('int') !== -1 || path.indexOf('-5') !== -1 || path.indexOf('-12') !== -1;
        var isAncSlot = (adUnitsCfg.anchor && path === adUnitsCfg.anchor) || path.indexOf('anc') !== -1 || path.indexOf('sticky') !== -1 || path.indexOf('-6') !== -1 || path.indexOf('-13') !== -1;
        var fmtKey = isIntSlot ? 'int' : (isAncSlot ? 'anc' : 'bnr');
        var cpData = window.MBELIK_INLINE_CURRENT_PRICING || null;
        if (cpData && cpData.summary && cpData.summary[fmtKey] && cpData.summary[fmtKey].ecpm) {
          estimatedECPM = parseFloat(cpData.summary[fmtKey].ecpm) || 0.0;
        }
        if (estimatedECPM <= 0) {
          estimatedECPM = (fmtKey === 'int') ? 25000.0 : (fmtKey === 'anc' ? 10000.0 : 5000.0);
        }
      } else if (pricingKey !== 'unknown') {
        var numericKey = parseFloat(String(pricingKey).replace(/[^0-9.]/g, ''));
        if (!isNaN(numericKey) && numericKey > 0) {
          estimatedECPM = numericKey;
        }
      }

      var earning = isLoaded ? (estimatedECPM / 1000.0) : 0.0;
      if (isLoaded) {
        window.mbelikAccumulator.sessionTotal += earning;
        try { sessionStorage.setItem('mbelik_session_total', window.mbelikAccumulator.sessionTotal.toFixed(2)); } catch (e) {}
      }

      var ecpmFormatted = 'Rp ' + Math.round(estimatedECPM).toLocaleString('id-ID');
      var earningFormatted = isLoaded ? ('+Rp ' + earning.toFixed(2)) : 'Rp 0.00';
      var totalFormatted = 'Rp ' + window.mbelikAccumulator.sessionTotal.toFixed(2);
      var displayUrl = window.location.href.replace(/^https?:\\/\\//, '');
      var icon = isLoaded ? '💰' : '⚪';
      var statusText = isLoaded ? 'Loaded' : 'Unfilled';

      console.log(
        icon + " [Micro-Earning] Slot: " + trackingKey + " | Status: " + statusText + " | PricingKey: " + pricingKey + " | eCPM: " + ecpmFormatted + " | Earning: " + earningFormatted + " | Total Session: " + totalFormatted + " [" + displayUrl + "]"
      );
    });

    window.googletag.pubads().addEventListener('impressionViewable', function(event) {
      var slot = event.slot;
      if (!window.mbelikSlotInt || slot !== window.mbelikSlotInt) return;

      var path = slot.getAdUnitPath();
      var slotId = slot.getSlotElementId();
      var trackingKey = slotId ? (path + " (" + slotId + ")") : path;

      var targetingValues = slot.getTargeting('mbelik_pricing');
      var pricingKey = (targetingValues && targetingValues.length > 0) ? targetingValues[0] : (window.mbelikPricingVal || 'unknown');

      var currentRule = null;
      var cfg = window.mbelikConfig || window.MBELIK_INLINE_PRICING_CONFIG;
      if (cfg && cfg.rules) {
        for (var i = 0; i < cfg.rules.length; i++) {
          var r = cfg.rules[i];
          if (r.target_key === pricingKey || r.floor_key === pricingKey) {
            currentRule = r;
            break;
          }
        }
      }

      var estimatedECPM = 0.0;
      if (currentRule && currentRule.cpm) {
        estimatedECPM = currentRule.cpm;
      } else if (pricingKey === 'google_optimize') {
        var cpData = window.MBELIK_INLINE_CURRENT_PRICING || null;
        if (cpData && cpData.summary && cpData.summary.int && cpData.summary.int.ecpm) {
          estimatedECPM = parseFloat(cpData.summary.int.ecpm) || 0.0;
        }
        if (estimatedECPM <= 0) estimatedECPM = 25000.0;
      } else if (pricingKey !== 'unknown') {
        var numericKey = parseFloat(String(pricingKey).replace(/[^0-9.]/g, ''));
        if (!isNaN(numericKey) && numericKey > 0) estimatedECPM = numericKey;
      }

      var earning = estimatedECPM / 1000.0;
      var activeSendTo = phpSendTo;
      if (cfg && cfg.conversion && cfg.conversion.send_to) {
        activeSendTo = cfg.conversion.send_to;
      }

      var sessionVal = (window.mbelikAccumulator && window.mbelikAccumulator.sessionTotal > 0)
        ? window.mbelikAccumulator.sessionTotal
        : earning;

      if (typeof window.gtag === 'function' && activeSendTo) {
        window.gtag('event', 'conversion', {
          'send_to': activeSendTo,
          'value': Number(sessionVal.toFixed(2)),
          'currency': 'IDR'
        });
        console.log("🎯 [Google Ads Interstitial Conversion Sent] Slot: " + trackingKey + " | SendTo: " + activeSendTo + " | Viewable on Screen | Value (Total Session): +Rp " + sessionVal.toFixed(2));
      }
    });
  });
})();
`;

  return (
    <>
      <script
        data-cfasync="false"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(conversionAw)}`}
      />
      <script
        data-cfasync="false"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(conversionAw)});
          `,
        }}
      />
      <script
        data-cfasync="false"
        async
        src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
      />
      <script
        data-cfasync="false"
        dangerouslySetInnerHTML={{ __html: inlineScript }}
      />
    </>
  );
}
