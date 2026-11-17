import { adminRequest } from '../api';
import { moduloOf, state } from '../state';
import { openPreview } from './dialogs';
import { openTopology } from './topology/viewer';
import type { Modulo, Proyecto } from '../types';

interface Handlers {
  openForm: (m: Modulo, p?: Proyecto) => void;
  refresh: () => Promise<void>;
}

/** Delegación de clics: un solo listener para todos los botones con data-*. */
export function initActions({ openForm, refresh }: Handlers): void {
  document.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const get = (attr: string) => t.closest<HTMLElement>(`[${attr}]`)?.getAttribute(attr) ?? null;
    const item = (id: string | null) => state.items.find((p) => p.id === Number(id));

    const prev = get('data-prev');
    if (prev) return openPreview(Number(prev));

    const topo = get('data-topo');
    if (topo) { const p = item(topo); if (p) await openTopology(p); return; }

    const add = get('data-add');
    if (add) { const m = moduloOf(add); if (m) openForm(m); return; }

    const edit = get('data-edit');
    if (edit) { const p = item(edit); const m = p && moduloOf(p.seccion); if (p && m) openForm(m, p); return; }

    const del = get('data-del');
    if (del) {
      if (!confirm('¿Eliminar este elemento?')) return;
      if ((await adminRequest('DELETE', `/proyectos/${del}`)).ok) await refresh();
    }
  });
}
