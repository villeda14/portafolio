import { itemsOf, state } from '../../state';
import { byId } from '../../utils/dom';
import { esc } from '../../utils/html';
import { observeReveals } from '../reveal';
import { renderDrawerModules } from '../drawer';
import { cardHtml } from './cards';
import { noteHtml } from './notes';
import { timelineItemHtml } from './timeline';
import type { Modulo } from '../../types';

const KICKER = { tarjetas: 'Proyectos', notas: 'Notas', linea: 'Trayectoria' } as const;
const CONTAINER = { tarjetas: 'cards', notas: 'notes', linea: 'timeline' } as const;
const EMPTY = { tarjetas: 'fa-folder-open', notas: 'fa-pen-to-square', linea: 'fa-trophy' } as const;

const empty = (icon: string) => `<div class="empty"><i class="fa-solid ${icon}"></i>Este módulo aún está vacío.</div>`;

/** Pinta el contenido (y filtros) de un módulo. */
function paintModule(m: Modulo): void {
  const list = byId(`l-${m.slug}`);
  const items = itemsOf(m.slug);

  if (m.tipo === 'tarjetas') {
    const filters = byId(`f-${m.slug}`);
    const cats = [...new Set(items.map((p) => p.categoria).filter((c): c is string => !!c))].sort();
    if (state.filtros[m.slug] && !cats.includes(state.filtros[m.slug])) state.filtros[m.slug] = '';
    const active = state.filtros[m.slug] ?? '';
    filters.innerHTML = cats.length < 2 ? '' : ['', ...cats]
      .map((c) => `<button class="${c === active ? 'on' : ''}" data-cat="${esc(c)}">${c || 'Todos'}</button>`).join('');
    filters.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.addEventListener('click', () => {
      state.filtros[m.slug] = b.dataset.cat ?? '';
      paintModule(m);
    }));
    const visible = items.filter((p) => !active || p.categoria === active);
    list.innerHTML = visible.length ? visible.map(cardHtml).join('') : empty(EMPTY[m.tipo]);
  } else {
    const render = m.tipo === 'notas' ? noteHtml : timelineItemHtml;
    list.innerHTML = items.length ? items.map(render).join('') : empty(EMPTY[m.tipo]);
  }
  observeReveals();
}

/** Reconstruye todas las secciones de módulos y el menú. */
export function renderModules(): void {
  byId('modulos').innerHTML = state.modulos.map((m, i) => `<div class="link"></div>
<section id="m-${esc(m.slug)}"><div class="container">
  <div class="sec-bar rv"><div class="sec-head" style="margin-bottom:var(--s6)">
    <div class="sec-idx">${String(i + 3).padStart(2, '0')} · ${KICKER[m.tipo]}</div><h2>${esc(m.nombre)}</h2>${m.descripcion ? `<p>${esc(m.descripcion)}</p>` : ''}</div>
    ${state.modoApi ? `<button class="btn btn-outline btn-sm" data-add="${esc(m.slug)}"><i class="fa-solid fa-plus"></i> Agregar</button>` : ''}</div>
  ${m.tipo === 'tarjetas' ? `<div class="filters" id="f-${esc(m.slug)}"></div>` : ''}
  <div class="${CONTAINER[m.tipo]}" id="l-${esc(m.slug)}"></div>
</div></section>`).join('');

  renderDrawerModules(state.modulos);
  (document.getElementById('hero-cta') as HTMLAnchorElement | null)?.setAttribute('href', state.modulos[0] ? `#m-${state.modulos[0].slug}` : '#sobre-mi');
  state.modulos.forEach(paintModule);
  observeReveals();
}
