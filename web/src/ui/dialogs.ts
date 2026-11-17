import { assetUrl } from '../api';
import { state } from '../state';
import { byId, qsa } from '../utils/dom';
import { esc, isVideo } from '../utils/html';

/** Cierre genérico de <dialog>: botón ✕ y clic en el fondo. */
export function initDialogs(): void {
  qsa('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog')?.close()));
  qsa<HTMLDialogElement>('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  byId<HTMLDialogElement>('dlg-prev').addEventListener('close', () => { byId('prev-b').innerHTML = ''; });
  // los videos de las tarjetas se reproducen al pasar el mouse
  document.addEventListener('mouseover', (e) => void (e.target as HTMLElement).closest<HTMLVideoElement>('video[data-hover-play]')?.play());
  document.addEventListener('mouseout', (e) => (e.target as HTMLElement).closest<HTMLVideoElement>('video[data-hover-play]')?.pause());
}

/** Vista previa ampliada (imagen o video) de un proyecto. */
export function openPreview(id: number): void {
  const p = state.items.find((q) => q.id === id);
  if (!p?.imagen) return;
  byId('prev-t').textContent = p.titulo;
  const src = assetUrl(esc(p.imagen));
  byId('prev-b').innerHTML =
    (isVideo(p.imagen) ? `<video src="${src}" controls autoplay loop></video>` : `<img src="${src}" alt="${esc(p.titulo)}">`) +
    `<p style="margin-top:var(--s4)">${esc(p.descripcion)}</p>`;
  byId<HTMLDialogElement>('dlg-prev').showModal();
}
