-- PostgREST resolves upsert conflict targets most reliably from a table
-- constraint rather than an independently-created index.

drop index if exists public.assignments_user_lms_external_id_idx;

delete from public.assignments older
using public.assignments newer
where older.user_id = newer.user_id
  and older.lms_external_id is not null
  and older.lms_external_id = newer.lms_external_id
  and older.id < newer.id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.assignments'::regclass
      and conname = 'assignments_user_lms_external_id_key'
  ) then
    alter table public.assignments
      add constraint assignments_user_lms_external_id_key
      unique (user_id, lms_external_id);
  end if;
end
$$;
