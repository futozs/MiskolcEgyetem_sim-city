import { fetchWithRetry } from './client';

// Constants
const ENDPOINT = '/esemenyek';
const REFRESH_INTERVAL = 5000; // 5 seconds refresh interval

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
    // Használjuk a cache-elt fetch-et 5 másodperces cache idővel
    return await fetchWithRetry<EsemenyekResponse>(ENDPOINT, 10, 500, REFRESH_INTERVAL);
  } catch (error) {
    console.error('Failed to fetch esemenyek:', error);
    // Return empty events array as fallback
    return { esemenyek: [] };
  }
}

/**
 * Transform events data for charts
 */
export function transformEsemenyekForCharts(data: EsemenyekResponse) {
  if (!data.esemenyek || !Array.isArray(data.esemenyek)) {
    return {
      eventsData: [],
      typeCounts: {},
      impactTotals: {
        penz: 0,
        boldogsag: 0,
        lakossag: 0
      }
    };
  }
  
  // Count by type
  const typeCounts = data.esemenyek.reduce((acc, esemeny) => {
    const type = esemeny.esemeny.tipus;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate total impact
  const impactTotals = data.esemenyek.reduce((acc, esemeny) => {
    if (esemeny.esemeny.hatas) {
      acc.penz += esemeny.esemeny.hatas.penz || 0;
      acc.boldogsag += esemeny.esemeny.hatas.boldogsag || 0;
      acc.lakossag += esemeny.esemeny.hatas.lakossag || 0;
    }
    return acc;
  }, { penz: 0, boldogsag: 0, lakossag: 0 });
  
  // Prepare chart data
  const eventsData = data.esemenyek.map(esemeny => {
    return {
      fordulo: esemeny.fordulo,
      nev: esemeny.esemeny.nev,
      leiras: esemeny.esemeny.leiras,
      tipus: esemeny.esemeny.tipus,
      hatas: esemeny.esemeny.hatas || { penz: 0, boldogsag: 0, lakossag: 0 }
    };
  });
  
  return {
    eventsData,
    typeCounts,
    impactTotals
  };
}

// Export the refresh interval
export { REFRESH_INTERVAL }; 