import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const adminDashboard = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (error || !allowed) throw new Error('Admin access required');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const accounts = [];
    for (let page = 1; ; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      accounts.push(...data.users.map(u => ({ id: u.id, email: u.email ?? 'No email', createdAt: u.created_at })));
      if (data.users.length < 1000) break;
    }
    const activity = [];
    for (let start = 0; ; start += 1000) {
      const { data, error } = await context.supabase.from('lead_activity').select('id,user_id,added_at').order('added_at', { ascending: false }).order('id').range(start, start + 999);
      if (error) throw error;
      activity.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return { accounts, activity, selfId: context.userId };
  });

export const removeAccount = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (error || !allowed) throw new Error('Admin access required');
    if (data.userId === context.userId) throw new Error('You cannot remove your own admin account');
    const { data: targetAdmin, error: roleError } = await context.supabase.rpc('has_role', { _user_id: data.userId, _role: 'admin' });
    if (roleError || targetAdmin) throw new Error('Admin accounts cannot be removed here');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (deleteError) throw deleteError;
    return { ok: true };
  });