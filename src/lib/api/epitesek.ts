import { fetchWithRetry } from './client';
import { EpitesResponse } from './types';

const ENDPOINT = '/epitesek';
const REFRESH_INTERVAL = 5000; // 5 seconds refresh interval

// Alapértelmezett építési adatok hiba esetére
const DEFAULT_EPITESEK: EpitesResponse = {
  id: 'default',
  epitesek: []
};

/**
 * Fetch construction projects data
 */
export async function fetchEpitesek(): Promise<EpitesResponse> {
  console.log('Fetching construction projects...');
  try {
    const result = await fetchWithRetry<EpitesResponse>(ENDPOINT);
    console.log('Construction projects fetched successfully!');
    
    if (!result.epitesek || !Array.isArray(result.epitesek)) {
      console.error('Invalid construction projects response structure', result);
      return DEFAULT_EPITESEK;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to fetch construction projects:', error);
    // Hiba esetén alapértelmezett adatokat adunk vissza, hogy az UI ne hibásodjon meg
    return DEFAULT_EPITESEK;
  }
}

/**
 * Transform construction data for visualization
 */
export function transformEpitesekForViz(data: EpitesResponse) {
  if (!data || !data.epitesek || !Array.isArray(data.epitesek)) {
    console.warn('Invalid or missing construction data for visualization transform');
    return [];
  }
  
  // Organize construction sites in a spiral pattern around the center
  return data.epitesek.map((epites, index) => {
    // Create a spiral pattern for construction sites
    const angle = index * 0.8; // radians
    const radius = 60 + (index * 5); // Increasing radius with each item
    
    // Convert polar to cartesian coordinates
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Parse dates
    const startDate = new Date(epites.kezdo_datum);
    const endDate = new Date(epites.befejezo_datum);
    
    // Calculate days remaining
    const today = new Date();
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    
    // Calculate expected progress based on elapsed time
    const expectedProgress = Math.min(1, daysElapsed / totalDays);
    // Calculate if the project is behind, on time, or ahead of schedule
    const progressStatus = epites.keszultsegi_fok / 100 < expectedProgress 
      ? 'behind' 
      : epites.keszultsegi_fok / 100 > expectedProgress 
        ? 'ahead' 
        : 'on-time';
    
    return {
      id: epites.azonosito,
      name: epites.nev,
      type: epites.tipus,
      cost: epites.koltseg,
      startDate,
      endDate,
      completionPercentage: epites.keszultsegi_fok,
      status: epites.allapot,
      position: [x, 0, z],
      daysRemaining,
      totalDays,
      progressStatus,
    };
  });
}

/**
 * Transform construction data for timeline visualization
 */
export function transformEpitesekForTimeline(data: EpitesResponse) {
  return data.epitesek.map(epites => {
    return {
      id: epites.azonosito,
      content: epites.nev,
      start: new Date(epites.kezdo_datum),
      end: new Date(epites.befejezo_datum),
      progress: epites.keszultsegi_fok / 100,
      type: epites.tipus,
      style: {
        background: epites.allapot === 'folyamatban' ? '#00aeff' : '#aaaaaa',
      },
    };
  });
}

/**
 * Transform construction data for charts
 */
export function transformEpitesekForCharts(data: EpitesResponse) {
  if (!data.epitesek || !Array.isArray(data.epitesek)) {
    return {
      epitesekData: [],
      statusCounts: {},
      typeCounts: {},
    };
  }
  
  // Count by status
  const statusCounts = data.epitesek.reduce((acc, epites) => {
    const status = epites.allapot;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count by type
  const typeCounts = data.epitesek.reduce((acc, epites) => {
    const type = epites.tipus;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Prepare chart data
  const epitesekData = data.epitesek.map(epites => ({
    id: epites.azonosito,
    name: epites.nev,
    type: epites.tipus,
    status: epites.allapot,
    cost: epites.koltseg,
    progress: epites.keszultsegi_fok,
    startDate: new Date(epites.kezdo_datum),
    endDate: new Date(epites.befejezo_datum),
  }));
  
  return {
    epitesekData,
    statusCounts,
    typeCounts
  };
}

// Constants for the API
export { REFRESH_INTERVAL }; 