-- ==============================================================================
-- SUPABASE SQL SCHEMA FOR ENGLISH JOIN INDONESIA
-- ==============================================================================
-- Run this script in the Supabase Dashboard -> SQL Editor -> New Query -> Run
-- This script configures:
-- 1. Helper function for updated_at timestamps
-- 2. Projects table (User-isolated study goals & targets with RLS)
-- 3. Student Registrations table (Student test registrations, payments, scores)
-- 4. Test History Records table (Completed CBT simulation test attempts & certificates)
-- 5. Programs table (Course offerings & test packages)
-- 6. Mentors table (Teacher & coach profiles)
-- ==============================================================================

-- 1. Timestamp auto-update trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- TABLE 1: projects (User Study Goals & Personal Projects)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);


-- ==============================================================================
-- TABLE 2: student_registrations (Participant Records & Scores)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_registrations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  program_name TEXT NOT NULL,
  registration_date TEXT NOT NULL DEFAULT 'Hari ini',
  test_score INTEGER,
  listening_score INTEGER,
  structure_score INTEGER,
  reading_score INTEGER,
  payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid', 'Pending', 'Installment')),
  status TEXT NOT NULL DEFAULT 'Belum Mulai',
  certificate_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read student registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Users can insert student registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Users can update student registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Users can delete student registrations" ON public.student_registrations;

-- RLS Policies (allows authenticated user to manage records, or admin access)
CREATE POLICY "Users can read student registrations"
  ON public.student_registrations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert student registrations"
  ON public.student_registrations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update student registrations"
  ON public.student_registrations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete student registrations"
  ON public.student_registrations FOR DELETE
  USING (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trigger_student_registrations_updated_at ON public.student_registrations;
CREATE TRIGGER trigger_student_registrations_updated_at
  BEFORE UPDATE ON public.student_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_student_registrations_user_id ON public.student_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_student_registrations_created_at ON public.student_registrations(created_at DESC);


-- ==============================================================================
-- TABLE 3: test_history_records (CBT Simulation Exam History & Certificates)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.test_history_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  student_name TEXT NOT NULL,
  test_title TEXT NOT NULL,
  test_type TEXT NOT NULL,
  date TEXT NOT NULL,
  listening_score INTEGER NOT NULL DEFAULT 0,
  structure_score INTEGER NOT NULL DEFAULT 0,
  reading_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 677,
  status TEXT NOT NULL DEFAULT 'Passed',
  cert_number TEXT,
  cert_issue_date TEXT,
  level_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.test_history_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own test history" ON public.test_history_records;
DROP POLICY IF EXISTS "Users can insert own test history" ON public.test_history_records;
DROP POLICY IF EXISTS "Users can update own test history" ON public.test_history_records;
DROP POLICY IF EXISTS "Users can delete own test history" ON public.test_history_records;

CREATE POLICY "Users can view own test history"
  ON public.test_history_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test history"
  ON public.test_history_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test history"
  ON public.test_history_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own test history"
  ON public.test_history_records FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_test_history_updated_at ON public.test_history_records;
CREATE TRIGGER trigger_test_history_updated_at
  BEFORE UPDATE ON public.test_history_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_test_history_user_id ON public.test_history_records(user_id);
CREATE INDEX IF NOT EXISTS idx_test_history_created_at ON public.test_history_records(created_at DESC);


-- ==============================================================================
-- TABLE 4: programs (English Join Course & Test Programs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.programs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  tag TEXT,
  level TEXT,
  duration TEXT,
  session_count TEXT,
  price_formatted TEXT,
  original_price TEXT,
  score_target TEXT,
  description TEXT,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active programs" ON public.programs;
DROP POLICY IF EXISTS "Authenticated users can manage programs" ON public.programs;

-- Public can view active programs
CREATE POLICY "Public can view active programs"
  ON public.programs FOR SELECT
  USING (true);

-- Authenticated staff/admins can insert, update, delete
CREATE POLICY "Authenticated users can manage programs"
  ON public.programs FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trigger_programs_updated_at ON public.programs;
CREATE TRIGGER trigger_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- TABLE 5: mentors (Instructors & Tutors)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mentors (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  experience TEXT NOT NULL,
  badge TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  bio TEXT NOT NULL,
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active mentors" ON public.mentors;
DROP POLICY IF EXISTS "Authenticated users can manage mentors" ON public.mentors;

CREATE POLICY "Public can view active mentors"
  ON public.mentors FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage mentors"
  ON public.mentors FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trigger_mentors_updated_at ON public.mentors;
CREATE TRIGGER trigger_mentors_updated_at
  BEFORE UPDATE ON public.mentors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- STORAGE: Bucket 'app-files' & User-Folder RLS Policies
-- ==============================================================================
-- Automatically ensures bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-files', 'app-files', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- 1. SELECT: Users can view own files in their user_id folder
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-files'
  AND name LIKE (auth.uid()::text || '/%')
);

-- 2. INSERT: Users can upload only to their own folder (auth.uid()/)
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-files'
  AND name LIKE (auth.uid()::text || '/%')
);

-- 3. UPDATE: Users can update own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-files'
  AND name LIKE (auth.uid()::text || '/%')
);

-- 4. DELETE: Users can delete own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-files'
  AND name LIKE (auth.uid()::text || '/%')
);


