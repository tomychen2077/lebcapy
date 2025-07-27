/*
  # Create patients table

  1. New Tables
    - `patients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, not null)
      - `age` (integer, not null)
      - `sex` (text, not null)
      - `contact` (text, not null) - phone or email
      - `regd_no` (text, not null) - registration number
      - `registration_date` (timestamptz, default now())
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `patients` table
    - Add policies for users to manage their own patients
    - Add unique constraint on user_id + regd_no
*/

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age <= 150),
  sex text NOT NULL CHECK (sex IN ('male', 'female', 'other')),
  contact text NOT NULL,
  regd_no text NOT NULL,
  registration_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique registration numbers per user
  UNIQUE(user_id, regd_no)
);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Users can manage their own patients
CREATE POLICY "Users can read own patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own patients"
  ON patients
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_regd_no ON patients(user_id, regd_no);
CREATE INDEX IF NOT EXISTS idx_patients_registration_date ON patients(registration_date);