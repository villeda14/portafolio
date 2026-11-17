/** 255.255.255.252 → 30 */
export function maskToCidr(mask: string): number | null {
  const parts = mask.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return null;
  const bits = parts.map((p) => p.toString(2).padStart(8, '0')).join('');
  return bits.includes('01') ? null : bits.split('1').length - 1;
}
export function ipWithCidr(ip: string, mask?: string): string {
  const c = mask ? maskToCidr(mask) : null;
  return c === null ? ip : `${ip}/${c}`;
}
