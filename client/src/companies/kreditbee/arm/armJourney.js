/** AI Relationship Manager — step definitions and transitions. */

export const STEP_ORDER = [
  'terms',
  'aadhaar_consent',
  'aadhaar_mobile_link',
  'aadhaar_number',
  'aadhaar_otp',
  'email',
  'email_otp',
  'marital_status',
  'education',
  'differently_abled',
  'address_same',
  'residence_type',
  'income_verify',
  'family_reference',
  'family_mobile',
  'friend_details',
  'success',
];

export const EDUCATION_OPTIONS = [
  '10th Pass',
  '12th Pass',
  'Diploma',
  'Graduate',
  'Post Graduate',
  'Professional (CA/CS/etc.)',
  'Doctorate / PhD',
];

export const RESIDENCE_OPTIONS = ['owned', 'rented', 'pg', 'office provided', 'others'];

export const INITIAL_FORM = {
  termsAccepted: '',
  aadhaarConsent: '',
  aadhaarMobileLinked: '',
  aadhaarNumber: '',
  aadhaarOtp: '',
  email: '',
  emailOtp: '',
  maritalStatus: '',
  education: '',
  differentlyAbled: '',
  addressSame: '',
  residenceType: '',
  incomeVerify: '',
  familyReference: '',
  familyMobile: '',
  friendName: '',
  friendMobile: '',
};

/** @typedef {'quick' | 'aadhaar' | 'otp6' | 'phone10' | 'email' | 'friend_form' | 'list' | 'success' | 'none'} InputType */

/**
 * @param {string} stepId
 * @param {Record<string, string>} form
 */
export function getStepConfig(stepId, form = {}) {
  const configs = {
    terms: {
      id: 'terms',
      messages: ["Do you agree to KreditBee's Terms and Conditions?"],
      quickOptions: [
        { label: 'I Agree', value: 'agree' },
        { label: 'No', value: 'no' },
      ],
      inputType: 'quick',
      helpText:
        "Not sure what to choose? Type or speak naturally — we'll work out the right answer.",
      voiceHint: 'Tap mic to speak naturally',
    },
    aadhaar_consent: {
      id: 'aadhaar_consent',
      messages: ['Do you consent to Aadhaar-based KYC verification?'],
      quickOptions: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      inputType: 'quick',
      helpText:
        "Having trouble with KYC? Type or say what went wrong and we'll help you through it.",
      voiceHint: 'Tap mic to speak naturally',
    },
    aadhaar_mobile_link: {
      id: 'aadhaar_mobile_link',
      messages: ['Is your Aadhaar linked to the mobile number you logged in with?'],
      quickOptions: [
        { label: 'Yes', value: 'yes' },
        { label: 'No, Different Number', value: 'no_different' },
      ],
      inputType: 'quick',
      helpText:
        "Having trouble with KYC? Type or say what went wrong and we'll help you through it.",
      voiceHint: 'Tap mic to speak naturally',
    },
    aadhaar_number: {
      id: 'aadhaar_number',
      messages: ['Please tell me your 12-digit Aadhaar number.'],
      inputType: 'aadhaar',
      inputLabel: 'AADHAAR NUMBER',
      helpText:
        "Having trouble with KYC? Type or say what went wrong and we'll help you through it.",
      voiceHint: 'Use the fields above for this step — or tap mic to speak',
      links: [
        { label: 'Forgot your Aadhaar Number?', action: 'forgot_aadhaar' },
        { label: 'Skip for now', action: 'skip' },
      ],
    },
    aadhaar_otp: {
      id: 'aadhaar_otp',
      messages: [
        'OTP sent to your Aadhaar-linked number. Please tell me the 6-digit OTP. Check the SIM linked to your Aadhaar.',
      ],
      inputType: 'otp6',
      inputLabel: 'AADHAAR OTP',
      helpText:
        "Having trouble with KYC? Type or say what went wrong and we'll help you through it.",
      voiceHint: 'Use the fields above for this step — or tap mic to speak',
    },
    email: {
      id: 'email',
      messages: ["What is your email address? I'll send an OTP to verify it."],
      inputType: 'email',
      inputLabel: 'EMAIL ADDRESS',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Fill in above, or tap mic to speak',
    },
    email_otp: {
      id: 'email_otp',
      messages: [
        'OTP sent to your email – please tell me the 6-digit code. Check spam/ promotions if not seen.',
      ],
      inputType: 'otp6',
      inputLabel: 'EMAIL OTP',
      helpText: 'Not sure which option fits? Tell us in your own words – type or use the mic.',
      voiceHint: 'Fill in above, or tap mic to speak',
    },
    marital_status: {
      id: 'marital_status',
      messages: [
        'A few quick questions — feel free to answer all at once or one by one. What is your marital status?',
      ],
      quickOptions: [
        { label: 'Single', value: 'single' },
        { label: 'Married', value: 'married' },
        { label: 'Divorced', value: 'divorced' },
      ],
      inputType: 'quick',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Tap mic to speak naturally',
    },
    education: {
      id: 'education',
      messages: ['What is your highest educational qualification?'],
      listOptions: EDUCATION_OPTIONS.map((label) => ({ label, value: label.toLowerCase() })),
      inputType: 'list',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Tap mic to speak naturally',
    },
    differently_abled: {
      id: 'differently_abled',
      messages: ['Are you differently abled?'],
      quickOptions: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      inputType: 'quick',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Tap mic to speak naturally',
    },
    address_same: {
      id: 'address_same',
      messages: ['Is your current address same as your Aadhaar address?'],
      quickOptions: [
        { label: 'Yes, Same', value: 'yes' },
        { label: 'No, Different', value: 'no' },
      ],
      inputType: 'quick',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Tap mic to speak naturally',
    },
    residence_type: {
      id: 'residence_type',
      messages: ['What type of residence do you live in?'],
      quickOptions: RESIDENCE_OPTIONS.map((r) => ({ label: r, value: r })),
      inputType: 'quick',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Tap mic to speak naturally',
    },
    income_verify: {
      id: 'income_verify',
      messages: ['Would you like to verify your income? This can increase your loan offer amount.'],
      quickOptions: [
        { label: 'Verify Now', value: 'verify' },
        { label: 'Skip for Now', value: 'skip' },
      ],
      inputType: 'quick',
      helpText:
        'Confused? Not satisfied? Type or speak — AI can guide you through income verification or alternatives.',
      voiceHint: 'Tap mic to speak naturally',
    },
    family_reference: {
      id: 'family_reference',
      messages: [
        'Almost done! I need 2 reference contacts — one family, one friend. These are only backup contacts. Should I add your father or mother as family reference?',
      ],
      quickOptions: [
        { label: 'Father', value: 'father' },
        { label: 'Mother', value: 'mother' },
      ],
      inputType: 'quick',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Tap mic to speak naturally',
      allowSkip: true,
    },
    family_mobile: {
      id: 'family_mobile',
      messages: ['Please tell me their mobile number.'],
      inputType: 'phone10',
      inputLabel: 'FAMILY REFERENCE MOBILE NUMBER',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Use the fields above for this step — or tap mic to speak',
    },
    friend_details: {
      id: 'friend_details',
      messages: ['Please tell me their full name. A colleague or neighbour works too.'],
      inputType: 'friend_form',
      inputLabel: 'FRIEND REFERENCE DETAILS',
      helpText: 'Not sure which option fits? Tell us in your own words — type or use the mic.',
      voiceHint: 'Use the fields above for this step — or tap mic to speak',
    },
    success: {
      id: 'success',
      inputType: 'success',
      voiceHint: 'Your application has been submitted',
    },
  };

  return configs[stepId] || null;
}

