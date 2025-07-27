import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase';
import { checkTrialStatus, TrialStatus, shouldRedirectToSubscription } from '@/utils/trialStatus';

interface UseTrialStatusOptions {
  redirectIfExpired?: boolean;
}

export function useTrialStatus(userId: string | undefined, options: UseTrialStatusOptions = {}) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const status = await checkTrialStatus(userId);
        setTrialStatus(status);

        // Redirect to subscription page if trial is expired and option is enabled
        if (options.redirectIfExpired && shouldRedirectToSubscription(status)) {
          router.push('/subscription');
        }
      } catch (err) {
        console.error('Error fetching trial status:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch trial status'));
      } finally {
        setLoading(false);
      }
    };

    fetchTrialStatus();
  }, [userId, router, options.redirectIfExpired]);

  const startTrial = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Update the trial_start_date in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ trial_start_date: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Refresh trial status
      const status = await checkTrialStatus(userId);
      setTrialStatus(status);

      return true;
    } catch (err) {
      console.error('Error starting trial:', err);
      setError(err instanceof Error ? err : new Error('Failed to start trial'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    trialStatus,
    loading,
    error,
    startTrial,
    isExpired: trialStatus?.isExpired || false,
    daysLeft: trialStatus?.daysLeft || 0,
    hasActiveSubscription: trialStatus?.subscriptionStatus === 'active',
  };
}