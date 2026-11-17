/** Tipos del dominio del portafolio, compartidos por la API y el sitio. */

export type TipoModulo = 'tarjetas' | 'notas' | 'linea';

export interface Modulo {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoModulo;
  orden: number;
}

export interface Proyecto {
  id: number;
  seccion: string;
  titulo: string;
  descripcion: string;
  tecnologias: string | null;
  categoria: string | null;
  fecha: string | null;
  enlace: string | null;
  imagen: string | null;
  archivo: string | null;
  archivo_nombre: string | null;
  /** Ruta del JSON con la topología extraída del .pkt (si lo hay). */
  topologia: string | null;
}

export const TIPOS_MODULO: readonly TipoModulo[] = ['tarjetas', 'notas', 'linea'];
