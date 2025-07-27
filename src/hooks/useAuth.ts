import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthState({
          user: user ? { id: user.id, email: user.email } : null,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error getting initial session:', error);
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setAuthState({
            user: { id: session.user.id, email: session.user.email },
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign in'),
        loading: false,
      }));
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      // Note: In a real app, you might want to create a user profile here
    } catch (error) {
      console.error('Error signing up:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign up'),
        loading: false,
      }));
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign in with Google'),
        loading: false,
      }));
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to sign out'),
        loading: false,
      }));
    }
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };
}