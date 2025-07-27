/**
 * Validates an email address
 * @param email The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password
 * @param password The password to validate
 * @returns An object with a valid flag and an error message if invalid
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Validates a phone number
 * @param phone The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  // This is a simple validation that checks if the phone number has 10-15 digits
  // In a real application, you might want to use a more sophisticated validation
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates a name
 * @param name The name to validate
 * @returns True if the name is valid, false otherwise
 */
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

/**
 * Validates a price
 * @param price The price to validate
 * @returns True if the price is valid, false otherwise
 */
export function isValidPrice(price: number | string): boolean {
  const priceNumber = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(priceNumber) && priceNumber >= 0;
}

/**
 * Validates an age
 * @param age The age to validate
 * @returns True if the age is valid, false otherwise
 */
export function isValidAge(age: number | string): boolean {
  const ageNumber = typeof age === 'string' ? parseInt(age, 10) : age;
  return !isNaN(ageNumber) && ageNumber >= 0 && ageNumber <= 120;
}

/**
 * Validates a file size
 * @param file The file to validate
 * @param maxSizeMB The maximum file size in megabytes
 * @returns True if the file size is valid, false otherwise
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validates a file type
 * @param file The file to validate
 * @param allowedTypes Array of allowed MIME types
 * @returns True if the file type is valid, false otherwise
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validates a URL
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates required fields in a form
 * @param formData Object containing form data
 * @param requiredFields Array of required field names
 * @returns Object with valid flag and array of missing field names
 */
export function validateRequiredFields(
  formData: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => {
    const value = formData[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}