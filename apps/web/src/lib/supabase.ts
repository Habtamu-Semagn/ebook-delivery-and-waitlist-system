/**
 * Supabase URL helper utilities
 * Provides environment-based URL generation for Supabase storage
 */

/**
 * Get Supabase base URL from environment or use default for development
 */
export const getSupabaseUrl = (): string => {
  const url = import.meta.env.VITE_SUPABASE_URL
  
  if (!url) {
    console.warn('VITE_SUPABASE_URL not set, using localhost default')
    return 'http://localhost:54321'
  }
  
  return url
}

/**
 * Get Supabase storage base URL
 */
export const getSupabaseStorageUrl = (): string => {
  return `${getSupabaseUrl()}/storage/v1/object/public`
}

/**
 * Get full URL for a book cover image
 * @param imageName - The image filename stored in the database
 * @returns Full URL to the image or null if no image name provided
 */
export const getBookImageUrl = (imageName: string | undefined): string | null => {
  if (!imageName) return null
  return `${getSupabaseStorageUrl()}/book-images/${imageName}`
}
