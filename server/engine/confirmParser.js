// Deterministic yes/no/cancel parser per language. Runs BEFORE the LLM in the
// CONFIRM state so the engine never blocks on the model for a payment ack.
//
// Returns one of: 'confirm' | 'cancel' | 'unknown'.
//
// Heuristic: tokenise utterance to lowercase words, scan for any positive or
// negative phrase. Exact-equal AND containment match on multi-word phrases.

const POSITIVE = {
  en: [
    'yes',
    'yep',
    'yeah',
    'yup',
    'ok',
    'okay',
    'okey',
    'sure',
    'confirm',
    'confirmed',
    'do it',
    'go ahead',
    'go for it',
    'send it',
    'send',
    'pay',
    'pay it',
    'alright',
    'right',
    'please send',
    'please pay',
    'fine',
    'proceed',
    "let's go",
    'absolutely',
    'definitely',
  ],
  hi: [
    'हाँ',
    'हां',
    'जी',
    'जी हाँ',
    'ठीक है',
    'ठीक',
    'ओके',
    'भेज दो',
    'भेजो',
    'कर दो',
    'करो',
    'करिए',
    'कीजिए',
    'सही है',
    'haan',
    'han',
    'ji',
    'theek hai',
    'thik',
    'kar do',
    'bhej do',
  ],
  te: [
    'అవును',
    'సరే',
    'పంపించు',
    'పంపించండి',
    'పంపు',
    'చేయండి',
    'చేయి',
    'ఎస్',
    'avunu',
    'sare',
    'pampu',
    'cheyi',
    'chey',
  ],
  ta: ['ஆம்', 'சரி', 'அனுப்பு', 'செய்', 'அனுப்பு', 'aam', 'sari', 'anuppu', 'sei'],
};

const NEGATIVE = {
  en: ['no', 'nope', 'cancel', 'cancelled', 'stop', 'abort', 'nah', 'never mind', "don't"],
  hi: ['नहीं', 'मत', 'रहने दो', 'रोको', 'cancel', 'nahin', 'nahi', 'mat'],
  te: ['వద్దు', 'ఆపు', 'వొద్దు', 'cancel', 'aapu', 'voddu'],
  ta: ['வேண்டாம்', 'நிறுத்து', 'cancel', 'vendam'],
};

function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[.,!?¡¿।]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchAny(text, phrases) {
  const t = normalise(text);
  if (!t) return false;
  for (const p of phrases) {
    const pn = normalise(p);
    if (!pn) continue;
    if (t === pn) return true;
    // word-boundary-ish containment for short phrases
    if (
      pn.length >= 2 &&
      (t.includes(' ' + pn + ' ') || t.startsWith(pn + ' ') || t.endsWith(' ' + pn) || t === pn)
    )
      return true;
    // for very short tokens like "ok" / "हाँ", allow direct token match
    if (pn.length <= 4 && t.split(/\s+/).includes(pn)) return true;
  }
  return false;
}

export function parseConfirm(text, lang) {
  const langs = [lang, 'en'];
  let positive = false;
  let negative = false;
  for (const L of langs) {
    if (matchAny(text, NEGATIVE[L] || [])) negative = true;
    if (matchAny(text, POSITIVE[L] || [])) positive = true;
  }
  // negative wins if both — "no thanks but ok" should be treated as cancel
  if (negative) return 'cancel';
  if (positive) return 'confirm';
  return 'unknown';
}

export const CONFIRM_PHRASES = { POSITIVE, NEGATIVE };
