import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * NEVER import this file into client components ('use client').
 * NEVER expose this key in NEXT_PUBLIC_* variables.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
