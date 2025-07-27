/*
  # Create test templates table

  1. New Tables
    - `test_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `test_name` (text, not null)
      - `test_price` (decimal)
      - `description` (text)
      - `pdf_url` (text, not null)
      - `original_filename` (text)
      - `placeholders` (jsonb, for storing placeholder positions)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `test_templates` table
    - Add policies for users to manage their own test templates
*/

CREATE TABLE IF NOT EXISTS test_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_name text NOT NULL,
  test_price decimal(10,2) NOT NULL DEFAULT 0.00,
  description text DEFAULT '',
  pdf_url text NOT NULL,
  original_filename text,
  placeholders jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;

-- Users can manage their own test templates
CREATE POLICY "Users can read own test templates"
  ON test_templates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own test templates"
  ON test_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own test templates"
  ON test_templates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own test templates"
  ON test_templates
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_test_templates_updated_at
  BEFORE UPDATE ON test_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_test_templates_user_id ON test_templates(user_id);