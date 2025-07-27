'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/utils/supabase';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type Test = {
  id: string;
  test_name: string;
  test_price: number;
};

type SelectedTest = Test & { selected: boolean };

export default function RegisterPatientPage() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [contact, setContact] = useState('');
  const [regdNo, setRegdNo] = useState('');
  const [tests, setTests] = useState<SelectedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  
  const router = useRouter();
  const supabase = createSupabaseClient();

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

        // Check if trial is active
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('trial_start_date, lab_name')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        if (!userData.trial_start_date) {
          router.push('/');
          return;
        }

        const trialStartDate = new Date(userData.trial_start_date);
        const trialEndDate = new Date(trialStartDate);
        trialEndDate.setMonth(trialEndDate.getMonth() + 1);

        if (new Date() > trialEndDate) {
          // Trial expired
          router.push('/subscription');
          return;
        }

        // Fetch available tests
        const { data: testsData, error: testsError } = await supabase
          .from('tests')
          .select('id, test_name, test_price')
          .eq('user_id', user.id);

        if (testsError) throw testsError;

        setTests(testsData.map((test: Test) => ({ ...test, selected: false })));

        // Generate registration number
        const { data: patientCount, error: countError } = await supabase
          .from('patients')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        if (countError) throw countError;

        const count = patientCount?.length || 0;
        const nextRegdNo = (count % 1000) + 1;
        setRegdNo(nextRegdNo.toString().padStart(4, '0'));

      } catch (error: any) {
        console.error('Error checking auth:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  useEffect(() => {
    // Calculate total cost whenever tests selection changes
    const total = tests
      .filter(test => test.selected)
      .reduce((sum, test) => sum + test.test_price, 0);
    
    setTotalCost(total);
  }, [tests]);

  const toggleTestSelection = (id: string) => {
    setTests(tests.map(test => 
      test.id === id ? { ...test, selected: !test.selected } : test
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);

      // Validate form
      if (!name.trim() || !age.trim() || !contact.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      const selectedTests = tests.filter(test => test.selected);
      if (selectedTests.length === 0) {
        setError('Please select at least one test');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Save patient to database
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name,
          age: parseInt(age),
          sex,
          contact,
          regd_no: regdNo,
          registration_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Save selected tests for this patient
      const patientTests = selectedTests.map(test => ({
        patient_id: patient.id,
        test_id: test.id,
        status: 'pending',
      }));

      const { error: testsError } = await supabase
        .from('patient_tests')
        .insert(patientTests);

      if (testsError) throw testsError;

      // Generate registration slip
      generateSlip();

      setSuccess(true);
      
      // Reset form
      setName('');
      setAge('');
      setSex('male');
      setContact('');
      setTests(tests.map(test => ({ ...test, selected: false })));

      // Generate new registration number
      const nextRegdNo = (parseInt(regdNo) % 1000) + 1;
      setRegdNo(nextRegdNo.toString().padStart(4, '0'));

    } catch (error: any) {
      console.error('Error registering patient:', error);
      setError(error.message || 'An error occurred while registering the patient');
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlip = () => {
    try {
      const doc = new jsPDF();
      const selectedTests = tests.filter(test => test.selected);
      
      // Add lab name
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Lab2077', 105, 20, { align: 'center' });
      
      // Add registration details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Registration Slip`, 105, 30, { align: 'center' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
      
      // Add patient details
      doc.setFontSize(10);
      doc.text(`Registration No: ${regdNo}`, 20, 60);
      doc.text(`Patient Name: ${name}`, 20, 70);
      doc.text(`Age: ${age}`, 20, 80);
      doc.text(`Sex: ${sex}`, 20, 90);
      doc.text(`Contact: ${contact}`, 20, 100);
      
      // Add tests table
      const tableColumn = ['Test Name', 'Price'];
      const tableRows = selectedTests.map(test => [
        test.test_name,
        `$${test.test_price.toFixed(2)}`,
      ]);
      
      // @ts-ignore - jspdf-autotable types are not properly recognized
      doc.autoTable({
        startY: 110,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [66, 66, 66] },
      });
      
      // Add total
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.text(`Total: $${totalCost.toFixed(2)}`, 150, finalY + 10, { align: 'right' });
      
      // Add footer
      doc.setFontSize(8);
      doc.text('This is a computer generated slip and does not require signature.', 105, 280, { align: 'center' });
      
      // Save the PDF
      doc.save(`Lab2077_Registration_${regdNo}.pdf`);
    } catch (error) {
      console.error('Error generating slip:', error);
      setError('Failed to generate registration slip');
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
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-900 rounded-md"
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
              <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
              <div>
                <Link
                  href="/dashboard/patients"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View All Patients
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
              Patient registered successfully! Registration slip has been generated.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="regdNo" className="block text-sm font-medium text-gray-700">
                      Registration No
                    </label>
                    <input
                      type="text"
                      id="regdNo"
                      value={regdNo}
                      readOnly
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                      Age *
                    </label>
                    <input
                      type="number"
                      id="age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      min="1"
                      max="150"
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                      Sex *
                    </label>
                    <select
                      id="sex"
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      required
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                      Phone/Email *
                    </label>
                    <input
                      type="text"
                      id="contact"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Phone number or email address"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Select Tests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select the tests to be performed for this patient
                  </p>

                  {tests.length === 0 ? (
                    <div className="p-4 mt-4 text-sm text-yellow-700 bg-yellow-100 rounded-md">
                      No test templates available. <Link href="/dashboard/tests/upload" className="font-medium underline">Upload test templates</Link> first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                      {tests.map((test) => (
                        <div key={test.id} className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`test-${test.id}`}
                              type="checkbox"
                              checked={test.selected}
                              onChange={() => toggleTestSelection(test.id)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor={`test-${test.id}`} className="font-medium text-gray-700">
                              {test.test_name}
                            </label>
                            <p className="text-gray-500">${test.test_price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 text-right">
                  <p className="mb-4 text-lg font-medium">
                    Total: ${totalCost.toFixed(2)}
                  </p>
                  <button
                    type="submit"
                    disabled={submitting || tests.length === 0 || !tests.some(test => test.selected)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? 'Registering...' : 'Register Patient & Generate Slip'}
                  </button>
                </div>
              </form>
            </div>

            <div>
              <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-lg font-medium text-gray-900">Registration Information</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Fill in the patient details and select the tests to be performed. A registration slip will be generated after submission.
                </p>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700">What happens next?</h3>
                  <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                    <li>Patient information will be saved in the database</li>
                    <li>A registration slip will be generated for download</li>
                    <li>You can share the slip via WhatsApp or Email</li>
                    <li>Test reports will be created and marked as pending</li>
                    <li>You can complete the reports later from the Reports section</li>
                  </ul>
                </div>

                <div className="p-4 mt-6 text-sm text-blue-700 bg-blue-100 rounded-md">
                  <p className="font-medium">Note:</p>
                  <p className="mt-1">
                    Registration numbers are automatically generated from 1 to 1000 and will reset after reaching 1000.
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