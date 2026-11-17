# Portafolio · Josué Daniel Villeda

Sitio web + API + lector de archivos de **Packet Tracer**, todo en **TypeScript**.

```
shared/            Tipos compartidos por la API y el sitio
  domain.ts          Modulo, Proyecto
  topology.ts        Modelo de topología (dispositivos, enlaces, servicios)
server/
  src/
    index.ts           Arranque de Express (API + sitio estático)
    config.ts · db.ts  Configuración y MySQL
    routes/            modulos.ts · proyectos.ts   (una responsabilidad por archivo)
    middleware/        auth.ts (clave de admin) · upload.ts (multer)
    services/          topologia.ts (genera la topología al subir un .pkt)
    pkt/               ← lector de Packet Tracer
      twofish-eax.ts     Twofish-EAX sobre el bloque Twofish
      decoder.ts         .pkt → XML (descifra y descomprime)
      extract.ts         XML → Topology (dispositivos, enlaces, IPs, VLANs, DHCP, DNS…)
      sanitize.ts        Oculta contraseñas/claves de las configuraciones
  db/schema.sql        Esquema de MySQL
  tests/               Pruebas con un .pkt real
web/
  index.html           Estructura de la página
  styles/              CSS por responsabilidad (tokens, layout, módulos, topología…)
  src/
    main.ts            Arranque
    api.ts · state.ts  Datos (API o JSON estático) y estado
    ui/                Una pieza de interfaz por archivo
      modules/           cards · notes · timeline · render
      admin/             item-form · modules-manager
      topology/          render · details · pathfinding · simulation · pan-zoom · viewer
scripts/               build-web.mjs · export-data.ts · reprocess-topologies.ts · pkt-inspect.ts · publish.sh
docs/                  Sitio compilado + uploads (esto es lo que publica GitHub Pages)
```

## Uso diario

```bash
npm run dev            # API + sitio en http://localhost:3000 (modo administrador)
npm run watch:web      # recompila el sitio al guardar (en otra terminal)
npm run build          # comprueba tipos y compila web/ → docs/
npm test               # pruebas del lector de Packet Tracer
npm run pkt -- archivo.pkt          # inspecciona un .pkt desde la terminal
npm run topologias     # regenera la topología de todos los .pkt ya subidos
npm run publish:site   # build + exporta datos + commit + push (GitHub Pages)
```

Primera vez: `brew install mysql && brew services start mysql`, `npm install`, `npm run db:setup`
y un `.env` con `ADMIN_KEY=...`.

## Cómo funciona la topología automática

Al subir un `.pkt`/`.pka` desde un módulo de tipo *tarjetas*, el servidor
(`services/topologia.ts`) lo descifra (`pkt/decoder.ts`), extrae la topología
(`pkt/extract.ts`) y guarda un JSON junto al archivo. La tarjeta muestra
**Explorar topología** y el visor (`web/src/ui/topology/`) dibuja los dispositivos
en sus posiciones originales, muestra IPs/VLANs/DHCP/DNS/rutas reales y simula
paquetes sobre los enlaces. Las configuraciones se publican **sin secretos**.

## Dónde añadir cosas

- **Nuevo tipo de módulo**: `shared/domain.ts` (TipoModulo) → `server/db/schema.sql` →
  `web/src/ui/modules/` (un archivo de render) → `render.ts`.
- **Leer más datos del .pkt** (ACLs, DHCP de routers…): `server/src/pkt/extract.ts` y
  `shared/topology.ts`; luego mostrarlo en `web/src/ui/topology/details.ts`.
- **Nuevo tipo de archivo subible**: `server/src/middleware/upload.ts`.
