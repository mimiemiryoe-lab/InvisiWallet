-- InvisiWallet migration: invisible wallets + ChiPay reconciliation support
-- Safe to run multiple times (IF NOT EXISTS guards)

-- 1) Recipient wallet address directly on profiles (for username-based on-chain sends)
alter table public.profiles
  add column if not exists starknet_address text;

create index if not exists profiles_starknet_address_idx
  on public.profiles(starknet_address);

-- 2) Transactions: add processor and external_ref for ChiPay/webhook reconciliation
alter table public.transactions
  add column if not exists processor text; -- e.g., 'chipay'

alter table public.transactions
  add column if not exists external_ref text; -- e.g., 'tx_<uuid>' used in checkout/webhooks

-- 3) Note: We'll use transaction_type enum directly in queries instead of a generated column

-- 4) Optional: convenience view aligning enum names to simple columns
--    Keep if helpful; otherwise comment out.
CREATE OR REPLACE VIEW public.transactions_view AS
SELECT
  id,
  from_user_id,
  to_user_id,
  amount,
  (transaction_type)::text AS type,
  status,
  tx_hash,
  processor,
  external_ref,
  note,
  created_at,
  completed_at
FROM public.transactions;

-- 5) Helpful index for external_ref lookups (webhook reconciliation)
create index if not exists transactions_external_ref_idx
  on public.transactions(external_ref);

-- 6) Helpful composite index for from/to user filters
create index if not exists transactions_from_to_user_idx
  on public.transactions(from_user_id, to_user_id);

-- End of migration
