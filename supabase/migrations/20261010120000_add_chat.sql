create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_participants (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  attempt_id uuid references public.assessment_attempts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists chat_participants_user_id_idx
  on public.chat_participants(user_id);
create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages(conversation_id, created_at);
create index if not exists chat_messages_sender_id_idx
  on public.chat_messages(sender_id);

alter table public.chat_conversations enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

create policy "Chat participants can view their conversations"
  on public.chat_participants for select
  using (user_id = auth.uid());

create policy "Chat participants can view messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_participants
      where conversation_id = chat_messages.conversation_id
        and user_id = auth.uid()
    )
  );

create policy "Chat participants can send messages"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_participants
      where conversation_id = chat_messages.conversation_id
        and user_id = auth.uid()
    )
  );

create policy "Chat participants can mark messages read"
  on public.chat_participants for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
end $$;
