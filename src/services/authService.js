import { supabase } from '../supabaseClient';
import {
  detectEmailRole,
  normalizeEmail,
  validateStudentOrAdminEmail,
  validateWorkerCredentials,
} from '../utils/authValidators';

export async function loginStudentOrAdmin({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const validation = validateStudentOrAdminEmail(normalizedEmail);

  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  if (!password?.trim()) {
    throw new Error('Password is required.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: data.user,
    session: data.session,
    role: detectEmailRole(normalizedEmail),
    loginType: 'email',
  };
}

export async function loginWorker({ phone, employeeId, password }) {
  const validation = validateWorkerCredentials(phone, employeeId);

  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  if (!password?.trim()) {
    throw new Error('Password is required.');
  }

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, employee_id, phone, email, role, active')
    .eq('phone', validation.phone)
    .eq('employee_id', validation.employeeId)
    .single();

  if (workerError || !worker) {
    throw new Error('Worker not found. Check phone number and worker ID.');
  }

  if (!worker.active) {
    throw new Error('Worker account is inactive. Contact admin.');
  }

  if (!worker.email) {
    throw new Error('Worker email mapping missing in database.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: worker.email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: data.user,
    session: data.session,
    role: 'worker',
    loginType: 'worker-phone-id',
    workerProfile: worker,
  };
}