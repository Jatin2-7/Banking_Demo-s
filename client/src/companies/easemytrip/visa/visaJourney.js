/** EaseMyTrip Visa application journey — state & constants. */

export const VISA_STEPS = ['select_date', 'upload_picture', 'scan_passport', 'traveller_details'];

export const STEP_LABELS = {
  select_date: 'Select Date',
  upload_picture: 'Upload Picture',
  scan_passport: 'Scan Passport',
  traveller_details: 'Traveller Details',
};

export const VISA_TYPES = ['Tourist', 'Business', 'Transit'];
export const VISA_DURATIONS = ['5', '15', '30', '90'];
export const ENTRY_TYPES = ['Single', 'Multiple'];

export const DESTINATIONS = [
  { id: 'singapore', name: 'Singapore', label: 'Singapore For Indians', image: 'coastal' },
  { id: 'dubai', name: 'Dubai', label: 'Dubai For Indians', image: 'desert' },
  { id: 'thailand', name: 'Thailand', label: 'Thailand For Indians', image: 'temple' },
];

export const INITIAL_VISA_FORM = {
  phase: 'home',
  destination: '',
  searchQuery: '',
  travellers: 1,
  departureDate: '',
  departureDateLabel: '',
  visaType: 'Tourist',
  duration: '15',
  entryType: 'Single',
  validityDays: '5',
  currentStep: 'select_date',
  showDateModal: false,
  photoUploaded: false,
  passportScanned: false,
  travellerName: '',
  travellerPassport: '',
  travellerDob: '',
  applicationRef: '',
};

export function generateVisaRef() {
  return `VISA${Date.now().toString().slice(-8)}`;
}

export function formatVisaDate(day, month = 6, year = 2026) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const h = new Date().getHours();
  const m = String(new Date().getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${day} ${months[month]} ${year}, ${String(hr).padStart(2, '0')}:${m} ${ampm}`;
}

export function getEstimatedDateLabel() {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return formatVisaDate(d.getDate(), d.getMonth(), d.getFullYear());
}

export function detectVisaCountry(text) {
  const t = String(text).toLowerCase();
  if (/\bsingapore\b/.test(t)) return 'singapore';
  if (/\bdubai\b|\buae\b/.test(t)) return 'dubai';
  if (/\bthailand\b|\bbali\b/.test(t)) return 'thailand';
  return null;
}

export function getNextVisaPrompt(form) {
  if (form.phase === 'success') return null;
  if (form.phase === 'wizard') {
    if (form.currentStep === 'upload_picture' && !form.photoUploaded) {
      return 'Say upload photo to add your picture.';
    }
    if (form.currentStep === 'scan_passport' && !form.passportScanned) {
      return 'Say scan passport to continue.';
    }
    if (form.currentStep === 'traveller_details') {
      return 'Tell me your name and passport number, or say submit to finish.';
    }
    return 'Say proceed to continue.';
  }
  if (form.showDateModal) return 'Say a date like 15th July, or say proceed.';
  if (form.phase === 'destination') return 'Say start application to begin.';
  if (!form.destination) return 'Which country visa do you need? Singapore, Dubai, or Thailand?';
  return 'Say start application when you are ready.';
}

export function formToVisaAgentState(form) {
  return {
    phase: form.phase,
    destination: form.destination,
    search_query: form.searchQuery,
    travellers: String(form.travellers),
    departure_date: form.departureDate,
    visa_type: form.visaType,
    duration: form.duration,
    entry_type: form.entryType,
    validity_days: form.validityDays,
    current_step: form.currentStep,
    show_date_modal: form.showDateModal,
    photo_uploaded: form.photoUploaded,
    passport_scanned: form.passportScanned,
    traveller_name: form.travellerName,
    traveller_passport: form.travellerPassport,
    traveller_dob: form.travellerDob,
    application_ref: form.applicationRef,
    next_prompt: getNextVisaPrompt(form) || '',
  };
}

export function visaAgentStateToFormPatch(patch) {
  const map = {
    phase: 'phase',
    destination: 'destination',
    search_query: 'searchQuery',
    travellers: 'travellers',
    departure_date: 'departureDate',
    visa_type: 'visaType',
    duration: 'duration',
    entry_type: 'entryType',
    validity_days: 'validityDays',
    current_step: 'currentStep',
    show_date_modal: 'showDateModal',
    photo_uploaded: 'photoUploaded',
    passport_scanned: 'passportScanned',
    traveller_name: 'travellerName',
    traveller_passport: 'travellerPassport',
    traveller_dob: 'travellerDob',
    application_ref: 'applicationRef',
  };
  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    const key = map[k] || k;
    if (key === 'travellers') out[key] = parseInt(v, 10) || 1;
    else if (key === 'photoUploaded' || key === 'passportScanned' || key === 'showDateModal') {
      out[key] = v === true || v === 'true';
    } else out[key] = v;
  }
  return out;
}

export function stepIndex(step) {
  return VISA_STEPS.indexOf(step);
}