/**
 * @param {string} currentStep
 * @param {string} field
 * @param {string} value
 * @param {Record<string, string>} form
 */
export function getNextStep(currentStep, field, value, form) {
  const v = String(value || '')
    .trim()
    .toLowerCase();

  if (currentStep === 'terms') {
    if (v === 'no')
      return { next: 'terms', error: 'You need to agree to continue with your application.' };
    return { next: 'aadhaar_consent' };
  }
  if (currentStep === 'aadhaar_consent') {
    if (v === 'no')
      return { next: 'aadhaar_consent', error: 'Aadhaar KYC is required to proceed.' };
    return { next: 'aadhaar_mobile_link' };
  }
  if (currentStep === 'aadhaar_mobile_link') return { next: 'aadhaar_number' };
  if (currentStep === 'aadhaar_number') return { next: 'aadhaar_otp' };
  if (currentStep === 'aadhaar_otp') return { next: 'email' };
  if (currentStep === 'email') return { next: 'email_otp' };
  if (currentStep === 'email_otp') return { next: 'marital_status' };
  if (currentStep === 'marital_status') return { next: 'education' };
  if (currentStep === 'education') return { next: 'differently_abled' };
  if (currentStep === 'differently_abled') return { next: 'address_same' };
  if (currentStep === 'address_same') return { next: 'residence_type' };
  if (currentStep === 'residence_type') return { next: 'income_verify' };
  if (currentStep === 'income_verify') return { next: 'family_reference' };
  if (currentStep === 'family_reference') {
    if (v === 'skip' || v === 'skip for now') return { next: 'friend_details' };
    return { next: 'family_mobile' };
  }
  if (currentStep === 'family_mobile') return { next: 'friend_details' };
  if (currentStep === 'friend_details') return { next: 'success' };

  return { next: currentStep };
}

export function fieldForStep(stepId) {
  const map = {
    terms: 'termsAccepted',
    aadhaar_consent: 'aadhaarConsent',
    aadhaar_mobile_link: 'aadhaarMobileLinked',
    aadhaar_number: 'aadhaarNumber',
    aadhaar_otp: 'aadhaarOtp',
    email: 'email',
    email_otp: 'emailOtp',
    marital_status: 'maritalStatus',
    education: 'education',
    differently_abled: 'differentlyAbled',
    address_same: 'addressSame',
    residence_type: 'residenceType',
    income_verify: 'incomeVerify',
    family_reference: 'familyReference',
    family_mobile: 'familyMobile',
    friend_details: 'friendName',
  };
  return map[stepId] || null;
}

export function displayUserAnswer(stepId, value, form) {
  if (stepId === 'email' && value.includes('@')) {
    const [local, domain] = value.split('@');
    const masked =
      local.length <= 2 ? '***' : `${'*'.repeat(Math.max(1, local.length - 1))}${local.slice(-1)}`;
    return `${masked}@${domain}`;
  }
  if (stepId === 'friend_details') {
    return form.friendName || value;
  }
  return value;
}
