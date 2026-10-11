-- Allow Supabase upsert(onConflict: user_id,lms_external_id) to resolve
-- the assignment conflict target. PostgreSQL still permits multiple rows
-- with a NULL lms_external_id, so local assignments remain supported.

drop index if exists public.assignments_user_lms_external_id_idx;

delete from public.assignments older
using public.assignments newer
where older.user_id = newer.user_id
  and older.lms_external_id is not null
  and older.lms_external_id = newer.lms_external_id
  and older.id < newer.id;

create unique index if not exists assignments_user_lms_external_id_idx
  on public.assignments(user_id, lms_external_id);
