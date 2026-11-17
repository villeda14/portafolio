import type { Topology } from '../../types';

export interface Hop {
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
}

/** Camino más corto (menos saltos) entre dos dispositivos, con los puertos de cada salto. */
export function findPath(topo: Topology, from: string, to: string): Hop[] {
  const adj = new Map<string, Hop[]>();
  for (const l of topo.links) {
    const add = (h: Hop) => { const list = adj.get(h.from) ?? []; list.push(h); adj.set(h.from, list); };
    add({ from: l.from.device, fromPort: l.from.port, to: l.to.device, toPort: l.to.port });
    add({ from: l.to.device, fromPort: l.to.port, to: l.from.device, toPort: l.from.port });
  }
  const prev = new Map<string, Hop | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const hop of adj.get(cur) ?? []) {
      if (!prev.has(hop.to)) { prev.set(hop.to, hop); queue.push(hop.to); }
    }
  }
  if (!prev.has(to)) return [];
  const path: Hop[] = [];
  for (let cur = prev.get(to); cur; cur = prev.get(cur.from)) path.unshift(cur);
  return path;
}

export const reverseHop = (h: Hop): Hop => ({ from: h.to, fromPort: h.toPort, to: h.from, toPort: h.fromPort });
