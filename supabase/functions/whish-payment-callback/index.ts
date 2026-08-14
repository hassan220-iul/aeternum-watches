

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
