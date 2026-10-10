create table if not exists public.assessment_shares (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  shared_with_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (attempt_id, shared_with_id)
);

create index if not exists assessment_shares_shared_with_idx
  on public.assessment_shares(shared_with_id);

alter table public.assessment_shares enable row level security;

create policy "Assessment owners and recipients can view shares"
  on public.assessment_shares for select
  using (
    shared_with_id = auth.uid()
    or exists (
      select 1 from public.assessment_attempts
      where id = assessment_shares.attempt_id and user_id = auth.uid()
    )
  );
