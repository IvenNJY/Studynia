-- Resource and performance persistence for LMS synchronization.

alter table public.materials
  add column if not exists user_id uuid references public.profiles(id),
  add column if not exists lms_external_id text,
  add column if not exists module_name text,
  add column if not exists source text not null default 'local',
  add column if not exists updated_at timestamp with time zone not null default now();

update public.materials
set user_id = courses.user_id
from public.courses as courses
where public.materials.course_id = courses.id
  and public.materials.user_id is null;

create unique index if not exists materials_user_lms_external_id_idx
  on public.materials(user_id, lms_external_id)
  where lms_external_id is not null;

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lms_external_id text,
  title text not null,
  description text,
  file_url text,
  due_date timestamp with time zone,
  points_possible numeric,
  source text not null default 'lms' check (source in ('lms', 'local')),
  is_completed boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists assignments_user_lms_external_id_idx
  on public.assignments(user_id, lms_external_id)
  where lms_external_id is not null;

create table if not exists public.material_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  viewed boolean not null default false,
  viewed_at timestamp with time zone,
  updated_at timestamp with time zone not null default now(),
  unique(user_id, material_id)
);

create table if not exists public.gpa_progression (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  semester text not null,
  semester_order integer not null,
  gpa numeric(3, 2) check (gpa is null or (gpa >= 0 and gpa <= 4)),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_id, semester)
);

create index if not exists materials_user_course_idx
  on public.materials(user_id, course_id);

create index if not exists assignments_user_due_date_idx
  on public.assignments(user_id, due_date);

create index if not exists material_progress_user_idx
  on public.material_progress(user_id, material_id);

create index if not exists gpa_progression_user_order_idx
  on public.gpa_progression(user_id, semester_order);

alter table public.materials enable row level security;
alter table public.assignments enable row level security;
alter table public.material_progress enable row level security;
alter table public.gpa_progression enable row level security;

drop policy if exists "Users manage their materials" on public.materials;
create policy "Users manage their materials" on public.materials
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage their assignments" on public.assignments;
create policy "Users manage their assignments" on public.assignments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage their material progress" on public.material_progress;
create policy "Users manage their material progress" on public.material_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage their GPA progression" on public.gpa_progression;
create policy "Users manage their GPA progression" on public.gpa_progression
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
