import { assetUrl } from '../../api';
import { byId, qsa } from '../../utils/dom';
import { esc } from '../../utils/html';
import { deviceDetailsHtml } from './details';
import { PanZoom } from './pan-zoom';
import { buildScene } from './render';
import { Simulation } from './simulation';
import type { Proyecto, Topology } from '../../types';

let panZoom: PanZoom | null = null;
let simulation: Simulation | null = null;
let current: Topology | null = null;
let wired = false;

const INFO_HINT = 'Toca un dispositivo para ver sus interfaces, direccionamiento y configuración.';

function selectDevice(id: string) {
  if (!current) return;
  qsa('.nd', byId('topo-view')).forEach((g) => g.classList.toggle('sel', g.dataset.id === id));
  const d = current.devices.find((x) => x.id === id);
  if (d) byId('tp-info').innerHTML = deviceDetailsHtml(d);
}

/** Eventos del visor: se conectan una sola vez; trabajan sobre la topología actual. */
function wireOnce(view: HTMLElement) {
  if (wired) return;
  wired = true;
  view.addEventListener('click', (e) => { const g = (e.target as HTMLElement).closest<SVGGElement>('.nd'); if (g?.dataset.id) selectDevice(g.dataset.id); });
  view.addEventListener('keydown', (e) => {
    const g = (e.target as HTMLElement).closest<SVGGElement>('.nd');
    if (g?.dataset.id && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectDevice(g.dataset.id); }
  });
  byId('tz-in').addEventListener('click', () => panZoom?.zoom(0.75));
  byId('tz-out').addEventListener('click', () => panZoom?.zoom(1.33));
  byId('tz-0').addEventListener('click', () => panZoom?.reset());
  byId('tz-ports').addEventListener('click', (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const on = view.classList.toggle('ports');
    btn.setAttribute('aria-pressed', String(on));
  });
  byId('tp-go').addEventListener('click', () => void simulation?.run(byId<HTMLSelectElement>('tp-from').value, byId<HTMLSelectElement>('tp-to').value));
  byId('tp-clr').addEventListener('click', () => { simulation?.clear(); simulation?.clearLog(); });
  byId<HTMLDialogElement>('dlg-topo').addEventListener('close', () => simulation?.clear());
}

function fillSelectors(topo: Topology) {
  const opts = topo.devices.map((d) => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');
  const from = byId<HTMLSelectElement>('tp-from'), to = byId<HTMLSelectElement>('tp-to');
  from.innerHTML = to.innerHTML = opts;
  const firstPc = topo.devices.find((d) => d.kind === 'pc');
  const lastServer = [...topo.devices].reverse().find((d) => d.kind === 'server');
  if (firstPc) from.value = firstPc.id;
  if (lastServer) to.value = lastServer.id;
}

export async function openTopology(p: Proyecto): Promise<void> {
  if (!p.topologia) return;
  const dialog = byId<HTMLDialogElement>('dlg-topo');
  const view = byId('topo-view');

  let topo: Topology;
  try {
    const r = await fetch(assetUrl(p.topologia));
    topo = (await r.json()) as Topology;
    if (topo.schema !== 2) throw new Error('formato antiguo');
  } catch {
    alert('No se pudo cargar la topología. Si es un proyecto antiguo, ejecuta "npm run topologias".');
    return;
  }
  current = topo;

  byId('topo-t').textContent = p.titulo;
  view.querySelector('svg')?.remove();
  const scene = buildScene(topo);
  view.insertAdjacentHTML('afterbegin', scene.svg);
  const svg = view.querySelector('svg') as SVGSVGElement;

  panZoom ??= new PanZoom(view, scene.viewBox);
  panZoom.attach(svg, scene.viewBox);
  simulation = new Simulation(topo, view, byId<HTMLOListElement>('tp-log') as HTMLOListElement, scene.position);
  simulation.clearLog();
  fillSelectors(topo);
  byId('tp-info').textContent = INFO_HINT;
  wireOnce(view);
  dialog.showModal();
}
