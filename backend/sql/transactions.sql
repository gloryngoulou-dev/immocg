-- À exécuter dans Supabase SQL Editor
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid,
  bien_id uuid not null,
  agence_user_id uuid,
  client_nom text,
  client_tel text,
  type_transaction text not null check (type_transaction in ('location', 'vente', 'location_jour', 'visite')),
  montant_fcfa integer not null check (montant_fcfa > 0),
  commission_pct numeric not null default 10,
  commission_fcfa integer not null,
  reference_immocg text not null,
  statut text not null default 'declaree' check (statut in ('declaree', 'verifiee', 'contestee')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_agence on transactions(agence_user_id);
create index if not exists idx_transactions_reservation on transactions(reservation_id);
create unique index if not exists idx_transactions_reservation_unique on transactions(reservation_id) where reservation_id is not null;
