'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import SuccessMessage from '@/components/SuccessMessage';

interface UserProfile {
  id: string;
  email: string;
  lab_name: string | null;
  created_at: string;
  trial_start_date: string | null;
  subscription_status: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [labName, setLabName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { trialStatus } = useTrialStatus(user?.id);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        setLabName(data.lab_name || '');
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, router, supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('users')
        .update({ lab_name: labName })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profile updated successfully');
      setProfile(prev => prev ? { ...prev, lab_name: labName } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoadingSpinner size="large" message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account settings</p>
        </div>

        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
        {success && <SuccessMessage message={success} />}

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile?.email}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Account created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Subscription status</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                {trialStatus?.subscriptionStatus === 'active' ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active subscription
                  </span>
                ) : trialStatus?.isExpired ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Trial expired
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Trial active - {trialStatus?.daysLeft} days left
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
          <h4 className="text-lg leading-6 font-medium text-gray-900 mb-4">Lab Settings</h4>
          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label htmlFor="lab-name" className="block text-sm font-medium text-gray-700">
                Lab Name
              </label>
              <input
                type="text"
                id="lab-name"
                name="lab-name"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isSaving ? <LoadingSpinner size="small" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
          <h4 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Actions</h4>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex">
            <button
              type="button"
              onClick={() => router.push('/subscription')}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Manage Subscription
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}