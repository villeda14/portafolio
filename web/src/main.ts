import { loadData } from './api';
import { state } from './state';
import { initActions } from './ui/actions';
import { initItemForm } from './ui/admin/item-form';
import { initModulesManager } from './ui/admin/modules-manager';
import { startBackground } from './ui/background';
import { initDialogs } from './ui/dialogs';
import { initDrawer } from './ui/drawer';
import { renderModules } from './ui/modules/render';
import { initProgress } from './ui/progress';
import { observeReveals } from './ui/reveal';

/** Recarga datos y vuelve a pintar (se usa tras cualquier cambio de administración). */
async function refresh(): Promise<void> {
  await loadData();
  renderModules();
}

startBackground();
initProgress();
initDrawer();
initDialogs();
observeReveals();

const itemForm = initItemForm(refresh);
initModulesManager(refresh);
initActions({ openForm: itemForm.open, refresh });

await refresh();
console.info(`Portafolio cargado (${state.modoApi ? 'modo administrador' : 'modo estático'})`);
