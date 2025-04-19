// Base API client configuration
// Használjuk a saját dedikált Next.js API végpontokat
import { apiCache } from './cache';

const API_BASE_URL = '/api';

/**
 * Base fetch function with error handling
 */
export async function fetchApi<T>(endpoint: string): Promise<T> {
  try {
    // Abszolút URL használata
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      // Nincs szükség speciális header-ekre, mivel ugyanazon az origin-on vagyunk
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Közvetlenül használhatjuk a JSON parse-olást, mivel a Next.js API route már kezeli a JSON adatokat
    const jsonData = await response.json();
    return jsonData as T;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Generic function to handle API fetching with retry logic
 */
export async function fetchWithRetry<T>(
  endpoint: string,
  maxRetries = 10, 
  retryDelay = 500,
  cacheTime = 5000  // Default cache time: 5 seconds
): Promise<T> {
  // Use the cache service to either get cached data or fetch fresh data
  return apiCache.getOrFetch<T>(
    endpoint,
    async () => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fetchApi<T>(endpoint);
        } catch (error) {
          lastError = error as Error;
          console.log(`Retry attempt ${attempt + 1}/${maxRetries}`);
          
          // Wait before retrying (lineáris várakozás)
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      throw lastError || new Error(`Failed to fetch from ${endpoint} after ${maxRetries} attempts`);
    },
    cacheTime
  );
} 