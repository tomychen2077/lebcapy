'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/utils/supabase';
import { PDFDocument, rgb } from 'pdf-lib';

type Report = {
  id: string;
  patient_id: string;
  test_id: string;
  status: 'pending' | 'completed';
  created_at: string;
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
    pdf_url: string;
    placeholders: any[];
  };
};

export default function EditReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
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
          throw new Error('You do not have permission to edit this report');
        }

        // Check if report is already completed
        if (data.status === 'completed') {
          router.push(`/dashboard/reports/view/${reportId}`);
          return;
        }

        setReport(data as unknown as Report);

        // Initialize test results with empty values
        if (data.test.placeholders && data.test.placeholders.length > 0) {
          const initialResults: Record<string, string> = {};
          data.test.placeholders.forEach((placeholder: any) => {
            // Skip patient info placeholders as they'll be filled automatically
            if (!['{{name}}', '{{age}}', '{{sex}}', '{{date}}', '{{regd_no}}'].includes(placeholder.text)) {
              initialResults[placeholder.text] = '';
            }
          });
          setTestResults(initialResults);
        }

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

  const handleInputChange = (placeholder: string, value: string) => {
    setTestResults(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  const generateReport = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!report) return;

      // Download the template PDF
      const templateResponse = await fetch(report.test.pdf_url);
      const templateBytes = await templateResponse.arrayBuffer();
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(templateBytes);
      
      // Get the first page
      const pages = pdfDoc.getPages();
      
      // Fill in patient information placeholders
      for (const page of pages) {
        const { width, height } = page.getSize();
        
        // Add patient information
        if (report.test.placeholders && report.test.placeholders.length > 0) {
          for (const placeholder of report.test.placeholders) {
            let text = '';
            
            // Replace standard placeholders with patient info
            if (placeholder.text === '{{name}}') {
              text = report.patient.name;
            } else if (placeholder.text === '{{age}}') {
              text = report.patient.age.toString();
            } else if (placeholder.text === '{{sex}}') {
              text = report.patient.sex;
            } else if (placeholder.text === '{{date}}') {
              text = new Date().toLocaleDateString();
            } else if (placeholder.text === '{{regd_no}}') {
              text = report.patient.regd_no;
            } else {
              // Use the test result value for custom placeholders
              text = testResults[placeholder.text] || '';
            }
            
            // Only add text to the correct page
            if (placeholder.page === pages.indexOf(page) + 1) {
              page.drawText(text, {
                x: placeholder.x,
                y: height - placeholder.y, // PDF coordinates start from bottom
                size: 12,
                color: rgb(0, 0, 0),
              });
            }
          }
        }
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Convert to Blob
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Upload to Supabase Storage
      const fileName = `report_${report.id}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

      const reportUrl = urlData.publicUrl;
      
      // Update report status in database
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          report_url: reportUrl,
          test_results: testResults
        })
        .eq('id', report.id);

      if (updateError) throw updateError;
      
      setSuccess(true);
      
      // Redirect to view page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/reports/view/${report.id}`);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error generating report:', error);
      setError(error.message || 'An error occurred while generating the report');
    } finally {
      setSubmitting(false);
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
                Complete Report: {report.test.test_name}
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

          {success && (
            <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-md">
              Report completed successfully! Redirecting to view page...
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Patient Information</h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Patient Name</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration No</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.regd_no}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Age</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.age}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sex</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact</p>
                    <p className="text-base font-medium text-gray-900">{report.patient.contact}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registration Date</p>
                    <p className="text-base font-medium text-gray-900">{new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="mb-4 text-lg font-medium text-gray-900">Test Results</h2>
                  
                  {Object.keys(testResults).length === 0 ? (
                    <div className="p-4 text-sm text-yellow-700 bg-yellow-100 rounded-md">
                      No custom placeholders found in this test template. You can complete the report directly.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(testResults).map(([placeholder, value]) => (
                        <div key={placeholder}>
                          <label htmlFor={placeholder} className="block text-sm font-medium text-gray-700">
                            {placeholder.replace(/[{}]/g, '')}
                          </label>
                          <input
                            type="text"
                            id={placeholder}
                            value={value}
                            onChange={(e) => handleInputChange(placeholder, e.target.value)}
                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={generateReport}
                    disabled={submitting}
                    className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? 'Generating Report...' : 'Complete Report'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Template Preview</h2>
                
                {report.test.pdf_url ? (
                  <div className="border border-gray-300 rounded-md">
                    <iframe 
                      src={report.test.pdf_url} 
                      className="w-full h-[500px]"
                      title="PDF Preview"
                    />
                  </div>
                ) : (
                  <div className="p-4 text-sm text-yellow-700 bg-yellow-100 rounded-md">
                    No template preview available
                  </div>
                )}

                <div className="mt-4 text-sm text-gray-500">
                  <p>This is the template that will be used to generate the final report.</p>
                  <p className="mt-2">Patient information will be automatically filled in.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}