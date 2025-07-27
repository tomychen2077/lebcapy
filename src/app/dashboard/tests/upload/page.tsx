'use client';

import { useState } from 'react';
import { createSupabaseClient } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UploadTestTemplatePage() {
  const [testName, setTestName] = useState('');
  const [testPrice, setTestPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testName.trim() || !testPrice.trim() || !file) {
      setError('Please fill in all fields and upload a PDF file');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to Supabase Storage
      const fileName = `${user.id}_${Date.now()}_${file.name}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('test_templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('test_templates')
        .getPublicUrl(fileName);

      // Save test info to database
      const { error: dbError } = await supabase
        .from('tests')
        .insert({
          user_id: user.id,
          test_name: testName,
          test_price: parseFloat(testPrice),
          pdf_url: publicUrl,
          original_filename: file.name,
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setTestName('');
      setTestPrice('');
      setFile(null);

      // Reset form
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/tests');
      }, 2000);

    } catch (error: any) {
      console.error('Error uploading test template:', error);
      setError(error.message || 'An error occurred while uploading the test template');
    } finally {
      setUploading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Upload Test Template</h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload a PDF template for a test and set its price. You'll be able to edit the template and add placeholders in the next step.
            </p>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 mb-6 text-sm text-green-700 bg-green-100 rounded-md">
              Test template uploaded successfully! Redirecting...
            </div>
          )}

          <div className="p-6 bg-white rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
                <div>
                  <label htmlFor="testName" className="block text-sm font-medium text-gray-700">
                    Test Name
                  </label>
                  <input
                    type="text"
                    id="testName"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Complete Blood Count"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="testPrice" className="block text-sm font-medium text-gray-700">
                    Test Price
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="testPrice"
                      value={testPrice}
                      onChange={(e) => setTestPrice(e.target.value)}
                      className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  PDF Template
                </label>
                <div className="flex justify-center px-6 pt-5 pb-6 mt-1 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative font-medium text-indigo-600 bg-white rounded-md cursor-pointer hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="application/pdf"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    {file && (
                      <p className="text-sm text-indigo-600">
                        Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/dashboard/tests"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex justify-center px-4 py-2 ml-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Template'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}