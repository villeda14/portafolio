import { qsa } from '../utils/dom';

const observer = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
}, { threshold: 0.12 });

/** Anima la aparición de los elementos nuevos al entrar en pantalla. */
export function observeReveals(): void {
  qsa('.rv:not(.in), .card:not(.in), .note:not(.in), .t-item:not(.in)').forEach((el) => observer.observe(el));
}
