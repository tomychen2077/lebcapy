'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);

      if (data.user) {
        // Check if user has a trial_start_date
        const { data: userData, error } = await supabase
          .from('users')
          .select('trial_start_date')
          .eq('id', data.user.id)
          .single();

        if (!error && userData?.trial_start_date) {
          router.push('/dashboard');
        }
      }
    };

    checkUser();
  }, [router, supabase]);

  const startFreeTrial = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Set trial_start_date to current date
      const { error } = await supabase
        .from('users')
        .update({ trial_start_date: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error starting trial:', error);
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
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container flex items-center justify-between px-4 py-4 mx-auto">
          <h1 className="text-2xl font-bold text-indigo-600">Lab2077</h1>
          <div>
            {user ? (
              <button
                onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center flex-1 px-4 py-12 bg-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Lab2077</span>
            <span className="block text-indigo-600">Modern Pathology Lab Management</span>
          </h1>
          <p className="max-w-md mx-auto mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your pathology lab operations with our comprehensive management solution.
            From patient registration to report generation, we've got you covered.
          </p>
          <div className="mt-10 sm:flex sm:justify-center">
            <div className="rounded-md shadow">
              <button
                onClick={startFreeTrial}
                className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>

        <div className="grid max-w-5xl grid-cols-1 gap-8 mt-20 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-indigo-100 rounded-md">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-center text-gray-900">Patient Management</h3>
            <p className="text-sm text-center text-gray-500">
              Easily register patients, generate unique IDs, and maintain comprehensive records.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-indigo-100 rounded-md">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-center text-gray-900">Test Templates</h3>
            <p className="text-sm text-center text-gray-500">
              Create and customize test templates with placeholders for patient information.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-indigo-100 rounded-md">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-center text-gray-900">Report Generation</h3>
            <p className="text-sm text-center text-gray-500">
              Generate professional reports with automated patient data insertion and easy sharing options.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 bg-gray-800">
        <div className="container px-4 mx-auto">
          <p className="text-sm text-center text-gray-400">
            &copy; {new Date().getFullYear()} Lab2077. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
