/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `patient_id` (uuid, foreign key to patients)
      - `test_template_id` (uuid, foreign key to test_templates)
      - `patient_test_id` (uuid, foreign key to patient_tests)
      - `status` (text, default 'pending')
      - `results` (jsonb, for storing test results)
      - `pdf_url` (text, for completed report PDF)
      - `created_at` (timestamptz, default now())
      - `completed_at` (timestamptz)
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `reports` table
    - Add policies for users to manage their own reports
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_template_id uuid NOT NULL REFERENCES test_templates(id) ON DELETE CASCADE,
  patient_test_id uuid NOT NULL REFERENCES patient_tests(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  results jsonb DEFAULT '{}'::jsonb,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one report per patient test
  UNIQUE(patient_test_id)
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can manage their own reports
CREATE POLICY "Users can read own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_reports_completed_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_completed_at ON reports(completed_at) WHERE completed_at IS NOT NULL;