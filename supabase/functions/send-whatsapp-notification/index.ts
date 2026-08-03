// Supabase Edge Function: send-whatsapp-notification
//
// Deploy with:
//   supabase functions deploy send-whatsapp-notification
//
// Configure secrets (never commit these):
//   supabase secrets set WHATSAPP_ACCESS_TOKEN=xxxxx
//   supabase secrets set WHATSAPP_PHONE_NUMBER_ID=xxxxx
//
// This function receives { to, message, event } from the frontend
// (src/services/whatsappService.js) and forwards it to the WhatsApp
// Business Cloud API using the Meta Graph API. The access token lives
// only in this server-side environment, never in the browser bundle.

Deno.serve(async (req) => {
  try {
    const { to, message } = await req.json();

    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!token || !phoneNumberId) {
      return new Response(
        JSON.stringify({
          error:
            'WhatsApp credentials are not configured on the server. ' +
            'Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID as Supabase secrets.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const graphUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ delivered: true, whatsappResponse: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
