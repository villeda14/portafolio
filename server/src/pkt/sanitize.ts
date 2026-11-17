/**
 * Elimina secretos de una running-config antes de publicarla:
 * contraseñas, claves, comunidades SNMP y hashes.
 */

const SECRET_PATTERNS: RegExp[] = [
  /^(\s*enable (?:secret|password)\s+)(?:\d+\s+)?\S+/i,
  /^(\s*username\s+\S+\s+(?:privilege\s+\d+\s+)?(?:secret|password)\s+)(?:\d+\s+)?\S+/i,
  /^(\s*password\s+)(?:\d+\s+)?\S+/i,
  /^(\s*(?:snmp-server community\s+))\S+/i,
  /^(\s*(?:key-string|key)\s+)(?:\d+\s+)?\S+/i,
  /^(\s*(?:ppp (?:chap|pap) password)\s+)(?:\d+\s+)?\S+/i,
  /^(\s*(?:ip ospf authentication-key|ip ospf message-digest-key\s+\d+\s+md5)\s+)(?:\d+\s+)?\S+/i,
  /^(\s*wpa-psk ascii\s+)(?:\d+\s+)?\S+/i,
];

export function sanitizeConfig(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    let line = raw.replace(/\s+$/, '');
    for (const re of SECRET_PATTERNS) {
      const m = re.exec(line);
      if (m) { line = `${m[1]}<oculto>`; break; }
    }
    // colapsa líneas "!" consecutivas
    if (line.trim() === '!' && out.length && out[out.length - 1].trim() === '!') continue;
    out.push(line);
  }
  return out;
}
