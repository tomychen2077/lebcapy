import { createClient } from '@supabase/supabase-js';
// Server-side imports are moved to the server file to avoid client-side errors

// Create a single supabase client for the browser
export const createSupabaseClient = () => {
  // Use mock values for testing to avoid environment variable issues
  // In a real environment, these would be set in .env.local
  return createClient(
    'https://ndvrilyfotxifazljszl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdnJpbHlmb3R4aWZhemxqc3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODM2ODksImV4cCI6MjA2ODg1OTY4OX0.WSBQjuSjQIsVFa26eJKvSHmKoaRruwBq7zEDf3ksAug'
  );
};

// Server-side client has been moved to supabase-server.ts
// This avoids importing server-only modules in client components