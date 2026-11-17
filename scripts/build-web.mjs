// Compila el sitio: TypeScript + CSS → docs/assets, y copia index.html.
import { build, context } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
await mkdir('docs/assets', { recursive: true });

const options = {
  entryPoints: { app: 'web/src/main.ts', styles: 'web/styles/main.css' },
  bundle: true,
  outdir: 'docs/assets',
  format: 'esm',
  target: 'es2022',
  minify: !watch,
  sourcemap: watch,
  logLevel: 'info',
  loader: { '.css': 'css' },
};

const copyHtml = () => copyFile('web/index.html', 'docs/index.html');
await copyHtml();

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('Observando cambios en web/ …');
} else {
  await build(options);
}
