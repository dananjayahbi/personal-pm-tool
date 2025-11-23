/**
 * Image Engine Utility
 * Handles image to base64 conversion and caching for SubTask images
 */

import fs from "fs";
import path from "path";

// Cache directory path
const CACHE_DIR = path.join(process.cwd(), "public", "assets", "cache", "base64");
const CACHE_FILE = path.join(CACHE_DIR, "image-cache.json");

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

interface ImageCache {
  [imageId: string]: CachedImage;
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
 * Load cache from JSON file
 */
function loadCache(): ImageCache {
  ensureCacheDir();
  
  if (!fs.existsSync(CACHE_FILE)) {
    return {};
  }
  
  try {
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading cache:", error);
    return {};
  }
}

/**
 * Save cache to JSON file
 */
function saveCache(cache: ImageCache): void {
  ensureCacheDir();
  
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving cache:", error);
  }
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
  const cache = loadCache();
  return cache[imageId] || null;
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
  const cache = loadCache();
  
  cache[imageId] = {
    id: imageId,
    base64Data,
    mimeType,
    filename,
    cachedAt: new Date().toISOString(),
  };
  
  saveCache(cache);
}

/**
 * Remove image from cache
 * Server-side only
 */
export function removeImageFromCache(imageId: string): void {
  const cache = loadCache();
  
  if (cache[imageId]) {
    delete cache[imageId];
    saveCache(cache);
  }
}

/**
 * Clear old cache entries (older than 30 days)
 * Server-side only
 */
export function clearOldCache(): void {
  const cache = loadCache();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let modified = false;
  
  Object.keys(cache).forEach((imageId) => {
    const cachedAt = new Date(cache[imageId].cachedAt);
    if (cachedAt < thirtyDaysAgo) {
      delete cache[imageId];
      modified = true;
    }
  });
  
  if (modified) {
    saveCache(cache);
  }
}

/**
 * Get cache statistics
 * Server-side only
 */
export function getCacheStats(): { count: number; size: string } {
  const cache = loadCache();
  const count = Object.keys(cache).length;
  
  let totalSize = 0;
  Object.values(cache).forEach((image) => {
    totalSize += (image.base64Data.length * 3) / 4; // Estimate binary size
  });
  
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  return {
    count,
    size: `${sizeMB} MB`,
  };
}
