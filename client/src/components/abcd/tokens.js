/** Aditya Birla Capital (ABCD) brand + tab config */

export const ABCD = {
  red: '#C41E24',
  redDark: '#A8181E',
  yellow: '#F5C518',
  cream: '#F7F0E8',
  creamSoft: '#FFF8EE',
  ink: '#1A1A1A',
  muted: '#6B7280',
};

/** Canonical tab order (clockwise). Active tab is always rotated to center. */
export const ABCD_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'myTrack', label: 'My Track' },
  { id: 'loans', label: 'Loans' },
  { id: 'insure', label: 'Insure' },
  { id: 'invest', label: 'Invest' },
];

export const ABCD_PILLS = {
  home: { label: 'Payment Options', icon: 'pay' },
  myTrack: { label: 'Cashback & ABCD Coins', icon: 'coins' },
  loans: { label: 'Get instant Funding', icon: 'funding' },
  insure: { label: 'No GST + Extra Discount!', icon: 'umbrella' },
  invest: { label: 'Invest Options', icon: 'invest' },
};

/** Rotate so the active tab sits in the center slot (index 2). */
export function getRotatedTabs(activeId) {
  const i = ABCD_TABS.findIndex((t) => t.id === activeId);
  const idx = i < 0 ? 0 : i;
  const shift = (idx - 2 + ABCD_TABS.length) % ABCD_TABS.length;
  return [...ABCD_TABS.slice(shift), ...ABCD_TABS.slice(0, shift)];
}
