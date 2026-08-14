

import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const CODNLOC_URL = 'https://pay.codnloc.com/api.php';
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get('CODNLOC_WHISH_SECRET');
    const website = Deno.env.get('CODNLOC_WHISH_WEBSITE');
    if (!secret || !website) {
      return json({ error: 'Whish card payments are not configured yet. Set CODNLOC_WHISH_SECRET and CODNLOC_WHISH_WEBSITE (see comments in this function for setup steps).' }, 500);
    }

    const { orderId } = await req.json();
    if (!orderId) return json({ error: 'orderId is required.' }, 400);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total, shipping_address')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) return json({ error: 'Order not found.' }, 404);
    if (!(order.total > 0)) return json({ error: 'Order total must be greater than zero.' }, 400);

    const shipping = order.shipping_address || {};
    const [firstName, ...rest] = (shipping.fullName || 'Customer').split(' ');

    const payload = new URLSearchParams({
      website,
      secret,
      order_id: String(order.order_number ?? order.id),
      invoice: `Aeternum Watches — Order #${order.order_number}`,
      amount: Number(order.total).toFixed(2),
      currency: 'USD',
      order_user_email: shipping.email || '',
      order_billing_phone: shipping.phone || '',
      order_first_name: firstName || '',
      order_last_name: rest.join(' ') || '',
    });

    const response = await fetch(CODNLOC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });
    const result = await response.json();

    if (!result.success) {
      return json({ error: result.message || 'Whish payment gateway declined the request.' }, 400);
    }

    await supabaseAdmin.from('orders').update({ payment_reference: `codnloc:${order.order_number}` }).eq('id', orderId);

    return json({ url: result.message });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
