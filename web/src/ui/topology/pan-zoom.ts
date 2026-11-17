export interface ViewBox { x: number; y: number; w: number; h: number }

/** Arrastrar, rueda y botones para mover/acercar el SVG cambiando su viewBox. */
export class PanZoom {
  private vb: ViewBox;
  private drag: { x: number; y: number } | null = null;
  private svg: SVGSVGElement | null = null;

  constructor(private readonly host: HTMLElement, private home: ViewBox) {
    this.vb = { ...home };
    host.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.nd, .tv-tools')) return;
      this.drag = { x: e.clientX, y: e.clientY };
      host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const k = this.vb.w / host.getBoundingClientRect().width;
      this.vb.x -= (e.clientX - this.drag.x) * k;
      this.vb.y -= (e.clientY - this.drag.y) * k;
      this.drag = { x: e.clientX, y: e.clientY };
      this.apply();
    });
    host.addEventListener('pointerup', () => { this.drag = null; });
    host.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = host.getBoundingClientRect();
      this.zoom(e.deltaY < 0 ? 0.88 : 1.14, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }, { passive: false });
  }

  attach(svg: SVGSVGElement, home: ViewBox) { this.svg = svg; this.home = home; this.reset(); }

  /** Acerca/aleja manteniendo fijo el punto (fx, fy) ∈ [0,1]. */
  zoom(factor: number, fx = 0.5, fy = 0.5) {
    const w = Math.min(this.home.w * 1.6, Math.max(this.home.w / 6, this.vb.w * factor));
    const h = w * (this.home.h / this.home.w);
    this.vb = { x: this.vb.x + (this.vb.w - w) * fx, y: this.vb.y + (this.vb.h - h) * fy, w, h };
    this.apply();
  }
  reset() { this.vb = { ...this.home }; this.apply(); }
  private apply() { this.svg?.setAttribute('viewBox', `${this.vb.x} ${this.vb.y} ${this.vb.w} ${this.vb.h}`); }
}
