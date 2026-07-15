/** Parse spoken text into digits for live preview (supports word numbers). */

const WORD_TO_DIGIT = {
  zero: '0', oh: '0', o: '0',
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9',
  ten: '10',
};

export function parseSpokenDigitsLive(text, maxLen = 12) {
  if (!text) return '';
  let t = String(text).toLowerCase();
  for (const [word, digit] of Object.entries(WORD_TO_DIGIT)) {
    t = t.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  return t.replace(/\D/g, '').slice(0, maxLen);
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Animate filling digits one-by-one for live demo effect. */
export async function animateDigitFill(onUpdate, fullValue, msPerDigit = 70) {
  const v = String(fullValue || '').replace(/\D/g, '');
  for (let i = 1; i <= v.length; i += 1) {
    onUpdate(v.slice(0, i));
    await sleep(msPerDigit);
  }
  return v;
}

export function stepDigitLength(stepId) {
  if (stepId === 'aadhaar_number') return 12;
  if (stepId === 'aadhaar_otp' || stepId === 'email_otp') return 6;
  if (stepId === 'family_mobile') return 10;
  return 0;
}

export function fieldIdForStep(stepId) {
  const map = {
    aadhaar_number: 'aadhaarNumber',
    aadhaar_otp: 'aadhaarOtp',
    email_otp: 'emailOtp',
    family_mobile: 'familyMobile',
  };
  return map[stepId] || null;
}
