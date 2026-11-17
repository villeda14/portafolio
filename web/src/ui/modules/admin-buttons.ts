import { state } from '../../state';
import type { Proyecto } from '../../types';

/** Botones editar / eliminar (sólo visibles con la API local encendida). */
export const adminButtons = (p: Proyecto): string =>
  state.modoApi
    ? `<button class="btn btn-outline btn-sm" data-edit="${p.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>` +
      `<button class="btn btn-danger btn-sm" data-del="${p.id}" aria-label="Eliminar"><i class="fa-solid fa-trash"></i></button>`
    : '';
