import { AppState } from '../types';

// Cloudinary Configuration
const CLOUD_NAME = 'dythgh4ug';
const UPLOAD_PRESET = 'life_sync_unsigned_upload';
const API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Uploads an image to Cloudinary (Unsigned)
 * @param file File object to upload
 * @returns Promise resolving to the secure image URL
 */
export const uploadImage = async (file: File): Promise<string> => {
  // 1. Client-side Size Validation (Max 5MB)
  if (file.size > 5 * 1024 * 1024) { 
    throw new Error("File size exceeds 5MB limit.");
  }

  // 2. Client-side Type Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPG, JPEG, and PNG are allowed.");
  }

  // 3. Prepare FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    // 4. Upload to Cloudinary
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.secure_url; // Return the HTTPS URL
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

// --- Local Storage Helpers (for backups/cache) ---
const STORAGE_KEY = 'lifesync_data_v1';

export const loadState = (): Partial<AppState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch(e) { return {}; }
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};