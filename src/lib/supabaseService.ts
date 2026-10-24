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

