// Global cache service for API responses
// This helps prevent multiple API calls for the same data simultaneously

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

class ApiCacheService {
  private cache: Map<string, CachedData<any>> = new Map();
  private pendingFetches: Map<string, Promise<any>> = new Map();
  
  // Get data from cache or fetch it
  async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    expiryTime: number = 5000 // Default 5 seconds
  ): Promise<T> {
    // Check if fetch is already in progress for this key
    if (this.pendingFetches.has(key)) {
      return this.pendingFetches.get(key) as Promise<T>;
    }
    
    // Check if valid data exists in cache
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.expiryTime) {
      return cached.data;
    }
    
    // Create a new fetch promise
    const fetchPromise = this.fetchAndCache(key, fetchFn, expiryTime);
    
    // Store the pending fetch promise
    this.pendingFetches.set(key, fetchPromise);
    
    try {
      return await fetchPromise;
    } finally {
      // Clean up the pending fetch reference when done
      this.pendingFetches.delete(key);
    }
  }
  
  // Internal method to fetch and cache data
  private async fetchAndCache<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    expiryTime: number
  ): Promise<T> {
    try {
      // Fetch fresh data
      const data = await fetchFn();
      
      // Store in cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiryTime
      });
      
      return data;
    } catch (error) {
      // If there's cached data and we encounter an error, return the cached data even if expired
      const cached = this.cache.get(key);
      if (cached) {
        console.warn(`Failed to fetch fresh data for ${key}, using stale cache.`);
        return cached.data;
      }
      
      throw error;
    }
  }
  
  // Clear cache for a specific key or all cache
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Create a singleton instance
export const apiCache = new ApiCacheService(); 