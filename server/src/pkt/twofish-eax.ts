import { makeSession, encrypt, type Session } from 'twofish-ts';

/**
 * Twofish en modo EAX (cifrado autenticado) con sólo el bloque Twofish como
 * primitiva. EAX = CTR + OMAC (CMAC). Se verifica la etiqueta de 16 bytes,
 * de modo que una clave o IV incorrectos fallan en lugar de producir basura.
 */

const BLOCK = 16;

function xorBlock(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(BLOCK);
  for (let i = 0; i < BLOCK; i++) out[i] = a[i] ^ b[i];
  return out;
}

/** Duplicación en GF(2^128) usada por CMAC (polinomio 0x87). */
function dbl(b: Uint8Array): Uint8Array {
  const out = new Uint8Array(BLOCK);
  for (let i = 0; i < BLOCK - 1; i++) out[i] = ((b[i] << 1) | (b[i + 1] >> 7)) & 0xff;
  out[BLOCK - 1] = (b[BLOCK - 1] << 1) & 0xff;
  if (b[0] & 0x80) out[BLOCK - 1] ^= 0x87;
  return out;
}

class BlockCipher {
  private readonly session: Session;
  constructor(key: Uint8Array) { this.session = makeSession(key); }
  encryptBlock(block: Uint8Array): Uint8Array {
    const out = new Uint8Array(BLOCK);
    encrypt(block, 0, out, 0, this.session);
    return out;
  }
}

class Omac {
  private readonly k1: Uint8Array;
  private readonly k2: Uint8Array;
  constructor(private readonly cipher: BlockCipher) {
    const l = cipher.encryptBlock(new Uint8Array(BLOCK));
    this.k1 = dbl(l);
    this.k2 = dbl(this.k1);
  }
  /** OMAC con prefijo de dominio `tweak` (0 = nonce, 1 = header, 2 = ciphertext). */
  compute(tweak: number, data: Uint8Array): Uint8Array {
    const msg = new Uint8Array(BLOCK + data.length);
    msg[BLOCK - 1] = tweak;
    msg.set(data, BLOCK);
    const blocks = Math.max(1, Math.ceil(msg.length / BLOCK));
    let x: Uint8Array = new Uint8Array(BLOCK);
    for (let i = 0; i < blocks; i++) {
      const chunk = msg.subarray(i * BLOCK, (i + 1) * BLOCK);
      let block: Uint8Array = new Uint8Array(BLOCK);
      block.set(chunk);
      if (i === blocks - 1) {
        if (chunk.length === BLOCK) block = xorBlock(block, this.k1);
        else { block[chunk.length] = 0x80; block = xorBlock(block, this.k2); }
      }
      x = this.cipher.encryptBlock(xorBlock(x, block));
    }
    return x;
  }
}

export class EaxAuthError extends Error {
  constructor() { super('La etiqueta de autenticación EAX no coincide'); }
}

/** Descifra `data` = ciphertext || tag(16). */
export function eaxDecrypt(data: Uint8Array, key: Uint8Array, nonce: Uint8Array, header = new Uint8Array(0)): Uint8Array {
  if (data.length < BLOCK) throw new EaxAuthError();
  const cipher = new BlockCipher(key);
  const omac = new Omac(cipher);
  const ct = data.subarray(0, data.length - BLOCK);
  const tag = data.subarray(data.length - BLOCK);

  const n = omac.compute(0, nonce);
  const h = omac.compute(1, header);
  const c = omac.compute(2, ct);
  const expected = xorBlock(xorBlock(n, h), c);
  let diff = 0;
  for (let i = 0; i < BLOCK; i++) diff |= expected[i] ^ tag[i];
  if (diff !== 0) throw new EaxAuthError();

  // CTR con contador inicial N (incremento big-endian de 128 bits)
  const counter = Uint8Array.from(n);
  const out = new Uint8Array(ct.length);
  for (let i = 0; i < ct.length; i += BLOCK) {
    const ks = cipher.encryptBlock(counter);
    for (let j = 0; j < BLOCK && i + j < ct.length; j++) out[i + j] = ct[i + j] ^ ks[j];
    for (let k = BLOCK - 1; k >= 0; k--) { counter[k] = (counter[k] + 1) & 0xff; if (counter[k] !== 0) break; }
  }
  return out;
}
