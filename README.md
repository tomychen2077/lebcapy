# Lab2077 - Pathology Lab Management App

## Overview

Lab2077 is a comprehensive pathology lab management application built with Next.js and Supabase. It helps pathology labs manage test templates, patient registrations, and report generation with an easy-to-use interface.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **User Authentication**: Email/password and Google OAuth login
- **Trial System**: 1-month free trial with subscription options
- **Lab Setup**: Configure your lab name and details
- **Test Template Management**: Upload and manage PDF test templates
- **PDF Editor**: Add placeholders to test templates
- **Patient Registration**: Register patients and select tests
- **Report Generation**: Generate and manage patient test reports
- **Sharing Options**: Share reports via WhatsApp or email
- **Auto-deletion**: Automatic cleanup of old reports

## Tech Stack

- **Frontend**: Next.js (React) with App Router
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Tailwind CSS
- **PDF Processing**: PDF.js, jsPDF
- **Messaging**: WhatsApp API, EmailJS
- **Payments**: Stripe integration

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/lab2077.git
cd lab2077
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Schema

### Users Table

```sql
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  lab_name text,
  trial_start_date timestamp with time zone,
  subscription_status text default 'trial',
  subscription_plan text,
  subscription_start_date timestamp with time zone,
  created_at timestamp with time zone default now()
);
```

### Tests Table

```sql
create table public.tests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  test_name text not null,
  test_price decimal(10,2) not null,
  pdf_url text not null,
  placeholders jsonb,
  created_at timestamp with time zone default now()
);
```

### Patients Table

```sql
create table public.patients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  name text not null,
  age integer,
  sex text,
  contact text,
  registration_number integer not null,
  created_at timestamp with time zone default now()
);
```

### Reports Table

```sql
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users not null,
  patient_id uuid references public.patients not null,
  test_id uuid references public.tests not null,
  status text default 'pending',
  pdf_url text,
  results jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Scheduled Functions

The application includes a Supabase Edge Function that automatically deletes completed reports after 6 days. This function is located in `supabase/functions/auto-delete-reports/index.ts`.

To deploy this function to your Supabase project:

```bash
npx supabase functions deploy auto-delete-reports
```

Then set up a scheduled task in Supabase to run this function daily.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Leb2077
