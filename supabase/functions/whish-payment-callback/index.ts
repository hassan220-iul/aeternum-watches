// Supabase Edge Function: whish-payment-callback
//
// STATUS: best-effort stub, not fully verified.
//
// pay.codnloc.com's public docs (https://pay.codnloc.com/api_documentation.html)
// mention callback URLs exist but don't publish the exact payload/field
// names in the page available at the time this was written. This function
// is wired up and deployable so it's ready the moment you confirm the
// real format, but until then, DO NOT rely on it alone — use the manual
// "Confirm Payment" button in Admin → Orders for whish_card orders (it's
// already there, no setup needed) as your source of truth.
//
// To finish this properly:
//   1. Message codnloc support (WhatsApp +961 3 687 150, see their docs
//      page) and ask for the exact callback/webhook payload they send
//      when a payment succeeds or fails.
//   2. Update the field names below (order_id, status, etc. are guesses
//      based on the naming used elsewhere in their API) to match.
//   3. In your pay.codnloc.com account settings, point their callback URL
//      at: https://<your-project-ref>.functions.supabase.co/whish-payment-callback
//   4. supabase functions deploy whish-payment-callback --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
  try {
    const body = req.headers.get('content-type')?.includes('application/json')
      ? await req.json()
      : Object.fromEntries(new URLSearchParams(await req.text()));

    // Best-guess field names — confirm with codnloc support and adjust.
    const orderNumber = body.order_id;
    const status = (body.status || '').toLowerCase();

    if (!orderNumber) return json({ error: 'Missing order_id in callback payload.' }, 400);

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .maybeSingle();
    if (!order) return json({ error: 'No matching order.' }, 404);

    if (status === 'success' || status === 'paid' || status === 'completed') {
      await supabaseAdmin.from('orders').update({ payment_status: 'paid' }).eq('id', order.id);
      const { data: existingInvoice } = await supabaseAdmin
        .from('invoices').select('id').eq('order_id', order.id).maybeSingle();
      if (!existingInvoice) await supabaseAdmin.from('invoices').insert({ order_id: order.id });
    } else if (status === 'failed' || status === 'cancelled') {
      await supabaseAdmin.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
    }

    return json({ received: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
