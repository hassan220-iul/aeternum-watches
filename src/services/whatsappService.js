import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * WhatsApp delivery architecture
 * ------------------------------
 * The WhatsApp Business Cloud API requires a permanent access token tied to
 * a Meta App. That token must never be shipped to the browser (any VITE_
 * env var is publicly readable in the compiled bundle), so this function
 * does NOT call Meta directly. Instead it invokes a Supabase Edge Function
 * (see supabase/functions/send-whatsapp-notification/index.js) which holds
 * the token as a server-side secret and performs the actual HTTP call.
 *
 * Until that Edge Function is deployed with real credentials (see
 * DEPLOYMENT_GUIDE.md → "WhatsApp notifications"), this resolves locally
 * and logs to the console instead of sending anything — the UI and admin
 * dashboard will keep working, they just won't produce real messages.
 */

const RECIPIENT = import.meta.env.VITE_WHATSAPP_RECIPIENT || '96170674606';

export async function sendWhatsAppNotification(event, payload) {
  const message = buildMessage(event, payload);

  if (!isSupabaseConfigured) {
    console.info('[WhatsApp:dev-mode] Would send to', RECIPIENT, '\n', message);
    return { delivered: false, mode: 'dev', message };
  }

  const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
    body: { to: RECIPIENT, message, event },
  });

  if (error) {
    console.error('WhatsApp notification failed:', error.message);
    return { delivered: false, mode: 'error', message, error: error.message };
  }
  return { delivered: true, mode: 'live', ...data };
}

function buildMessage(event, payload = {}) {
  switch (event) {
    case 'new_order':
      return (
        `New Order Received\n\n` +
        `Order ID: #${payload.orderNumber}\n` +
        `Customer: ${payload.customerName}\n` +
        `Total: ${payload.total}\n` +
        `Status: Pending\n\n` +
        `Aeternum Watches Admin Notification`
      );
    case 'payment_success':
      return `Payment Confirmed\n\nOrder #${payload.orderNumber} — ${payload.total}\n\nAeternum Watches Admin Notification`;
    case 'order_cancelled':
      return `Order Cancelled\n\nOrder #${payload.orderNumber}\nReason: ${payload.reason || 'Not specified'}\n\nAeternum Watches Admin Notification`;
    case 'refund_request':
      return `Refund Requested\n\nOrder #${payload.orderNumber}\nCustomer: ${payload.customerName}\n\nAeternum Watches Admin Notification`;
    case 'low_stock':
      return `Low Stock Alert\n\nProduct: ${payload.productName}\nRemaining units: ${payload.stock}\n\nAeternum Watches Admin Notification`;
    case 'vip_purchase':
      return `VIP Customer Purchase\n\nCustomer: ${payload.customerName}\nOrder #${payload.orderNumber} — ${payload.total}\n\nAeternum Watches Admin Notification`;
    case 'whish_money_pending':
      return (
        `Whish Money Transfer to Verify\n\n` +
        `Order #${payload.orderNumber}\n` +
        `Customer: ${payload.customerName}\n` +
        `Amount: ${payload.total}\n` +
        `Reference given: ${payload.reference}\n\n` +
        `Check your Whish Money account for a matching transfer, then confirm ` +
        `it in Admin → Orders.\n\nAeternum Watches Admin Notification`
      );
    case 'contact_form':
      return `New Contact Form Submission\n\nFrom: ${payload.customerName}\nEmail: ${payload.email}\nMessage: ${payload.messagePreview}\n\nAeternum Watches Admin Notification`;
    case 'new_registration':
      return `New User Registration\n\nName: ${payload.customerName}\nEmail: ${payload.email}\n\nAeternum Watches Admin Notification`;
    default:
      return `Aeternum Watches Notification\n\n${JSON.stringify(payload)}`;
  }
}
