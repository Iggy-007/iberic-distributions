interface SendTrackingEmailParams {
  to: string;
  orderNumber: string;
  trackingUrl: string;
  destinationCity: string;
  carrierCompany?: string;
  carrierTrackingNumber?: string;
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
