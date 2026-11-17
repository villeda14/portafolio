import { state } from './state';
import type { Modulo, Proyecto } from './types';

/**
 * Capa de datos. Con la API local encendida se lee de MySQL (modo administrador);
 * en GitHub Pages no hay API y se leen los JSON estáticos exportados.
 */

/** Los archivos subidos viven en docs/uploads, junto al sitio, en ambos modos. */
export const assetUrl = (path: string) => `.${path}`;

async function getJson<T>(url: string, timeoutMs?: number): Promise<T> {
  const ctl = new AbortController();
  const timer = timeoutMs ? setTimeout(() => ctl.abort(), timeoutMs) : undefined;
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadData(): Promise<void> {
  try {
    const [m, p] = await Promise.all([
      getJson<Modulo[]>('/api/modulos', 1500),
      getJson<Proyecto[]>('/api/proyectos', 1500),
    ]);
    state.modulos = m; state.items = p; state.modoApi = true;
  } catch {
    state.modoApi = false;
    try {
      const [m, p] = await Promise.all([getJson<Modulo[]>('modulos.json'), getJson<Proyecto[]>('projects.json')]);
      state.modulos = m; state.items = p;
    } catch {
      state.modulos = []; state.items = [];
    }
  }
  document.querySelectorAll('.admin').forEach((b) => b.classList.toggle('hidden', !state.modoApi));
}

/* ---------- administración (sólo con la API local) ---------- */

const KEY = 'k';
function adminKey(): string {
  let k = '';
  try { k = sessionStorage.getItem(KEY) ?? ''; } catch { /* sin almacenamiento */ }
  if (!k) {
    k = prompt('Clave de administrador:') ?? '';
    try { sessionStorage.setItem(KEY, k); } catch { /* sin almacenamiento */ }
  }
  return k;
}

export async function adminRequest(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: FormData | object): Promise<Response> {
  const isJson = body !== undefined && !(body instanceof FormData);
  const r = await fetch(`/api${path}`, {
    method,
    headers: { 'x-admin-key': adminKey(), ...(isJson ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : isJson ? JSON.stringify(body) : (body as FormData),
  });
  if (r.status === 401) {
    try { sessionStorage.removeItem(KEY); } catch { /* sin almacenamiento */ }
    alert('Clave incorrecta');
  }
  return r;
}
