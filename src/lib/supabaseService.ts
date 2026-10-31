import { supabase } from './supabase';

export interface ProjectItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentRegistrationItem {
  id: string;
  user_id?: string;
  name: string;
  whatsapp: string;
  email: string;
  program_name: string;
  registration_date: string;
  test_score: number | null;
  listening_score: number | null;
  structure_score: number | null;
  reading_score: number | null;
  payment_status: 'Paid' | 'Pending' | 'Installment';
  status: 'Lulus (500+)' | 'Selesai (<500)' | 'Sedang Ujian' | 'Belum Mulai';
  certificate_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestHistoryItem {
  id: string;
  user_id: string;
  student_name: string;
  test_title: string;
  test_type: string;
  date: string;
  listening_score: number;
  structure_score: number;
  reading_score: number;
  total_score: number;
  max_score: number;
  status: string;
  cert_number?: string;
  cert_issue_date?: string;
  level_category?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// 1. PROJECTS CRUD
// ============================================================================

/**
 * Load the authenticated user's projects
 */
export async function loadProjects(): Promise<{ data: ProjectItem[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Create a new project for the authenticated user
 */
export async function createProject(params: {
  title: string;
  description?: string | null;
  user_id: string;
}): Promise<{ data: ProjectItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          title: params.title.trim(),
          description: params.description?.trim() || null,
          user_id: params.user_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  params: {
    title?: string;
    description?: string | null;
  }
): Promise<{ data: ProjectItem | null; error: Error | null }> {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (params.title !== undefined) payload.title = params.title.trim();
    if (params.description !== undefined) payload.description = params.description?.trim() || null;

    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// ============================================================================
// 2. STUDENT REGISTRATIONS CRUD
// ============================================================================

/**
 * Load student registrations
 */
export async function loadStudentRegistrations(): Promise<{
  data: StudentRegistrationItem[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Create a new student registration
 */
export async function createStudentRegistration(
  student: Omit<StudentRegistrationItem, 'created_at' | 'updated_at'>
): Promise<{ data: StudentRegistrationItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .insert([student])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update a student registration
 */
export async function updateStudentRegistration(
  id: string,
  updates: Partial<StudentRegistrationItem>
): Promise<{ data: StudentRegistrationItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('student_registrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a student registration
 */
export async function deleteStudentRegistration(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('student_registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// ============================================================================
// 3. TEST HISTORY RECORDS CRUD
// ============================================================================

/**
 * Load test history records
 */
export async function loadTestHistoryRecords(): Promise<{
  data: TestHistoryItem[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('test_history_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Create a test history record
 */
export async function createTestHistoryRecord(
  record: Omit<TestHistoryItem, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: TestHistoryItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('test_history_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update a test history record
 */
export async function updateTestHistoryRecord(
  id: string,
  updates: Partial<TestHistoryItem>
): Promise<{ data: TestHistoryItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('test_history_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a test history record
 */
export async function deleteTestHistoryRecord(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('test_history_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// ============================================================================
// 4. STORAGE OPERATIONS ('app-files' bucket with auth.uid() folder isolation)
// ============================================================================

/**
 * Upload a file into user's isolated folder in 'app-files'
 * Stores at: {userId}/{timestamp}_{fileName}
 */
export async function uploadUserFile(
  userId: string,
  fileName: string,
  file: File | Blob
): Promise<{ path: string | null; error: Error | null }> {
  try {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${Date.now()}_${sanitized}`;

    const { data, error } = await supabase.storage
      .from('app-files')
      .upload(path, file, {
        upsert: true,
      });

    if (error) throw error;
    return { path: data?.path || path, error: null };
  } catch (err: any) {
    return { path: null, error: err };
  }
}

/**
 * Get a signed URL for a file in 'app-files' (valid for 1 hour by default)
 */
export async function getUserFileSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<{ signedUrl: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('app-files')
      .createSignedUrl(path, expiresInSeconds);

    if (error) throw error;
    return { signedUrl: data?.signedUrl || null, error: null };
  } catch (err: any) {
    return { signedUrl: null, error: err };
  }
}

/**
 * Delete a file from 'app-files'
 */
export async function deleteUserFile(path: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from('app-files')
      .remove([path]);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// ============================================================================
// 5. TOEFL QUESTION BANKS & QUESTIONS CRUD
// ============================================================================

export interface QuestionBankItem {
  id: string;
  user_id?: string;
  title: string;
  category: string;
  tag?: string;
  duration: string;
  question_count: string;
  score_target?: string;
  benefits?: string[];
  sections_data?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ToeflQuestionDbItem {
  id: string;
  program_id: string;
  user_id?: string;
  section: 'Listening' | 'Structure' | 'Reading' | string;
  part: string;
  question_text: string;
  audio_url?: string | null;
  audio_file_name?: string | null;
  passage_text?: string | null;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: 'A' | 'B' | 'C' | 'D' | string;
  explanation?: string;
  order_num?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Load all TOEFL question banks
 */
export async function loadQuestionBanks(): Promise<{ data: QuestionBankItem[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('toefl_question_banks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Create a new question bank
 */
export async function createQuestionBank(
  item: Omit<QuestionBankItem, 'created_at' | 'updated_at'>
): Promise<{ data: QuestionBankItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('toefl_question_banks')
      .insert([
        {
          id: item.id,
          title: item.title,
          category: item.category,
          tag: item.tag || 'Resmi',
          duration: item.duration,
          question_count: item.question_count,
          score_target: item.score_target || 'Skala 310 - 677',
          benefits: item.benefits || [],
          sections_data: item.sections_data || [],
          is_active: item.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing question bank
 */
export async function updateQuestionBank(
  item: Partial<QuestionBankItem> & { id: string }
): Promise<{ data: QuestionBankItem | null; error: Error | null }> {
  try {
    const payload: any = {};
    if (item.title !== undefined) payload.title = item.title;
    if (item.category !== undefined) payload.category = item.category;
    if (item.tag !== undefined) payload.tag = item.tag;
    if (item.duration !== undefined) payload.duration = item.duration;
    if (item.question_count !== undefined) payload.question_count = item.question_count;
    if (item.score_target !== undefined) payload.score_target = item.score_target;
    if (item.benefits !== undefined) payload.benefits = item.benefits;
    if (item.sections_data !== undefined) payload.sections_data = item.sections_data;
    if (item.is_active !== undefined) payload.is_active = item.is_active;

    const { data, error } = await supabase
      .from('toefl_question_banks')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a question bank and cascade delete its questions
 */
export async function deleteQuestionBank(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('toefl_question_banks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Load TOEFL questions (optionally filtered by program_id / bank_id)
 */
export async function loadToeflQuestions(
  programId?: string
): Promise<{ data: ToeflQuestionDbItem[] | null; error: Error | null }> {
  try {
    let query = supabase.from('toefl_questions').select('*').order('created_at', { ascending: true });

    if (programId) {
      query = query.eq('program_id', programId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Create a new TOEFL question
 */
export async function createToeflQuestion(
  item: Omit<ToeflQuestionDbItem, 'created_at' | 'updated_at'>
): Promise<{ data: ToeflQuestionDbItem | null; error: Error | null }> {
  try {
    const payload: any = {
      id: item.id,
      program_id: item.program_id,
      section: item.section,
      part: item.part,
      question_text: item.question_text,
      audio_url: item.audio_url || null,
      options: item.options,
      correct_answer: item.correct_answer,
      explanation: item.explanation || '',
    };
    if (item.user_id) payload.user_id = item.user_id;
    if (item.passage_text !== undefined) payload.passage_text = item.passage_text;
    if (item.audio_file_name !== undefined) payload.audio_file_name = item.audio_file_name;
    if (item.order_num !== undefined) payload.order_num = item.order_num;

    const { data, error } = await supabase
      .from('toefl_questions')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update an existing TOEFL question
 */
export async function updateToeflQuestion(
  item: Partial<ToeflQuestionDbItem> & { id: string }
): Promise<{ data: ToeflQuestionDbItem | null; error: Error | null }> {
  try {
    const payload: any = {
      updated_at: new Date().toISOString()
    };
    if (item.program_id !== undefined) payload.program_id = item.program_id;
    if (item.section !== undefined) payload.section = item.section;
    if (item.part !== undefined) payload.part = item.part;
    if (item.question_text !== undefined) payload.question_text = item.question_text;
    if (item.audio_url !== undefined) payload.audio_url = item.audio_url;
    if (item.audio_file_name !== undefined) payload.audio_file_name = item.audio_file_name;
    if (item.passage_text !== undefined) payload.passage_text = item.passage_text;
    if (item.options !== undefined) payload.options = item.options;
    if (item.correct_answer !== undefined) payload.correct_answer = item.correct_answer;
    if (item.explanation !== undefined) payload.explanation = item.explanation;
    if (item.order_num !== undefined) payload.order_num = item.order_num;

    const { data, error } = await supabase
      .from('toefl_questions')
      .update(payload)
      .eq('id', item.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a TOEFL question
 */
export async function deleteToeflQuestion(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('toefl_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

// ============================================================================
// 7. ACCOUNT ACCESS REQUESTS (Admin & Student approvals by Admin EJI)
// ============================================================================

export interface AccountAccessDbItem {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  role: 'admin' | 'student';
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Load all account access requests from Supabase
 */
export async function loadAccountAccessRequests(): Promise<{ data: AccountAccessDbItem[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('account_access_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Create a new account access request
 */
export async function createAccountAccessRequest(
  item: Omit<AccountAccessDbItem, 'created_at' | 'updated_at'>
): Promise<{ data: AccountAccessDbItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('account_access_requests')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update request status (approve or reject)
 */
export async function updateAccountAccessRequestStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  reviewedBy: string = 'englishjoinindonesia@gmail.com',
  notes?: string
): Promise<{ data: AccountAccessDbItem | null; error: Error | null }> {
  try {
    const payload: any = {
      status,
      reviewed_by: status === 'pending' ? null : reviewedBy,
      reviewed_at: status === 'pending' ? null : new Date().toISOString()
    };
    if (notes !== undefined) payload.notes = notes;

    const { data, error } = await supabase
      .from('account_access_requests')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete an access request
 */
export async function deleteAccountAccessRequestDb(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('account_access_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}



