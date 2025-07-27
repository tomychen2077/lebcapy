import { useState, useCallback } from 'react';
import { uploadFile } from '@/utils/fileUtils';
import { isValidFileSize, isValidFileType } from '@/utils/validation';

interface UseFileUploadOptions {
  bucket: string;
  path: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  generateUniquePath?: boolean;
}

export function useFileUpload({
  bucket,
  path,
  maxSizeMB = 10, // Default max size: 10MB
  allowedTypes = ['application/pdf'], // Default allowed type: PDF
  generateUniquePath = true,
}: UseFileUploadOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (!isValidFileSize(file, maxSizeMB)) {
        return {
          valid: false,
          error: `File size exceeds the maximum limit of ${maxSizeMB}MB`,
        };
      }

      if (!isValidFileType(file, allowedTypes)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        };
      }

      return { valid: true };
    },
    [maxSizeMB, allowedTypes]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0] || null;
      setError(null);

      if (!selectedFile) {
        setFile(null);
        return;
      }

      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setFile(null);
        // Reset the input value to allow selecting the same file again
        event.target.value = '';
        return;
      }

      setFile(selectedFile);
    },
    [validateFile]
  );

  const uploadSelectedFile = useCallback(async (): Promise<string | null> => {
    if (!file) {
      setError('No file selected');
      return null;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Generate a unique path if needed
      const filePath = generateUniquePath
        ? `${path}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
        : `${path}/${file.name.replace(/\s+/g, '_')}`;

      // Upload the file
      const url = await uploadFile(file, bucket, filePath, {
        contentType: file.type,
        upsert: true,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setFileUrl(url);
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [file, bucket, path, generateUniquePath]);

  const reset = useCallback(() => {
    setFile(null);
    setFileUrl(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, []);

  return {
    file,
    fileUrl,
    isUploading,
    uploadProgress,
    error,
    handleFileChange,
    uploadSelectedFile,
    reset,
  };
}