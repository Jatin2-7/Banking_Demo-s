/** Personal loan EMI / amount helpers (indicative). */

export function calcEmi(principal, annualRatePct, months) {
  const p = Number(principal);
  const n = Number(months);
  const r = Number(annualRatePct) / 12 / 100;
  if (!p || !n || !r) return 0;
  const pow = (1 + r) ** n;
  return Math.round((p * r * pow) / (pow - 1));
}

export function calcTotalPayable(emi, months) {
  return Math.round(Number(emi) * Number(months));
}

export function calcPrincipalFromEmi(emi, annualRatePct, months) {
  const e = Number(emi);
  const n = Number(months);
  const r = Number(annualRatePct) / 12 / 100;
  if (!e || !n || !r) return 0;
  const pow = (1 + r) ** n;
  return Math.round((e * (pow - 1)) / (r * pow));
}

export function formatInrCompact(n) {
  const v = Number(n);
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`.replace('.0L', 'L');
  if (v >= 1000) return `₹${Math.round(v / 1000)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

export function formatInrFull(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export function isValidPan(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(String(pan || '').trim());
}
