import { byId } from '../utils/dom';
import { esc } from '../utils/html';
import type { Modulo } from '../types';

const ICONS = { tarjetas: 'diagram-project', notas: 'pen-to-square', linea: 'trophy' } as const;

/** Menú hamburguesa lateral. */
export function initDrawer(): void {
  const drawer = byId('drawer'), veil = byId('veil'), burger = byId('burger');
  const toggle = (open: boolean) => {
    drawer.classList.toggle('open', open);
    veil.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) byId('d-close').focus();
  };
  burger.addEventListener('click', () => toggle(!drawer.classList.contains('open')));
  veil.addEventListener('click', () => toggle(false));
  byId('d-close').addEventListener('click', () => toggle(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  drawer.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) toggle(false); });
  // otros módulos pueden cerrar el menú (p. ej. al abrir el gestor)
  document.addEventListener('drawer:close', () => toggle(false));
}

export function renderDrawerModules(modulos: Modulo[]): void {
  byId('d-mods').innerHTML = modulos.length
    ? modulos.map((m) => `<a href="#m-${esc(m.slug)}"><i class="fa-solid fa-${ICONS[m.tipo]}"></i>${esc(m.nombre)}</a>`).join('')
    : '<p style="padding:0 var(--s4);font-size:.85rem">Sin módulos todavía.</p>';
}
