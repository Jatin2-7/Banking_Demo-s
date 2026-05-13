export const contacts = [
  {
    id: 'c1',
    name: 'Rahul Sharma',
    initials: 'RS',
    upiHandles: ['rahul.sharma@hdfcbank', 'rahulsharma@okaxis'],
    lastPaid: 3,
  },
  { id: 'c2', name: 'Rahul Mehta', initials: 'RM', upiHandles: ['rahul.mehta@ybl'], lastPaid: 14 },
  { id: 'c3', name: 'Rahul Verma', initials: 'RV', upiHandles: ['rahulverma@paytm'], lastPaid: 30 },
  { id: 'c4', name: 'Priya Nair', initials: 'PN', upiHandles: ['priya.nair@okicici'], lastPaid: 1 },
  { id: 'c5', name: 'Amit Joshi', initials: 'AJ', upiHandles: ['amit.joshi@upi'], lastPaid: 7 },
  {
    id: 'c6',
    name: 'Riya Mehta',
    initials: 'RM',
    upiHandles: ['riya.mehta@hdfcbank'],
    lastPaid: 8,
  },
  {
    id: 'c7',
    name: 'Vikram Singh',
    initials: 'VS',
    upiHandles: ['vikram.singh@okaxis'],
    lastPaid: 2,
  },
  { id: 'c8', name: 'Neha Gupta', initials: 'NG', upiHandles: ['neha.g@ybl'], lastPaid: 21 },
  {
    id: 'c9',
    name: 'Suresh Iyer',
    initials: 'SI',
    upiHandles: ['suresh.iyer@okicici'],
    lastPaid: 45,
  },
  {
    id: 'c10',
    name: 'Deepa Pillai',
    initials: 'DP',
    upiHandles: ['deepa.pillai@paytm'],
    lastPaid: 5,
  },
];

const AVATAR_COLORS = [
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

export function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
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
