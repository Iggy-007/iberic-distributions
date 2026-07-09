# Iberic Distributions

Aplicación B2B para la venta y seguimiento de productos ibéricos de **Galvan**.

## Roles

| Rol | Usuario | Email | Contraseña |
|-----|---------|-------|------------|
| Administrador | Administrator | admin@ibericdistributions.com | Admin123! |
| Cliente (Sake Team Food) | Manolo | manolo@saketeamfood.com | Manolo123! |
| Proveedor (Galvan) | Jose Juan | josejuan@galvan.es | Galvan123! |

## Productos

- **Jamón Ibérico 75%**: entero (23,00 €/kg + IVA 10%), loncheado (1,25 €/paquete + IVA 10%), plateado (2,50 €/plato + IVA 10%)
- **Lomito ibérico**: 49,00 €/kg + IVA 10%; loncheado 3,50 €/paquete + IVA 21%

Los precios en catálogo y pedidos muestran el importe con IVA incluido.

## Envío

- Nacional (España): 6,00 €
- Internacional: 15,00 €

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
npm run db:setup
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run dev:clean` | Mata procesos en puertos 3000–3002, borra caché `.next` y arranca dev |
| `npm run db:seed` | Restaura usuarios y productos (borra pedidos existentes) |
| `npm run db:ensure` | Seed solo si la BD está vacía (no destructivo) |
| `npm run sanity` | Comprueba BD, APIs y rutas (servidor debe estar en marcha) |
| `npm run db:update-vat` | Recalcula IVA 10%/21% en variantes y pedidos |
| `npm run db:push` | Aplica cambios del esquema Prisma a la base de datos |

## Si algo deja de funcionar

1. **Página sin estilos, errores `Cannot find module` o `routes-manifest.json`**: cerrar todos los terminales con `npm run dev` y ejecutar `npm run dev:clean`. Usar solo un servidor en el puerto **3000**.
2. **Productos/usuarios desaparecen**: `npm run db:seed`
3. **Comprobar estado**: `npm run sanity` o visitar `/api/health`
4. **Error `prisma generate` EPERM en Windows**: detener el servidor de desarrollo antes de regenerar el cliente Prisma.

## Variables de entorno

Copiar `.env.example` a `.env`:

- `DATABASE_URL` — SQLite en desarrollo (`file:./dev.db`)
- `NEXTAUTH_SECRET` — secreto para sesiones
- `NEXTAUTH_URL` — URL de la app
- `RESEND_API_KEY` — (opcional) para emails de seguimiento al cliente final

## Pedidos y totales estimados

Al crear un pedido (paso 4 del formulario) y en el detalle de pedidos existentes se muestran totales estimados:

- Subtotal sin IVA
- Desglose de IVA por tipo (10% / 21%)
- Subtotal con IVA
- Gastos de envío

Cada línea indica importe sin IVA, IVA y total con IVA. Los totales se agrupan por tipo impositivo.

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

La página pública muestra el estado del pedido, la línea de tiempo y los datos del transportista (empresa, tracking, teléfono).

## Estructura

- `/admin` — panel administrador (usuarios, productos, pedidos)
- `/client` — Sake Team Food (nuevo pedido, mis pedidos, catálogo)
- `/provider/orders` — Galvan (tablero Kanban, catálogo)
- `/tracking/[token]` — seguimiento público sin login
- `/login` — inicio de sesión (logo de marca a tamaño destacado)

## Modelo de datos (resumen)

Campos relevantes añadidos al flujo de proveedor:

- **OrderLine**: `actualWeightKg`, `actualPieceCount`, `galvanInternalId`
- **Order**: `cancellationNumber`, `carrierCompany`, `carrierTrackingNumber`, `carrierPhone`

## Producción

Para PostgreSQL, cambiar en `prisma/schema.prisma`:

```prisma
provider = "postgresql"
```

Y actualizar `DATABASE_URL` con la cadena de conexión.
