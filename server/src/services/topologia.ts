import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { PktFormatError, topologyFromFile } from '../pkt';

export interface TopologyResult {
  /** Ruta pública del JSON generado, o null si no se pudo leer el archivo. */
  path: string | null;
  /** Mensaje para mostrar al usuario si hubo un problema. */
  warning?: string;
}

const PKT_EXT = /\.(pkt|pka)$/i;
export const isPacketTracerFile = (name: string) => PKT_EXT.test(name);

/** Lee un .pkt/.pka ya guardado en uploads y escribe su topología como JSON. */
export async function generateTopology(savedFilename: string): Promise<TopologyResult> {
  try {
    const topology = await topologyFromFile(path.join(config.uploadsDir, savedFilename));
    const jsonName = savedFilename.replace(PKT_EXT, '') + '-topologia.json';
    await writeFile(path.join(config.uploadsDir, jsonName), JSON.stringify(topology));
    return { path: `/uploads/${jsonName}` };
  } catch (e) {
    if (e instanceof PktFormatError) return { path: null, warning: `No se pudo generar la topología: ${e.message}` };
    throw e;
  }
}
