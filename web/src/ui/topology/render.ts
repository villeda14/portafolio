import { esc } from '../../utils/html';
import type { DeviceKind, TopoDevice, TopoLink, Topology } from '../../types';

/** Escala de las coordenadas de Packet Tracer al lienzo SVG. */
const SCALE = 1.35;
const PAD = 90;

const GLYPH: Record<DeviceKind, string> = {
  router: '', l3switch: '', switch: '', pc: '',
  server: '', accesspoint: '', cloud: '', other: '',
};

export interface Point { x: number; y: number }
export interface Scene {
  svg: string;
  viewBox: { x: number; y: number; w: number; h: number };
  position(deviceId: string): Point;
}

const short = (port: string) =>
  port.replace(/^GigabitEthernet/i, 'Gi').replace(/^FastEthernet/i, 'Fa').replace(/^Serial/i, 'Se').replace(/^TenGigabitEthernet/i, 'Te');

/** Línea en zigzag (como el rayo rojo de los enlaces seriales en Packet Tracer). */
function zigzag(a: Point, b: Point): string {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len, mx = a.x + dx / 2, my = a.y + dy / 2;
  const at = (t: number, off: number) => `${a.x + dx * t + nx * off},${a.y + dy * t + ny * off}`;
  return `M${a.x},${a.y} L${at(0.42, 0)} L${at(0.47, 14)} L${mx - nx * 14 + 0},${my - ny * 14} L${at(0.58, 0)} L${b.x},${b.y}`;
}

function linkSvg(l: TopoLink, pos: (id: string) => Point): string {
  const a = pos(l.from.device), b = pos(l.to.device);
  const at = (t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const data = `data-a="${esc(l.from.device)}" data-b="${esc(l.to.device)}"`;
  const geometry = l.cable === 'serial'
    ? `<path class="lk serial" ${data} d="${zigzag(a, b)}"/>`
    : `<line class="lk ${l.cable}" ${data} x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
  const p1 = at(0.2), p2 = at(0.8);
  return geometry +
    `<text class="pl" x="${p1.x}" y="${p1.y - 5}">${esc(short(l.from.port))}</text>` +
    `<text class="pl" x="${p2.x}" y="${p2.y - 5}">${esc(short(l.to.port))}</text>`;
}

function nodeSvg(d: TopoDevice, p: Point): string {
  return `<g class="nd ${d.kind}" data-id="${esc(d.id)}" transform="translate(${p.x},${p.y})" tabindex="0" role="button" aria-label="${esc(d.name)}">` +
    `<circle r="27"/><text class="gl">${GLYPH[d.kind]}</text><text class="lb" y="47">${esc(d.name)}</text></g>`;
}

/** Construye el SVG de la topología. */
export function buildScene(topo: Topology): Scene {
  const { minX, minY, maxX, maxY } = topo.bounds;
  const points = new Map<string, Point>();
  for (const d of topo.devices) points.set(d.id, { x: (d.x - minX) * SCALE + PAD, y: (d.y - minY) * SCALE + PAD });
  const position = (id: string) => points.get(id) ?? { x: 0, y: 0 };

  const w = (maxX - minX) * SCALE + PAD * 2, h = (maxY - minY) * SCALE + PAD * 2;
  const links = topo.links.map((l) => linkSvg(l, position)).join('');
  const nodes = topo.devices.map((d) => nodeSvg(d, position(d.id))).join('');
  return {
    svg: `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Topología de red"><g id="tp-links">${links}</g><g id="tp-nodes">${nodes}</g><g id="tp-pk"></g></svg>`,
    viewBox: { x: 0, y: 0, w, h },
    position,
  };
}
