/** Exporta módulos y proyectos de MySQL a JSON estático (docs/) para GitHub Pages. */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../server/src/config';
import { pool, rows } from '../server/src/db';
import type { Modulo, Proyecto } from '../server/src/types';

const modulos = await rows<Modulo>('SELECT * FROM modulos ORDER BY orden, id');
const proyectos = await rows<Proyecto>('SELECT * FROM proyectos ORDER BY id DESC');
await writeFile(path.join(config.publicDir, 'modulos.json'), JSON.stringify(modulos, null, 1));
await writeFile(path.join(config.publicDir, 'projects.json'), JSON.stringify(proyectos, null, 1));
console.log(`Exportados ${modulos.length} módulos y ${proyectos.length} proyectos a docs/`);
await pool.end();
