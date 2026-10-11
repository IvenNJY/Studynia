-- Make the LMS material upsert conflict target explicit and deduplicate
-- any existing LMS rows before adding the table constraint.

drop index if exists public.materials_user_lms_external_id_idx;

delete from public.materials older
using public.materials newer
where older.user_id = newer.user_id
  and older.lms_external_id is not null
  and older.lms_external_id = newer.lms_external_id
  and older.id < newer.id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.materials'::regclass
      and conname = 'materials_user_lms_external_id_key'
  ) then
    alter table public.materials
      add constraint materials_user_lms_external_id_key
      unique (user_id, lms_external_id);
  end if;
end
$$;
