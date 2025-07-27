'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/utils/supabase';

type Report = {
  id: string;
  patient_id: string;
  test_id: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at?: string;
  report_url?: string;
  patient: {
    name: string;
    regd_no: string;
    age: number;
    sex: string;
    contact: string;
  };
  test: {
    test_name: string;
  };
};

export default function ViewReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareMethod, setShareMethod] = useState<'whatsapp' | 'email' | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createSupabaseClient();
  const reportId = params.id;

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch report details
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            patient:patients(*),
            test:tests(*)
          `)
          .eq('id', reportId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Report not found');

        // Check if user owns this report
        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to view this report');
        }

        // Check if report is completed
        if (data.status !== 'completed') {
          router.push(`/dashboard/reports/edit/${reportId}`);
          return;
        }

        setReport(data as unknown as Report);

      } catch (error: any) {
        console.error('Error fetching report:', error);
        setError(error.message || 'An error occurred while loading the report');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId, router, supabase]);

  const handleShare = async (method: 'whatsapp' | 'email') => {
    try {
      setSharing(true);
      setShareMethod(method);
      setShareSuccess(false);

      if (!report || !report.report_url) {
        throw new Error('Report URL not available');
      }

      const reportUrl = report.report_url;
      const patientName = report.patient.name;
      const testName = report.test.test_name;
      const message = `Lab2077 - ${testName} report for ${patientName}`;

      if (method === 'whatsapp') {
        // Format phone number (remove non-numeric characters)
        const phone = report.patient.contact.replace(/\D/g, '');
        if (!phone) throw new Error('Valid phone number not available');

        // Open WhatsApp with pre-filled message
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message + '\n\n' + reportUrl)}`;
        window.open(whatsappUrl, '_blank');
      } else if (method === 'email') {
        // Check if contact is an email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const contact = report.patient.contact;
        
        if (!emailRegex.test(contact)) {
          throw new Error('Valid email address not available');
        }

        // Open default email client with pre-filled message
        const emailUrl = `mailto:${contact}?subject=${encodeURIComponent(message)}&body=${encodeURIComponent('Please find your test report at:\n\n' + reportUrl)}`;
        window.location.href = emailUrl;
      }

      setShareSuccess(true);
    } catch (error: any) {
      console.error('Error sharing report:', error);
      setError(error.message || 'An error occurred while sharing the report');
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (report?.report_url) {
      window.open(report.report_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-700">{error}</p>
          <div className="mt-6">
            <Link
              href="/dashboard/reports"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Back to Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
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

      <div className="flex flex-1">
        <aside className="w-64 p-4 bg-indigo-800">
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-sm font-medium text-indigo-100 rounded-md hover:bg-indigo-700"
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
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-900 rounded-md"
            >
              <svg className="w-6 h-6 mr-3 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reports
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-gray-100">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                View Report: {report.test.test_name}
              </h1>
              <div>
                <Link
                  href="/dashboard/reports"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Reports
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {shareSuccess && (
            <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-md">
              Report shared successfully via {shareMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}!
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Report Preview</h2>
                
                {report.report_url ? (
                  <div className="border border-gray-300 rounded-md">
                    <iframe 
                      src={report.report_url} 
                      className="w-full h-[600px]"
                      title="Report Preview"
                    />
                  </div>
                ) : (
                  <div className="p-4 text-sm text-yellow-700 bg-yellow-100 rounded-md">
                    Report PDF not available
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!report.report_url}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Report
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleShare('whatsapp')}
                    disabled={sharing || !report.report_url}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mr-2 -ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share via WhatsApp
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleShare('email')}
                    disabled={sharing || !report.report_url}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Share via Email
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Report Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Patient Name</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration No</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.regd_no}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Age / Sex</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.age} / {report.patient.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.contact}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Test</p>
                    <p className="text-base font-medium text-gray-900">{report.test.test_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Report Status</p>
                    <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created Date</p>
                    <p className="text-base font-medium text-gray-900">{new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                  {report.completed_at && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Completed Date</p>
                      <p className="text-base font-medium text-gray-900">{new Date(report.completed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 mt-6 text-sm text-yellow-700 bg-yellow-100 rounded-md">
                  <p className="font-medium">Auto-deletion Notice:</p>
                  <p className="mt-1">
                    This report will be automatically deleted after 6 days from completion date.
                    Please download or share it with the patient before it is deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}