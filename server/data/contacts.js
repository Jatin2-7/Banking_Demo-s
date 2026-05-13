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

export function findContactById(id) {
  return contacts.find((c) => c.id === id) || null;
}

function normalize(s) {
  return (s || '').toLowerCase().trim();
}

export function fuzzyMatchContacts(query) {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  return contacts.filter((c) => {
    const name = normalize(c.name);
    const parts = name.split(/\s+/);
    return tokens.every(
      (t) => name.includes(t) || parts.some((p) => p.startsWith(t) || t.startsWith(p)),
    );
  });
}
