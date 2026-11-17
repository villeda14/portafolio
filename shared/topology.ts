/**
 * Modelo de topología compartido entre el servidor (que lo extrae de un
 * archivo de Packet Tracer) y el sitio web (que lo dibuja y simula).
 */

export type DeviceKind =
  | 'router' | 'switch' | 'l3switch' | 'pc' | 'server' | 'accesspoint' | 'cloud' | 'other';

export interface PortInfo {
  name: string;
  description?: string;
  ip?: string;
  mask?: string;
  ipv6?: string[];
  mac?: string;
  /** El puerto obtiene su IP por DHCP (equipos finales). */
  dhcp?: boolean;
  gateway?: string;
  dns?: string;
  shutdown?: boolean;
  /** Resumen de modo de capa 2, p. ej. "access VLAN 20" o "trunk". */
  switchport?: string;
}

export interface DhcpPool {
  name: string;
  network: string;
  mask: string;
  gateway?: string;
  dns?: string;
  start?: string;
  end?: string;
}

export interface DnsRecord { name: string; type: string; address: string }

export interface DeviceServices {
  dhcpPools?: DhcpPool[];
  dnsRecords?: DnsRecord[];
  http?: boolean;
}

export interface TopoDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  model: string;
  x: number;
  y: number;
  ports: PortInfo[];
  vlans?: { id: number; name: string }[];
  services?: DeviceServices;
  /** Rutas estáticas / por defecto declaradas en la configuración. */
  staticRoutes?: string[];
  /** Running-config sin secretos (contraseñas, claves y comunidades ocultas). */
  config?: string[];
}

export type LinkMedium = 'copper' | 'serial' | 'fiber' | 'wireless' | 'other';
export type CableKind = 'straight' | 'crossover' | 'serial' | 'fiber' | 'other';

export interface LinkEnd { device: string; port: string }

export interface TopoLink {
  from: LinkEnd;
  to: LinkEnd;
  medium: LinkMedium;
  cable: CableKind;
}

export interface Topology {
  schema: 2;
  source: 'packet-tracer';
  /** Versión de Packet Tracer con la que se guardó el archivo. */
  ptVersion: string;
  devices: TopoDevice[];
  links: TopoLink[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}
