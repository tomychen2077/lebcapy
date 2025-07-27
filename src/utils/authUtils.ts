import { createSupabaseClient } from './supabase';

/**
 * Signs up a new user with email and password
 * @param email The user's email
 * @param password The user's password
 * @returns Promise resolving to the sign-up result
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user record in the users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          { id: data.user.id, email: data.user.email }
        ]);

      if (profileError) throw profileError;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }
}

/**
 * Signs in a user with email and password
 * @param email The user's email
 * @param password The user's password
 * @returns Promise resolving to the sign-in result
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
}

/**
 * Signs in a user with Google OAuth
 * @returns Promise resolving to the sign-in result
 */
export async function signInWithGoogle() {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    return { data: null, error };
  }
}

/**
 * Signs out the current user
 * @returns Promise resolving to the sign-out result
 */
export async function signOut() {
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error };
  }
}

/**
 * Gets the current user
 * @returns Promise resolving to the current user
 */
export async function getCurrentUser() {
  const supabase = createSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    return { user, error: null };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return { user: null, error };
  }
}

/**
 * Resets a user's password
 * @param email The user's email
 * @returns Promise resolving to the password reset result
 */
export async function resetPassword(email: string) {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { data: null, error };
  }
}

/**
 * Updates a user's password
 * @param password The new password
 * @returns Promise resolving to the password update result
 */
export async function updatePassword(password: string) {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return { data: null, error };
  }
}

/**
 * Gets a user's profile data
 * @param userId The user's ID
 * @returns Promise resolving to the user's profile data
 */
export async function getUserProfile(userId: string) {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return { profile: data, error: null };
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return { profile: null, error };
  }
}

/**
 * Updates a user's profile data
 * @param userId The user's ID
 * @param profileData The profile data to update
 * @returns Promise resolving to the profile update result
 */
export async function updateUserProfile(userId: string, profileData: Record<string, any>) {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId);

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
}