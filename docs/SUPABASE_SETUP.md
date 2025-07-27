# Lab2077 Supabase Setup Guide

## Overview
This document provides a complete setup guide for the Lab2077 pathology lab management application using Supabase as the backend.

## Database Schema

### Core Tables

1. **users** - Lab information and subscription status
2. **test_templates** - PDF templates for different tests
3. **patients** - Patient information with unique registration numbers
4. **patient_tests** - Junction table linking patients to tests
5. **reports** - Generated test reports with results
6. **registration_slips** - Generated registration slips for patients

### Key Features

- **Row Level Security (RLS)** enabled on all tables
- **Auto-generated UUIDs** for primary keys
- **Foreign key constraints** for data integrity
- **Unique constraints** to prevent duplicates
- **Check constraints** for data validation
- **Automatic timestamps** with triggers

## Storage Buckets

### 1. test-templates (Private)
- Stores PDF test templates uploaded by users
- Path structure: `{user_id}/{filename}`
- Only accessible by the owning user

### 2. reports (Public)
- Stores generated report PDFs
- Path structure: `{user_id}/{report_id}_{timestamp}.pdf`
- Public read access for sharing via links

### 3. registration-slips (Public)
- Stores generated registration slip PDFs/images
- Path structure: `{user_id}/{patient_id}_{timestamp}.pdf`
- Public read access for sharing via links

## Edge Functions

### 1. auto-delete-reports
**Purpose**: Automatically delete completed reports after 6 days
**Schedule**: Run daily via cron job
**Actions**:
- Find reports completed > 6 days ago
- Delete PDF files from storage
- Remove database records

### 2. check-trial-status
**Purpose**: Check user trial and subscription status
**Usage**: Called by frontend to determine access permissions
**Returns**: Trial status, days left, subscription info

### 3. generate-registration-number
**Purpose**: Generate unique registration numbers (1-1000, cycling)
**Usage**: Called when registering new patients
**Logic**: 
- Check current patient count
- Prevent registration if limit (1000) reached
- Generate next available number

## Setup Instructions

### 1. Database Migration
Run the migration files in order:
```sql
-- Run each migration file in supabase/migrations/ folder
001_create_users_table.sql
002_create_test_templates_table.sql
003_create_patients_table.sql
004_create_patient_tests_table.sql
005_create_reports_table.sql
006_create_registration_slips_table.sql
007_create_storage_buckets.sql
```

### 2. Deploy Edge Functions
```bash
# Deploy auto-delete function
supabase functions deploy auto-delete-reports

# Deploy trial status checker
supabase functions deploy check-trial-status

# Deploy registration number generator
supabase functions deploy generate-registration-number
```

### 3. Set up Cron Jobs
Create a cron job to run auto-delete-reports daily:
```sql
-- In Supabase Dashboard > Database > Extensions
-- Enable pg_cron extension first

-- Schedule daily cleanup at 2 AM
SELECT cron.schedule(
  'auto-delete-reports',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/auto-delete-reports',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### 4. Environment Variables
Set up your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://frwgeyterhpmnaiarfif.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyd2dleXRlcmhwbW5haWFyZmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTA2MjEsImV4cCI6MjA2OTAyNjYyMX0.mBfSgc58HU_UOmKeY7WfF4A2kClj4eNUlGtv4F9yPf4
```

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies enforce user isolation

### Storage Security
- Private buckets for sensitive templates
- Public buckets for shareable content
- User-based folder structure

### Authentication
- Supabase Auth integration
- Google OAuth support
- Email/password authentication

## Business Logic

### Trial System
- 1-month free trial per user
- Dashboard access restricted after trial expires
- Subscription status tracking

### Registration Numbers
- Auto-generated from 1-1000
- Cycles back to 1 after reaching 1000
- Prevents duplicate registrations

### Report Auto-Deletion
- Completed reports deleted after 6 days
- Helps manage storage costs
- Automatic cleanup via cron job

## API Usage Examples

### Check Trial Status
```javascript
const response = await fetch('/api/functions/check-trial-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user-uuid' })
});
const { trialStatus } = await response.json();
```

### Generate Registration Number
```javascript
const response = await fetch('/api/functions/generate-registration-number', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user-uuid' })
});
const { registrationNumber } = await response.json();
```

## Monitoring and Maintenance

### Key Metrics to Monitor
- Storage usage (especially reports bucket)
- Number of active users
- Trial conversion rates
- Report generation frequency

### Regular Maintenance
- Monitor auto-deletion function logs
- Check storage bucket sizes
- Review RLS policy performance
- Update subscription statuses

## Troubleshooting

### Common Issues
1. **RLS Policy Errors**: Check user authentication and policy conditions
2. **Storage Upload Failures**: Verify bucket policies and file paths
3. **Function Timeouts**: Monitor function execution times
4. **Registration Number Conflicts**: Check unique constraints and generation logic

### Debug Queries
```sql
-- Check user trial status
SELECT id, email, trial_start_date, subscription_status 
FROM users 
WHERE id = 'user-uuid';

-- Check patient count per user
SELECT user_id, COUNT(*) as patient_count 
FROM patients 
GROUP BY user_id;

-- Check reports due for deletion
SELECT id, completed_at 
FROM reports 
WHERE status = 'completed' 
AND completed_at < NOW() - INTERVAL '6 days';
```