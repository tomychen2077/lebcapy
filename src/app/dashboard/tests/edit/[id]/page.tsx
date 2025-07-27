'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';

type Placeholder = {
  id: string;
  text: string;
  x: number;
  y: number;
  page: number;
};

export default function EditTestTemplatePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createSupabaseClient();
  const testId = params.id;

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Fetch test details
        const { data, error } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Test not found');

        // Check if user owns this test
        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to edit this test');
        }

        setTest(data);
        setPdfUrl(data.pdf_url);

        // Fetch existing placeholders if any
        if (data.placeholders) {
          setPlaceholders(data.placeholders);
        }

        // Load PDF document
        const response = await fetch(data.pdf_url);
        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(new Uint8Array(pdfBytes));
        
        setPdfBytes(new Uint8Array(pdfBytes));
        setNumPages(pdfDoc.getPageCount());

      } catch (error: any) {
        console.error('Error fetching test:', error);
        setError(error.message || 'An error occurred while loading the test template');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTest();
    }
  }, [testId, router, supabase]);

  const addPlaceholder = () => {
    if (!newPlaceholder.trim()) return;

    // Check if placeholder is valid
    if (!newPlaceholder.startsWith('{{') || !newPlaceholder.endsWith('}}')) {
      setError('Placeholder must be in the format {{placeholder_name}}');
      return;
    }

    const newId = `placeholder_${Date.now()}`;
    const newPlaceholderObj: Placeholder = {
      id: newId,
      text: newPlaceholder,
      x: 100, // Default position
      y: 100, // Default position
      page: currentPage,
    };

    setPlaceholders([...placeholders, newPlaceholderObj]);
    setNewPlaceholder('');
    setError(null);
  };

  const removePlaceholder = (id: string) => {
    setPlaceholders(placeholders.filter(p => p.id !== id));
  };

  const updatePlaceholderPosition = (id: string, x: number, y: number) => {
    setPlaceholders(
      placeholders.map(p => (p.id === id ? { ...p, x, y } : p))
    );
  };

  const savePlaceholders = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update test with placeholders
      const { error } = await supabase
        .from('tests')
        .update({ placeholders })
        .eq('id', testId);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving placeholders:', error);
      setError(error.message || 'An error occurred while saving placeholders');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="mb-4 text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-700">{error}</p>
          <div className="mt-6">
            <Link
              href="/dashboard/tests"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Back to Tests
            </Link>
          </div>
        </div>
      </div>
    );
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
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-900 rounded-md"
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
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Test Template: {test?.test_name}
              </h1>
              <div>
                <Link
                  href="/dashboard/tests"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Tests
                </Link>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Add placeholders to your PDF template. Available placeholders: {{name}}, {{age}}, {{sex}}, {{date}}, {{regd_no}}
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-md">
              Placeholders saved successfully!
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="p-4 bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">PDF Preview</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1 text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {numPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
                      disabled={currentPage === numPages}
                      className="p-1 text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="relative border border-gray-300 rounded-md">
                  {pdfUrl && (
                    <div className="relative w-full h-[600px] overflow-auto">
                      <iframe 
                        src={`${pdfUrl}#page=${currentPage}`} 
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                      
                      {/* Placeholder overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {placeholders
                          .filter(p => p.page === currentPage)
                          .map(placeholder => (
                            <div
                              key={placeholder.id}
                              className="absolute px-2 py-1 text-sm bg-yellow-200 border border-yellow-400 rounded cursor-move"
                              style={{ left: `${placeholder.x}px`, top: `${placeholder.y}px` }}
                              // In a real implementation, you'd add drag handlers here
                            >
                              {placeholder.text}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="p-4 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Add Placeholders</h2>
                
                <div className="mb-4">
                  <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700">
                    Placeholder
                  </label>
                  <div className="flex mt-1">
                    <input
                      type="text"
                      id="placeholder"
                      value={newPlaceholder}
                      onChange={(e) => setNewPlaceholder(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="{{name}}"
                    />
                    <button
                      type="button"
                      onClick={addPlaceholder}
                      className="inline-flex items-center px-3 py-2 ml-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Format: {{placeholder_name}}
                  </p>
                </div>

                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-700">Available Placeholders</h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setNewPlaceholder('{{name}}')}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                    >
                      {{name}}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPlaceholder('{{age}}')}
                      className="inline-flex items-center px-2 py-1 ml-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                    >
                      {{age}}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPlaceholder('{{sex}}')}
                      className="inline-flex items-center px-2 py-1 ml-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                    >
                      {{sex}}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPlaceholder('{{date}}')}
                      className="inline-flex items-center px-2 py-1 ml-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                    >
                      {{date}}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPlaceholder('{{regd_no}}')}
                      className="inline-flex items-center px-2 py-1 ml-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                    >
                      {{regd_no}}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-700">Current Placeholders</h3>
                  {placeholders.length === 0 ? (
                    <p className="text-sm text-gray-500">No placeholders added yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {placeholders.map(placeholder => (
                        <li key={placeholder.id} className="flex items-center justify-between p-2 text-sm bg-gray-50 rounded-md">
                          <span>
                            {placeholder.text} (Page {placeholder.page})
                          </span>
                          <button
                            type="button"
                            onClick={() => removePlaceholder(placeholder.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={savePlaceholders}
                    disabled={saving}
                    className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Placeholders'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}