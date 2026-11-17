import { Router } from 'express';
import { one, rows, run } from '../db';
import { requireAdmin } from '../middleware/auth';
import { slugify } from '../lib/slug';
import { TIPOS_MODULO, type Modulo, type TipoModulo } from '../types';

export const modulosRouter = Router();

modulosRouter.get('/', async (_req, res) => {
  res.json(await rows<Modulo>('SELECT * FROM modulos ORDER BY orden, id'));
});

modulosRouter.post('/', requireAdmin, async (req, res) => {
  const { nombre, descripcion, tipo } = req.body as { nombre?: string; descripcion?: string; tipo?: TipoModulo };
  if (!nombre?.trim() || !tipo || !TIPOS_MODULO.includes(tipo)) {
    res.status(400).json({ error: 'Nombre y tipo válidos son obligatorios' });
    return;
  }
  let slug = slugify(nombre);
  const taken = await rows<{ slug: string }>('SELECT slug FROM modulos WHERE slug LIKE ?', [`${slug}%`]);
  if (taken.some((t) => t.slug === slug)) slug += `-${taken.length + 1}`;
  const next = await one<{ o: number }>('SELECT COALESCE(MAX(orden), 0) + 1 AS o FROM modulos');
  const result = await run(
    'INSERT INTO modulos (slug, nombre, descripcion, tipo, orden) VALUES (?, ?, ?, ?, ?)',
    [slug, nombre.trim(), descripcion || null, tipo, next?.o ?? 1],
  );
  res.status(201).json({ id: result.insertId, slug });
});

modulosRouter.put('/:id', requireAdmin, async (req, res) => {
  const { nombre, descripcion, orden } = req.body as { nombre?: string; descripcion?: string; orden?: number };
  await run(
    'UPDATE modulos SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), orden = COALESCE(?, orden) WHERE id = ?',
    [nombre?.trim() || null, descripcion ?? null, orden ?? null, req.params.id],
  );
  res.json({ ok: true });
});

modulosRouter.delete('/:id', requireAdmin, async (req, res) => {
  const modulo = await one<Pick<Modulo, 'slug'>>('SELECT slug FROM modulos WHERE id = ?', [req.params.id]);
  if (modulo) {
    await run('DELETE FROM proyectos WHERE seccion = ?', [modulo.slug]);
    await run('DELETE FROM modulos WHERE id = ?', [req.params.id]);
  }
  res.json({ ok: true });
});
