import { z } from "zod";

export const finalClientFieldsSchema = z.object({
  finalClientFirstName: z.string().min(1, "Nombre requerido"),
  finalClientLastName: z.string().min(1, "Apellidos requeridos"),
  finalClientStreet: z.string().min(1, "Dirección requerida"),
  finalClientCity: z.string().min(1, "Ciudad requerida"),
  finalClientPostalCode: z.string().min(1, "Código postal requerido"),
  finalClientCountry: z.string().min(1).default("España"),
  finalClientPhone: z.string().min(1, "Teléfono requerido"),
  finalClientPhoneSecondary: z.string().optional().or(z.literal("")),
  finalClientEmail: z.string().email().optional().or(z.literal("")),
});

export type FinalClientInput = z.infer<typeof finalClientFieldsSchema>;
