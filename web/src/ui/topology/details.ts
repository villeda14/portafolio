import { esc } from '../../utils/html';
import { ipWithCidr } from '../../utils/ip';
import type { PortInfo, TopoDevice } from '../../types';

const KIND_LABEL: Record<TopoDevice['kind'], string> = {
  router: 'Router', switch: 'Switch', l3switch: 'Switch capa 3', pc: 'PC', server: 'Servidor',
  accesspoint: 'Punto de acceso', cloud: 'Nube', other: 'Dispositivo',
};

function portRow(p: PortInfo): string {
  const addr = p.ip ? ipWithCidr(p.ip, p.mask) : p.dhcp ? 'DHCP' : '—';
  const extra = [p.switchport, p.description, p.shutdown ? 'apagado' : ''].filter(Boolean).join(' · ');
  return `<tr><td>${esc(p.name.replace(/^GigabitEthernet/, 'Gi').replace(/^FastEthernet/, 'Fa').replace(/^Serial/, 'Se'))}</td><td>${esc(addr)}${extra ? `<br>${esc(extra)}` : ''}</td></tr>`;
}

/** HTML del panel con la información real del dispositivo (leída del .pkt). */
export function deviceDetailsHtml(d: TopoDevice): string {
  const parts = [`<b>${esc(d.name)}</b><span class="sub">${KIND_LABEL[d.kind]} · ${esc(d.model)}</span>`];

  const ports = d.ports.filter((p) => p.ip || p.dhcp || p.switchport || p.description || p.gateway);
  if (ports.length) parts.push(`<h5>Interfaces</h5><table>${ports.map(portRow).join('')}</table>`);

  const endpoint = d.ports.find((p) => p.gateway || p.dns);
  if (endpoint) {
    parts.push(`<h5>Red</h5><table>${endpoint.gateway ? `<tr><td>Gateway</td><td>${esc(endpoint.gateway)}</td></tr>` : ''}${endpoint.dns ? `<tr><td>DNS</td><td>${esc(endpoint.dns)}</td></tr>` : ''}</table>`);
  }
  if (d.vlans?.length) parts.push(`<h5>VLANs</h5><table>${d.vlans.map((v) => `<tr><td>${v.id}</td><td>${esc(v.name)}</td></tr>`).join('')}</table>`);
  if (d.staticRoutes?.length) parts.push(`<h5>Rutas estáticas</h5><ul>${d.staticRoutes.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`);

  const pools = d.services?.dhcpPools;
  if (pools?.length) {
    parts.push(`<h5>Pools DHCP</h5><table>${pools.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(ipWithCidr(p.network, p.mask))}${p.gateway ? `<br>gw ${esc(p.gateway)}` : ''}</td></tr>`).join('')}</table>`);
  }
  const dns = d.services?.dnsRecords;
  if (dns?.length) parts.push(`<h5>Registros DNS</h5><table>${dns.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.address)}</td></tr>`).join('')}</table>`);
  if (d.services?.http) parts.push('<h5>Servicios</h5><ul><li>HTTP habilitado</li></ul>');

  if (d.config?.length) {
    parts.push(`<details><summary>Configuración (sin secretos)</summary><pre>${esc(d.config.filter((l) => l.trim() !== '!').join('\n'))}</pre></details>`);
  }
  return parts.join('');
}
