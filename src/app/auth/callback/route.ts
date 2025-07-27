import { createServerSupabaseClient } from '@/utils/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // Check if this is a new user (sign up) and create a user record if needed
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (!existingUser) {
        // Create a new user record
        await supabase.from('users').insert([
          {
            id: session.user.id,
            email: session.user.email,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}