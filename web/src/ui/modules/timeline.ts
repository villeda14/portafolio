import { assetUrl } from '../../api';
import { esc, isVideo } from '../../utils/html';
import { adminButtons } from './admin-buttons';
import type { Proyecto } from '../../types';

/** Glifos de Font Awesome por categoría. */
const GLYPH: Record<string, string> = { 'Título': '', 'Certificación': '', 'Logro': '', 'Reconocimiento': '' };

export function timelineItemHtml(p: Proyecto): string {
  const admin = adminButtons(p);
  const link = p.enlace ? `<a class="btn btn-outline btn-sm" href="${esc(p.enlace)}" target="_blank" rel="noopener">Ver credencial</a>` : '';
  const img = p.imagen && !isVideo(p.imagen) ? `<img src="${assetUrl(esc(p.imagen))}" alt="${esc(p.titulo)}" loading="lazy">` : '';
  return `<article class="t-item" data-ico="${GLYPH[p.categoria ?? ''] ?? ''}">
    <div class="meta">${esc(p.categoria)}${p.fecha ? ` · ${esc(p.fecha)}` : ''}</div>
    <h3>${esc(p.titulo)}</h3><p>${esc(p.descripcion)}</p>${img}${link || admin ? `<div class="actions">${link}${admin}</div>` : ''}</article>`;
}
