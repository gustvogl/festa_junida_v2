import { supabase } from './supabase';

function throwIfError(error) {
  if (error) {
    throw error;
  }
}

export async function fetchProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  throwIfError(authError);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  throwIfError(error);
  return data;
}

export async function updateOwnProfile(payload) {
  const { data, error } = await supabase.rpc('update_own_profile', {
    p_full_name: payload.fullName,
    p_nickname: payload.nickname,
    p_avatar_id: payload.avatarId,
  });
  throwIfError(error);
  return data;
}

export async function fetchMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name');
  throwIfError(error);
  return data;
}

export async function purchaseMenuItems(items) {
  const { data, error } = await supabase.rpc('purchase_menu_items', {
    p_items: items,
  });
  throwIfError(error);
  return data;
}

export async function fetchLoveNotes() {
  const { data, error } = await supabase
    .from('love_notes')
    .select(
      `
        id,
        content,
        style,
        created_at,
        sender:profiles!love_notes_sender_id_fkey(nickname),
        recipient:profiles!love_notes_recipient_id_fkey(nickname)
      `,
    )
    .order('created_at', { ascending: false })
    .limit(12);
  throwIfError(error);
  return data;
}

export async function sendLoveNote(payload) {
  const { data, error } = await supabase.rpc('send_love_note', {
    p_recipient_nickname: payload.recipientNickname,
    p_content: payload.content,
    p_style: payload.style,
  });
  throwIfError(error);
  return data;
}

export async function fetchGames() {
  const { data, error } = await supabase
    .from('game_definitions')
    .select('*')
    .eq('active', true)
    .order('cost');
  throwIfError(error);
  return data;
}

export async function playGame(gameKey) {
  const { data, error } = await supabase.rpc('play_game', {
    p_game_key: gameKey,
  });
  throwIfError(error);
  return data;
}

export async function fetchShows() {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .order('starts_at');
  throwIfError(error);
  return data;
}

export async function fetchJailRecords() {
  const { data, error } = await supabase
    .from('jail_records')
    .select(
      `
        id,
        status,
        created_at,
        prisoner:profiles!jail_records_prisoner_id_fkey(nickname),
        jailed_by:profiles!jail_records_jailed_by_fkey(nickname)
      `,
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  throwIfError(error);
  return data;
}

export async function jailUser(nickname) {
  const { data, error } = await supabase.rpc('jail_user', {
    p_prisoner_nickname: nickname,
  });
  throwIfError(error);
  return data;
}

export async function payBail() {
  const { data, error } = await supabase.rpc('pay_bail');
  throwIfError(error);
  return data;
}

export async function answerJailQuiz(answer) {
  const { data, error } = await supabase.rpc('answer_jail_quiz', {
    p_answer: answer,
  });
  throwIfError(error);
  return data;
}

export async function fetchTokenTransactions() {
  const { data, error } = await supabase
    .from('token_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  throwIfError(error);
  return data;
}

export async function fetchAdminCollections() {
  const [menuItems, shows] = await Promise.all([fetchMenuItems(), fetchShows()]);
  return { menuItems, shows };
}

export async function saveMenuItem(item) {
  const query = item.id
    ? supabase.from('menu_items').update(item).eq('id', item.id).select().single()
    : supabase.from('menu_items').insert(item).select().single();
  const { data, error } = await query;
  throwIfError(error);
  return data;
}

export async function saveShow(show) {
  const query = show.id
    ? supabase.from('shows').update(show).eq('id', show.id).select().single()
    : supabase.from('shows').insert(show).select().single();
  const { data, error } = await query;
  throwIfError(error);
  return data;
}
