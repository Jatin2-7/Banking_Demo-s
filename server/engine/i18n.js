// i18n — per-manifest strings + a small global fallback bundle for engine-level
// messages (greet, didnt_catch, network_error, …).
//
// Resolution order for `t(lang, key, ...args, { manifest })`:
//   1. manifest.strings[lang][key]      (per-action override)
//   2. manifest.strings.en[key]
//   3. GLOBAL[lang][key]
//   4. GLOBAL.en[key]
//   5. key  (so an unknown key shows up in the UI as a tag, not as undefined)
//
// Strings can contain {0}, {1}, … placeholders that get filled from args.

const GLOBAL = {
  en: {
    greet: 'Hi! What would you like to do?',
    didnt_catch: "Sorry, I didn't catch that.",
    cancelled: 'No problem — cancelled. Nothing was deducted.',
    sayYesPrompt: 'Say "yes" to confirm or "no" to cancel.',
    network_error: 'Network glitch. Try again — nothing was deducted.',
    bank_declined: 'Your bank declined the transaction. No money was deducted.',
    saga_progress: 'Step {0}/{1}: {2}',
  },
  hi: {
    greet: 'नमस्ते! क्या करना है?',
    didnt_catch: 'समझ नहीं आया।',
    cancelled: 'कोई बात नहीं — रद्द कर दिया।',
    sayYesPrompt: '"हाँ" बोलें या "नहीं"।',
    network_error: 'नेटवर्क समस्या। फिर से कोशिश करें।',
    bank_declined: 'बैंक ने लेन-देन अस्वीकार किया।',
    saga_progress: 'स्टेप {0}/{1}: {2}',
  },
  te: {
    greet: 'నమస్కారం! మీరు ఏమి చేయాలనుకుంటున్నారు?',
    didnt_catch: 'అర్థం కాలేదు.',
    cancelled: 'ఫర్వాలేదు — రద్దు చేశాను.',
    sayYesPrompt: '"అవును" లేదా "కాదు" చెప్పండి.',
    network_error: 'నెట్‌వర్క్ సమస్య.',
    bank_declined: 'బ్యాంకు తిరస్కరించింది.',
    saga_progress: 'స్టెప్ {0}/{1}: {2}',
  },
  ta: {
    greet: 'வணக்கம்! என்ன செய்ய வேண்டும்?',
    didnt_catch: 'புரியவில்லை.',
    cancelled: 'பரவாயில்லை — ரத்து செய்யப்பட்டது.',
    sayYesPrompt: '"ஆம்" அல்லது "இல்லை" சொல்லுங்கள்.',
    network_error: 'நெட்வொர்க் சிக்கல்.',
    bank_declined: 'வங்கி நிராகரித்தது.',
    saga_progress: 'படி {0}/{1}: {2}',
  },
};

function fmt(template, args) {
  if (template == null) return '';
  let s = String(template);
  // {0} {1} {n}
  s = s.replace(/\{(\d+)\}/g, (_, i) => {
    const v = args[Number(i)];
    if (v == null) return '';
    if (typeof v === 'number') return v.toLocaleString('en-IN');
    return String(v);
  });
  // {currency:amount}  (Indian-grouped INR amount)
  s = s.replace(/\{currency:(\d+)\}/g, (_, i) => {
    const v = Number(args[Number(i)]);
    return Number.isFinite(v) ? v.toLocaleString('en-IN') : '';
  });
  return s;
}

export function tm(manifest, lang, key, ...args) {
  const langs = [lang, 'en'].filter(Boolean);
  if (manifest?.strings) {
    for (const L of langs) {
      const v = manifest.strings[L]?.[key];
      if (v != null) return fmt(v, args);
    }
  }
  for (const L of langs) {
    const v = GLOBAL[L]?.[key];
    if (v != null) return fmt(v, args);
  }
  return key; // visible-but-recognisable fallback
}

// Backwards-compatible global lookup.
export function t(lang, key, ...args) {
  return tm(null, lang, key, ...args);
}

export const GLOBAL_STRINGS = GLOBAL;
