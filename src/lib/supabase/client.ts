import { createBrowserClient } from '@supabase/ssr';

// Browser Supabase client. Carries the auth session via cookies, so all
// queries run as the signed-in user and RLS scopes them automatically.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
