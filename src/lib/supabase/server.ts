import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server Supabase client bound to the request's cookies. `cookies()` is async
// in this Next.js version. Use inside Server Components, Route Handlers, and
// Server Actions. Queries run as the signed-in user (RLS enforced).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // The proxy refreshes the session cookie, so this is safe to ignore.
          }
        },
      },
    }
  );
}
