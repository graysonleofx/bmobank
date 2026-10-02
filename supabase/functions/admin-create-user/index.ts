import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Server configuration or authorization is missing.' }, 500);
  }

  const accessToken = authorization.slice('Bearer '.length);
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(accessToken);
  if (authError || !caller) return jsonResponse({ error: 'Please sign in again.' }, 401);

  const { data: callerAccount, error: callerAccountError } = await adminClient
    .from('accounts')
    .select('role')
    .eq('id', caller.id)
    .maybeSingle();
  if (callerAccountError) return jsonResponse({ error: callerAccountError.message }, 500);
  if (callerAccount?.role !== 'admin') return jsonResponse({ error: 'Administrator access required.' }, 403);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const fullName = typeof payload.full_name === 'string' ? payload.full_name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const checking = Number(payload.checking_account_balance ?? 0);
  const savings = Number(payload.savings_account_balance ?? 0);
  const accountNumber = typeof payload.account_number === 'string' ? payload.account_number.trim() : '';

  if (!fullName || !email || password.length < 8 || !accountNumber) {
    return jsonResponse({ error: 'Name, email, an 8-character password, and account number are required.' }, 400);
  }
  if (!Number.isFinite(checking) || checking < 0 || !Number.isFinite(savings) || savings < 0) {
    return jsonResponse({ error: 'Balances must be valid non-negative amounts.' }, 400);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  let targetUser = created?.user ?? null;
  let createdNewAuthUser = Boolean(targetUser);

  if (!targetUser && createError && /already (registered|exists)|email_exists/i.test(createError.message)) {
    let page = 1;
    while (!targetUser) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return jsonResponse({ error: error.message }, 500);
      targetUser = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
      if (targetUser || data.users.length < 1000) break;
      page += 1;
    }
  }

  if (!targetUser) {
    return jsonResponse({ error: createError?.message || 'Could not create authentication user.' }, 400);
  }

  const { data: existingAccount, error: existingAccountError } = await adminClient
    .from('accounts')
    .select('id')
    .eq('id', targetUser.id)
    .maybeSingle();
  if (existingAccountError) return jsonResponse({ error: existingAccountError.message }, 500);
  if (existingAccount) return jsonResponse({ error: 'This email is already linked to an account.' }, 409);

  if (!createdNewAuthUser && !targetUser.email) {
    return jsonResponse({ error: 'The existing Auth user has no email address.' }, 400);
  }

  const { error: accountError } = await adminClient.from('accounts').insert({
    id: targetUser.id,
    full_name: fullName,
    email,
    account_number: accountNumber,
    checking_account_balance: checking,
    savings_account_balance: savings,
    balance: checking + savings,
    status: 'active',
    role: 'user',
  });

  if (accountError) {
    if (createdNewAuthUser) {
      const { error: cleanupError } = await adminClient.auth.admin.deleteUser(targetUser.id);
      if (cleanupError) console.error('Failed to remove Auth user after account insert failure:', cleanupError);
    }
    return jsonResponse({ error: accountError.message }, 400);
  }

  return jsonResponse({ user_id: targetUser.id, account_number: accountNumber }, 201);
});