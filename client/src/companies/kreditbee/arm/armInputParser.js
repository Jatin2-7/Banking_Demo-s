import { EDUCATION_OPTIONS, RESIDENCE_OPTIONS } from './armJourney.js';

function norm(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s@.-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Extract a person's name from natural friend-reference speech. */
export function parseFriendNameFromSpeech(text) {
  const raw = cleanSpeechText(text);
  if (!raw || /\d{5,}/.test(raw)) return null;

  const patterns = [
    /(?:friend(?:'?s)?\s+(?:full\s+)?name\s+is\s+)([A-Za-z][A-Za-z\s.'-]{1,60})/i,
    /(?:name\s+is\s+)([A-Za-z][A-Za-z\s.'-]{1,60})/i,
    /(?:called\s+)([A-Za-z][A-Za-z\s.'-]{1,60})/i,
    /(?:he\s+is|she\s+is|they\s+are)\s+([A-Za-z][A-Za-z\s.'-]{1,60})/i,
  ];
  for (const p of patterns) {
    const m = raw.match(p);
    if (m?.[1]) return m[1].trim().replace(/\s+/g, ' ');
  }

  const stripped = raw
    .replace(/^(?:my\s+)?friend(?:'?s)?\s+(?:name\s+)?(?:is\s+)?/i, '')
    .replace(/^(?:full\s+)?name\s+is\s+/i, '')
    .trim();

  if (/^[A-Za-z][A-Za-z\s.'-]{1,60}$/.test(stripped) && stripped.split(/\s+/).length >= 1) {
    return stripped.replace(/\s+/g, ' ');
  }
  return null;
}

/** Strip STT artifacts like "[background noise]" before parsing. */
export function cleanSpeechText(text) {
  return String(text || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchOption(text, options) {
  const n = norm(text);
  for (const opt of options) {
    const label = norm(opt.label || opt);
    const value = opt.value || opt.label || opt;
    if (n === label || n.includes(label) || label.includes(n)) return value;
  }
  return null;
}

export function parseDigits(text, len) {
  const digits = String(text || '').replace(/\D/g, '');
  if (digits.length === len) return digits;
  if (digits.length > len) return digits.slice(0, len);
  return digits.length >= len - 1 ? digits : null;
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function isValidPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(d);
}

export function isValidAadhaar(num) {
  const d = String(num || '').replace(/\D/g, '');
  return /^\d{12}$/.test(d);
}

/**
 * Parse free-text or voice input for the current journey step.
 * @returns {{ ok: boolean, value?: string, display?: string, error?: string, partial?: Record<string, string> }}
 */
export function parseStepInput(stepId, text, form = {}) {
  const raw = cleanSpeechText(text);
  if (!raw) return { ok: false, error: 'Please enter a response.' };

  const n = norm(raw);

  if (n.includes('skip') && stepId !== 'income_verify') {
    if (stepId === 'family_reference' || stepId === 'aadhaar_number') {
      return { ok: true, value: 'skip', display: 'skip for now' };
    }
  }

  switch (stepId) {
    case 'terms':
      if (/^(yes|yeah|yep|agree|i agree|accepted|ok|okay|ready|reddy)/.test(n)) {
        return { ok: true, value: 'agree', display: 'I Agree' };
      }
      if (/^(no|nope|disagree|decline)/.test(n)) {
        return { ok: true, value: 'no', display: 'No' };
      }
      break;

    case 'aadhaar_consent':
    case 'differently_abled':
    case 'address_same':
      if (/^(yes|yeah|yep|y|agree|i agree|consent|ok|okay|same|correct|haan|ha)/.test(n)) {
        return { ok: true, value: 'yes', display: stepId === 'aadhaar_consent' ? 'Yes' : 'Yes' };
      }
      if (/^(no|nope|n|different|nahin|nahi)/.test(n)) {
        return {
          ok: true,
          value: stepId === 'address_same' ? 'no' : 'no',
          display: stepId === 'address_same' ? 'No, Different' : 'No',
        };
      }
      break;

    case 'aadhaar_mobile_link':
      if (/different|another|other number/.test(n)) {
        return { ok: true, value: 'no_different', display: 'No, Different Number' };
      }
      if (/^(yes|yeah|yep|y|linked|same)/.test(n)) {
        return { ok: true, value: 'yes', display: 'Yes' };
      }
      break;

    case 'aadhaar_number': {
      const digits = parseDigits(raw, 12);
      if (digits && isValidAadhaar(digits)) return { ok: true, value: digits, display: digits };
      return { ok: false, error: 'Please enter a valid 12-digit Aadhaar number.' };
    }

    case 'aadhaar_otp':
    case 'email_otp': {
      const otp = parseDigits(raw, 6);
      if (otp && otp.length === 6) return { ok: true, value: otp, display: otp };
      return { ok: false, error: 'Please enter the 6-digit OTP.' };
    }

    case 'email': {
      const emailMatch = raw.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      const email = emailMatch ? emailMatch[0] : raw.replace(/\s/g, '');
      if (isValidEmail(email)) return { ok: true, value: email, display: email };
      return { ok: false, error: 'What is your email address? I\'ll send an OTP to verify it.' };
    }

    case 'marital_status':
      if (/single|unmarried/.test(n)) return { ok: true, value: 'single', display: 'Single' };
      if (/married/.test(n)) return { ok: true, value: 'married', display: 'Married' };
      if (/divorc/.test(n)) return { ok: true, value: 'divorced', display: 'Divorced' };
      break;

    case 'education': {
      for (const opt of EDUCATION_OPTIONS) {
        const label = opt.toLowerCase();
        if (n.includes(label) || label.includes(n)) {
          return { ok: true, value: label, display: opt };
        }
      }
      if (/grad/.test(n)) return { ok: true, value: 'graduate', display: 'Graduate' };
      if (/post/.test(n)) return { ok: true, value: 'post graduate', display: 'Post Graduate' };
      if (/10th|tenth/.test(n)) return { ok: true, value: '10th pass', display: '10th Pass' };
      if (/12th|twelfth/.test(n)) return { ok: true, value: '12th pass', display: '12th Pass' };
      if (/diploma/.test(n)) return { ok: true, value: 'diploma', display: 'Diploma' };
      if (/phd|doctorate/.test(n)) return { ok: true, value: 'doctorate / phd', display: 'Doctorate / PhD' };
      break;
    }

    case 'residence_type': {
      for (const r of RESIDENCE_OPTIONS) {
        if (n.includes(r) || r.includes(n)) return { ok: true, value: r, display: r };
      }
      if (/own/.test(n)) return { ok: true, value: 'owned', display: 'owned' };
      if (/rent/.test(n)) return { ok: true, value: 'rented', display: 'rented' };
      break;
    }

    case 'income_verify':
      if (/verify|yes|proceed|now/.test(n)) return { ok: true, value: 'verify', display: 'Verify Now' };
      if (/skip|later|no|not now/.test(n)) return { ok: true, value: 'skip', display: 'Skip for Now' };
      break;

    case 'family_reference':
      if (/father|dad|papa/.test(n)) return { ok: true, value: 'father', display: 'father' };
      if (/mother|mom|mummy/.test(n)) return { ok: true, value: 'mother', display: 'mother' };
      if (/skip/.test(n)) return { ok: true, value: 'skip', display: 'skip for now' };
      break;

    case 'family_mobile': {
      const phone = parseDigits(raw, 10);
      if (phone && isValidPhone(phone)) return { ok: true, value: phone, display: phone };
      return { ok: false, error: 'Please tell me their mobile number.' };
    }

    case 'friend_details': {
      const phoneMatch = raw.match(/\b([6-9]\d{9})\b/);
      const phone = phoneMatch?.[1] || null;
      const namePart =
        parseFriendNameFromSpeech(raw) ||
        raw.replace(/\d{5,}/g, '').replace(/mobile|number|phone/gi, '').trim();

      if (namePart && phone && isValidPhone(phone)) {
        return {
          ok: true,
          value: namePart,
          display: namePart,
          partial: { friendName: namePart, friendMobile: phone },
        };
      }
      if (namePart && phone) {
        return {
          ok: false,
          partial: { friendName: namePart },
          error: 'Please provide a valid 10-digit mobile number starting with 6–9.',
        };
      }
      if (namePart) {
        return {
          ok: false,
          partial: { friendName: namePart },
          error: form.friendMobile && isValidPhone(form.friendMobile)
            ? 'Name saved. Say their mobile number or enter it below.'
            : 'Got the name. What is their 10-digit mobile number?',
        };
      }
      if (phone && isValidPhone(phone)) {
        if (form.friendName?.trim()) {
          return {
            ok: true,
            value: form.friendName,
            display: form.friendName,
            partial: { friendMobile: phone },
          };
        }
        return {
          ok: false,
          partial: { friendMobile: phone },
          error: 'Please tell me your friend\'s full name first.',
        };
      }
      break;
    }

    default:
      break;
  }

  return { ok: false, error: 'I didn\'t catch that. Please try again or pick an option above.' };
}

/** Map quick-option value to display label */
export function quickOptionDisplay(stepId, value, config) {
  const opts = config?.quickOptions || config?.listOptions || [];
  const found = opts.find((o) => o.value === value || o.label?.toLowerCase() === value);
  return found?.label || value;
}
