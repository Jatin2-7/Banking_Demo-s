/** Fast intent matching for SBI YONO home assistant (bypass slow LLM). */

import { normalizeVoiceCommandText } from '../../../lib/voiceCommandRouter.js';

export function matchesPinChangeIntent(t) {
  return (
    /\b(change|reset|update|forgot)\b.{0,24}\b(credit\s*)?(card\s*)?pin\b/.test(t) ||
    /\b(credit\s*)?card\s*pin\b.{0,16}\b(change|reset|update)\b/.test(t) ||
    /\bchange\s+my\s+(credit\s+)?(card\s+)?pin\b/.test(t) ||
    /\bpin\s*badlo\b|\bpin\s*change\b/.test(t)
  );
}

export function matchesApplyHomeLoanIntent(t, raw = '') {
  const trimmed = String(raw || '').trim();
  if (matchesPinChangeIntent(t)) return false;
  if (/^(apply|loan|home\s*loan)$/i.test(trimmed)) return true;
  if (/\b(apply\s+(for\s+(a\s+)?)?home\s+loan|home\s+loan\s+application)\b/.test(t)) return true;
  if (/\b(apply\s+(for\s+)?(a\s+)?loan|i\s+want\s+to\s+apply|start\s+(a\s+)?loan)\b/.test(t))
    return true;
  if (
    /\b(ghar\s*ka\s*loan|home\s*loan\s*chahiye|loan\s*apply|loan\s*lena|loan\s*chahiye)\b/.test(t)
  )
    return true;
  if (/\bmortgage\b/.test(t)) return true;
  if (/\bhome\s+loan\b/.test(t) && /\b(apply|start|open|chahiye|lena|karna|form)\b/.test(t))
    return true;
  if (/\bhome\s+loan\b/.test(t)) return true;
  return false;
}

export function matchesLoansTabIntent(t) {
  return /\b(open\s+)?loans?\b/.test(t) && !/\bhome\s+loan\b/.test(t) && !/\bapply\b/.test(t);
}

export function matchesHinglishPreference(t) {
  return /\b(hinglish|hindi\s+english|mix\s+hindi|hindi\s+mein|hinglish\s+mein)\b/.test(t);
}

/**
 * @param {string} userText
 * @param {string} [assistantText]
 * @returns {{ destination: string, context?: string } | null}
 */
export function inferSbiHomeDestination(userText = '', assistantText = '') {
  const t = `${userText} ${assistantText}`.toLowerCase();
  if (matchesPinChangeIntent(t)) {
    return { destination: 'credit_card', context: 'change_pin' };
  }
  if (matchesApplyHomeLoanIntent(t, userText)) {
    return { destination: 'loan_application', context: userText };
  }
  if (matchesLoansTabIntent(t)) {
    return { destination: 'loans', context: '' };
  }
  return null;
}

/**
 * @param {string} text
 * @returns {false | string | { deferNavigate: object, reply: string }}
 */
export function handleSbiHomeUserMessage(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;

  const t = normalizeVoiceCommandText(raw);

  if (matchesHinglishPreference(t)) {
    return 'Bilkul! Ab se main Hinglish mein baat karunga. Home loan ke liye "apply for home loan" bolo, ya seedha "home loan apply" bolo — main turant form khol dunga.';
  }

  if (matchesPinChangeIntent(t)) {
    return {
      deferNavigate: {
        destination: 'credit_card',
        context: 'change_pin',
        routingStatus: 'Opening SBI credit card PIN change.',
      },
      reply: 'Opening credit card PIN change…',
    };
  }

  if (matchesApplyHomeLoanIntent(t, raw)) {
    return {
      deferNavigate: {
        destination: 'loan_application',
        context: text,
        routingStatus: 'Opening your SBI YONO home loan application.',
      },
      reply:
        'Opening your home loan application — main aapka form step by step bharne mein madad karunga.',
    };
  }

  if (matchesLoansTabIntent(t)) {
    return {
      deferNavigate: {
        destination: 'loans',
        context: text,
        routingStatus: 'Opening SBI loans.',
      },
      reply: 'Opening SBI loans…',
    };
  }

  return false;
}
