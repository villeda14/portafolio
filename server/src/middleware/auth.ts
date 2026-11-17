import type { RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { config } from '../config';

/** Protege las rutas de escritura con la cabecera `x-admin-key`. */
export const requireAdmin: RequestHandler = (req, res, next) => {
  const given = Buffer.from(req.get('x-admin-key') ?? '');
  const expected = Buffer.from(config.adminKey);
  const ok = expected.length > 0 && given.length === expected.length && timingSafeEqual(given, expected);
  if (!ok) { res.status(401).json({ error: 'Clave incorrecta' }); return; }
  next();
};
