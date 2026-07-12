import bcrypt from "bcryptjs";
import {
  DestinationType,
  OrderStatus,
  OrganizationType,
  Role,
  ShippingType,
  VariantPresentation,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { generateTrackingToken } from "../src/lib/utils";
import { ensureDefaultShippingRates } from "../src/lib/shipping-rates";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderStatusEvent.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.trackingToken.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productDocument.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const adminOrg = await prisma.organization.create({
    data: {
      type: OrganizationType.ADMIN,
      name: "Iberic Distributions",
      city: "Málaga",
      country: "España",
    },
  });

  const sakeTeamFood = await prisma.organization.create({
    data: {
      type: OrganizationType.CLIENT,
      name: "Sake Team Food",
      street: "Calle Larios 45",
      city: "Málaga",
      postalCode: "29005",
      country: "España",
    },
  });

  const galvan = await prisma.organization.create({
    data: {
      type: OrganizationType.PROVIDER,
      name: "Galvan",
      city: "Jabugo",
      country: "España",
    },
  });

  const passwordHash = async (password: string) =>
    bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@ibericdistributions.com",
      passwordHash: await passwordHash("Admin123!"),
      name: "Administrador",
      phone: "+34 600 000 001",
      role: Role.ADMIN,
      organizationId: adminOrg.id,
    },
  });

  const manolo = await prisma.user.create({
    data: {
      email: "manolo@saketeamfood.com",
      passwordHash: await passwordHash("Manolo123!"),
      name: "Manolo",
      phone: "+34 600 000 002",
      role: Role.CLIENT,
      organizationId: sakeTeamFood.id,
    },
  });

  const joseJuan = await prisma.user.create({
    data: {
      email: "josejuan@galvan.es",
      passwordHash: await passwordHash("Galvan123!"),
      name: "Jose Juan",
      phone: "+34 600 000 003",
      role: Role.PROVIDER,
      organizationId: galvan.id,
    },
  });

  const jamon = await prisma.product.create({
    data: {
      name: "Jamón Ibérico 75%",
      galvanReference: "GAL-JAM-75",
      description:
        "Jamón ibérico de bellota 75% raza ibérica. Producto excepcional de Galvan.",
      variants: {
        create: [
          {
            name: "Entero",
            presentation: VariantPresentation.BASE,
            unitLabel: "unidad",
            priceCents: 2300,
            priceType: "PER_KG",
            vatRate: 0.1,
          },
          {
            name: "Loncheado (sobres)",
            presentation: VariantPresentation.LONCHEADO,
            galvanReference: "GAL-JAM-75-LON",
            unitLabel: "paquete",
            priceCents: 125,
            priceType: "FIXED",
            vatRate: 0.21,
          },
          {
            name: "Plateado",
            presentation: VariantPresentation.PLATEADO,
            galvanReference: "GAL-JAM-75-PLA",
            unitLabel: "plato",
            priceCents: 250,
            priceType: "FIXED",
            vatRate: 0.21,
          },
        ],
      },
    },
  });

  const lomito = await prisma.product.create({
    data: {
      name: "Lomito ibérico",
      galvanReference: "GAL-LOM-01",
      description: "Lomito ibérico de máxima calidad, curado por Galvan.",
      variants: {
        create: [
          {
            name: "Entero",
            presentation: VariantPresentation.BASE,
            unitLabel: "unidad",
            priceCents: 4900,
            priceType: "PER_KG",
            vatRate: 0.1,
          },
          {
            name: "Loncheado (sobres)",
            presentation: VariantPresentation.LONCHEADO,
            galvanReference: "GAL-LOM-01-LON",
            unitLabel: "paquete",
            priceCents: 350,
            priceType: "FIXED",
            vatRate: 0.21,
          },
        ],
      },
    },
  });

  await prisma.productDocument.createMany({
    data: [
      {
        productId: jamon.id,
        docType: "FICHA_TECNICA",
        title: "Jamón Ibérico 75%",
        fileUrl: "/uploads/docs/jamon-iberico-75-ficha.pdf",
      },
      {
        productId: jamon.id,
        docType: "ETIQUETA",
        title: "Jamón Ibérico 75%",
        fileUrl: "/uploads/docs/jamon-iberico-75-etiqueta.pdf",
      },
      {
        productId: lomito.id,
        docType: "FICHA_TECNICA",
        title: "Lomito ibérico",
        fileUrl: "/uploads/docs/lomito-iberico-ficha.pdf",
      },
      {
        productId: lomito.id,
        docType: "ETIQUETA",
        title: "Lomito ibérico",
        fileUrl: "/uploads/docs/lomito-iberico-etiqueta.pdf",
      },
    ],
  });

  const jamonLoncheado = await prisma.productVariant.findFirst({
    where: {
      productId: jamon.id,
      presentation: VariantPresentation.LONCHEADO,
    },
  });
  const lomitoVariant = await prisma.productVariant.findFirst({
    where: {
      productId: lomito.id,
      presentation: VariantPresentation.BASE,
    },
  });

  if (jamonLoncheado && lomitoVariant) {
    const orderNumber = "ORD-250709-1001";
    const loncheadoLineTotal = jamonLoncheado.priceCents * 10;
    const lomitoLineTotal = Math.round(lomitoVariant.priceCents * 0.4);
    const subtotal = loncheadoLineTotal + lomitoLineTotal;
    const shipping = 600;
    const vatCents =
      Math.round(loncheadoLineTotal * jamonLoncheado.vatRate) +
      Math.round(lomitoLineTotal * lomitoVariant.vatRate);
    const order = await prisma.order.create({
      data: {
        orderNumber,
        clientOrgId: sakeTeamFood.id,
        createdByUserId: manolo.id,
        status: OrderStatus.IN_PROCESS,
        destinationType: DestinationType.CLIENT_WAREHOUSE,
        destName: "Sake Team Food",
        destStreet: sakeTeamFood.street,
        destCity: sakeTeamFood.city,
        destPostalCode: sakeTeamFood.postalCode,
        destCountry: sakeTeamFood.country,
        finalClientFirstName: "Carlos",
        finalClientLastName: "García López",
        finalClientStreet: "Calle Larios 12",
        finalClientCity: "Málaga",
        finalClientPostalCode: "29005",
        finalClientCountry: "España",
        finalClientPhone: "+34 612 345 678",
        finalClientPhoneSecondary: "+34 951 111 222",
        finalClientEmail: "carlos.garcia@email.com",
        shippingType: ShippingType.NATIONAL,
        shippingCostCents: shipping,
        subtotalCents: subtotal,
        vatCents,
        totalCents: subtotal + vatCents + shipping,
        lines: {
          create: [
            {
              variantId: jamonLoncheado.id,
              quantity: 10,
              unitPriceCents: jamonLoncheado.priceCents,
              lineTotalCents: loncheadoLineTotal,
            },
            {
              variantId: lomitoVariant.id,
              quantity: 1,
              unitPriceCents: lomitoVariant.priceCents,
              lineTotalCents: lomitoLineTotal,
            },
          ],
        },
        statusEvents: {
          create: [
            { status: OrderStatus.SENT, createdByUserId: manolo.id },
            {
              status: OrderStatus.RECEIVED_BY_PROVIDER,
              createdByUserId: joseJuan.id,
            },
            {
              status: OrderStatus.IN_PROCESS,
              createdByUserId: joseJuan.id,
            },
          ],
        },
      },
    });

    await prisma.trackingToken.create({
      data: {
        orderId: order.id,
        token: generateTrackingToken(),
      },
    });
  }

  await ensureDefaultShippingRates();

  console.log("Seed completed.");
  console.log("Users:");
  console.log("  Admin:    admin@ibericdistributions.com / Admin123!");
  console.log("  Manolo:   manolo@saketeamfood.com / Manolo123!");
  console.log("  Jose Juan: josejuan@galvan.es / Galvan123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
