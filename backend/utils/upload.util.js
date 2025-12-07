import { supabase } from '../config/database.js';

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Name of the file
 * @param {string} bucket - Supabase storage bucket name
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export const uploadToSupabase = async (fileBuffer, fileName, bucket = 'product-images') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: 'image/*',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - Path of file in storage
 * @param {string} bucket - Supabase storage bucket name
 */
export const deleteFromSupabase = async (filePath, bucket = 'product-images') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
export const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};
