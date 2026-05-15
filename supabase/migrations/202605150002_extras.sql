alter table public.profiles
add column if not exists corn_grains integer not null default 0 check (corn_grains >= 0);

create table if not exists public.grain_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.festival_settings (
  id boolean primary key default true check (id),
  spotify_embed_url text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.festival_settings (id, spotify_embed_url)
values (true, '')
on conflict (id) do nothing;

drop trigger if exists festival_settings_set_updated_at on public.festival_settings;
create trigger festival_settings_set_updated_at
before update on public.festival_settings
for each row execute function public.set_updated_at();

create index if not exists menu_items_active_category_name_idx
  on public.menu_items (active, category, name);

create or replace function public.purchase_menu_items(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_balance integer;
  v_grain_balance integer;
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
  set
    tokens = tokens - v_total,
    corn_grains = corn_grains + v_total
  where id = auth.uid()
    and tokens >= v_total
  returning tokens, corn_grains into v_balance, v_grain_balance;

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

  insert into public.grain_transactions (user_id, delta, reason, metadata)
  values (
    auth.uid(),
    v_total,
    'compra_comida',
    jsonb_build_object('order_id', v_order_id)
  );

  return jsonb_build_object(
    'order_id', v_order_id,
    'total', v_total,
    'balance', v_balance,
    'grain_balance', v_grain_balance
  );
end;
$$;

create or replace function public.adjust_grains(
  p_nickname text,
  p_delta integer,
  p_reason text
)
returns jsonb
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

  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  if p_delta = 0 then
    raise exception 'invalid_delta';
  end if;

  update public.profiles
  set corn_grains = corn_grains + p_delta
  where lower(nickname) = lower(trim(p_nickname))
    and corn_grains + p_delta >= 0
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'profile_not_found_or_insufficient_grains';
  end if;

  insert into public.grain_transactions (user_id, delta, reason)
  values (v_profile.id, p_delta, coalesce(nullif(trim(p_reason), ''), 'ajuste_manual'));

  return jsonb_build_object(
    'nickname', v_profile.nickname,
    'balance', v_profile.corn_grains
  );
end;
$$;

create or replace function public.get_mayor_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'orders', (select count(*) from public.orders where status = 'paid'),
    'revenue_tokens', (select coalesce(sum(total), 0) from public.orders where status = 'paid'),
    'love_notes', (select count(*) from public.love_notes),
    'active_jails', (select count(*) from public.jail_records where status = 'active'),
    'total_grains', (select coalesce(sum(corn_grains), 0) from public.profiles)
  );
end;
$$;

alter table public.grain_transactions enable row level security;
alter table public.festival_settings enable row level security;

drop policy if exists "grain_transactions_select_own_or_admin" on public.grain_transactions;
create policy "grain_transactions_select_own_or_admin"
on public.grain_transactions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "festival_settings_select_authenticated" on public.festival_settings;
create policy "festival_settings_select_authenticated"
on public.festival_settings
for select
to authenticated
using (true);

drop policy if exists "festival_settings_admin_write" on public.festival_settings;
create policy "festival_settings_admin_write"
on public.festival_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.grain_transactions to authenticated;
grant select, insert, update on public.festival_settings to authenticated;

revoke all on function public.adjust_grains(text, integer, text) from public;
revoke all on function public.get_mayor_dashboard() from public;

grant execute on function public.adjust_grains(text, integer, text) to authenticated;
grant execute on function public.get_mayor_dashboard() to authenticated;
