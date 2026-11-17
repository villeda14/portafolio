import { esc, splitTags } from '../../utils/html';
import { adminButtons } from './admin-buttons';
import type { Proyecto } from '../../types';

export function noteHtml(p: Proyecto): string {
  const admin = adminButtons(p);
  const tags = splitTags(p.tecnologias).map((t) => `<span>#${esc(t)}</span>`).join('');
  return `<article class="note">
    <div class="meta"><span style="color:var(--violet)">${esc(p.categoria)}</span>${p.fecha ? `<span>${esc(p.fecha)}</span>` : ''}${tags}</div>
    <h3>${esc(p.titulo)}</h3><p>${esc(p.descripcion)}</p>${admin ? `<div class="actions">${admin}</div>` : ''}</article>`;
}
