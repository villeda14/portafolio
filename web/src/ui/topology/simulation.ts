import { reduceMotion } from '../../utils/dom';
import { findPath, reverseHop, type Hop } from './pathfinding';
import type { Point } from './render';
import type { Topology } from '../../types';

const NS = 'http://www.w3.org/2000/svg';
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const short = (port: string) =>
  port.replace(/^GigabitEthernet/i, 'Gi').replace(/^FastEthernet/i, 'Fa').replace(/^Serial/i, 'Se').replace(/^TenGigabitEthernet/i, 'Te');

/** Anima un paquete (solicitud y respuesta) entre dos dispositivos y lo registra paso a paso. */
export class Simulation {
  private token = 0;

  constructor(
    private readonly topo: Topology,
    private readonly view: HTMLElement,
    private readonly log: HTMLOListElement,
    private readonly position: (id: string) => Point,
  ) {}

  clear() {
    this.token++;
    this.view.querySelectorAll('.lk.on').forEach((l) => l.classList.remove('on'));
    this.view.querySelector('#tp-pk')!.innerHTML = '';
  }

  clearLog() { this.log.innerHTML = ''; }

  async run(from: string, to: string): Promise<void> {
    this.clear();
    this.clearLog();
    const mine = this.token;
    if (from === to) { this.line('Origen y destino son el mismo dispositivo.'); return; }
    const path = findPath(this.topo, from, to);
    if (!path.length) { this.line('No hay un camino entre estos dispositivos.'); return; }

    const packet = document.createElementNS(NS, 'circle');
    packet.setAttribute('r', '9');
    this.view.querySelector('#tp-pk')!.appendChild(packet);

    const legs: [Hop, boolean][] = [...path.map((h): [Hop, boolean] => [h, false]), ...[...path].reverse().map((h): [Hop, boolean] => [reverseHop(h), true])];
    for (const [hop, back] of legs) {
      if (mine !== this.token) return;
      packet.setAttribute('class', `pkt${back ? ' back' : ''}`);
      this.highlight(hop);
      const li = this.line(`${back ? 'Respuesta' : 'Solicitud'}: ${hop.from} (${short(hop.fromPort)}) → ${hop.to} (${short(hop.toPort)})`, 'now');
      await this.move(packet, this.position(hop.from), this.position(hop.to), 520, mine);
      li.classList.remove('now');
    }
    if (mine === this.token) {
      this.line(`Completado: ${path.length} saltos, ida y vuelta.`, 'done');
      packet.remove();
    }
  }

  private highlight(h: Hop) {
    this.view.querySelectorAll<SVGElement>('.lk').forEach((l) => {
      const a = l.dataset.a, b = l.dataset.b;
      if ((a === h.from && b === h.to) || (a === h.to && b === h.from)) l.classList.add('on');
    });
  }

  private line(text: string, cls = ''): HTMLLIElement {
    const li = document.createElement('li');
    li.textContent = text;
    if (cls) li.className = cls;
    this.log.appendChild(li);
    this.log.scrollTop = this.log.scrollHeight;
    return li;
  }

  private async move(el: SVGCircleElement, a: Point, b: Point, ms: number, token: number): Promise<void> {
    if (reduceMotion()) { el.setAttribute('cx', String(b.x)); el.setAttribute('cy', String(b.y)); await sleep(120); return; }
    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const step = (t: number) => {
        const k = Math.min((t - t0) / ms, 1);
        el.setAttribute('cx', String(a.x + (b.x - a.x) * k));
        el.setAttribute('cy', String(a.y + (b.y - a.y) * k));
        if (k < 1 && token === this.token) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }
}
