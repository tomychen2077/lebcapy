import { createSupabaseClient } from './supabase';

/**
 * Uploads a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param path The path within the bucket (including filename)
 * @param options Additional upload options
 * @returns Promise resolving to the file URL if successful
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
  options?: { contentType?: string; upsert?: boolean }
): Promise<string> {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType || file.type,
        upsert: options?.upsert || false
      });

    if (error) throw error;

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Uploads a file from a Uint8Array to Supabase Storage
 * @param fileData The file data as a Uint8Array
 * @param fileName The name of the file
 * @param contentType The MIME type of the file
 * @param bucket The storage bucket name
 * @param path The path within the bucket (including filename)
 * @param options Additional upload options
 * @returns Promise resolving to the file URL if successful
 */
export async function uploadFileFromUint8Array(
  fileData: Uint8Array,
  fileName: string,
  contentType: string,
  bucket: string,
  path: string,
  options?: { upsert?: boolean }
): Promise<string> {
  const supabase = createSupabaseClient();
  
  try {
    // Convert Uint8Array to Blob
    const blob = new Blob([fileData], { type: contentType });
    const file = new File([blob], fileName, { type: contentType });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: options?.upsert || false
      });

    if (error) throw error;

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file from Uint8Array:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Downloads a file from Supabase Storage
 * @param bucket The storage bucket name
 * @param path The path within the bucket (including filename)
 * @returns Promise resolving to the file data as a Blob
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;
    if (!data) throw new Error('No data received');

    return data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error('Failed to download file');
  }
}

/**
 * Deletes a file from Supabase Storage
 * @param bucket The storage bucket name
 * @param path The path within the bucket (including filename)
 * @returns Promise resolving to true if successful
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Gets a public URL for a file in Supabase Storage
 * @param bucket The storage bucket name
 * @param path The path within the bucket (including filename)
 * @returns The public URL for the file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createSupabaseClient();
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Extracts the file extension from a filename
 * @param filename The filename
 * @returns The file extension (without the dot)
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Generates a unique filename with the current timestamp
 * @param originalFilename The original filename
 * @returns A unique filename with the original extension
 */
export function generateUniqueFilename(originalFilename: string): string {
  const extension = getFileExtension(originalFilename);
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 10);
  
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @param decimals The number of decimal places to show
 * @returns A human-readable file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}