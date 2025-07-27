import { createServerClient } from '@supabase/ssr';
// Import cookies conditionally to avoid client-side errors
let cookiesModule: any = null;

// This function will be used on the server side only
if (typeof window === 'undefined') {
  cookiesModule = require('next/headers');
}

// Create a server-side supabase client
export const createServerSupabaseClient = () => {
  // Ensure this function is only called on the server
  if (typeof window !== 'undefined') {
    console.error('createServerSupabaseClient should only be called on the server');
    return null;
  }
  
  const cookieStore = cookiesModule.cookies();
  
  // Use mock values for testing to avoid environment variable issues
  // In a real environment, these would be set in .env.local
  return createServerClient(
    'https://ndvrilyfotxifazljszl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdnJpbHlmb3R4aWZhemxqc3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODM2ODksImV4cCI6MjA2ODg1OTY4OX0.WSBQjuSjQIsVFa26eJKvSHmKoaRruwBq7zEDf3ksAug',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};