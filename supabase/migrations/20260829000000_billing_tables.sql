-- 3WM SONIK — Billing tables backing the Stripe webhook handler.
--
-- Before this migration the webhook handler had no persistence at all (every event branch
-- was a TODO), so completed checkouts provisioned nothing. These three tables are the
-- minimum authoritative state the handler needs.
--
-- All writes come from the stripe-webhooks edge function using the service role key, so RLS
-- is enabled with read-only self-access policies and no client-writable policy at all.

-- ==========================================================================
-- subscriptions — one authoritative row per user
-- ==========================================================================
create table if not exists public.subscriptions (
  user_id                 text primary key,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan_id                 text,
  status                  text not null,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  -- NULL means unmetered (Master Label); 0 means no entitlement.
  ai_credits              integer,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

-- ==========================================================================
-- processed_webhook_events — idempotency ledger
-- ==========================================================================
-- Stripe retries on any non-2xx and may deliver the same event more than once. The unique
-- constraint here is what actually makes the handler idempotent: a duplicate insert fails
-- with 23505 and the handler returns early.
create table if not exists public.processed_webhook_events (
  stripe_event_id  text primary key,
  event_type       text not null,
  processed_at     timestamptz not null default now()
);

create index if not exists processed_webhook_events_processed_at_idx
  on public.processed_webhook_events (processed_at);

-- ==========================================================================
-- credit_transactions — one-off AI credit purchases
-- ==========================================================================
create table if not exists public.credit_transactions (
  id                        bigint generated always as identity primary key,
  user_id                   text not null,
  stripe_payment_intent_id  text not null unique,
  amount_cents              integer not null,
  currency                  text not null,
  credits                   integer not null default 0,
  created_at                timestamptz not null default now()
);

create index if not exists credit_transactions_user_id_idx
  on public.credit_transactions (user_id);

-- ==========================================================================
-- Row Level Security
-- ==========================================================================
alter table public.subscriptions            enable row level security;
alter table public.processed_webhook_events enable row level security;
alter table public.credit_transactions      enable row level security;

-- Users may read their own billing state. No insert/update/delete policy exists, so only
-- the service role (which bypasses RLS) can write.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid()::text = user_id);

drop policy if exists "credit_transactions_select_own" on public.credit_transactions;
create policy "credit_transactions_select_own"
  on public.credit_transactions for select
  using (auth.uid()::text = user_id);

-- processed_webhook_events is internal bookkeeping: no client access whatsoever.

-- ==========================================================================
-- updated_at maintenance
-- ==========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
