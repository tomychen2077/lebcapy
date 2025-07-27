'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/utils/supabase';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [trialInfo, setTrialInfo] = useState<{
    trialStartDate: Date | null;
    trialEndDate: Date | null;
    daysLeft: number;
    isExpired: boolean;
  }>({ trialStartDate: null, trialEndDate: null, daysLeft: 0, isExpired: false });
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createSupabaseClient();

  // Subscription plans
  const plans = [
    {
      name: 'Monthly',
      price: 19.99,
      features: [
        'Unlimited test templates',
        'Unlimited patient registrations',
        'PDF report generation',
        'WhatsApp & Email sharing',
        'Basic support',
      ],
      recommended: false,
      period: 'month',
    },
    {
      name: 'Yearly',
      price: 199.99,
      features: [
        'All Monthly features',
        'Priority support',
        'Advanced analytics',
        'Bulk report generation',
        'Save 17% compared to monthly',
      ],
      recommended: true,
      period: 'year',
    },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);

        // Check trial status
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('trial_start_date, subscription_status')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        // Check if subscription is active
        if (userData.subscription_status === 'active') {
          setSubscriptionActive(true);
          router.push('/dashboard');
          return;
        }

        // Calculate trial status
        if (userData.trial_start_date) {
          const trialStartDate = new Date(userData.trial_start_date);
          const trialEndDate = new Date(trialStartDate);
          trialEndDate.setMonth(trialEndDate.getMonth() + 1);
          
          const today = new Date();
          const daysLeft = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = today > trialEndDate;

          setTrialInfo({
            trialStartDate,
            trialEndDate,
            daysLeft,
            isExpired,
          });
        } else {
          // No trial started yet
          router.push('/');
          return;
        }

      } catch (error: any) {
        console.error('Error checking auth:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleSubscribe = async (planName: string) => {
    try {
      setProcessingPayment(true);
      setError(null);

      // In a real implementation, this would integrate with Stripe or EasyPaisa
      // For this demo, we'll simulate a successful payment after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update subscription status in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_plan: planName,
          subscription_start_date: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error processing subscription:', error);
      setError(error.message || 'An error occurred while processing your subscription');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container flex items-center justify-between px-4 py-4 mx-auto">
          <h1 className="text-2xl font-bold text-indigo-600">Lab2077</h1>
          <div>
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {trialInfo.isExpired ? 'Your Trial Has Expired' : 'Your Trial is Ending Soon'}
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              {trialInfo.isExpired
                ? 'Subscribe now to continue using Lab2077'
                : `You have ${trialInfo.daysLeft} days left in your trial. Subscribe now to avoid interruption.`}
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-md">
              Subscription activated successfully! Redirecting to dashboard...
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 mt-12 lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-6 bg-white rounded-lg shadow-md ${plan.recommended ? 'border-2 border-indigo-500' : 'border border-gray-200'}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 px-3 py-1 text-xs font-medium tracking-wide text-white transform -translate-y-1/2 bg-indigo-500 rounded-full">
                    RECOMMENDED
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <p className="flex items-baseline mt-4 text-gray-900">
                    <span className="text-5xl font-extrabold tracking-tight">${plan.price}</span>
                    <span className="ml-1 text-xl font-semibold">/{plan.period}</span>
                  </p>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex">
                        <svg className="flex-shrink-0 w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="ml-3 text-base text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => handleSubscribe(plan.name.toLowerCase())}
                    disabled={processingPayment}
                    className={`w-full px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${processingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {processingPayment ? 'Processing...' : `Subscribe ${plan.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-gray-900">Subscription FAQ</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-base font-medium text-gray-900">What happens after I subscribe?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You'll get immediate access to all features of Lab2077. Your subscription will automatically renew at the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">Can I cancel my subscription?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">Is there a refund policy?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  We offer a 14-day money-back guarantee if you're not satisfied with our service.
                </p>
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">How do I get support?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You can reach our support team at support@lab2077.com or through the in-app chat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}