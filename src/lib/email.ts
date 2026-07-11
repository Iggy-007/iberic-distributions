interface SendTrackingEmailParams {
  to: string;
  orderNumber: string;
  trackingUrl: string;
  destinationCity: string;
  carrierCompany?: string;
  carrierTrackingNumber?: string;
  carrierTrackingUrl?: string;
  carrierPhone?: string;
}

export async function sendTrackingEmail(
  params: SendTrackingEmailParams
): Promise<{ sent: boolean; reason?: string }> {
  const {
    to,
    orderNumber,
    trackingUrl,
    destinationCity,
    carrierCompany,
    carrierTrackingNumber,
    carrierTrackingUrl,
    carrierPhone,
  } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Iberic Distributions <noreply@ibericdistributions.com>";

  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set. Tracking email would be sent to:", to);
    console.log("[email] Order:", orderNumber, "URL:", trackingUrl);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Seguimiento de pedido ${orderNumber} — Iberic Distributions`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #7B1E2E;">Iberic Distributions</h2>
          <p>Su pedido <strong>${orderNumber}</strong> ha sido enviado.</p>
          <p>Destino: <strong>${destinationCity}</strong></p>
          ${
            carrierCompany
              ? `<p>Transportista: <strong>${carrierCompany}</strong></p>`
              : ""
          }
          ${
            carrierTrackingNumber
              ? `<p>Nº seguimiento: <strong>${carrierTrackingNumber}</strong></p>`
              : ""
          }
          ${
            carrierTrackingUrl
              ? `<p>Seguimiento online: <a href="${carrierTrackingUrl}" style="color: #7B1E2E;">${carrierTrackingUrl}</a></p>`
              : ""
          }
          ${
            carrierPhone
              ? `<p>Tel. transportista: <strong>${carrierPhone}</strong></p>`
              : ""
          }
          <p>Puede seguir el estado de su envío en el siguiente enlace:</p>
          <p><a href="${trackingUrl}" style="color: #7B1E2E;">${trackingUrl}</a></p>
          <p style="color: #666; font-size: 12px;">Distribución B2B de productos ibéricos — Galvan</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] Failed to send:", text);
    return { sent: false, reason: text };
  }

  return { sent: true };
}

interface SendCatalogChangeEmailParams {
  to: string[];
  summary: string;
  detail?: string;
  productsUrl: string;
}

export async function sendCatalogChangeEmail(
  params: SendCatalogChangeEmailParams
): Promise<{ sent: boolean; reason?: string }> {
  const { to, summary, detail, productsUrl } = params;
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ??
    "Iberic Distributions <noreply@ibericdistributions.com>";

  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set. Catalog change email to:", to);
    console.log("[email] Summary:", summary);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Cambio en catálogo — ${summary}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #7B1E2E;">Iberic Distributions</h2>
          <p>Se ha registrado un cambio en el catálogo:</p>
          <p><strong>${summary}</strong></p>
          ${detail ? `<p style="white-space: pre-line; color: #444;">${detail}</p>` : ""}
          <p><a href="${productsUrl}" style="color: #7B1E2E;">Ver productos y catálogo</a></p>
          <p style="color: #666; font-size: 12px;">Notificación automática del sistema B2B</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] Failed to send catalog change:", text);
    return { sent: false, reason: text };
  }

  return { sent: true };
}
