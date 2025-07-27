import { PDFDocument } from 'pdf-lib';

/**
 * Extracts text content from a PDF file
 * @param pdfBytes The PDF file as a Uint8Array
 * @returns A promise that resolves to an array of strings, one for each page
 */
export async function extractTextFromPdf(pdfBytes: Uint8Array): Promise<string[]> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    // This is a simplified version - in a real implementation, 
    // you would use pdf.js to extract text properly
    // For now, we'll return placeholder text
    return Array(pageCount).fill('PDF text content would be extracted here');
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Finds potential placeholder positions in PDF text
 * @param pdfText Array of text content from PDF pages
 * @returns Array of potential placeholders
 */
export function findPotentialPlaceholders(pdfText: string[]): string[] {
  // In a real implementation, this would use regex to find patterns like [NAME], {{DOB}}, etc.
  // For this demo, we'll return some common placeholders
  return [
    '[PATIENT_NAME]',
    '[PATIENT_AGE]',
    '[PATIENT_SEX]',
    '[PATIENT_ID]',
    '[TEST_DATE]',
    '[RESULT_1]',
    '[RESULT_2]',
    '[RESULT_3]',
    '[DOCTOR_NAME]',
    '[LAB_NAME]'
  ];
}

/**
 * Creates a PDF with filled placeholders
 * @param templatePdfBytes The template PDF as a Uint8Array
 * @param placeholders Object mapping placeholder names to values
 * @returns Promise resolving to the modified PDF as a Uint8Array
 */
export async function fillPdfTemplate(
  templatePdfBytes: Uint8Array,
  placeholders: Record<string, string>
): Promise<Uint8Array> {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templatePdfBytes);
    
    // In a real implementation, you would:
    // 1. Extract form fields if the PDF has them
    // 2. Or add text annotations at specific positions for each placeholder
    // 3. Or create a new PDF with the same layout but with placeholders replaced
    
    // For this demo, we'll just return the original PDF
    // In a real implementation, this would be replaced with actual placeholder filling logic
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error filling PDF template:', error);
    throw new Error('Failed to fill PDF template');
  }
}

/**
 * Converts a File object to a Uint8Array
 * @param file The File object to convert
 * @returns Promise resolving to a Uint8Array
 */
export function fileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to convert file to Uint8Array'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates a download link for a PDF file
 * @param pdfBytes The PDF file as a Uint8Array
 * @param filename The name to give the downloaded file
 */
export function downloadPdf(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}