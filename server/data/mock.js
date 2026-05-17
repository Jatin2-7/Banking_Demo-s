// Server-side mock data — single source of truth for execution.
// Mirrors client/src/data/mock.js for the dialogue display, but the server's
// version is what actually mutates on payment.

export const PER_TXN_LIMIT = 100000;

export const CONTACTS = [
  {
    id: 'c1',
    name: 'Rahul Sharma',
    initials: 'RS',
    aliases: ['राहुल', 'राहुल शर्मा', 'రాహుల్', 'ராகுல்'],
    phone: '9876543210',
    vpas: [
      { id: 'v1a', label: 'HDFC Savings', sublabel: 'rahul.sharma@hdfcbank' },
      { id: 'v1b', label: 'GPay', sublabel: 'rahul.sharma@okaxis' },
    ],
    lastPaid: '3 days ago',
  },
  {
    id: 'c2',
    name: 'Rahul Mehta',
    initials: 'RM',
    aliases: ['राहुल', 'राहुल मेहता', 'రాహుల్', 'ராகுல்'],
    phone: '9123456780',
    vpas: [{ id: 'v2', label: 'PhonePe', sublabel: 'rahul.mehta@ybl' }],
    lastPaid: 'colleague',
  },
  {
    id: 'c3',
    name: 'Rahul Verma',
    initials: 'RV',
    aliases: ['राहुल', 'राहुल वर्मा', 'రాహుల్', 'ராகுல்'],
    phone: '9000000003',
    vpas: [{ id: 'v3', label: 'Paytm', sublabel: 'rahulverma@paytm' }],
    lastPaid: '1 month ago',
  },
  {
    id: 'c4',
    name: 'Priya Nair',
    initials: 'PN',
    aliases: ['प्रिया', 'प्रिया नायर', 'ప్రియా', 'பிரியா'],
    phone: '9812345670',
    vpas: [{ id: 'v4', label: 'ICICI', sublabel: 'priya.nair@okicici' }],
    lastPaid: 'yesterday',
  },
  {
    id: 'c5',
    name: 'Amit Joshi',
    initials: 'AJ',
    aliases: ['अमित', 'अमित जोशी', 'అమిత్', 'அமித்'],
    phone: '9765432100',
    vpas: [{ id: 'v5', label: 'SBI', sublabel: 'amit.joshi@upi' }],
    lastPaid: 'last week',
  },
  {
    id: 'c9',
    name: 'Mom',
    initials: 'M',
    aliases: ['mum', 'mummy', 'mama', 'mother', 'माँ', 'मम्मी', 'అమ్మ', 'அம்மா'],
    phone: '9988776655',
    vpas: [{ id: 'v9', label: 'SBI', sublabel: 'mom.lakshmi@oksbi' }],
    lastPaid: 'last month',
  },
  {
    id: 'c11',
    name: 'Prateek Reddy',
    initials: 'PR',
    aliases: [
      'prateek',
      'pratik',
      'prateek reddy',
      'प्रतीक',
      'प्रतीक रेड्डी',
      'ప్రతీక్',
      'ప్రతీక్ రెడ్డి',
      'பிரதீக்',
      'பிரதீக் ரெட்டி',
    ],
    phone: '9876500011',
    vpas: [
      { id: 'v11a', label: 'Indian Bank Savings', sublabel: 'prateek.reddy@indianbk' },
      { id: 'v11b', label: 'GPay', sublabel: 'prateek.reddy@okaxis' },
    ],
    lastPaid: 'yesterday',
  },
  {
    id: 'c12',
    name: 'Prateek Singh',
    initials: 'PS',
    aliases: ['prateek', 'pratik', 'prateek singh', 'प्रतीक', 'प्रतीक सिंह', 'ప్రతీక్', 'பிரதீக்'],
    phone: '9876500012',
    vpas: [{ id: 'v12', label: 'PhonePe', sublabel: 'prateek.singh@ybl' }],
    lastPaid: '4 days ago',
  },
];

export const ACCOUNTS = [
  { id: 'a1', label: 'Indian Bank Savings', last4: '1762', balance: 251000, type: 'savings' },
  { id: 'a2', label: 'Indian Bank Current', last4: '7102', balance: 85000, type: 'current' },
  { id: 'a3', label: 'IB Wallet', last4: 'WAL', balance: 4500, type: 'wallet' },
];

