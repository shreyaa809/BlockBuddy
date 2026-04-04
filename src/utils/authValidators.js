export const STUDENT_EMAIL_REGEX =
  /^[a-zA-Z]+(\.[a-zA-Z]+)*\d*@vitstudent\.ac\.in$/i;

export const ADMIN_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@vit\.ac\.in$/i;

export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const EMPLOYEE_ID_REGEX = /^[a-zA-Z0-9_-]{4,20}$/;

export function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone = '') {
  return phone.replace(/\D/g, '').slice(-10);
}

export function detectEmailRole(email = '') {
  const normalizedEmail = normalizeEmail(email);

  if (STUDENT_EMAIL_REGEX.test(normalizedEmail)) return 'student';
  if (ADMIN_EMAIL_REGEX.test(normalizedEmail)) return 'admin';

  return null;
}

export function validateStudentOrAdminEmail(email = '') {
  const normalizedEmail = normalizeEmail(email);
  const role = detectEmailRole(normalizedEmail);

  if (!normalizedEmail) {
    return { isValid: false, role: null, message: 'Email is required.' };
  }

  if (!role) {
    return {
      isValid: false,
      role: null,
      message:
        'Use a valid VIT email. Students must use @vitstudent.ac.in and admins must use @vit.ac.in.',
    };
  }

  return { isValid: true, role, message: '' };
}

export function validateWorkerCredentials(phone = '', employeeId = '') {
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmployeeId = employeeId.trim();

  if (!normalizedPhone) {
    return { isValid: false, message: 'Phone number is required.' };
  }

  if (!PHONE_REGEX.test(normalizedPhone)) {
    return { isValid: false, message: 'Enter a valid 10-digit phone number.' };
  }

  if (!normalizedEmployeeId) {
    return { isValid: false, message: 'Worker ID is required.' };
  }

  if (!EMPLOYEE_ID_REGEX.test(normalizedEmployeeId)) {
    return {
      isValid: false,
      message: 'Worker ID must be 4 to 20 characters.',
    };
  }

  return {
    isValid: true,
    message: '',
    phone: normalizedPhone,
    employeeId: normalizedEmployeeId,
  };
}