# Iberic Distributions

Aplicación B2B para la venta y seguimiento de productos ibéricos de **Galvan**.

## Roles

| Rol | Usuario | Email | Contraseña |
|-----|---------|-------|------------|
| Administrador | Administrator | admin@ibericdistributions.com | Admin123! |
| Cliente (Sake Team Food) | Manolo | manolo@saketeamfood.com | Manolo123! |
| Proveedor (Galvan) | Jose Juan | josejuan@galvan.es | Galvan123! |

## Productos

Cada producto del catálogo tiene una **presentación base** (entero) y **servicios combinables** opcionales:

| Producto | Base (entero) | Servicios combinables |
|----------|---------------|------------------------|
| **Jamón Ibérico 75%** | 23,00 €/kg + IVA 10% | Loncheado (sobres) 1,25 €/paquete + IVA 10%; Plateado 2,50 €/plato + IVA 10% |
| **Lomito ibérico** | 49,00 €/kg + IVA 10% | Loncheado (sobres) 3,50 €/paquete + IVA 21% |

Las variantes se muestran como **Entero**, **Loncheado (sobres)** y **Plateado** (no se repite el nombre del producto en el servicio). Cada servicio puede tener su propia **referencia Galvan** (p. ej. `GAL-JAM-75-LON`).

Los precios en catálogo y pedidos muestran el importe **con IVA incluido**.

### Pesos y unidades estimados (orientativos)

| Tipo | Estimación usada para el precio |
|------|----------------------------------|
| Jamón entero | 7–7,5 kg por unidad (se usa 7,5 kg) |
| Lomito entero | **400 g** por unidad |
| Loncheado (jamón) | ~**36 sobres de 100 g** por unidad pedida (referencia: jamón ~8 kg) |
| Plateado (jamón) | ~**40 platos de 90 g** en atmósfera por unidad pedida (referencia: jamón ~8 kg) |
| Loncheado (lomito) | precio por paquete (sin estimación por peso de pieza) |

El cobro final de jamón y lomito enteros se ajusta al **peso real** registrado por el proveedor.

## Envío

El envío es un **servicio a nivel de pedido** (no un producto del catálogo). Puede haber **varios servicios** por ámbito:

- **Nacional (España)** — p. ej. estándar, urgente
- **Internacional** — p. ej. estándar, express

Por defecto se crean nacional (6,00 €) e internacional (15,00 €). Admin y proveedor pueden **añadir, editar y eliminar** servicios desde **Catálogo → Gestionar productos y servicios → Servicios de envío**. El cliente elige el servicio activo al crear el pedido (se preselecciona el marcado como predeterminado).

## Requisitos

- Node.js 18+
- npm
- Docker (opcional; en Windows puedes usar SQLite local sin Docker)

## Flujo de trabajo (local → producción)

Usamos **dos entornos separados**:

