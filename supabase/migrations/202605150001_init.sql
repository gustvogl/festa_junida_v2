create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(trim(nickname)) between 3 and 32),
  full_name text not null,
  avatar_id text not null default '1',
  role text not null default 'user' check (role in ('user', 'admin')),
  tokens integer not null default 50 check (tokens >= 0),
  level text not null default 'Caipira iniciante',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.token_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null,
  price integer not null check (price > 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total integer not null check (total >= 0),
  status text not null default 'paid' check (status in ('paid', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price > 0)
);

create table if not exists public.love_notes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete set null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 300),
  style text not null default 'direct' check (style in ('direct', 'anonymous', 'mimo')),
  visible_on_mural boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.game_definitions (
  id uuid primary key default gen_random_uuid(),
  game_key text not null unique,
  name text not null,
  description text not null,
  cost integer not null check (cost > 0),
  reward_tokens integer not null check (reward_tokens >= 0),
  win_chance numeric(4, 3) not null check (win_chance >= 0 and win_chance <= 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.game_definitions(id),
  cost integer not null,
  reward integer not null,
  won boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jail_records (
  id uuid primary key default gen_random_uuid(),
  prisoner_id uuid not null references public.profiles(id) on delete cascade,
  jailed_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'released')),
  released_by uuid references public.profiles(id) on delete set null,
  release_reason text,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create unique index if not exists one_active_jail_per_prisoner
  on public.jail_records (prisoner_id)
  where status = 'active';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

drop trigger if exists game_definitions_set_updated_at on public.game_definitions;
create trigger game_definitions_set_updated_at
before update on public.game_definitions
for each row execute function public.set_updated_at();

drop trigger if exists shows_set_updated_at on public.shows;
create trigger shows_set_updated_at
before update on public.shows
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
begin
  v_nickname := coalesce(
    nullif(trim(new.raw_user_meta_data->>'nickname'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, nickname, full_name, avatar_id)
  values (
    new.id,
    v_nickname,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), v_nickname),
    coalesce(nullif(trim(new.raw_user_meta_data->>'avatar_id'), ''), '1')
  );

  insert into public.token_transactions (user_id, delta, reason)
  values (new.id, 50, 'saldo_inicial');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.update_own_profile(
  p_full_name text,
  p_nickname text,
  p_avatar_id text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.profiles
  set
    full_name = trim(p_full_name),
    nickname = trim(p_nickname),
    avatar_id = trim(p_avatar_id)
  where id = auth.uid()
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'profile_not_found';
  end if;

  return v_profile;
end;
$$;

create or replace function public.purchase_menu_items(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_balance integer;
  v_order_id uuid;
  v_requested_count integer;
  v_priced_count integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  with requested as (
    select
      (value->>'menu_item_id')::uuid as menu_item_id,
      greatest(coalesce((value->>'quantity')::integer, 0), 0) as quantity
    from jsonb_array_elements(p_items)
  ),
  normalized as (
    select menu_item_id, sum(quantity)::integer as quantity
    from requested
    where quantity > 0
    group by menu_item_id
  ),
  priced as (
    select n.menu_item_id, n.quantity, m.price
    from normalized n
    join public.menu_items m on m.id = n.menu_item_id and m.active = true
  )
  select
    (select count(*) from normalized),
    (select count(*) from priced),
    coalesce((select sum(quantity * price) from priced), 0)
  into v_requested_count, v_priced_count, v_total;

  if v_requested_count = 0 then
    raise exception 'empty_cart';
  end if;

  if v_requested_count <> v_priced_count then
    raise exception 'invalid_menu_item';
  end if;

  update public.profiles
  set tokens = tokens - v_total
  where id = auth.uid()
    and tokens >= v_total
  returning tokens into v_balance;

  if v_balance is null then
    raise exception 'insufficient_tokens';
  end if;

  insert into public.orders (user_id, total)
  values (auth.uid(), v_total)
  returning id into v_order_id;

  with requested as (
    select
      (value->>'menu_item_id')::uuid as menu_item_id,
      greatest(coalesce((value->>'quantity')::integer, 0), 0) as quantity
    from jsonb_array_elements(p_items)
  ),
  normalized as (
    select menu_item_id, sum(quantity)::integer as quantity
    from requested
    where quantity > 0
    group by menu_item_id
  )
  insert into public.order_items (order_id, menu_item_id, quantity, unit_price)
  select
    v_order_id,
    n.menu_item_id,
    n.quantity,
    m.price
  from normalized n
  join public.menu_items m on m.id = n.menu_item_id and m.active = true;

  insert into public.token_transactions (user_id, delta, reason, metadata)
  values (
    auth.uid(),
    -v_total,
    'compra_comida',
    jsonb_build_object('order_id', v_order_id)
  );

  return jsonb_build_object(
    'order_id', v_order_id,
    'total', v_total,
    'balance', v_balance
  );
end;
$$;

create or replace function public.send_love_note(
  p_recipient_nickname text,
  p_content text,
  p_style text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient_id uuid;
  v_balance integer;
  v_note_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_style not in ('direct', 'anonymous', 'mimo') then
    raise exception 'invalid_note_style';
  end if;

  select id
  into v_recipient_id
  from public.profiles
  where lower(nickname) = lower(trim(p_recipient_nickname));

  if v_recipient_id is null then
    raise exception 'recipient_not_found';
  end if;

  if p_style = 'mimo' then
    update public.profiles
    set tokens = tokens - 1
    where id = auth.uid()
      and tokens >= 1
    returning tokens into v_balance;

    if v_balance is null then
      raise exception 'insufficient_tokens';
    end if;

    insert into public.token_transactions (user_id, delta, reason)
    values (auth.uid(), -1, 'mimo_correio');
  else
    select tokens into v_balance
    from public.profiles
    where id = auth.uid();
  end if;

  insert into public.love_notes (sender_id, recipient_id, content, style)
  values (auth.uid(), v_recipient_id, trim(p_content), p_style)
  returning id into v_note_id;

  return jsonb_build_object(
    'note_id', v_note_id,
    'balance', v_balance
  );
end;
$$;

create or replace function public.play_game(p_game_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.game_definitions;
  v_won boolean;
  v_reward integer;
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into v_game
  from public.game_definitions
  where game_key = p_game_key
    and active = true;

  if v_game.id is null then
    raise exception 'game_not_found';
  end if;

  v_won := random() < v_game.win_chance;
  v_reward := case when v_won then v_game.reward_tokens else 0 end;

  update public.profiles
  set tokens = tokens - v_game.cost + v_reward
  where id = auth.uid()
    and tokens >= v_game.cost
  returning tokens into v_balance;

  if v_balance is null then
    raise exception 'insufficient_tokens';
  end if;

  insert into public.game_plays (user_id, game_id, cost, reward, won)
  values (auth.uid(), v_game.id, v_game.cost, v_reward, v_won);

  insert into public.token_transactions (user_id, delta, reason, metadata)
  values (
    auth.uid(),
    v_reward - v_game.cost,
    'jogo',
    jsonb_build_object(
      'game_key', v_game.game_key,
      'won', v_won,
      'cost', v_game.cost,
      'reward', v_reward
    )
  );

  return jsonb_build_object(
    'game_name', v_game.name,
    'won', v_won,
    'cost', v_game.cost,
    'reward', v_reward,
    'balance', v_balance
  );
end;
$$;

create or replace function public.jail_user(p_prisoner_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prisoner_id uuid;
  v_prisoner_nickname text;
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select id, nickname
  into v_prisoner_id, v_prisoner_nickname
  from public.profiles
  where lower(nickname) = lower(trim(p_prisoner_nickname));

  if v_prisoner_id is null then
    raise exception 'prisoner_not_found';
  end if;

  if v_prisoner_id = auth.uid() then
    raise exception 'cannot_jail_yourself';
  end if;

  update public.profiles
  set tokens = tokens - 2
  where id = auth.uid()
    and tokens >= 2
  returning tokens into v_balance;

  if v_balance is null then
    raise exception 'insufficient_tokens';
  end if;

  insert into public.jail_records (prisoner_id, jailed_by)
  values (v_prisoner_id, auth.uid());

  insert into public.token_transactions (user_id, delta, reason, metadata)
  values (
    auth.uid(),
    -2,
    'prisao',
    jsonb_build_object('prisoner_id', v_prisoner_id)
  );

  return jsonb_build_object(
    'prisoner_nickname', v_prisoner_nickname,
    'balance', v_balance
  );
end;
$$;

create or replace function public.pay_bail()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jail_id uuid;
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select id
  into v_jail_id
  from public.jail_records
  where prisoner_id = auth.uid()
    and status = 'active'
  order by created_at desc
  limit 1;

  if v_jail_id is null then
    raise exception 'not_in_jail';
  end if;

  update public.profiles
  set tokens = tokens - 1
  where id = auth.uid()
    and tokens >= 1
  returning tokens into v_balance;

  if v_balance is null then
    raise exception 'insufficient_tokens';
  end if;

  update public.jail_records
  set
    status = 'released',
    released_by = auth.uid(),
    release_reason = 'bail',
    released_at = now()
  where id = v_jail_id;

  insert into public.token_transactions (user_id, delta, reason)
  values (auth.uid(), -1, 'fianca');

  return jsonb_build_object('balance', v_balance);
end;
$$;

create or replace function public.answer_jail_quiz(p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jail_id uuid;
  v_answer text;
  v_correct boolean;
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select id
  into v_jail_id
  from public.jail_records
  where prisoner_id = auth.uid()
    and status = 'active'
  order by created_at desc
  limit 1;

  if v_jail_id is null then
    raise exception 'not_in_jail';
  end if;

  v_answer := lower(trim(p_answer));
  v_correct := v_answer like '%quadrilha%'
    or v_answer like '%fogueira%'
    or v_answer like '%fogos%'
    or v_answer like '%sao joao%'
    or v_answer like '%são joão%';

  if not v_correct then
    return jsonb_build_object('correct', false);
  end if;

  update public.jail_records
  set
    status = 'released',
    released_by = auth.uid(),
    release_reason = 'quiz',
    released_at = now()
  where id = v_jail_id;

  update public.profiles
  set tokens = tokens + 2
  where id = auth.uid()
  returning tokens into v_balance;

  insert into public.token_transactions (user_id, delta, reason)
  values (auth.uid(), 2, 'quiz_prisao');

  return jsonb_build_object(
    'correct', true,
    'balance', v_balance
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.token_transactions enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.love_notes enable row level security;
alter table public.game_definitions enable row level security;
alter table public.game_plays enable row level security;
alter table public.shows enable row level security;
alter table public.jail_records enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "transactions_select_own_or_admin" on public.token_transactions;
create policy "transactions_select_own_or_admin"
on public.token_transactions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "menu_items_select_authenticated" on public.menu_items;
create policy "menu_items_select_authenticated"
on public.menu_items
for select
to authenticated
using (active or public.is_admin());

drop policy if exists "menu_items_admin_write" on public.menu_items;
create policy "menu_items_admin_write"
on public.menu_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "love_notes_select_related_or_mural" on public.love_notes;
create policy "love_notes_select_related_or_mural"
on public.love_notes
for select
to authenticated
using (
  recipient_id = auth.uid()
  or sender_id = auth.uid()
  or visible_on_mural = true
  or public.is_admin()
);

drop policy if exists "game_definitions_select_authenticated" on public.game_definitions;
create policy "game_definitions_select_authenticated"
on public.game_definitions
for select
to authenticated
using (active or public.is_admin());

drop policy if exists "game_definitions_admin_write" on public.game_definitions;
create policy "game_definitions_admin_write"
on public.game_definitions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "game_plays_select_own_or_admin" on public.game_plays;
create policy "game_plays_select_own_or_admin"
on public.game_plays
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "shows_select_authenticated" on public.shows;
create policy "shows_select_authenticated"
on public.shows
for select
to authenticated
using (true);

drop policy if exists "shows_admin_write" on public.shows;
create policy "shows_admin_write"
on public.shows
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "jail_records_select_authenticated" on public.jail_records;
create policy "jail_records_select_authenticated"
on public.jail_records
for select
to authenticated
using (true);

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.token_transactions to authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.love_notes to authenticated;
grant select, insert, update, delete on public.game_definitions to authenticated;
grant select on public.game_plays to authenticated;
grant select, insert, update, delete on public.shows to authenticated;
grant select on public.jail_records to authenticated;

revoke all on function public.update_own_profile(text, text, text) from public;
revoke all on function public.purchase_menu_items(jsonb) from public;
revoke all on function public.send_love_note(text, text, text) from public;
revoke all on function public.play_game(text) from public;
revoke all on function public.jail_user(text) from public;
revoke all on function public.pay_bail() from public;
revoke all on function public.answer_jail_quiz(text) from public;

grant execute on function public.update_own_profile(text, text, text) to authenticated;
grant execute on function public.purchase_menu_items(jsonb) to authenticated;
grant execute on function public.send_love_note(text, text, text) to authenticated;
grant execute on function public.play_game(text) to authenticated;
grant execute on function public.jail_user(text) to authenticated;
grant execute on function public.pay_bail() to authenticated;
grant execute on function public.answer_jail_quiz(text) to authenticated;

insert into public.menu_items (name, description, category, price)
values
  ('Pamonha Tradicional', 'Milho verde fresquinho e doce na medida.', 'Salgados', 3),
  ('Milho Cozido', 'Com manteiga derretendo.', 'Salgados', 2),
  ('Pastel de Feira', 'Crocante e bem recheado.', 'Salgados', 4),
  ('Canjica', 'Cremosa e com canela.', 'Doces', 3),
  ('Quentão', 'Esquenta a noite do arraial.', 'Bebidas', 2)
on conflict do nothing;

insert into public.game_definitions (game_key, name, description, cost, reward_tokens, win_chance)
values
  ('pescaria', 'Pescaria', 'Pesque o prêmio certo antes do tempo acabar.', 5, 10, 0.45),
  ('tomba-lata', 'Tomba-lata', 'Teste a mira e derrube tudo.', 3, 7, 0.5),
  ('boca-palhaco', 'Boca do Palhaço', 'Acertou a boca, levou.', 4, 9, 0.42)
on conflict (game_key) do nothing;

insert into public.shows (title, artist, description, starts_at, ends_at, is_live)
values
  (
    'Quadrilha Infantil',
    'Escola Municipal',
    'Abertura da noite.',
    date_trunc('day', now()) + interval '18 hours',
    date_trunc('day', now()) + interval '19 hours',
    false
  ),
  (
    'Trio Pé de Serra',
    'Os Nordestinos',
    'Forró ao vivo.',
    date_trunc('day', now()) + interval '19 hours 30 minutes',
    date_trunc('day', now()) + interval '21 hours',
    true
  ),
  (
    'Grande Quadrilha',
    'Turma do Arraiá',
    'Encerramento principal.',
    date_trunc('day', now()) + interval '23 hours',
    null,
    false
  )
on conflict do nothing;
