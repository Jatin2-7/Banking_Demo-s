export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', bcp47: 'en-IN', sample: 'Send money' },
  { code: 'hi', label: 'हिंदी', short: 'हिं', bcp47: 'hi-IN', sample: 'पैसे भेजो' },
  { code: 'ta', label: 'தமிழ்', short: 'த', bcp47: 'ta-IN', sample: 'பணம் அனுப்பு' },
  { code: 'te', label: 'తెలుగు', short: 'తె', bcp47: 'te-IN', sample: 'డబ్బు పంపు' },
];

export const LANG_TO_BCP47 = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.bcp47]));

export const DEFAULT_LANG = 'en';
