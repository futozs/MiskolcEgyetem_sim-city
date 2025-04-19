import { fetchWithRetry } from './client';
import { EpuletResponse } from './types';

const ENDPOINT = '/epuletek';
const REFRESH_INTERVAL = 5000; // 5 seconds refresh interval

// Alapértelmezett épület adatok hiba esetére
const DEFAULT_EPULETEK: EpuletResponse = {
  id: 'default',
  epuletek: []
};

/**
 * Fetch buildings data
 */
export async function fetchEpuletek(): Promise<EpuletResponse> {
  console.log('Fetching buildings...');
  try {
    const result = await fetchWithRetry<EpuletResponse>(ENDPOINT);
    console.log('Buildings fetched successfully!');
    
    if (!result.epuletek || !Array.isArray(result.epuletek)) {
      console.error('Invalid building response structure', result);
      return DEFAULT_EPULETEK;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to fetch buildings:', error);
    // Hiba esetén alapértelmezett adatokat adunk vissza, hogy az UI ne hibásodjon meg
    return DEFAULT_EPULETEK;
  }
}

/**
 * Transform building data for 3D visualization
 */
export function transformEpuletekFor3D(data: EpuletResponse) {
  if (!data || !data.epuletek || !Array.isArray(data.epuletek)) {
    console.warn('Invalid or missing building data for 3D transform');
    return [];
  }
  
  // Define zones for different city areas with proper city planning
  const zones = {
    residential: { x: [-150, -30], z: [-150, 150] },   // Left side of city - residential area
    commercial: { x: [30, 150], z: [-50, 50] },        // Right side - business district
    government: { x: [30, 150], z: [60, 150] },        // Upper right - government buildings
    educational: { x: [30, 150], z: [-150, -60] },     // Lower right - education zone
    park1: { x: [-20, 20], z: [60, 150] },             // Upper center park
    park2: { x: [-20, 20], z: [-150, -60] },           // Lower center park
    centralPlaza: { x: [-20, 20], z: [-50, 50] }       // Central area
  };
  
  // Sort buildings by type for better zoning
  const sortedBuildings = [...data.epuletek].sort((a, b) => {
    const typeA = a.tipus.toLowerCase();
    const typeB = b.tipus.toLowerCase();
    
    // First group by general categories
    const isResidentialA = typeA.includes('lakó') || typeA.includes('lako');
    const isResidentialB = typeB.includes('lakó') || typeB.includes('lako');
    
    const isCommercialA = typeA.includes('keresk') || typeA.includes('iroda') || typeA.includes('üzlet') || typeA.includes('uzlet');
    const isCommercialB = typeB.includes('keresk') || typeB.includes('iroda') || typeB.includes('üzlet') || typeB.includes('uzlet');
    
    const isGovernmentA = typeA.includes('közép') || typeA.includes('kozep') || typeA.includes('hivatal');
    const isGovernmentB = typeB.includes('közép') || typeB.includes('kozep') || typeB.includes('hivatal');
    
    const isEducationalA = typeA.includes('oktat') || typeA.includes('iskola') || typeA.includes('egyetem');
    const isEducationalB = typeB.includes('oktat') || typeB.includes('iskola') || typeB.includes('egyetem');
    
    // Group buildings by their primary function
    if (isResidentialA && !isResidentialB) return -1;
    if (!isResidentialA && isResidentialB) return 1;
    if (isCommercialA && !isCommercialB) return -1;
    if (!isCommercialA && isCommercialB) return 1;
    if (isGovernmentA && !isGovernmentB) return -1;
    if (!isGovernmentA && isGovernmentB) return 1;
    if (isEducationalA && !isEducationalB) return -1;
    if (!isEducationalA && isEducationalB) return 1;
    
    return 0;
  });
  
  // Calculate grid pattern for each zone
  // Result will contain building objects with proper positioning
  return sortedBuildings.map((epulet, index) => {
    // Determine building type and assign to appropriate zone
    const type = epulet.tipus.toLowerCase();
    
    // Choose zone based on building type
    let zone;
    let zoneGridSize;
    let buildingSpacing;
    
    // Residential buildings
    if (type.includes('lakó') || type.includes('lako')) {
      zone = zones.residential;
      zoneGridSize = 15; // Closer together in residential areas
      buildingSpacing = 12;
    } 
    // Commercial/office buildings
    else if (type.includes('keresk') || type.includes('iroda') || type.includes('üzlet') || type.includes('uzlet')) {
      zone = zones.commercial;
      zoneGridSize = 25; // More space between commercial buildings
      buildingSpacing = 18;
    }
    // Government/public buildings 
    else if (type.includes('közép') || type.includes('kozep') || type.includes('hivatal')) {
      zone = zones.government;
      zoneGridSize = 30; // More space for government buildings
      buildingSpacing = 20;
    }
    // Educational buildings
    else if (type.includes('oktat') || type.includes('iskola') || type.includes('egyetem')) {
      zone = zones.educational;
      zoneGridSize = 25;
      buildingSpacing = 18;
    }
    // Default to central plaza for special buildings
    else {
      zone = zones.centralPlaza;
      zoneGridSize = 20;
      buildingSpacing = 15;
    }
    
    // Calculate zone dimensions
    const zoneWidth = zone.x[1] - zone.x[0];
    const zoneDepth = zone.z[1] - zone.z[0];
    
    // How many buildings can fit in this zone
    const buildingsPerRow = Math.floor(zoneWidth / zoneGridSize);
    
    // Place building in a grid within its zone
    const relativeIndex = sortedBuildings
      .slice(0, index)
      .filter(b => {
        const bType = b.tipus.toLowerCase();
        // Count only buildings in the same zone type
        return (
          (type.includes('lakó') || type.includes('lako')) && (bType.includes('lakó') || bType.includes('lako')) ||
          (type.includes('keresk') || type.includes('iroda')) && (bType.includes('keresk') || bType.includes('iroda')) ||
          (type.includes('közép') || type.includes('kozep')) && (bType.includes('közép') || bType.includes('kozep')) ||
          (type.includes('oktat') || type.includes('iskola')) && (bType.includes('oktat') || bType.includes('iskola')) ||
          (!type.includes('lakó') && !type.includes('lako') && !type.includes('keresk') && !type.includes('iroda') && 
           !type.includes('közép') && !type.includes('kozep') && !type.includes('oktat') && !type.includes('iskola'))
        );
      }).length;
    
    // Calculate grid position
    const row = Math.floor(relativeIndex / buildingsPerRow);
    const col = relativeIndex % buildingsPerRow;
    
    // Compute actual position with some deterministic variation
    // Use building ID for deterministic positioning
    const seed = epulet.azonosito % 1000;
    
    // Position with slight random offset for natural look, but deterministic
    const posX = zone.x[0] + col * zoneGridSize + ((seed % 10) / 10 - 0.5) * 5;
    const posZ = zone.z[0] + row * zoneGridSize + ((Math.floor(seed / 10) % 10) / 10 - 0.5) * 5;
    
    // Ensure the building stays within zone boundaries
    const x = Math.max(zone.x[0] + 5, Math.min(zone.x[1] - 5, posX));
    const z = Math.max(zone.z[0] + 5, Math.min(zone.z[1] - 5, posZ));
    
    // Scale buildings based on floor area with min/max constraints
    // Also adjust based on type - commercial buildings are taller, residential more varied
    const baseScale = Math.sqrt(epulet.alapterulet) / 20;
    let scale = Math.max(0.5, Math.min(baseScale, 3));
    
    // Height varies by building type
    let heightFactor = 1.0;
    
    if (type.includes('lakó') || type.includes('lako')) {
      // Residential buildings - varied height
      heightFactor = 0.8 + (seed % 5) / 10; // 0.8 to 1.3
    } else if (type.includes('keresk') || type.includes('iroda')) {
      // Commercial/office buildings - taller
      heightFactor = 1.5 + (seed % 5) / 10; // 1.5 to 2.0
    } else if (type.includes('oktat') || type.includes('iskola')) {
      // Educational buildings - medium height, wide
      heightFactor = 1.2;
      scale = Math.max(scale, 1.2); // Ensure minimum size for schools
    } else if (type.includes('vallási')) {
      // Religious buildings - tall and special
      heightFactor = 2.0;
    } else if (type.includes('közép') || type.includes('kozep')) {
      // Government buildings - substantial
      heightFactor = 1.4;
      scale = Math.max(scale, 1.3); // Ensure minimum size for government buildings
    } else {
      // Other buildings - standard height
      heightFactor = 1.0 + (seed % 5) / 10;
    }
    
    return {
      id: epulet.azonosito,
      name: epulet.nev,
      type: epulet.tipus.toLowerCase(),
      position: [x, 0, z],
      scale: [scale, scale * heightFactor, scale],
      condition: epulet.allapot,
      constructionDate: new Date(epulet.epitesi_datum),
      floorArea: epulet.alapterulet,
      zoneType: type.includes('lakó') || type.includes('lako') ? 'residential' :
                type.includes('keresk') || type.includes('iroda') ? 'commercial' :
                type.includes('oktat') || type.includes('iskola') ? 'educational' :
                type.includes('közép') || type.includes('kozep') ? 'government' : 'other'
    };
  });
}

/**
 * Transform building data for statistics
 */
export function transformEpuletekForStats(data: EpuletResponse) {
  // Count buildings by type
  const typeCounts = data.epuletek.reduce((acc, epulet) => {
    const type = epulet.tipus.toLowerCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count buildings by condition
  const conditionCounts = data.epuletek.reduce((acc, epulet) => {
    const condition = epulet.allapot;
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate average building age
  const now = new Date();
  const totalAge = data.epuletek.reduce((sum, epulet) => {
    const buildingDate = new Date(epulet.epitesi_datum);
    const ageInYears = (now.getTime() - buildingDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return sum + ageInYears;
  }, 0);
  
  const averageAge = data.epuletek.length > 0 
    ? Math.round(totalAge / data.epuletek.length) 
    : 0;
  
  return {
    typeCounts,
    conditionCounts,
    averageAge,
    totalBuildings: data.epuletek.length,
  };
}

/**
 * Transform building data specifically for chart visualizations
 */
export function transformEpuletekForCharts(data: EpuletResponse) {
  if (!data || !data.epuletek || !Array.isArray(data.epuletek)) {
    console.warn('Invalid or missing building data for chart transform');
    return {
      epuletTipusAdatok: [],
      allapotEloszlas: [],
      korszakEloszlas: []
    };
  }
  
  // Transform building types for pie/donut chart
  const epuletTipusok = data.epuletek.reduce((acc, epulet) => {
    const tipus = epulet.tipus;
    acc[tipus] = (acc[tipus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const epuletTipusAdatok = Object.entries(epuletTipusok).map(([tipus, ertek]) => ({
    id: tipus,
    label: tipus,
    value: ertek
  }));
  
  // Transform building conditions for pie/donut chart
  const allapotok = data.epuletek.reduce((acc, epulet) => {
    const allapot = epulet.allapot;
    acc[allapot] = (acc[allapot] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const allapotEloszlas = Object.entries(allapotok).map(([allapot, ertek]) => ({
    id: allapot,
    label: allapot,
    value: ertek
  }));
  
  // Group buildings by construction decade for timeline/bar chart
  const currentYear = new Date().getFullYear();
  const decades = data.epuletek.reduce((acc, epulet) => {
    const year = new Date(epulet.epitesi_datum).getFullYear();
    const decade = Math.floor(year / 10) * 10;
    acc[`${decade}-${decade + 9}`] = (acc[`${decade}-${decade + 9}`] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort decades chronologically
  const korszakEloszlas = Object.entries(decades)
    .sort(([decadeA], [decadeB]) => {
      const startA = parseInt(decadeA.split('-')[0]);
      const startB = parseInt(decadeB.split('-')[0]);
      return startA - startB;
    })
    .map(([decade, count]) => ({
      decade,
      count
    }));
  
  return {
    epuletTipusAdatok,
    allapotEloszlas,
    korszakEloszlas
  };
}

// Export the refresh interval
export { REFRESH_INTERVAL }; 