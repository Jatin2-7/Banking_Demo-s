// All mock data lives here. Single source of truth for the simulation.

export const PER_TXN_LIMIT = 100000;

export const CONTACTS = [
  {
    id: 'c1',
    name: 'Rahul Sharma',
    initials: 'RS',
    aliases: ['राहुल', 'राहुल शर्मा', 'రాహుల్', 'ராகுல்'],
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
    vpas: [{ id: 'v2', label: 'PhonePe', sublabel: 'rahul.mehta@ybl' }],
    lastPaid: 'colleague',
  },
  {
    id: 'c3',
    name: 'Rahul Verma',
    initials: 'RV',
    aliases: ['राहुल', 'राहुल वर्मा', 'రాహుల్', 'ராகுல்'],
    vpas: [{ id: 'v3', label: 'Paytm', sublabel: 'rahulverma@paytm' }],
    lastPaid: '1 month ago',
  },
  {
    id: 'c4',
    name: 'Priya Nair',
    initials: 'PN',
    aliases: ['प्रिया', 'प्रिया नायर', 'ప్రియా', 'பிரியா'],
    vpas: [{ id: 'v4', label: 'ICICI', sublabel: 'priya.nair@okicici' }],
    lastPaid: 'yesterday',
  },
  {
    id: 'c5',
    name: 'Amit Joshi',
    initials: 'AJ',
    aliases: ['अमित', 'अमित जोशी', 'అమిత్', 'அமித்'],
    vpas: [{ id: 'v5', label: 'SBI', sublabel: 'amit.joshi@upi' }],
    lastPaid: 'last week',
  },
  {
    id: 'c6',
    name: 'Riya Mehta',
    initials: 'RM',
    aliases: ['रिया', 'रिया मेहता', 'రియా', 'ரியா'],
    vpas: [{ id: 'v6', label: 'HDFC', sublabel: 'riya.mehta@hdfcbank' }],
    lastPaid: '8 days ago',
  },
  {
    id: 'c7',
    name: 'Vikram Singh',
    initials: 'VS',
    aliases: ['विक्रम', 'విక్రమ్', 'விக்ரம்'],
    vpas: [{ id: 'v7', label: 'Axis', sublabel: 'vikram.singh@okaxis' }],
    lastPaid: '2 days ago',
  },
  {
    id: 'c8',
    name: 'Neha Gupta',
    initials: 'NG',
    aliases: ['नेहा', 'నేహా', 'நேஹா'],
    vpas: [{ id: 'v8', label: 'PhonePe', sublabel: 'neha.g@ybl' }],
    lastPaid: '3 weeks ago',
  },
  {
    id: 'c9',
    name: 'Mom',
    initials: 'M',
    aliases: ['mum', 'mummy', 'mama', 'mother', 'माँ', 'मम्मी', 'అమ్మ', 'அம்மா'],
    vpas: [{ id: 'v9', label: 'SBI', sublabel: 'mom.lakshmi@oksbi' }],
    lastPaid: 'last month',
  },
  {
    id: 'c10',
    name: 'Deepa Pillai',
    initials: 'DP',
    aliases: ['दीपा', 'దీపా', 'தீபா'],
    vpas: [{ id: 'v10', label: 'Paytm', sublabel: 'deepa.pillai@paytm' }],
    lastPaid: '5 days ago',
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
  },
  {
    id: 'b2',
    name: 'BESCOM Electricity',
    category: 'Electricity',
    icon: '⚡',
    defaultAmount: 2240,
    accountLabel: 'Account No.',
    sample: '5512889',
  },
  {
    id: 'b3',
    name: 'Airtel Postpaid',
    category: 'Mobile',
    icon: '📱',
    defaultAmount: 749,
    accountLabel: 'Mobile No.',
    sample: '9876543210',
  },
  {
    id: 'b4',
    name: 'Jio Prepaid',
    category: 'Recharge',
    icon: '📱',
    defaultAmount: 299,
    accountLabel: 'Mobile No.',
    sample: '9876543211',
  },
  {
    id: 'b5',
    name: 'Vi Postpaid',
    category: 'Mobile',
    icon: '📱',
    defaultAmount: 599,
    accountLabel: 'Mobile No.',
    sample: '9876543212',
  },
  {
    id: 'b6',
    name: 'BWSSB Water',
    category: 'Water',
    icon: '💧',
    defaultAmount: 480,
    accountLabel: 'RR No.',
    sample: 'RR-44521',
  },
  {
    id: 'b7',
    name: 'Indane Gas',
    category: 'Gas',
    icon: '🔥',
    defaultAmount: 1100,
    accountLabel: 'Consumer No.',
    sample: 'IND-7821',
  },
  {
    id: 'b8',
    name: 'Tata Sky DTH',
    category: 'DTH',
    icon: '📺',
    defaultAmount: 399,
    accountLabel: 'Subscriber ID',
    sample: '1066540',
  },
  {
    id: 'b9',
    name: 'Airtel Broadband',
    category: 'Broadband',
    icon: '🌐',
    defaultAmount: 999,
    accountLabel: 'Account ID',
    sample: 'AB-99821',
  },
];

