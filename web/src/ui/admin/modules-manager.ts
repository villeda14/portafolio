import { adminRequest } from '../../api';
import { itemsOf, state } from '../../state';
import { byId } from '../../utils/dom';
import { esc } from '../../utils/html';

type Refresh = () => Promise<void>;

/** Diálogo para crear, renombrar, ordenar y eliminar módulos. */
export function initModulesManager(refresh: Refresh): void {
  const dialog = byId<HTMLDialogElement>('dlg-mod');
  const list = byId('mod-list');

  const paint = () => {
    list.innerHTML = state.modulos.map((m, i) => `<div class="mod-row">
      <div><input value="${esc(m.nombre)}" data-ren="${m.id}" aria-label="Nombre del módulo"><span class="tipo">${m.tipo} · ${itemsOf(m.slug).length} elementos</span></div>
      <div class="bt">
        <button data-up="${i}" aria-label="Subir" ${i === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-up"></i></button>
        <button data-down="${i}" aria-label="Bajar" ${i === state.modulos.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-down"></i></button>
        <button data-delmod="${m.id}" aria-label="Eliminar módulo" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button>
      </div></div>`).join('') || '<p>No hay módulos. Crea el primero abajo.</p>';
  };
  const reload = async () => { await refresh(); paint(); };

  byId('btn-gestion').addEventListener('click', () => {
    document.dispatchEvent(new Event('drawer:close'));
    paint();
    dialog.showModal();
  });

  byId<HTMLFormElement>('mod-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await adminRequest('POST', '/modulos', {
      nombre: byId<HTMLInputElement>('m-nombre').value,
      descripcion: byId<HTMLInputElement>('m-desc').value,
      tipo: byId<HTMLSelectElement>('m-tipo').value,
    });
    if (r.ok) { (e.target as HTMLFormElement).reset(); await reload(); }
    else if (r.status !== 401) alert(((await r.json()) as { error?: string }).error ?? 'Error');
  });

  dialog.addEventListener('change', async (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>('[data-ren]');
    if (input?.value.trim()) { await adminRequest('PUT', `/modulos/${input.dataset.ren}`, { nombre: input.value.trim() }); await reload(); }
  });

  dialog.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const del = t.closest<HTMLElement>('[data-delmod]');
    if (del) {
      const m = state.modulos.find((q) => q.id === Number(del.dataset.delmod));
      if (!m || !confirm(`¿Eliminar el módulo "${m.nombre}" y sus ${itemsOf(m.slug).length} elementos? No se puede deshacer.`)) return;
      if ((await adminRequest('DELETE', `/modulos/${m.id}`)).ok) await reload();
      return;
    }
    const mv = t.closest<HTMLButtonElement>('[data-up],[data-down]');
    if (mv && !mv.disabled) {
      const i = Number(mv.dataset.up ?? mv.dataset.down);
      const j = mv.dataset.up !== undefined ? i - 1 : i + 1;
      await adminRequest('PUT', `/modulos/${state.modulos[i].id}`, { orden: j + 1 });
      await adminRequest('PUT', `/modulos/${state.modulos[j].id}`, { orden: i + 1 });
      await reload();
    }
  });
}
