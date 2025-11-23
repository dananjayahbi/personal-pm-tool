/**
 * Image Engine Utility
 * Handles image to base64 conversion and caching for SubTask images
 * Each image is stored in its own JSON file for better performance
 */

import fs from "fs";
import path from "path";

// Cache directory path
const CACHE_DIR = path.join(process.cwd(), "public", "assets", "cache", "base64");

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

interface CachedImage {
  id: string;
  base64Data: string;
  mimeType: string;
  filename: string;
  cachedAt: string;
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get cache file path for a specific image
 */
function getCacheFilePath(imageId: string): string {
  return path.join(CACHE_DIR, `${imageId}.json`);
}

/**
 * Validate image file
 */
export function validateImage(base64Data: string, mimeType: string): { valid: boolean; error?: string } {
  // Check if mime type is allowed
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid image type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // Check base64 format
  if (!base64Data || typeof base64Data !== "string") {
    return {
      valid: false,
      error: "Invalid base64 data format",
    };
  }

  // Estimate file size from base64 (base64 is ~33% larger than binary)
  const estimatedSize = (base64Data.length * 3) / 4;
  if (estimatedSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Convert File/Blob to base64
 * Client-side only
 */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64Data = result.split(",")[1];
      
      resolve({
        base64: base64Data,
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
 * Works in browser
 */
export function base64ToImageUrl(base64Data: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Get image from cache
 * Server-side only
 */
export function getImageFromCache(imageId: string): CachedImage | null {
  ensureCacheDir();
  const cacheFilePath = getCacheFilePath(imageId);
  
  if (!fs.existsSync(cacheFilePath)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(cacheFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading cache for image ${imageId}:`, error);
    return null;
  }
}

/**
 * Save image to cache
 * Server-side only
 */
export function saveImageToCache(
  imageId: string,
  base64Data: string,
  mimeType: string,
  filename: string
): void {
  ensureCacheDir();
  
  const cachedImage: CachedImage = {
    id: imageId,
    base64Data,
    mimeType,
    filename,
    cachedAt: new Date().toISOString(),
  };
  
  const cacheFilePath = getCacheFilePath(imageId);
  
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cachedImage, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error saving cache for image ${imageId}:`, error);
  }
}

/**
 * Remove image from cache
 * Server-side only
 */
export function removeImageFromCache(imageId: string): void {
  const cacheFilePath = getCacheFilePath(imageId);
  
  if (fs.existsSync(cacheFilePath)) {
    try {
      fs.unlinkSync(cacheFilePath);
    } catch (error) {
      console.error(`Error removing cache for image ${imageId}:`, error);
    }
  }
}

/**
 * Clear old cache entries (older than 30 days)
 * Server-side only
 */
export function clearOldCache(): void {
  ensureCacheDir();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    const files = fs.readdirSync(CACHE_DIR);
    
    files.forEach((file) => {
      if (!file.endsWith(".json")) return;
      
      const filePath = path.join(CACHE_DIR, file);
      
      try {
        const data = fs.readFileSync(filePath, "utf-8");
        const cachedImage: CachedImage = JSON.parse(data);
        const cachedAt = new Date(cachedImage.cachedAt);
        
        if (cachedAt < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Error processing cache file ${file}:`, error);
      }
    });
  } catch (error) {
    console.error("Error clearing old cache:", error);
  }
}

/**
 * Get cache statistics
 * Server-side only
 */
export function getCacheStats(): { count: number; size: string } {
  ensureCacheDir();
  
  let count = 0;
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(CACHE_DIR);
    
    files.forEach((file) => {
      if (!file.endsWith(".json")) return;
      
      const filePath = path.join(CACHE_DIR, file);
      
      try {
        const data = fs.readFileSync(filePath, "utf-8");
        const cachedImage: CachedImage = JSON.parse(data);
        
        count++;
        totalSize += (cachedImage.base64Data.length * 3) / 4; // Estimate binary size
      } catch (error) {
        console.error(`Error reading cache file ${file}:`, error);
      }
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
  }
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  return {
    count,
    size: `${sizeMB} MB`,
  };
}
