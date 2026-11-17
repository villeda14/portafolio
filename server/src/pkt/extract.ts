import { XMLParser } from 'fast-xml-parser';
import type {
  DeviceKind, DhcpPool, DnsRecord, LinkMedium, CableKind, PortInfo, TopoDevice, TopoLink, Topology,
} from '../../../shared/topology';
import { PktFormatError } from './decoder';
import { sanitizeConfig } from './sanitize';

/* ---------- utilidades de lectura del XML ---------- */

type Node = Record<string, any>;

const ARRAY_TAGS = new Set([
  'DEVICE', 'LINK', 'LINE', 'VLAN', 'PORT', 'POOL', 'RESOURCE-RECORD', 'MODULE', 'SLOT', 'ASSOCIATED_PORT',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false, // se conserva la sangría de las líneas de configuración
  isArray: (name) => ARRAY_TAGS.has(name),
});

/** Texto de un nodo que puede traer atributos (<NAME translate="true">R1</NAME>). */
function text(n: unknown): string {
  if (n == null) return '';
  if (typeof n === 'object') return text((n as Node)['#text']);
  return String(n).trim();
}
/** Texto sin recortar (conserva la sangría de la running-config). */
function rawText(n: unknown): string {
  if (n == null) return '';
  if (typeof n === 'object') return rawText((n as Node)['#text']);
  return String(n);
}
const num = (n: unknown, fallback = 0): number => {
  const v = parseFloat(text(n));
  return Number.isFinite(v) ? v : fallback;
};
const arr = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** Recorre el árbol y devuelve todos los nodos <PORT> (están anidados en MODULE/SLOT). */
function collectPorts(node: unknown, acc: Node[] = []): Node[] {
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Node)) {
      if (k === 'PORT') acc.push(...arr<Node>(v as Node));
      else if (k === 'MODULE' || k === 'SLOT') for (const c of arr<Node>(v as Node)) collectPorts(c, acc);
    }
  }
  return acc;
}

/* ---------- tipos de dispositivo ---------- */

const KIND_BY_TYPE: Record<string, DeviceKind> = {
  Router: 'router',
  Switch: 'switch',
  MultiLayerSwitch: 'l3switch',
  Pc: 'pc',
  Laptop: 'pc',
  TabletPC: 'pc',
  Server: 'server',
  AccessPoint: 'accesspoint',
  LightWeightAccessPoint: 'accesspoint',
  Cloud: 'cloud',
};
const IGNORED_TYPES = new Set(['Power Distribution Device']);

/* ---------- configuración de equipos de red ---------- */

const IFACE_SHORT: [RegExp, string][] = [
  [/^GigabitEthernet/i, 'Gi'], [/^FastEthernet/i, 'Fa'], [/^TenGigabitEthernet/i, 'Te'], [/^Serial/i, 'Se'], [/^Ethernet/i, 'Eth'],
];
export function shortPort(name: string): string {
  for (const [re, s] of IFACE_SHORT) if (re.test(name)) return name.replace(re, s);
  return name;
}

/** Interpreta bloques `interface …` de una running-config. */
function parseConfigInterfaces(lines: string[]): PortInfo[] {
  const ports: PortInfo[] = [];
  let cur: PortInfo | null = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const head = /^interface\s+(\S+)/i.exec(line);
    if (head) { cur = { name: head[1] }; ports.push(cur); continue; }
    if (!cur) continue;
    if (!line.startsWith(' ')) { cur = null; continue; }
    const t = line.trim();
    let m: RegExpExecArray | null;
    if ((m = /^description\s+(.+)$/i.exec(t))) cur.description = m[1];
    else if ((m = /^ip address\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)/i.exec(t))) { cur.ip = m[1]; cur.mask = m[2]; }
    else if ((m = /^ipv6 address\s+(\S+)/i.exec(t))) (cur.ipv6 ??= []).push(m[1]);
    else if (/^shutdown$/i.test(t)) cur.shutdown = true;
    else if ((m = /^switchport access vlan\s+(\d+)/i.exec(t))) cur.switchport = `access VLAN ${m[1]}`;
    else if (/^switchport mode trunk/i.test(t)) cur.switchport = 'trunk';
    else if ((m = /^encapsulation dot1q\s+(\d+)/i.exec(t))) cur.switchport = `dot1Q VLAN ${m[1]}`;
    else if ((m = /^channel-group\s+(\d+)/i.exec(t))) cur.switchport = `EtherChannel ${m[1]}`;
  }
  // se omiten interfaces sin información útil (VLAN1 apagada sin IP, etc.)
  return ports.filter((p) => p.ip || p.description || p.switchport || p.ipv6 || !p.shutdown);
}

function parseStaticRoutes(lines: string[]): string[] {
  return lines.map((l) => l.trim()).filter((l) => /^ip route\s/i.test(l)).map((l) => l.replace(/^ip route\s+/i, ''));
}

/* ---------- puertos de equipos finales (PC, servidores, AP) ---------- */

function parseEndpointPorts(engine: Node): PortInfo[] {
  const out: PortInfo[] = [];
  for (const p of collectPorts(engine.MODULE)) {
    const type = text(p.TYPE);
    if (!/Ethernet|Wireless|Serial/i.test(type)) continue;
    const ip = text(p.IP), mask = text(p.SUBNET);
    const info: PortInfo = { name: text(p.NAME) || type.replace(/^eCopper/, '') };
    if (ip) { info.ip = ip; info.mask = mask || undefined; }
    if (text(p.MACADDRESS)) info.mac = text(p.MACADDRESS);
    if (text(p.PORT_DHCP_ENABLE) === 'true') info.dhcp = true;
    if (text(p.PORT_GATEWAY)) info.gateway = text(p.PORT_GATEWAY);
    if (text(p.PORT_DNS)) info.dns = text(p.PORT_DNS);
    if (info.ip || info.dhcp || info.gateway || info.dns) out.push(info);
  }
  return out;
}

