/** InCred personal loan journey — phases, form state, and field metadata. */

export const PHASE_ORDER = ['login_info', 'basic_details', 'employment', 'eligibility', 'success'];

export const INITIAL_FORM = {
  phase: 'login_info',
  pan: '',
  fullName: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  gender: '',
  pincode: '',
  ndncConsent: true,
  smsConsent: true,
  employmentType: 'salaried',
  netMonthlyIncome: '',
  companyName: '',
  ckycConsent: true,
  creditReportConsent: true,
  householdIncomeConsent: true,
  maritalStatus: '',
  residenceType: '',
  email: '',
  purpose: '',
  applicationRef: '',
  confirmModal: null,
};

export const GENDER_OPTIONS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'others', label: 'Others' },
];

export const EMPLOYMENT_TYPES = [
  { id: 'salaried', label: 'Job/Salary' },
  { id: 'business', label: 'Business' },
];

export const MARITAL_OPTIONS = [
  { id: 'single', label: 'Single' },
  { id: 'married', label: 'Married' },
  { id: 'divorced', label: 'Divorced' },
];

export const RESIDENCE_OPTIONS = [
  { id: 'owned', label: 'Owned' },
  { id: 'rented', label: 'Rented' },
  { id: 'pg', label: 'Paying Guest' },
  { id: 'parental', label: 'Parental' },
];

export const PURPOSE_OPTIONS = [
  { id: 'personal', label: 'Personal expenses' },
  { id: 'medical', label: 'Medical emergency' },
  { id: 'education', label: 'Education' },
  { id: 'travel', label: 'Travel' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'debt', label: 'Debt consolidation' },
];

export const COMPANY_OPTIONS = [
  'SilverSuits',
  'TCS',
  'Infosys',
  'Wipro',
  'HDFC Bank',
  'ICICI Bank',
  'Reliance Industries',
  'Other',
];

/** Progress bar segment: login_info | basic_details | get_offer */
export function progressSegment(phase) {
  if (phase === 'login_info') return { login: 100, basic: 0, offer: 0 };
  if (phase === 'success') return { login: 100, basic: 100, offer: 100 };
  if (phase === 'eligibility') return { login: 100, basic: 100, offer: 30 };
  return { login: 100, basic: phase === 'employment' ? 70 : 40, offer: 0 };
}

export function formatDobDisplay(day, month, year) {
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  const y = String(year);
  if (!day || !month || !year) return '';
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
  const mi = parseInt(m, 10) - 1;
  const suffix =
    d.endsWith('1') && d !== '11'
      ? 'st'
      : d.endsWith('2') && d !== '12'
        ? 'nd'
        : d.endsWith('3') && d !== '13'
          ? 'rd'
          : 'th';
  return `${parseInt(d, 10)}${suffix} ${months[mi] || m} ${y}`;
}

export function formatDobLong(day, month, year) {
  const d = parseInt(String(day), 10);
  const m = parseInt(String(month), 10);
  const y = String(year);
  if (!d || !m || !y) return '';
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${d} ${months[m - 1] || month} ${y}`;
}

export function generateApplicationRef() {
  return `INC${Date.now().toString().slice(-8)}`;
}

/** Map React form state → snake_case agent state. */
export function formToAgentState(form) {
  return {
    phase: form.phase,
    pan: form.pan,
    full_name: form.fullName,
    dob_day: form.dobDay,
    dob_month: form.dobMonth,
    dob_year: form.dobYear,
    gender: form.gender,
    pincode: form.pincode,
    ndnc_consent: form.ndncConsent,
    sms_consent: form.smsConsent,
    employment_type: form.employmentType,
    net_monthly_income: form.netMonthlyIncome,
    company_name: form.companyName,
    ckyc_consent: form.ckycConsent,
    credit_report_consent: form.creditReportConsent,
    household_income_consent: form.householdIncomeConsent,
    marital_status: form.maritalStatus,
    residence_type: form.residenceType,
    email: form.email,
    purpose: form.purpose,
    confirm_modal: form.confirmModal,
  };
}

/** Map agent snake_case patches → React form patches. */
export function agentStateToFormPatch(patch) {
  const map = {
    phase: 'phase',
    pan: 'pan',
    full_name: 'fullName',
    dob_day: 'dobDay',
    dob_month: 'dobMonth',
    dob_year: 'dobYear',
    gender: 'gender',
    pincode: 'pincode',
    ndnc_consent: 'ndncConsent',
    sms_consent: 'smsConsent',
    employment_type: 'employmentType',
    net_monthly_income: 'netMonthlyIncome',
    company_name: 'companyName',
    ckyc_consent: 'ckycConsent',
    credit_report_consent: 'creditReportConsent',
    household_income_consent: 'householdIncomeConsent',
    marital_status: 'maritalStatus',
    residence_type: 'residenceType',
    email: 'email',
    purpose: 'purpose',
    confirm_modal: 'confirmModal',
    application_ref: 'applicationRef',
  };
  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    const key = map[k] || k;
    out[key] = v;
  }
  return out;
}
