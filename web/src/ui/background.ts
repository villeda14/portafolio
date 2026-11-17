import { byId, reduceMotion } from '../utils/dom';

interface Node { x: number; y: number; vx: number; vy: number }
interface Packet { a: Node; b: Node; t: number }

/** Fondo animado: una red de nodos por la que viajan paquetes. */
export function startBackground(): void {
  const canvas = byId<HTMLCanvasElement>('net');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const still = reduceMotion();
  const LINK_DIST = 170;
  let w = 0, h = 0, nodes: Node[] = [], packets: Packet[] = [];

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(18, Math.min(48, Math.floor((w * h) / 32000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    }));
    packets = [];
  }

  function frame() {
    const c = ctx!;
    c.clearRect(0, 0, w, h);
    for (const n of nodes) {
      if (!still) { n.x += n.vx; n.y += n.vy; }
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    const links: [Node, Node][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d >= LINK_DIST) continue;
        links.push([nodes[i], nodes[j]]);
        c.strokeStyle = `rgba(240,163,94,${0.16 * (1 - d / LINK_DIST)})`;
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(nodes[i].x, nodes[i].y); c.lineTo(nodes[j].x, nodes[j].y); c.stroke();
      }
    }
    if (!still) {
      if (links.length && Math.random() < 0.05 && packets.length < 14) {
        const [a, b] = links[Math.floor(Math.random() * links.length)];
        packets.push({ a, b, t: 0 });
      }
      packets = packets.filter((p) => p.t < 1);
      for (const p of packets) {
        p.t += 0.012;
        c.fillStyle = 'rgba(143,191,174,.95)'; c.shadowColor = '#8fbfae'; c.shadowBlur = 10;
        c.beginPath(); c.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 2.2, 0, 6.3); c.fill();
        c.shadowBlur = 0;
      }
    }
    for (const n of nodes) { c.fillStyle = 'rgba(240,163,94,.55)'; c.beginPath(); c.arc(n.x, n.y, 2, 0, 6.3); c.fill(); }
    if (!still) requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', () => { resize(); if (still) frame(); });
  frame();
}
