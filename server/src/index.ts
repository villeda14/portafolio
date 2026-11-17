import express, { type ErrorRequestHandler } from 'express';
import { mkdir } from 'node:fs/promises';
import { config } from './config';
import { modulosRouter } from './routes/modulos';
import { proyectosRouter } from './routes/proyectos';

await mkdir(config.uploadsDir, { recursive: true });

const app = express();
app.use(express.json());

app.use('/api/modulos', modulosRouter);
app.use('/api/proyectos', proyectosRouter);

// Sitio compilado (docs/): el mismo origen sirve la web y la API.
app.use(express.static(config.publicDir));

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err instanceof Error ? err.message : 'Error interno' });
};
app.use(onError);

app.listen(config.port, () => console.log(`Portafolio en http://localhost:${config.port}`));
