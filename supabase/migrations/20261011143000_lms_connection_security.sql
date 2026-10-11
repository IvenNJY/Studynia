-- Secure LMS token access used by the server-side synchronization routes.

-- The view may already exist with a different column order/name from the
-- original LMS setup. CREATE OR REPLACE VIEW cannot rename those columns.
drop view if exists public.decrypted_lms_connections;

create view public.decrypted_lms_connections
with (security_invoker = false)
as
select
  connections.id,
  connections.user_id,
  connections.platform_name as domain,
  connections.is_active,
  decrypted.decrypted_secret as access_token
from public.lms_connections as connections
join vault.decrypted_secrets as decrypted
  on decrypted.id = connections.secret_id
where connections.is_active = true;

create or replace function public.store_lms_token(
  p_platform_name text,
  p_token text
)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  current_user_id uuid := auth.uid();
  secret_uuid uuid;
  connection_uuid uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_platform_name), '') is null or nullif(trim(p_token), '') is null then
    raise exception 'platform_name and token are required';
  end if;

  select secret_id
    into secret_uuid
  from public.lms_connections
  where user_id = current_user_id
    and is_active = true
  order by last_synced_at desc nulls last
  limit 1;

  if secret_uuid is not null then
    perform vault.update_secret(secret_uuid, trim(p_token), trim(p_platform_name));
    update public.lms_connections
      set platform_name = trim(p_platform_name),
          last_synced_at = null,
          is_active = true
    where user_id = current_user_id
      and secret_id = secret_uuid;
    select id into connection_uuid
    from public.lms_connections
    where user_id = current_user_id
      and secret_id = secret_uuid
    limit 1;
  else
    secret_uuid := vault.create_secret(trim(p_token), trim(p_platform_name), 'StudyNia LMS access token');
    insert into public.lms_connections(user_id, platform_name, secret_id, is_active)
      values (current_user_id, trim(p_platform_name), secret_uuid, true)
      returning id into connection_uuid;
  end if;

  return connection_uuid;
end;
$$;

revoke all on function public.store_lms_token(text, text) from public;
grant execute on function public.store_lms_token(text, text) to authenticated;