| Entorno | URL | Para qué |
|---------|-----|----------|
| **Local** | [http://localhost:3000](http://localhost:3000) (o `3001` si el 3000 está ocupado) | Probar cambios de código antes de publicarlos |
| **Producción** | [https://ibericos.enviaclientes.com](https://ibericos.enviaclientes.com) | Uso real (pedidos, catálogo, Kanban) |

### Datos vs código

| Tipo de cambio | Dónde | Cómo se guarda |
|----------------|-------|----------------|
| Pedidos, productos, estados, usuarios… | Producción (web) | **Automático** en la base de datos del servidor |
| Pantallas, lógica, nuevas funciones | Local primero | **Commit → GitHub → Coolify** despliega en producción |

### Ciclo habitual de desarrollo

```text
1. Arrancar en local     →  npm run start:local   (o pedir al asistente: "arranca en local")
2. Probar cambios        →  http://localhost:3000 (o el puerto que indique la terminal)
3. Cuando esté bien      →  commit + push a GitHub (el asistente lo hace cuando lo pidas)
4. Coolify despliega     →  automático al hacer push a main (o Redeploy manual en Coolify)
5. Comprobar en prod     →  https://ibericos.enviaclientes.com
6. Seguir en local       →  vuelta al paso 1 para el siguiente cambio
```

**Frases útiles para el asistente:**

- *"Arranca en local"* — levanta la app en tu PC
- *"Guarda y súbelo a prod"* — commit, push y despliegue
- *"Esto ya funciona en local, despliégalo"* — mismo flujo de publicación

### Reglas importantes

1. **No ejecutar `db:seed` en producción** — borra pedidos y datos reales.
2. Lo probado en **local no afecta a producción** hasta hacer push.
3. La base de datos de producción tiene **backup diario** (3:00, Coolify).
4. Cambiar contraseñas de demo antes de clientes reales.

---

## Instalación (desarrollo local)

### Opción A — Windows sin Docker (recomendada)

```powershell
cd c:\src\Iberic_distribution
npm install
npm run start:local
```

`start:local` configura SQLite (`prisma/dev.db`), aplica el esquema, carga datos de demo si hace falta y arranca el servidor.

### Opción B — PostgreSQL con Docker

```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

> En staging/producción la base de datos es **PostgreSQL** (Coolify). Ver [DEPLOY.md](./DEPLOY.md).

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run start:local` | Arranque completo en Windows (SQLite + `npm run dev`) |
| `npm run setup:local` | Solo prepara BD local con Docker + PostgreSQL |
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run dev:clean` | Mata procesos en puertos 3000–3002, borra caché `.next` y arranca dev |
| `npm run db:seed` | Restaura usuarios y productos (borra pedidos existentes) |
| `npm run db:ensure` | Seed solo si la BD está vacía (no destructivo) |
| `npm run sanity` | Comprueba BD, APIs y rutas (servidor debe estar en marcha) |
| `npm run db:update-vat` | Recalcula IVA 10%/21% en variantes y pedidos |
| `npm run db:push` | Aplica cambios del esquema Prisma a la base de datos |
| `npm run db:migrate-shipping` | Migra tabla `ShippingRate` y aplica esquema (BD existentes) |
| `npm run db:migrate-documents` | Migra tipos de documento (`ETIQUETA` → ficha unificada) y aplica esquema |

## Catálogo — documentación de productos

En **Catálogo → Gestionar productos y servicios**, cada producto puede tener:

| Tipo | Formatos de subida | Uso |
|------|-------------------|-----|
| **Ficha Técnica/Etiqueta** | PDF, JPG, PNG | Ficha técnica o etiqueta del producto (un solo tipo unificado) |
| **Folleto informativo** | PDF | Folleto o documento informativo |

También se puede **añadir un enlace** (URL externa o ruta `/uploads/docs/...`) en lugar de subir archivo.

Los archivos se guardan en `public/uploads/docs/` y se sirven en producción vía `/uploads/docs/{archivo}`.

**Producción (Coolify):** montar un volumen persistente en **Persistent Storage → Volume Mount** con **Destination path** `/app/public/uploads`. Sin volumen, los archivos subidos se pierden al redeployar. Ver [DEPLOY.md](./DEPLOY.md).

La página de gestión usa **paneles colapsables** (servicios de envío, jamón, lomito, etc.) para reducir el scroll.


1. **Página sin estilos, errores `Cannot find module` o `routes-manifest.json`**: cerrar todos los terminales con `npm run dev` y ejecutar `npm run dev:clean`. Usar solo un servidor en el puerto **3000**.
2. **Productos/usuarios desaparecen**: `npm run db:seed`
3. **Comprobar estado**: `npm run sanity` o visitar `/api/health`
4. **Error `prisma generate` EPERM en Windows**: detener el servidor de desarrollo antes de regenerar el cliente Prisma.

## Variables de entorno

Copiar `.env.example` a `.env`:

- `DATABASE_URL` — local: SQLite (`file:./dev.db`) o PostgreSQL con Docker (ver `.env.example`)
- `NEXTAUTH_SECRET` — secreto para sesiones
- `NEXTAUTH_URL` — URL de la app
- `RESEND_API_KEY` — (opcional) para emails de seguimiento al cliente final

## Pedidos y desglose fiscal

En el **resumen estimado** (nuevo pedido), el **detalle de pedido** (cliente, admin, proveedor) y el **seguimiento público** se usa un desglose fiscal unificado, alineado con la práctica habitual en España:

1. **Líneas del pedido** — concepto + importe total (IVA incl.) a la derecha
2. **Desglose fiscal** — tabla: Tipo IVA | Base imponible | Cuota IVA
3. **Totales** — Base imponible total, IVA total, Importe productos (IVA incl.), Gastos de envío, **Total**

Al crear un pedido, el cliente elige productos agrupados por tarjeta (producto base + servicios combinables en el mismo bloque).

## Panel administrador

Navegación: **Panel · Pedidos · Catálogo** (izquierda) y **Usuarios** (derecha).

- **Catálogo**: pestañas *Ver catálogo* y *Gestionar productos y servicios*
  - *Gestionar*: servicios de envío del pedido + edición de productos (presentaciones, precios, documentación)
  - Secciones colapsables con flecha ▼ en envío y en cada producto
- El proveedor puede editar el catálogo; el admin recibe **notificaciones** (y email) cuando hay cambios

## Panel proveedor (Kanban)

`/provider` redirige a `/provider/orders`. El proveedor gestiona pedidos en un tablero Kanban con arrastrar y soltar (solo un paso hacia adelante por columna):

| Columna | Estado |
|---------|--------|
| Pedidos solicitados | `SENT` |
| Pedidos aceptados | `RECEIVED_BY_PROVIDER` |
| En proceso | `IN_PROCESS` |
| En envío | `SHIPPED_TO_FINAL` |
| Pedidos cancelados | `CANCELLED` |

**Interacción:**

- **Clic** en una tarjeta → panel lateral para introducir datos reales de la línea
- **Doble clic** → detalle completo del pedido
- **Arrastrar** a la columna siguiente → avanza el estado (si se cumplen las validaciones)

El proveedor también accede a **Catálogo** (mismas pestañas que el admin para productos y envío).

### Datos reales obligatorios

Antes de mover un pedido a la siguiente columna, cada línea debe tener los datos reales según el tipo de producto:

| Tipo | Campos requeridos |
|------|-------------------|
| Jamón entero / Lomito | Peso real (kg) |
| Jamón loncheado / Plateado | Peso real del jamón (kg) **y** paquetes/platos reales |

Opcionalmente se puede indicar el **nº de identificación interna Galvan** al registrar datos reales. Si faltan datos, el sistema muestra una alerta y bloquea el avance.

### Envío a cliente final

Al mover de *En proceso* → *En envío* se abre un formulario que exige:

- Empresa de transporte
- Número de seguimiento (tracking)
- Teléfono del transportista

Estos datos se muestran en el detalle del pedido (cliente y admin), en la página pública de seguimiento y en el email al cliente final.

### Pedidos cancelados

Los pedidos cancelados aparecen en la quinta columna (estilo gris). Al cancelar se asigna un número de cancelación con formato `CAN-YYMMDD-####`. Desde el detalle del pedido cancelado el proveedor puede **reactivar** el pedido (vuelve a *Pedidos solicitados* y se limpia el número de cancelación).

## Seguimiento público

Cuando un pedido se marca como *Enviado a cliente final*, si hay email de destino se envía un enlace:

`/tracking/{token}`

La página pública muestra el estado del pedido, el desglose fiscal del pedido, la línea de tiempo y los datos del transportista (empresa, tracking, teléfono).

## Estructura

- `/admin` — panel administrador (usuarios, pedidos, catálogo)
- `/client` — Sake Team Food (nuevo pedido, mis pedidos, catálogo)
- `/provider/orders` — Galvan (tablero Kanban)
- `/provider/catalog` — Galvan (catálogo y envío)
- `/tracking/[token]` — seguimiento público sin login
- `/login` — inicio de sesión

## Modelo de datos (resumen)

Campos relevantes del flujo actual:

- **ProductVariant**: `presentation` (`BASE` | `LONCHEADO` | `PLATEADO`), `galvanReference` (por servicio)
- **ShippingRate**: servicios de envío (`label`, `type`, `priceCents`, `supplier`, `isDefault`, `active`)
- **Order**: `shippingServiceId`, `shippingLabel` (nombre del servicio elegido)
- **ProductDocument**: `docType` (`FICHA_TECNICA` | `FOLLETO_INFORMATIVO`), `fileUrl`, `title`
- **CatalogNotification**: avisos al admin por cambios de catálogo del proveedor
- **OrderLine**: `actualWeightKg`, `actualPieceCount`, `galvanInternalId`
- **Order**: `cancellationNumber`, `carrierCompany`, `carrierTrackingNumber`, `carrierPhone`

## Producción / staging (Coolify)

| Item | Valor |
|------|-------|
| URL pública | [https://ibericos.enviaclientes.com](https://ibericos.enviaclientes.com) |
| Repositorio | [github.com/Iggy-007/iberic-distributions](https://github.com/Iggy-007/iberic-distributions) |
| Rama de despliegue | `main` |

Despliegue en VPS Hostinger con Coolify + PostgreSQL: ver **[DEPLOY.md](./DEPLOY.md)**.

En Coolify, configurar **Persistent Storage → Volume Mount** con destino `/app/public/uploads` para conservar PDFs e imágenes del catálogo entre deploys.

**Actualizar producción tras cambios de código:**

```text
git push origin main  →  Coolify reconstruye y despliega la app
```

## Producción (PostgreSQL manual)

Para PostgreSQL sin Coolify, cambiar en `prisma/schema.prisma` (ya configurado como `postgresql`) y actualizar `DATABASE_URL`.
