/** Regenera la topología de todos los proyectos que tienen un .pkt/.pka adjunto. */
import path from 'node:path';
import { pool, rows, run } from '../server/src/db';
import { generateTopology, isPacketTracerFile } from '../server/src/services/topologia';
import type { Proyecto } from '../server/src/types';

const proyectos = await rows<Proyecto>('SELECT * FROM proyectos WHERE archivo IS NOT NULL');
for (const p of proyectos) {
  if (!p.archivo || !isPacketTracerFile(p.archivo)) continue;
  const result = await generateTopology(path.basename(p.archivo));
  if (result.path) {
    await run('UPDATE proyectos SET topologia = ? WHERE id = ?', [result.path, p.id]);
    console.log(`✔ #${p.id} ${p.titulo} → ${result.path}`);
  } else {
    console.warn(`✖ #${p.id} ${p.titulo}: ${result.warning}`);
  }
}
await pool.end();
