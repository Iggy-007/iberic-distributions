export interface CarrierInfo {
  carrierCompany: string | null;
  carrierTrackingNumber: string | null;
  carrierTrackingUrl: string | null;
  carrierPhone: string | null;
}

export function orderHasCarrierInfo(order: CarrierInfo): boolean {
  return (
    !!order.carrierCompany?.trim() &&
    !!order.carrierTrackingNumber?.trim() &&
    !!order.carrierPhone?.trim()
  );
}

export function getMissingCarrierMessage(): string {
  return "Indique empresa de transporte, número de seguimiento y teléfono del transportista antes de marcar el envío.";
}

export interface CarrierFormValues {
  carrierCompany: string;
  carrierTrackingNumber: string;
  carrierTrackingUrl: string;
  carrierPhone: string;
}

export function validateCarrierForm(values: CarrierFormValues): string | null {
  if (!values.carrierCompany.trim()) {
    return "La empresa de transporte es obligatoria";
  }
  if (!values.carrierTrackingNumber.trim()) {
    return "El número de seguimiento es obligatorio";
  }
  if (!values.carrierPhone.trim()) {
    return "El teléfono del transportista es obligatorio";
  }
  const url = values.carrierTrackingUrl.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "El enlace de seguimiento debe empezar por http:// o https://";
      }
    } catch {
      return "El enlace de seguimiento online no es válido";
    }
  }
  return null;
}
