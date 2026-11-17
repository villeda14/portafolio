import multer from 'multer';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { config } from '../config';

const IMAGE_OR_VIDEO = /^(image|video)\//;
const DOWNLOADABLE = /\.(pkt|pka|pkz|zip|pdf)$/i;

const storage = multer.diskStorage({
  destination: config.uploadsDir,
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${randomBytes(3).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});

/** Acepta una vista previa (`imagen`) y un archivo descargable (`archivo`, p. ej. .pkt). */
export const uploadFiles = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    const ok = file.fieldname === 'imagen' ? IMAGE_OR_VIDEO.test(file.mimetype) : DOWNLOADABLE.test(file.originalname);
    cb(null, ok);
  },
}).fields([{ name: 'imagen', maxCount: 1 }, { name: 'archivo', maxCount: 1 }]);

export type UploadedFiles = { imagen?: Express.Multer.File[]; archivo?: Express.Multer.File[] };
