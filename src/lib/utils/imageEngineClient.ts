/**
 * Client-side Image Engine Utility
 * Handles image to base64 conversion for browser usage
 */

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export interface ImageData {
  filename: string;
  base64Data: string;
  mimeType: string;
}

/**
 * Validate image file
 */
export function validateImage(
  file: File
): { valid: boolean; error?: string } {
  // Check if mime type is allowed
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Convert File to base64
 */
export function fileToBase64(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64Data = result.split(",")[1];

      resolve({
        base64Data,
        mimeType: file.type,
        filename: file.name,
      });
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 to image URL for display
 */
export function base64ToImageUrl(base64Data: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Handle paste event to extract images from clipboard
 */
export async function handlePasteImage(
  event: ClipboardEvent
): Promise<ImageData | null> {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (!file) continue;

      const validation = validateImage(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      return await fileToBase64(file);
    }
  }

  return null;
}

/**
 * Process multiple files
 */
export async function processFiles(files: FileList): Promise<ImageData[]> {
  const imagePromises: Promise<ImageData>[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    const validation = validateImage(file);
    if (!validation.valid) {
      throw new Error(`${file.name}: ${validation.error}`);
    }

    imagePromises.push(fileToBase64(file));
  }

  return await Promise.all(imagePromises);
}