-- ==============================================================================
-- TABLE 7: toefl_question_banks (Bank Soal Test TOEFL & Format Ujian)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.toefl_question_banks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,                           -- Nama Bank Soal
  category TEXT NOT NULL DEFAULT 'TOEFL ITP',    -- Kategori/Format: Listening, Structure, Reading, TOEFL ITP
  tag TEXT DEFAULT 'Resmi',                      -- Label tag / badge
  duration TEXT NOT NULL DEFAULT '115 Menit',    -- Alokasi Waktu
  question_count TEXT NOT NULL DEFAULT '140 Soal', -- Jumlah Soal
  score_target TEXT DEFAULT 'Skala 310 - 677',   -- Target Skor
  benefits TEXT[] DEFAULT '{}',                  -- Rincian alokasi per seksi
  sections_data JSONB DEFAULT '[]'::jsonb,       -- Struktur rinci seksi (durasi & jumlah soal)
  is_active BOOLEAN NOT NULL DEFAULT true,       -- Status Aktif / Published
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.toefl_question_banks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active question banks" ON public.toefl_question_banks;
DROP POLICY IF EXISTS "Authenticated users can create question banks" ON public.toefl_question_banks;
DROP POLICY IF EXISTS "Authenticated users can update question banks" ON public.toefl_question_banks;
DROP POLICY IF EXISTS "Authenticated users can delete question banks" ON public.toefl_question_banks;

-- RLS Policies
CREATE POLICY "Public can view active question banks"
  ON public.toefl_question_banks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create question banks"
  ON public.toefl_question_banks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update question banks"
  ON public.toefl_question_banks FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete question banks"
  ON public.toefl_question_banks FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS trigger_toefl_question_banks_updated_at ON public.toefl_question_banks;
CREATE TRIGGER trigger_toefl_question_banks_updated_at
  BEFORE UPDATE ON public.toefl_question_banks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_toefl_question_banks_user_id ON public.toefl_question_banks(user_id);
CREATE INDEX IF NOT EXISTS idx_toefl_question_banks_category ON public.toefl_question_banks(category);
CREATE INDEX IF NOT EXISTS idx_toefl_question_banks_created_at ON public.toefl_question_banks(created_at DESC);


-- ==============================================================================
-- TABLE 8: toefl_questions (Butir Soal TOEFL dalam Bank Soal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.toefl_questions (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES public.toefl_question_banks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  section TEXT NOT NULL,                         -- 'Listening' | 'Structure' | 'Reading'
  part TEXT NOT NULL,                            -- 'Part A (Short Dialogue)', 'Part A (Sentence Completion)', dsb.
  question_text TEXT NOT NULL,                   -- Narasi / teks pertanyaan
  audio_url TEXT,                                -- URL audio audio listening jika ada
  options JSONB NOT NULL DEFAULT '{"A":"","B":"","C":"","D":""}'::jsonb, -- Pilihan jawaban A, B, C, D
  correct_answer TEXT NOT NULL,                  -- 'A' | 'B' | 'C' | 'D'
  explanation TEXT,                              -- Pembahasan kunci jawaban
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.toefl_questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view toefl questions" ON public.toefl_questions;
DROP POLICY IF EXISTS "Authenticated users can create toefl questions" ON public.toefl_questions;
DROP POLICY IF EXISTS "Authenticated users can update toefl questions" ON public.toefl_questions;
DROP POLICY IF EXISTS "Authenticated users can delete toefl questions" ON public.toefl_questions;

-- RLS Policies
CREATE POLICY "Public can view toefl questions"
  ON public.toefl_questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create toefl questions"
  ON public.toefl_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update toefl questions"
  ON public.toefl_questions FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete toefl questions"
  ON public.toefl_questions FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS trigger_toefl_questions_updated_at ON public.toefl_questions;
CREATE TRIGGER trigger_toefl_questions_updated_at
  BEFORE UPDATE ON public.toefl_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_toefl_questions_program_id ON public.toefl_questions(program_id);
CREATE INDEX IF NOT EXISTS idx_toefl_questions_section ON public.toefl_questions(section);
CREATE INDEX IF NOT EXISTS idx_toefl_questions_created_at ON public.toefl_questions(created_at DESC);

-- ==============================================================================
-- TABLE 8: account_access_requests (Persetujuan Akses Akun Admin & Student)
-- Admin Utama: englishjoinindonesia@gmail.com (Admin EJI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.account_access_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  role TEXT NOT NULL DEFAULT 'student',          -- 'admin' | 'student'
  status TEXT NOT NULL DEFAULT 'pending',        -- 'pending' | 'approved' | 'rejected'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_by TEXT,                              -- Admin EJI email (englishjoinindonesia@gmail.com)
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.account_access_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view own or all requests" ON public.account_access_requests;
DROP POLICY IF EXISTS "Anyone can submit access request" ON public.account_access_requests;
DROP POLICY IF EXISTS "Admins can update access requests" ON public.account_access_requests;
DROP POLICY IF EXISTS "Admins can delete access requests" ON public.account_access_requests;

-- RLS Policies
CREATE POLICY "Public can view own or all requests"
  ON public.account_access_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit access request"
  ON public.account_access_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update access requests"
  ON public.account_access_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete access requests"
  ON public.account_access_requests FOR DELETE
  USING (true);

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS trigger_account_access_requests_updated_at ON public.account_access_requests;
CREATE TRIGGER trigger_account_access_requests_updated_at
  BEFORE UPDATE ON public.account_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_access_requests_email ON public.account_access_requests(email);
CREATE INDEX IF NOT EXISTS idx_account_access_requests_status ON public.account_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_access_requests_role ON public.account_access_requests(role);



