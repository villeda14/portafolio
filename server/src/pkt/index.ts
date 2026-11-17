import { readFile } from 'node:fs/promises';
import type { Topology } from '../../../shared/topology';
import { decodePkt } from './decoder';
import { extractTopology } from './extract';

export { PktFormatError } from './decoder';
export { extractTopology } from './extract';
export { decodePkt } from './decoder';

/** Lee un .pkt/.pka del disco y devuelve su topología. */
export async function topologyFromFile(path: string): Promise<Topology> {
  return extractTopology(decodePkt(await readFile(path)));
}
