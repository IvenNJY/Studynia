-- Allow authenticated users to manage only their own courses.

alter table public.courses enable row level security;

drop policy if exists "Users manage their courses" on public.courses;
create policy "Users manage their courses" on public.courses
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
