'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { trialStatus, loading: trialLoading } = useTrialStatus(user?.id, {
    redirectIfExpired: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && !trialLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading, trialLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
          <Sidebar />
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Dashboard Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                {trialStatus && !trialStatus.hasActiveSubscription && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      {trialStatus.isExpired
                        ? 'Your trial has expired. Please subscribe to continue using Lab2077.'
                        : `Your trial expires in ${trialStatus.daysLeft} days. Consider upgrading to a paid plan.`}
                    </p>
                  </div>
                )}
              </div>

              {/* Dashboard Content */}
              <div className="bg-white shadow rounded-lg p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}