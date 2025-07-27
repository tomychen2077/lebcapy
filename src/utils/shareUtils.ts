/**
 * Shares content via WhatsApp
 * @param text The text to share
 * @param url Optional URL to include
 */
export function shareViaWhatsApp(text: string, url?: string): void {
  let whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  
  if (url) {
    whatsappUrl += encodeURIComponent(` ${url}`);
  }
  
  window.open(whatsappUrl, '_blank');
}

/**
 * Shares content via email using mailto link
 * @param subject The email subject
 * @param body The email body
 * @param to Optional recipient email address
 */
export function shareViaEmail(subject: string, body: string, to?: string): void {
  let mailtoUrl = 'mailto:';
  
  if (to) {
    mailtoUrl += encodeURIComponent(to);
  }
  
  mailtoUrl += `?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.location.href = mailtoUrl;
}

/**
 * Shares content via EmailJS
 * @param templateParams Parameters for the EmailJS template
 * @param templateId The EmailJS template ID
 * @param userId The EmailJS user ID
 * @param serviceId The EmailJS service ID
 * @returns Promise resolving to the EmailJS response
 */
export async function shareViaEmailJS(
  templateParams: Record<string, any>,
  templateId: string,
  userId: string,
  serviceId: string
): Promise<any> {
  try {
    // This is a placeholder for EmailJS integration
    // In a real implementation, you would import and use the EmailJS library
    console.log('Sending email via EmailJS with params:', {
      templateParams,
      templateId,
      userId,
      serviceId
    });
    
    // Simulate a successful response
    return { status: 200, text: 'OK' };
  } catch (error) {
    console.error('Error sending email via EmailJS:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Copies text to clipboard
 * @param text The text to copy
 * @returns Promise resolving to true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    
    // Fallback method for browsers that don't support clipboard API
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackError) {
      console.error('Fallback clipboard copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Generates a shareable link
 * @param path The path to share (will be appended to the current origin)
 * @returns The full shareable URL
 */
export function generateShareableLink(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Shares content using the Web Share API if available
 * @param data The data to share (title, text, url)
 * @returns Promise resolving to true if successful
 */
export async function useWebShareApi(data: { title: string; text: string; url?: string }): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // User cancelled or share failed
      console.error('Error using Web Share API:', error);
      return false;
    }
  }
  return false; // Web Share API not available
}