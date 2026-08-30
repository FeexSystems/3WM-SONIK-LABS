/**
 * 3WM SONIK — Stripe Webhook Handler
 * Processes Stripe webhook events for subscription lifecycle management.
 *
 * Security: every request MUST pass Stripe signature verification before its payload is
 * trusted. Without it, anyone who knows this URL can forge a `checkout.session.completed`
 * and provision themselves a paid plan.
 *
 * This is a server-to-server endpoint. Stripe never issues a CORS preflight, so no
 * Access-Control-Allow-Origin header is emitted — a browser must not be able to reach it.
 */

import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
// Service role: webhook writes are system-authoritative and must bypass RLS. The anon key
// would be silently blocked by row policies and the events would be dropped.
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY') ?? '';

const stripe = new Stripe(stripeSecretKey, {
  // Deno has no Node crypto/http; Stripe requires these adapters.
  httpClient: Stripe.createFetchHttpClient(),
});

// SubtleCrypto is async-only in Deno, which is why constructEventAsync is required below.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Records the event id and reports whether this delivery is a replay.
 * Stripe retries on any non-2xx and can deliver the same event more than once, so every
 * handler below must be idempotent. The unique constraint on `stripe_event_id` is what
 * actually enforces this — a duplicate insert fails and we return early.
 */
async function claimEvent(db: SupabaseClient, event: Stripe.Event): Promise<boolean> {
  const { error } = await db.from('processed_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });

  if (!error) return false;

  // 23505 = unique_violation -> already processed.
  if (error.code === '23505') return true;

  throw new Error(`Failed to record webhook event ${event.id}: ${error.message}`);
}

interface PlanEntitlements {
  aiCredits: number | null;
}

/** Mirrors the plan table in src/services/stripeService.ts. */
const PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  pro_studio: { aiCredits: 100 },
  // null == unmetered
  master_label: { aiCredits: null },
};

function entitlementsFor(planId: string | null | undefined): PlanEntitlements {
  if (!planId) return { aiCredits: 0 };
  return PLAN_ENTITLEMENTS[planId] ?? { aiCredits: 0 };
}

/**
 * Upserts the authoritative subscription row for a user.
 * Keyed on user_id so a user has exactly one current subscription record.
 */
async function upsertSubscription(
  db: SupabaseClient,
  row: {
    user_id: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    plan_id?: string | null;
    status: string;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    ai_credits?: number | null;
  }
): Promise<void> {
  const { error } = await db
    .from('subscriptions')
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Failed to upsert subscription for ${row.user_id}: ${error.message}`);
  }
}

function periodEndIso(subscription: Stripe.Subscription): string | null {
  // Stripe moved current_period_end from the subscription onto its items in recent API
  // versions; read the item and fall back to the legacy top-level field.
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  const epoch =
    fromItem ?? (subscription as unknown as { current_period_end?: number }).current_period_end;
  return typeof epoch === 'number' ? new Date(epoch * 1000).toISOString() : null;
}

function planIdOf(subscription: Stripe.Subscription): string | null {
  return (
    subscription.metadata?.planId ?? subscription.items?.data?.[0]?.price?.metadata?.planId ?? null
  );
}

async function handleEvent(db: SupabaseClient, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planId = session.metadata?.planId ?? null;

      if (!userId) {
        console.error(`[Stripe] checkout.session.completed ${session.id} has no metadata.userId`);
        return;
      }

      await upsertSubscription(db, {
        user_id: userId,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
        stripe_subscription_id:
          typeof session.subscription === 'string' ? session.subscription : null,
        plan_id: planId,
        status: 'active',
        ai_credits: entitlementsFor(planId).aiCredits,
      });
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error(`[Stripe] ${event.type} ${subscription.id} has no metadata.userId`);
        return;
      }

      const planId = planIdOf(subscription);

      await upsertSubscription(db, {
        user_id: userId,
        stripe_customer_id:
          typeof subscription.customer === 'string' ? subscription.customer : null,
        stripe_subscription_id: subscription.id,
        plan_id: planId,
        status: subscription.status,
        current_period_end: periodEndIso(subscription),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        ai_credits: entitlementsFor(planId).aiCredits,
      });
      return;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error(`[Stripe] subscription.deleted ${subscription.id} has no metadata.userId`);
        return;
      }

      await upsertSubscription(db, {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        status: 'canceled',
        current_period_end: periodEndIso(subscription),
        cancel_at_period_end: true,
        // Revoke premium entitlements.
        ai_credits: 0,
      });
      return;
    }

    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof (invoice as unknown as { subscription?: unknown }).subscription === 'string'
          ? (invoice as unknown as { subscription: string }).subscription
          : null;

      if (!subscriptionId) {
        console.warn(`[Stripe] ${event.type} ${invoice.id} is not tied to a subscription`);
        return;
      }

      const succeeded = event.type === 'invoice.payment_succeeded';

      // Re-read the subscription so plan/period/credits come from Stripe rather than the
      // invoice snapshot, then reuse the same upsert path.
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;

      if (!userId) {
        console.error(`[Stripe] subscription ${subscriptionId} has no metadata.userId`);
        return;
      }

      const planId = planIdOf(subscription);

      await upsertSubscription(db, {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan_id: planId,
        status: succeeded ? subscription.status : 'past_due',
        current_period_end: periodEndIso(subscription),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        // Renewal grants a fresh credit allowance; a failed payment does not.
        ...(succeeded ? { ai_credits: entitlementsFor(planId).aiCredits } : {}),
      });
      return;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata?.userId;

      if (!userId) {
        console.error(
          `[Stripe] payment_intent.succeeded ${paymentIntent.id} has no metadata.userId`
        );
        return;
      }

      const { error } = await db.from('credit_transactions').insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency,
        credits: Number.parseInt(paymentIntent.metadata?.credits ?? '0', 10) || 0,
      });

      if (error) {
        throw new Error(`Failed to record credit purchase ${paymentIntent.id}: ${error.message}`);
      }
      return;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[Stripe] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not configured');
    return json({ error: 'Webhook not configured' }, 500);
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, 400);
  }

  // Raw body is required — any reserialization invalidates the signature.
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error(
      '[Stripe] Signature verification failed:',
      err instanceof Error ? err.message : err
    );
    return json({ error: 'Invalid signature' }, 400);
  }

  const db = getSupabase();
  if (!db) {
    // 500 so Stripe retries once configuration is fixed, rather than silently dropping.
    console.error('[Stripe] SUPABASE_URL / SUPABASE_SERVICE_KEY not configured');
    return json({ error: 'Datastore not configured' }, 500);
  }

  try {
    if (await claimEvent(db, event)) {
      console.log(`[Stripe] Event ${event.id} already processed — ignoring replay`);
      return json({ received: true, duplicate: true });
    }

    try {
      await handleEvent(db, event);
    } catch (handlerError) {
      // Release the claim so Stripe's retry is not mistaken for a replay and dropped.
      await db.from('processed_webhook_events').delete().eq('stripe_event_id', event.id);
      throw handlerError;
    }

    return json({ received: true });
  } catch (error) {
    // Non-2xx makes Stripe retry with backoff, which is what we want for transient failures.
    console.error('[Stripe] Webhook processing error:', error);
    return json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, 500);
  }
});
