import { fetchWithRetry } from './client';

const ENDPOINT = '/szolgaltatasok';
const REFRESH_INTERVAL = 5000; // 5 seconds refresh interval

export interface Szolgaltatas {
  azonosito: string;
  nev: string;
  tipus: string;
  havi_koltseg: number;
  elegedettseg_hatas: number;
  lakossag_hatas: number;
  ertek: number;
  indulas_datum: string;
  aktiv: boolean;
  allami_tamogatas: boolean;
}

export interface SzolgaltatasokResponse {
  szolgaltatasok: Szolgaltatas[];
}

/**
 * Fetch services data from the server
 */
export async function fetchSzolgaltatasok(): Promise<SzolgaltatasokResponse> {
  try {
    return await fetchWithRetry<SzolgaltatasokResponse>(ENDPOINT);
  } catch (error) {
    console.error('Failed to fetch szolgaltatasok:', error);
    // Return empty services array as fallback
    return { szolgaltatasok: [] };
  }
}

/**
 * Transform services data for charts
 */
export function transformSzolgaltatasokForCharts(data: SzolgaltatasokResponse) {
  if (!data.szolgaltatasok || !Array.isArray(data.szolgaltatasok)) {
    return {
      servicesData: [],
      typeCounts: {},
      statusCounts: { active: 0, inactive: 0 },
      costTotal: 0,
      avgSatisfactionImpact: 0,
      avgPopulationImpact: 0,
      stateSupported: 0
    };
  }
  
  // Count by type
  const typeCounts = data.szolgaltatasok.reduce((acc, szolgaltatas) => {
    const type = szolgaltatas.tipus;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count by status
  const statusCounts = data.szolgaltatasok.reduce((acc, szolgaltatas) => {
    if (szolgaltatas.aktiv) {
      acc.active += 1;
    } else {
      acc.inactive += 1;
    }
    return acc;
  }, { active: 0, inactive: 0 });
  
  // Calculate cost total for active services
  const costTotal = data.szolgaltatasok
    .filter(s => s.aktiv)
    .reduce((total, s) => total + s.havi_koltseg, 0);
  
  // Calculate averages
  const activeServices = data.szolgaltatasok.filter(s => s.aktiv);
  const avgSatisfactionImpact = activeServices.length > 0
    ? activeServices.reduce((sum, s) => sum + s.elegedettseg_hatas, 0) / activeServices.length
    : 0;
    
  const avgPopulationImpact = activeServices.length > 0
    ? activeServices.reduce((sum, s) => sum + s.lakossag_hatas, 0) / activeServices.length
    : 0;
  
  // Count state supported services
  const stateSupported = data.szolgaltatasok.filter(s => s.allami_tamogatas).length;
  
  // Prepare data for charts
  const servicesData = data.szolgaltatasok.map(szolgaltatas => {
    return {
      id: szolgaltatas.azonosito,
      name: szolgaltatas.nev,
      type: szolgaltatas.tipus,
      monthlyCost: szolgaltatas.havi_koltseg,
      satisfactionImpact: szolgaltatas.elegedettseg_hatas,
      populationImpact: szolgaltatas.lakossag_hatas,
      value: szolgaltatas.ertek,
      startDate: szolgaltatas.indulas_datum,
      active: szolgaltatas.aktiv,
      stateSupported: szolgaltatas.allami_tamogatas
    };
  });
  
  return {
    servicesData,
    typeCounts,
    statusCounts,
    costTotal,
    avgSatisfactionImpact,
    avgPopulationImpact,
    stateSupported
  };
}

// Export the refresh interval
export { REFRESH_INTERVAL }; 