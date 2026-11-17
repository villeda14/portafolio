import 'dotenv/config';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

export const config = {
  root,
  port: Number(process.env.PORT ?? 3000),
  adminKey: process.env.ADMIN_KEY ?? '',
  /** Carpeta publicada (sitio compilado + archivos subidos). */
  publicDir: path.join(root, 'docs'),
  uploadsDir: path.join(root, 'docs', 'uploads'),
  maxUploadBytes: 50 * 1024 * 1024,
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'portafolio',
  },
} as const;

if (!config.adminKey) console.warn('⚠ ADMIN_KEY no está definida en .env: no se podrá administrar el contenido.');
