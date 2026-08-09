import { get, set, del } from "idb-keyval";

/**
 * Robust IndexedDB storage helper with localStorage auto-migration.
 * Prevents QuotaExceededError caused by browser 5MB localStorage limits on base64 images.
 */

export async function loadStorageData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    // 1. Try reading from IndexedDB
    const indexedData = await get<T>(key);
    if (indexedData !== undefined && indexedData !== null) {
      return indexedData;
    }

    // 2. Fallback check on legacy localStorage & migrate if present
    const legacyLocal = localStorage.getItem(key);
    if (legacyLocal) {
      try {
        const parsed: T = JSON.parse(legacyLocal);
        // Migrate to IndexedDB asynchronously
        await set(key, parsed);
        // Clear legacy key to free up precious localStorage quota!
        localStorage.removeItem(key);
        return parsed;
      } catch (e) {
        console.warn(`Failed to parse legacy localStorage for key: ${key}`, e);
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.error(`IndexedDB read error for key ${key}:`, err);
  }

  return defaultValue;
}

export async function saveStorageData<T>(key: string, value: T): Promise<void> {
  try {
    // Save to IndexedDB (which supports hundreds of MBs without quota errors)
    await set(key, value);
    // Remove from localStorage if it still exists there
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`IndexedDB write error for key ${key}:`, err);
    // If IndexedDB fails, attempt trimmed fallback or report error safely
  }
}

export async function removeStorageData(key: string): Promise<void> {
  try {
    await del(key);
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing key ${key}:`, err);
  }
}
