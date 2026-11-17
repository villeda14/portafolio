import { inflateSync } from 'node:zlib';
import { eaxDecrypt, EaxAuthError } from './twofish-eax';

/**
 * Lector del contenedor de archivos de Packet Tracer (.pkt / .pka).
 *
 * Un archivo guardado por Packet Tracer 7+ es XML comprimido con zlib y
 * protegido en cuatro capas, que aquí se revierten en orden inverso:
 *   1. Ofuscación: bytes invertidos y XOR con una función de la longitud.
 *   2. Twofish-EAX con clave (0x89 × 16) y nonce (0x10 × 16).
 *   3. Segunda ofuscación: XOR con (longitud − posición).
 *   4. Cabecera de 4 bytes (tamaño sin comprimir, big-endian) + zlib.
 */

const KEY = new Uint8Array(16).fill(0x89);
const NONCE = new Uint8Array(16).fill(0x10);

export class PktFormatError extends Error {
  constructor(message: string) { super(message); this.name = 'PktFormatError'; }
}

/** Capa 1: invierte el orden y aplica XOR dependiente de la longitud. */
function deobfuscateOuter(input: Uint8Array): Uint8Array {
  const n = input.length;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = input[n - 1 - i] ^ ((n - i * n) & 0xff);
  return out;
}

/** Capa 3: XOR con (longitud − posición). */
function deobfuscateInner(data: Uint8Array): void {
  const n = data.length;
  for (let i = 0; i < n; i++) data[i] ^= (n - i) & 0xff;
}

/** Devuelve el XML (<PACKETTRACER5>…) contenido en un archivo de Packet Tracer. */
export function decodePkt(file: Uint8Array): string {
  if (file.length < 64) throw new PktFormatError('El archivo es demasiado pequeño para ser de Packet Tracer');

  let decrypted: Uint8Array;
  try {
    decrypted = eaxDecrypt(deobfuscateOuter(file), KEY, NONCE);
  } catch (e) {
    if (e instanceof EaxAuthError) {
      throw new PktFormatError('No se pudo descifrar: versión de Packet Tracer no soportada o archivo dañado');
    }
    throw e;
  }
  deobfuscateInner(decrypted);

  const expected = new DataView(decrypted.buffer, decrypted.byteOffset, 4).getUint32(0);
  let xml: Buffer;
  try {
    xml = inflateSync(decrypted.subarray(4));
  } catch {
    throw new PktFormatError('El contenido descifrado no se pudo descomprimir');
  }
  if (xml.length !== expected) throw new PktFormatError('El tamaño descomprimido no coincide con la cabecera');

  const text = xml.toString('utf8');
  if (!text.includes('<PACKETTRACER5>')) throw new PktFormatError('El archivo no contiene un proyecto de Packet Tracer');
  return text;
}
