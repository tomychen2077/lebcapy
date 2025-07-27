import { createSupabaseClient } from './supabase';

export interface TrialStatus {
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  daysLeft: number;
  isExpired: boolean;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
}

export async function checkTrialStatus(userId: string): Promise<TrialStatus> {
  const supabase = createSupabaseClient();
  
  // Default trial status
  const defaultStatus: TrialStatus = {
    trialStartDate: null,
    trialEndDate: null,
    daysLeft: 0,
    isExpired: false,
    subscriptionStatus: 'none',
    subscriptionPlan: null
  };

  try {
    // Get user data from database
    const { data: userData, error } = await supabase
      .from('users')
      .select('trial_start_date, subscription_status, subscription_plan')
      .eq('id', userId)
      .single();

    if (error) throw error;

    // If no trial has started yet
    if (!userData.trial_start_date) {
      return defaultStatus;
    }

    // Calculate trial status
    const trialStartDate = new Date(userData.trial_start_date);
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setMonth(trialEndDate.getMonth() + 1); // 1 month trial
    
    const today = new Date();
    const daysLeft = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = today > trialEndDate;

    return {
      trialStartDate,
      trialEndDate,
      daysLeft,
      isExpired,
      subscriptionStatus: userData.subscription_status || 'trial',
      subscriptionPlan: userData.subscription_plan
    };
  } catch (error) {
    console.error('Error checking trial status:', error);
    return defaultStatus;
  }
}

export function formatTrialMessage(trialStatus: TrialStatus): string {
  if (trialStatus.subscriptionStatus === 'active') {
    return `You have an active ${trialStatus.subscriptionPlan} subscription.`;
  }
  
  if (!trialStatus.trialStartDate) {
    return 'You have not started your free trial yet.';
  }
  
  if (trialStatus.isExpired) {
    return 'Your free trial has expired. Please subscribe to continue using Lab2077.';
  }
  
  return `Your free trial expires in ${trialStatus.daysLeft} day${trialStatus.daysLeft !== 1 ? 's' : ''}.`;
}

export function shouldRedirectToSubscription(trialStatus: TrialStatus): boolean {
  // Redirect if trial is expired and no active subscription
  return trialStatus.isExpired && trialStatus.subscriptionStatus !== 'active';
}