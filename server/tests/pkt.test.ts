import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePkt, extractTopology, PktFormatError } from '../src/pkt';

const sample = readFileSync(new URL('./fixtures/cafe-altiplano.pkt', import.meta.url));
const topo = extractTopology(decodePkt(sample));
const dev = (name: string) => topo.devices.find((d) => d.name === name)!;

test('descifra el contenedor y obtiene la versión de Packet Tracer', () => {
  assert.match(topo.ptVersion, /^\d+\.\d+/);
});

test('extrae dispositivos y enlaces', () => {
  assert.equal(topo.devices.length, 32);
  assert.equal(topo.links.length, 36);
  assert.equal(topo.links.filter((l) => l.medium === 'serial').length, 4);
});

test('clasifica los tipos de dispositivo', () => {
  assert.equal(dev('R-HQ').kind, 'router');
  assert.equal(dev('SW-CORE').kind, 'l3switch');
  assert.equal(dev('SW-ACC-VTA').kind, 'switch');
  assert.equal(dev('PC-VTA1').kind, 'pc');
  assert.equal(dev('SRV-DNS').kind, 'server');
});

test('lee interfaces e IPs desde la configuración', () => {
  const se = dev('R-HQ').ports.find((p) => p.name === 'Serial0/0/0')!;
  assert.equal(se.ip, '10.20.255.1');
  assert.equal(se.mask, '255.255.255.252');
});

test('lee servicios del servidor', () => {
  assert.ok(dev('SRV-DHCP').services?.dhcpPools?.length);
  assert.ok(dev('SRV-DNS').services?.dnsRecords?.some((r) => r.name === 'intranet.altiplano.gt'));
});

test('oculta secretos de la configuración', () => {
  const cfg = dev('R-HQ').config!.join('\n');
  assert.doesNotMatch(cfg, /\$1\$/);
  assert.match(cfg, /enable secret <oculto>/);
});

test('rechaza archivos que no son de Packet Tracer', () => {
  assert.throws(() => decodePkt(Buffer.alloc(200, 7)), PktFormatError);
});
