import { Router, type Request } from 'express';
import { one, rows, run } from '../db';
import { requireAdmin } from '../middleware/auth';
import { uploadFiles, type UploadedFiles } from '../middleware/upload';
import { generateTopology, isPacketTracerFile } from '../services/topologia';
import type { Proyecto } from '../types';

export const proyectosRouter = Router();

const publicPath = (f?: Express.Multer.File) => (f ? `/uploads/${f.filename}` : null);
const filesOf = (req: Request) => (req.files ?? {}) as UploadedFiles;

proyectosRouter.get('/', async (_req, res) => {
  res.json(await rows<Proyecto>('SELECT * FROM proyectos ORDER BY id DESC'));
});

proyectosRouter.post('/', requireAdmin, uploadFiles, async (req, res) => {
  const b = req.body as Record<string, string | undefined>;
  if (!b.titulo?.trim() || !b.descripcion?.trim()) {
    res.status(400).json({ error: 'Título y descripción son obligatorios' });
    return;
  }
  if (!(await one('SELECT id FROM modulos WHERE slug = ?', [b.seccion]))) {
    res.status(400).json({ error: 'Módulo inexistente' });
    return;
  }
  const { imagen, archivo } = filesOf(req);
  const file = archivo?.[0];

  // Si el archivo es de Packet Tracer, la topología se genera sola.
  const topo = file && isPacketTracerFile(file.originalname) ? await generateTopology(file.filename) : null;

  const result = await run(
    `INSERT INTO proyectos (seccion, titulo, descripcion, tecnologias, categoria, fecha, enlace, imagen, archivo, archivo_nombre, topologia)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [b.seccion, b.titulo.trim(), b.descripcion.trim(), b.tecnologias || null, b.categoria || 'General', b.fecha || null,
     b.enlace || null, publicPath(imagen?.[0]), publicPath(file), file?.originalname ?? null, topo?.path ?? null],
  );
  res.status(201).json({ id: result.insertId, topologia: topo?.path ?? null, aviso: topo?.warning });
});

proyectosRouter.put('/:id', requireAdmin, uploadFiles, async (req, res) => {
  const b = req.body as Record<string, string | undefined>;
  const { imagen, archivo } = filesOf(req);
  const file = archivo?.[0];
  const topo = file && isPacketTracerFile(file.originalname) ? await generateTopology(file.filename) : null;

  await run(
    `UPDATE proyectos SET
       titulo = COALESCE(?, titulo), descripcion = COALESCE(?, descripcion), categoria = COALESCE(?, categoria),
       tecnologias = ?, enlace = ?, fecha = ?,
       imagen = COALESCE(?, imagen), archivo = COALESCE(?, archivo), archivo_nombre = COALESCE(?, archivo_nombre),
       topologia = COALESCE(?, topologia)
     WHERE id = ?`,
    [b.titulo || null, b.descripcion || null, b.categoria || null, b.tecnologias || null, b.enlace || null, b.fecha || null,
     publicPath(imagen?.[0]), publicPath(file), file?.originalname ?? null, topo?.path ?? null, req.params.id],
  );
  res.json({ ok: true, topologia: topo?.path ?? undefined, aviso: topo?.warning });
});

proyectosRouter.delete('/:id', requireAdmin, async (req, res) => {
  await run('DELETE FROM proyectos WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});
