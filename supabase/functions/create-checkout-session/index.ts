

import Stripe from 'npm:stripe@14.21.0';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-06-20' });
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
  try {
    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      return json({ error: 'STRIPE_SECRET_KEY is not configured on the server. Run: supabase secrets set STRIPE_SECRET_KEY=sk_...' }, 500);
    }

    const { orderId, successUrl, cancelUrl, customerEmail } = await req.json();

    if (!orderId || !successUrl || !cancelUrl) {
      return json({ error: 'orderId, successUrl, and cancelUrl are required.' }, 400);
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, total')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) return json({ error: 'Order not found.' }, 404);
    if (!(order.total > 0)) return json({ error: 'Order total must be greater than zero.' }, 400);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Aeternum Watches — Order #${order.order_number}` },

            unit_amount: Math.round(Number(order.total) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { order_id: orderId },
    });

    await supabaseAdmin.from('orders').update({ stripe_session_id: session.id }).eq('id', orderId);

    return json({ url: session.url });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