/* ---------- servicios de servidor ---------- */

function parseServices(engine: Node): TopoDevice['services'] | undefined {
  const services: NonNullable<TopoDevice['services']> = {};

  const pools: DhcpPool[] = [];
  for (const ap of arr<Node>(engine.DHCP_SERVERS?.ASSOCIATED_PORTS?.ASSOCIATED_PORT)) {
    if (text(ap.DHCP_SERVER?.ENABLED) !== '1') continue;
    for (const p of arr<Node>(ap.DHCP_SERVER?.POOLS?.POOL)) {
      const gw = text(p.DEFAULT_ROUTER), dns = text(p.DNS_SERVER);
      pools.push({
        name: text(p.NAME), network: text(p.NETWORK), mask: text(p.MASK),
        gateway: gw && gw !== '0.0.0.0' ? gw : undefined,
        dns: dns && dns !== '0.0.0.0' ? dns : undefined,
        start: text(p.START_IP) || undefined, end: text(p.END_IP) || undefined,
      });
    }
  }
  if (pools.length) services.dhcpPools = pools;

  if (text(engine.DNS_SERVER?.ENABLED) === '1') {
    const recs: DnsRecord[] = arr<Node>(engine.DNS_SERVER?.['NAMESERVER-DATABASE']?.['RESOURCE-RECORD'])
      .map((r) => ({ name: text(r.NAME), type: text(r.TYPE).replace(/-REC$/, ''), address: text(r.IPADDRESS) }))
      .filter((r) => r.name && r.address);
    if (recs.length) services.dnsRecords = recs;
  }
  if (text(engine.HTTP_SERVER?.ENABLED) === '1') services.http = true;

  return Object.keys(services).length ? services : undefined;
}

/* ---------- enlaces ---------- */

function parseCable(link: Node): { medium: LinkMedium; cable: CableKind } {
  const t = text(link.TYPE);
  const sub = text(link.CABLE?.TYPE);
  if (t === 'eSerial') return { medium: 'serial', cable: 'serial' };
  if (t === 'eFiber') return { medium: 'fiber', cable: 'fiber' };
  if (t === 'eWireless') return { medium: 'wireless', cable: 'other' };
  if (t === 'eCopper') return { medium: 'copper', cable: sub === 'eCrossOver' ? 'crossover' : 'straight' };
  return { medium: 'other', cable: 'other' };
}

/* ---------- entrada principal ---------- */

/** Convierte el XML de Packet Tracer en una topología lista para dibujar. */
export function extractTopology(xml: string): Topology {
  const root = parser.parse(xml).PACKETTRACER5 as Node | undefined;
  const network = root?.NETWORK as Node | undefined;
  if (!network?.DEVICES) throw new PktFormatError('El proyecto no contiene dispositivos');

  const devices: TopoDevice[] = [];
  const idBySaveRef = new Map<string, string>();

  for (const d of arr<Node>(network.DEVICES.DEVICE)) {
    const engine = d.ENGINE as Node;
    const typeName = text(engine.TYPE);
    if (IGNORED_TYPES.has(typeName)) continue;

    const name = text(engine.NAME);
    const kind = KIND_BY_TYPE[typeName] ?? 'other';
    const logical = d.WORKSPACE?.LOGICAL ?? {};
    const rawConfig = arr<unknown>(engine.RUNNINGCONFIG?.LINE).map((l) => rawText(l));
    const hasConfig = rawConfig.some((l) => l.trim() && l.trim() !== '!');

    const dev: TopoDevice = {
      id: name,
      name,
      kind,
      model: engine.TYPE?.['@_model'] || typeName,
      x: num(logical.X),
      y: num(logical.Y),
      ports: hasConfig ? parseConfigInterfaces(rawConfig) : parseEndpointPorts(engine),
    };

    if (kind === 'pc' || kind === 'server' || kind === 'accesspoint') {
      if (!dev.ports.length) dev.ports = parseEndpointPorts(engine);
    }

    const vlans = arr<Node>(engine.VLANS?.VLAN)
      .map((v) => ({ id: num(v['@_number']), name: String(v['@_name'] ?? '') }))
      .filter((v) => v.id > 1 && v.id < 1002);
    if ((kind === 'switch' || kind === 'l3switch') && vlans.length) dev.vlans = vlans;

    if (kind === 'server') {
      const services = parseServices(engine);
      if (services) dev.services = services;
    }
    if (hasConfig) {
      dev.config = sanitizeConfig(rawConfig);
      const routes = parseStaticRoutes(rawConfig);
      if (routes.length) dev.staticRoutes = routes;
    }

    devices.push(dev);
    const ref = text(engine.SAVE_REF_ID);
    if (ref) idBySaveRef.set(ref, dev.id);
  }

  const links: TopoLink[] = [];
  for (const l of arr<Node>(network.LINKS?.LINK)) {
    const cable = l.CABLE as Node | undefined;
    if (!cable) continue;
    const ports = arr<unknown>(cable.PORT).map(text);
    const from = idBySaveRef.get(text(cable.FROM));
    const to = idBySaveRef.get(text(cable.TO));
    if (!from || !to || ports.length < 2) continue;
    links.push({ from: { device: from, port: ports[0] }, to: { device: to, port: ports[1] }, ...parseCable(l) });
  }

  const xs = devices.map((d) => d.x), ys = devices.map((d) => d.y);
  return {
    schema: 2,
    source: 'packet-tracer',
    ptVersion: text(root?.VERSION),
    devices,
    links,
    bounds: { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) },
  };
}
