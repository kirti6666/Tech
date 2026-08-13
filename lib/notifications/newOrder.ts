import { sendEmail } from "@/lib/email";

/**
 * Tells you a sale happened, immediately.
 *
 * Sounds like a vanity feature; it isn't. Orders create obligations — a
 * rebranding request needs chasing, a failed delivery needs catching — and
 * the gap between "money arrived" and "somebody noticed" is where customer
 * trust is lost. Especially in the first months, when nobody is watching
 * the admin panel at 11pm.
 *
 * WhatsApp via the Meta Cloud API, with email as the fallback. Both are
 * best-effort and wrapped so a failure can never affect the payment path:
 * an unsent notification is an inconvenience, an exception thrown inside
 * confirmPayment after money has changed hands is not.
 *
 * WhatsApp business messaging requires a pre-approved template for messages
 * outside a 24-hour customer-initiated window. Since these go to your own
 * number and you'll rarely reply, treat the template path as the normal
 * one: create a template with three variables in Meta Business Manager and
 * put its name in WHATSAPP_TEMPLATE_NAME.
 */

interface OrderSummary {
  orderNumber: string;
  customerName: string;
  total: number;
  currency: string;
  itemTitles: string[];
  addonLabels: string[];
  country: string;
}

export async function notifyNewOrder(order: OrderSummary): Promise<void> {
  await Promise.allSettled([sendWhatsApp(order), sendOwnerEmail(order)]);
}

async function sendWhatsApp(order: OrderSummary): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_NOTIFY_NUMBER;
  const template = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!token || !phoneNumberId || !recipient || !template) return;

  const amount = `${order.currency === "USD" ? "$" : "₹"}${order.total.toLocaleString(
    order.currency === "USD" ? "en-US" : "en-IN"
  )}`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "template",
          template: {
            name: template,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: order.orderNumber },
                  { type: "text", text: amount },
                  {
                    type: "text",
                    text: order.itemTitles.join(", ").slice(0, 60) || "Order",
                  },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `[notify] WhatsApp rejected the message (${response.status}): ${body.slice(0, 300)}`
      );
    }
  } catch (error) {
    console.error("[notify] WhatsApp send failed:", error);
  }
}

async function sendOwnerEmail(order: OrderSummary): Promise<void> {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!to) return;

  const symbol = order.currency === "USD" ? "$" : "₹";
  const services = order.addonLabels.length
    ? `<p style="margin:0 0 12px;padding:10px 12px;background:#f5f3ff;font-size:14px;color:#18181b;">
         <strong>Needs action:</strong> ${order.addonLabels.join(", ")} —
         the customer has to submit intake details before work can start.
       </p>`
    : "";

  try {
    await sendEmail({
      to,
      subject: `New order ${order.orderNumber} — ${symbol}${order.total.toLocaleString("en-IN")}`,
      html: `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;padding:20px;color:#18181b;">
  <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;">New order</h1>
  <p style="margin:0 0 6px;font-size:15px;">
    <strong>${symbol}${order.total.toLocaleString("en-IN")}</strong> · ${escapeHtml(order.customerName)} · ${escapeHtml(order.country)}
  </p>
  <p style="margin:0 0 16px;font-size:14px;color:#52525b;">
    ${escapeHtml(order.itemTitles.join(", "))}
  </p>
  ${services}
  <p style="margin:0;">
    <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/orders"
       style="color:#6d28d9;font-size:14px;">Open in the admin panel</a>
  </p>
</div>`.trim(),
    });
  } catch (error) {
    console.error("[notify] owner email failed:", error);
  }
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
