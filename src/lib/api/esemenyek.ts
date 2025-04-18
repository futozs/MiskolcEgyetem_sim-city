import { fetchWithRetry } from './client';

// Constants
export const REFRESH_INTERVAL = 5000; // 5 seconds
const ENDPOINT = '/esemenyek';

// Types
export interface Esemeny {
  fordulo: number;
  esemeny: {
    nev: string;
    leiras: string;
    tipus: string;
    hatas: {
      penz: number;
      boldogsag: number;
      lakossag: number;
    };
  };
}

export interface EsemenyekResponse {
  esemenyek: Esemeny[];
}

/**
 * Fetch events data from the server
 */
export async function fetchEsemenyek(): Promise<EsemenyekResponse> {
  try {
    return await fetchWithRetry<EsemenyekResponse>(ENDPOINT);
  } catch (error) {
    console.error('Failed to fetch esemenyek:', error);
    // Return empty events array as fallback
    return { esemenyek: [] };
  }
} 