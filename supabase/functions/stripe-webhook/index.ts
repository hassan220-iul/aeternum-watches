

import Stripe from 'npm:stripe@14.21.0';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-06-20' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabaseAdmin.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);

        const { data: existingInvoice } = await supabaseAdmin
          .from('invoices')
          .select('id')
          .eq('order_id', orderId)
          .maybeSingle();
        if (!existingInvoice) {
          await supabaseAdmin.from('invoices').insert({ order_id: orderId });
        }

        await supabaseAdmin.rpc('log_admin_action', {
          p_action: 'payment received via Stripe',
          p_table: 'orders',
          p_record: orderId,
        }).catch(() => {});
      }
    }

    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        await supabaseAdmin.from('orders').update({ payment_status: 'failed' }).eq('id', orderId);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
