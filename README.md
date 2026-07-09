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
| `npm run dev` | Servidor de desarrollo |
| `npm run dev:clean` | Borra caché `.next` y arranca dev (si falla CSS o rutas) |
| `npm run db:seed` | Restaura usuarios y productos (borra pedidos existentes) |
| `npm run db:ensure` | Seed solo si la BD está vacía (no destructivo) |
| `npm run sanity` | Comprueba BD, APIs y rutas (servidor debe estar en marcha) |
| `npm run db:update-vat` | Recalcula IVA 10%/21% en variantes y pedidos |

## Si algo deja de funcionar

1. **Página sin estilos o errores `Cannot find module`**: `npm run dev:clean`
2. **Productos/usuarios desaparecen**: `npm run db:seed`
3. **Comprobar estado**: `npm run sanity` o visitar `/api/health`

## Variables de entorno

Copiar `.env.example` a `.env`:

- `DATABASE_URL` — SQLite en desarrollo (`file:./dev.db`)
- `NEXTAUTH_SECRET` — secreto para sesiones
- `NEXTAUTH_URL` — URL de la app
- `RESEND_API_KEY` — (opcional) para emails de seguimiento al cliente final

## Seguimiento público (Opción A)

Cuando un pedido se marca como *Enviado a cliente final*, si hay email de destino se envía un enlace:

`/tracking/{token}`

## Estructura

- `/admin` — panel administrador (usuarios, productos, pedidos)
- `/client` — Sake Team Food (nuevo pedido, mis pedidos, catálogo)
- `/provider` — Galvan (bandeja, actualizar estados)
- `/tracking/[token]` — seguimiento público sin login

## Producción

Para PostgreSQL, cambiar en `prisma/schema.prisma`:

```prisma
provider = "postgresql"
```

Y actualizar `DATABASE_URL` con la cadena de conexión.
