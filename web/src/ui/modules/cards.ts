import { assetUrl } from '../../api';
import { esc, isVideo, splitTags } from '../../utils/html';
import { adminButtons } from './admin-buttons';
import type { Proyecto } from '../../types';

function mediaHtml(p: Proyecto): string {
  if (p.imagen && isVideo(p.imagen)) {
    return `<video src="${assetUrl(esc(p.imagen))}" muted loop playsinline preload="metadata" data-hover-play></video>`;
  }
  if (p.imagen) return `<img src="${assetUrl(esc(p.imagen))}" alt="${esc(p.titulo)}" loading="lazy">`;
  return `<i class="fa-solid ${p.archivo ? 'fa-network-wired' : 'fa-folder-open'} ph"></i>`;
}

export function cardHtml(p: Proyecto): string {
  const tags = splitTags(p.tecnologias).map((t) => `<span>${esc(t)}</span>`).join('');
  const actions: string[] = [];
  if (p.topologia) actions.push(`<button class="btn btn-primary btn-sm" data-topo="${p.id}"><i class="fa-solid fa-diagram-project"></i> Explorar topología</button>`);
  if (p.archivo) actions.push(`<a class="btn ${p.topologia ? 'btn-outline' : 'btn-primary'} btn-sm" href="${assetUrl(esc(p.archivo))}" download="${esc(p.archivo_nombre ?? 'archivo')}"><i class="fa-solid fa-download"></i> Descargar</a>`);
  if (p.enlace) {
    const local = p.enlace.startsWith('/uploads');
    const href = local ? assetUrl(esc(p.enlace)) : esc(p.enlace);
    actions.push(`<a class="btn btn-outline btn-sm" href="${href}" target="_blank" rel="noopener"><i class="fa-solid ${local ? 'fa-file-pdf' : 'fa-arrow-up-right-from-square'}"></i> ${local ? 'Informe' : 'Ver'}</a>`);
  }
  const admin = adminButtons(p);
  if (admin) actions.push(admin);

  return `<article class="card">
    <div class="media">${mediaHtml(p)}${p.archivo ? '<span class="leds"><i></i><i></i><i></i></span>' : ''}${p.imagen ? `<button class="play" data-prev="${p.id}" aria-label="Ampliar vista previa"><i class="fa-solid fa-expand"></i></button>` : ''}</div>
    <div class="body"><span class="kicker">${esc(p.categoria)}</span><h3>${esc(p.titulo)}</h3><p>${esc(p.descripcion)}</p>
    <div class="tags">${tags}</div>${actions.length ? `<div class="actions">${actions.join('')}</div>` : ''}</div></article>`;
}