export const BILLERS = [
  {
    id: 'b1',
    name: 'Tata Power',
    category: 'Electricity',
    icon: '⚡',
    defaultAmount: 1850,
    accountLabel: 'Consumer No.',
    sample: '210034567',
    keywords: ['electricity', 'power', 'bijli', 'tata', 'tata power'],
  },
  {
    id: 'b2',
    name: 'BESCOM Electricity',
    category: 'Electricity',
    icon: '⚡',
    defaultAmount: 2240,
    accountLabel: 'Account No.',
    sample: '5512889',
    keywords: ['electricity', 'power', 'bijli', 'bescom', 'bangalore'],
  },
  {
    id: 'b3',
    name: 'Airtel Postpaid',
    category: 'Mobile',
    icon: '📱',
    defaultAmount: 749,
    accountLabel: 'Mobile No.',
    sample: '9876543210',
    keywords: ['airtel', 'postpaid', 'mobile', 'bill'],
  },
  {
    id: 'b4',
    name: 'Jio Prepaid',
    category: 'Recharge',
    icon: '📱',
    defaultAmount: 299,
    accountLabel: 'Mobile No.',
    sample: '9876543211',
    keywords: ['jio', 'prepaid', 'recharge', 'mobile'],
  },
  {
    id: 'b5',
    name: 'Vi Postpaid',
    category: 'Mobile',
    icon: '📱',
    defaultAmount: 599,
    accountLabel: 'Mobile No.',
    sample: '9876543212',
    keywords: ['vi', 'vodafone', 'idea', 'postpaid', 'mobile'],
  },
  {
    id: 'b6',
    name: 'Airtel Prepaid',
    category: 'Recharge',
    icon: '📱',
    defaultAmount: 239,
    accountLabel: 'Mobile No.',
    sample: '9876543213',
    keywords: ['airtel', 'prepaid', 'recharge', 'mobile'],
  },
  {
    id: 'b7',
    name: 'BWSSB Water',
    category: 'Water',
    icon: '💧',
    defaultAmount: 480,
    accountLabel: 'RR No.',
    sample: 'RR-44521',
    keywords: ['water', 'bwssb', 'pani'],
  },
  {
    id: 'b8',
    name: 'Indane Gas',
    category: 'Gas',
    icon: '🔥',
    defaultAmount: 1100,
    accountLabel: 'Consumer No.',
    sample: 'IND-7821',
    keywords: ['gas', 'cylinder', 'indane', 'lpg'],
  },
  {
    id: 'b9',
    name: 'Tata Sky DTH',
    category: 'DTH',
    icon: '📺',
    defaultAmount: 399,
    accountLabel: 'Subscriber ID',
    sample: '1066540',
    keywords: ['dth', 'tv', 'sky', 'tata sky'],
  },
  {
    id: 'b10',
    name: 'Airtel Broadband',
    category: 'Broadband',
    icon: '🌐',
    defaultAmount: 999,
    accountLabel: 'Account ID',
    sample: 'AB-99821',
    keywords: ['broadband', 'internet', 'wifi', 'airtel'],
  },
];

const STOPWORDS = new Set([
  'my',
  'the',
  'a',
  'an',
  'to',
  'for',
  'mr',
  'mrs',
  'ms',
  'sir',
  'madam',
  'please',
  'kindly',
  'dear',
  'jee',
  'ji',
  'bhaiya',
  'didi',
  'मेरी',
  'मेरे',
  'मेरा',
  'को',
  'के',
  'से',
]);

export function searchContacts(query) {
  const raw = String(query || '').trim();
  if (!raw) return [];
  // Phone number lookup
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 7) {
    const byPhone = CONTACTS.filter((c) => c.phone && c.phone.includes(digits));
    if (byPhone.length) return byPhone;
  }
  const tokens = raw
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
  const q = tokens.join(' ') || raw.toLowerCase();
  return CONTACTS.filter((c) => {
    const lower = c.name.toLowerCase();
    if (lower.split(/\s+/).some((p) => p.startsWith(q))) return true;
    if (lower.includes(q)) return true;
    if (
      c.aliases?.some((a) => {
        const al = String(a).toLowerCase();
        return al === q || al.includes(q) || q.includes(al);
      })
    )
      return true;
    return false;
  });
}

export function searchBillers(query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return [];
  // Direct full-name match
  const direct = BILLERS.filter(
    (b) => q.includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(q),
  );
  if (direct.length === 1) return direct;
  // Keyword match — collect sets, intersect when multiple
  const sets = [];
  for (const b of BILLERS) {
    for (const kw of b.keywords) {
      if (new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(q)) {
        sets.push(b.id);
        break;
      }
    }
  }
  const uniq = [...new Set(sets)];
  if (uniq.length) return BILLERS.filter((b) => uniq.includes(b.id));
  return direct;
}

export function getAccount(id) {
  return ACCOUNTS.find((a) => a.id === id);
}
export function getAccountByType(t) {
  return ACCOUNTS.find((a) => a.type === t);
}
export function getContact(id) {
  return CONTACTS.find((c) => c.id === id);
}
export function getBiller(id) {
  return BILLERS.find((b) => b.id === id);
}
