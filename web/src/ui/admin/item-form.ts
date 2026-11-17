import { adminRequest } from '../../api';
import { itemsOf } from '../../state';
import { byId, qsa } from '../../utils/dom';
import { esc } from '../../utils/html';
import type { Modulo, Proyecto } from '../../types';

type Refresh = () => Promise<void>;
const TEXT_FIELDS = ['titulo', 'categoria', 'descripcion', 'tecnologias', 'fecha', 'enlace'] as const;

/** Formulario para agregar o editar un elemento de un módulo. */
export function initItemForm(refresh: Refresh): { open: (m: Modulo, p?: Proyecto) => void } {
  const dialog = byId<HTMLDialogElement>('dlg-form');
  const form = byId<HTMLFormElement>('form');
  const msg = byId('msg');

  function open(m: Modulo, p?: Proyecto) {
    form.reset();
    msg.textContent = '';
    byId<HTMLInputElement>('f-seccion').value = m.slug;
    byId<HTMLInputElement>('f-id').value = p ? String(p.id) : '';
    byId('form-t').textContent = `${p ? 'Editar en' : 'Agregar a'} ${m.nombre}`;
    const cats = [...new Set(itemsOf(m.slug).map((q) => q.categoria).filter(Boolean))];
    byId('dl-cat').innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join('');
    // cada campo declara para qué tipos de módulo se muestra (data-for)
    qsa('[data-for]', form).forEach((f) => f.classList.toggle('hidden', !(f.dataset.for ?? '').split(' ').includes(m.tipo)));
    if (p) for (const k of TEXT_FIELDS) {
      const input = form.elements.namedItem(k) as HTMLInputElement | null;
      if (input) input.value = (p[k] as string | null) ?? '';
    }
    dialog.showModal();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    for (const [k, v] of [...data.entries()]) if (v instanceof File && !v.size) data.delete(k);
    const id = byId<HTMLInputElement>('f-id').value;
    msg.textContent = 'Guardando…';
    try {
      const r = await adminRequest(id ? 'PUT' : 'POST', id ? `/proyectos/${id}` : '/proyectos', data);
      if (!r.ok) { msg.textContent = r.status === 401 ? 'Clave incorrecta.' : ((await r.json()) as { error?: string }).error ?? 'Error al guardar'; return; }
      const res = (await r.json()) as { aviso?: string; topologia?: string };
      dialog.close();
      await refresh();
      if (res.aviso) alert(res.aviso);
    } catch {
      msg.textContent = 'No se pudo conectar con la API.';
    }
  });

  return { open };
}
