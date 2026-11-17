import type { Modulo, Proyecto } from './types';

/** Estado global de la página (una sola fuente de verdad). */
export const state = {
  modulos: [] as Modulo[],
  items: [] as Proyecto[],
  /** true cuando la API está disponible (modo administrador local). */
  modoApi: false,
  /** Filtro de categoría activo por módulo (slug → categoría). */
  filtros: {} as Record<string, string>,
};

export const itemsOf = (slug: string) => state.items.filter((p) => p.seccion === slug);
export const moduloOf = (slug: string) => state.modulos.find((m) => m.slug === slug);
