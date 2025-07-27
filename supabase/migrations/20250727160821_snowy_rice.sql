/*
  # Create patient tests junction table

  1. New Tables
    - `patient_tests`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `test_template_id` (uuid, foreign key to test_templates)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `patient_tests` table
    - Add policies for users to manage tests for their patients
*/

CREATE TABLE IF NOT EXISTS patient_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_template_id uuid NOT NULL REFERENCES test_templates(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate test assignments
  UNIQUE(patient_id, test_template_id)
);

-- Enable RLS
ALTER TABLE patient_tests ENABLE ROW LEVEL SECURITY;

-- Users can manage tests for their own patients
CREATE POLICY "Users can read own patient tests"
  ON patient_tests
  FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own patient tests"
  ON patient_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    ) AND
    test_template_id IN (
      SELECT id FROM test_templates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own patient tests"
  ON patient_tests
  FOR UPDATE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own patient tests"
  ON patient_tests
  FOR DELETE
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_tests_patient_id ON patient_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_tests_test_template_id ON patient_tests(test_template_id);
CREATE INDEX IF NOT EXISTS idx_patient_tests_status ON patient_tests(status);