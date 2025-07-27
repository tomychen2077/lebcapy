/*
  # Create registration slips table

  1. New Tables
    - `registration_slips`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `patient_id` (uuid, foreign key to patients)
      - `slip_url` (text, for generated slip PDF/image)
      - `total_amount` (decimal)
      - `tests_included` (jsonb, array of test template IDs)
      - `shared_via` (text array, tracking sharing methods)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `registration_slips` table
    - Add policies for users to manage their own slips
*/

CREATE TABLE IF NOT EXISTS registration_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  slip_url text,
  total_amount decimal(10,2) NOT NULL DEFAULT 0.00,
  tests_included jsonb DEFAULT '[]'::jsonb,
  shared_via text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE registration_slips ENABLE ROW LEVEL SECURITY;

-- Users can manage their own registration slips
CREATE POLICY "Users can read own registration slips"
  ON registration_slips
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own registration slips"
  ON registration_slips
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own registration slips"
  ON registration_slips
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own registration slips"
  ON registration_slips
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registration_slips_user_id ON registration_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_slips_patient_id ON registration_slips(patient_id);
CREATE INDEX IF NOT EXISTS idx_registration_slips_created_at ON registration_slips(created_at);