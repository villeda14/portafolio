/** Uso: npm run pkt -- ruta/al/archivo.pkt   → resumen de la topología (o --json para volcarla). */
import { topologyFromFile } from '../server/src/pkt';

const [file, flag] = process.argv.slice(2);
if (!file) { console.error('Uso: npm run pkt -- archivo.pkt [--json]'); process.exit(1); }

const t = await topologyFromFile(file);
if (flag === '--json') { console.log(JSON.stringify(t, null, 2)); process.exit(0); }

console.log(`Packet Tracer ${t.ptVersion} · ${t.devices.length} dispositivos · ${t.links.length} enlaces\n`);
for (const d of t.devices) {
  const ips = d.ports.filter((p) => p.ip).map((p) => `${p.name}=${p.ip}`).join(', ');
  console.log(`${d.kind.padEnd(11)} ${d.name.padEnd(14)} ${d.model.padEnd(16)} ${ips}`);
}
