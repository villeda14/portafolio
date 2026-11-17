import { byId } from '../utils/dom';

/** Barra superior que avanza con el scroll. */
export function initProgress(): void {
  const bar = byId('progress');
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  }, { passive: true });
}
