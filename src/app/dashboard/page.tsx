'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface DashboardStats {
  totalTests: number;
  totalPatients: number;
  pendingReports: number;
  completedReports: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [labName, setLabName] = useState<string | null>(null);
  const [showLabNameForm, setShowLabNameForm] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [trialInfo, setTrialInfo] = useState<{ start_date: string; days_left: number } | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTests: 0,
    totalPatients: 0,
    pendingReports: 0,
    completedReports: 0
  });
  const router = useRouter();
  const supabase = createSupabaseClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        router.push('/login');
        return;
      }

      setUser(data.user);

      // Check if user has a trial_start_date
      const { data: userData, error } = await supabase
        .from('users')
        .select('trial_start_date, lab_name')
        .eq('id', data.user.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (!userData?.trial_start_date) {
        // No trial started yet, redirect to home
        router.push('/');
        return;
      }

      // Calculate days left in trial
      const trialStartDate = new Date(userData.trial_start_date);
      const currentDate = new Date();
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setMonth(trialEndDate.getMonth() + 1); // 1 month trial
      
      const daysLeft = Math.ceil((trialEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      setTrialInfo({
        start_date: userData.trial_start_date,
        days_left: daysLeft
      });

      // Check if lab name exists
      if (userData?.lab_name) {
        setLabName(userData.lab_name);
      } else {
        setShowLabNameForm(true);
      }

      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  const handleLabNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLabName.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ lab_name: newLabName })
        .eq('id', user.id);

      if (error) throw error;

      setLabName(newLabName);
      setShowLabNameForm(false);
    } catch (error) {
      console.error('Error updating lab name:', error);
    }
  };

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;
      
      try {
        // Fetch total patients
        const { count: patientsCount, error: patientsError } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (patientsError) throw patientsError;
        
        // Fetch total tests
        const { count: testsCount, error: testsError } = await supabase
          .from('test_templates')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (testsError) throw testsError;
        
        // Fetch reports and count by status
        const { data: reports, error: reportsError } = await supabase
          .from('reports')
          .select('status')
          .eq('user_id', user.id);
          
        if (reportsError) throw reportsError;
        
        const pendingReports = reports?.filter(report => report.status === 'pending').length || 0;
        const completedReports = reports?.filter(report => report.status === 'completed').length || 0;
        
        setStats({
          totalPatients: patientsCount || 0,
          totalTests: testsCount || 0,
          pendingReports,
          completedReports
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    
    if (user) {
      fetchDashboardStats();
    }
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" message="Loading dashboard..." />
      </div>
    );
  }

  if (showLabNameForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome to Lab2077</h1>
            <p className="mt-2 text-gray-600">
              Please set up your lab name to continue
            </p>
          </div>

          <form onSubmit={handleLabNameSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="labName" className="block text-sm font-medium text-gray-700">
                Lab Name
              </label>
              <input
                id="labName"
                name="labName"
                type="text"
                required
                value={newLabName}
                onChange={(e) => setNewLabName(e.target.value)}
                className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save and Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="container flex items-center justify-between px-4 py-4 mx-auto">
          <h1 className="text-2xl font-bold text-indigo-600">{labName || 'Lab2077'}</h1>
          <div className="flex items-center space-x-4">
            {trialInfo && trialInfo.days_left > 0 && (
              <div className="px-3 py-1 text-sm text-yellow-800 bg-yellow-100 rounded-full">
                Trial: {trialInfo.days_left} days left
              </div>
            )}
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 p-4 bg-indigo-800">
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-900 rounded-md"
            >
              <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link
              href="/dashboard/tests"
              className="flex items-center px-3 py-2 text-sm font-medium text-indigo-100 rounded-md hover:bg-indigo-700"
            >
              <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Test Templates
            </Link>
            <Link
              href="/dashboard/patients"
              className="flex items-center px-3 py-2 text-sm font-medium text-indigo-100 rounded-md hover:bg-indigo-700"
            >
              <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Patients
            </Link>
            <Link
              href="/dashboard/reports"
              className="flex items-center px-3 py-2 text-sm font-medium text-indigo-100 rounded-md hover:bg-indigo-700"
            >
              <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reports
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-gray-100">
          <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-md">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 ml-4">
                  <h2 className="text-sm font-medium text-gray-900">Total Patients</h2>
                  <p className="text-2xl font-semibold text-gray-700">{stats.totalPatients}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-md">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 ml-4">
                  <h2 className="text-sm font-medium text-gray-900">Test Templates</h2>
                  <p className="text-2xl font-semibold text-gray-700">{stats.totalTests}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-md">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 ml-4">
                  <h2 className="text-sm font-medium text-gray-900">Pending Reports</h2>
                  <p className="text-2xl font-semibold text-gray-700">{stats.pendingReports}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-md">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1 ml-4">
                  <h2 className="text-sm font-medium text-gray-900">Completed Reports</h2>
                  <p className="text-2xl font-semibold text-gray-700">{stats.completedReports}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/dashboard/patients/register"
                className="flex items-center p-4 transition-colors border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200"
              >
                <svg className="w-6 h-6 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900">Register New Patient</h3>
                  <p className="text-sm text-gray-500">Add a new patient and generate a registration slip</p>
                </div>
              </Link>

              <Link
                href="/dashboard/tests/upload"
                className="flex items-center p-4 transition-colors border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200"
              >
                <svg className="w-6 h-6 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900">Upload Test Template</h3>
                  <p className="text-sm text-gray-500">Create a new test template with placeholders</p>
                </div>
              </Link>

              <Link
                href="/dashboard/reports/pending"
                className="flex items-center p-4 transition-colors border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200"
              >
                <svg className="w-6 h-6 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <div>
                  <h3 className="font-medium text-gray-900">Complete Pending Reports</h3>
                  <p className="text-sm text-gray-500">Fill in test results and finalize reports</p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}