// Quick lookups by name keyword used in the NLU
export const BILLER_KEYWORDS = {
  electricity: ['b1', 'b2'],
  current: ['b1', 'b2'], // "current bill" colloquial
  power: ['b1', 'b2'],
  bijli: ['b1', 'b2'],
  light: ['b1', 'b2'],
  bescom: ['b2'],
  tata: ['b1'],
  airtel: ['b3', 'b9'],
  jio: ['b4'],
  vi: ['b5'],
  vodafone: ['b5'],
  mobile: ['b3', 'b4', 'b5'],
  recharge: ['b3', 'b4', 'b5'],
  postpaid: ['b3', 'b5'],
  prepaid: ['b4'],
  water: ['b6'],
  bwssb: ['b6'],
  pani: ['b6'],
  gas: ['b7'],
  cylinder: ['b7'],
  indane: ['b7'],
  dth: ['b8'],
  tv: ['b8'],
  sky: ['b8'],
  broadband: ['b9'],
  internet: ['b9'],
  wifi: ['b9'],
};

// Strip possessive / filler words so "my mum" → "mum", "to rahul" → "rahul".
const NAME_STOPWORDS = new Set([
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

function normaliseName(s) {
  return String(s || '')
    .toLowerCase()
    .split(/\s+/)
    .filter((tok) => tok && !NAME_STOPWORDS.has(tok))
    .join(' ')
    .trim();
}

export function findContactsByName(query) {
  const raw = (query || '').trim();
  if (!raw) return [];
  const q = normaliseName(raw) || raw.toLowerCase();
  return CONTACTS.filter((c) => {
    const lower = c.name.toLowerCase();
    if (lower.split(/\s+/).some((part) => part.startsWith(q))) return true;
    if (lower.includes(q)) return true;
    if (
      c.aliases &&
      c.aliases.some((a) => {
        const al = String(a).toLowerCase();
        return al === q || al.includes(q) || q.includes(al);
      })
    )
      return true;
    return false;
  });
}

export function findBillersByKeyword(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  // Pass 1: any biller whose full name appears in the query (whole-word).
  const directName = BILLERS.filter((b) =>
    new RegExp(`\\b${b.name.toLowerCase().split(/\s+/)[0]}\\b`, 'i').test(q),
  );
  if (directName.length === 1) return directName;

  // Pass 2: collect matched keyword sets, intersect when multiple matched.
  const matchedSets = [];
  for (const [k, list] of Object.entries(BILLER_KEYWORDS)) {
    if (new RegExp(`\\b${k}\\b`, 'i').test(q)) {
      matchedSets.push(new Set(list));
    }
  }
  if (matchedSets.length === 0) return directName; // either [] or many directs
  let ids;
  if (matchedSets.length === 1) {
    ids = matchedSets[0];
  } else {
    // Intersection — narrows e.g. "airtel" + "recharge" → just b3
    ids = matchedSets.reduce((acc, s) => {
      const next = new Set();
      acc.forEach((id) => {
        if (s.has(id)) next.add(id);
      });
      return next;
    });
    // If intersection is empty, fall back to union
    if (ids.size === 0) {
      ids = matchedSets.reduce((acc, s) => {
        s.forEach((id) => acc.add(id));
        return acc;
      }, new Set());
    }
  }
  return BILLERS.filter((b) => ids.has(b.id));
}

export function getAccount(id) {
  return ACCOUNTS.find((a) => a.id === id);
}

export function avatarColor(name) {
  const colors = [
    '#1A237E',
    '#FF6B00',
    '#00875A',
    '#C2185B',
    '#5E35B1',
    '#0277BD',
    '#EF6C00',
    '#2E7D32',
    '#6A1B9A',
    '#3949AB',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function initialsOf(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
