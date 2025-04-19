import { fetchWithRetry } from './client';
import { StatisztikaResponse } from './types';

const ENDPOINT = '/statisztikak';
const REFRESH_INTERVAL = 5000; // 5 seconds refresh interval

// Alapértelmezett statisztikák hiba esetére
const DEFAULT_STATISZTIKAK: StatisztikaResponse = {
  id: 'default',
  statisztikak: {
    lakossag_szama: 0,
    lakossag_elegedettseg: 0,
    epuletek_szama: 0,
    lakossag_kor_eloszlas: { '0-18': 0, '19-39': 0, '40-64': 0, '65+': 0 },
    epulet_tipusok: { 'Lakóház': 0, 'Középület': 0, 'Kereskedelmi': 0, 'Oktatási': 0 },
    aktiv_projektek: 0,
    szolgaltatasok_szama: 0,
    fordulok_szama: 0,
    penzugyi_keret: 0,
    bevetel_kiadasok: { bevetel: 0, kiadas: 0 },
    varos_nev: "Nincs kapcsolat",
    aktualis_datum: new Date().toISOString()
  }
};

/**
 * Fetch city statistics data
 */
export async function fetchStatisztikak(): Promise<StatisztikaResponse> {
  console.log('Statisztika adatok lekérése kezdődik...');
  try {
    // Használjuk a cache-elt fetch-et 5 másodperces cache idővel
    const result = await fetchWithRetry<StatisztikaResponse>(ENDPOINT, 10, 500, REFRESH_INTERVAL);
    // Debug kiíratás
    console.log('Statisztikák sikeresen lekérve:', JSON.stringify(result).substring(0, 100) + '...');
    
    // Ellenőrizzük a válasz struktúráját
    if (!result.statisztikak) {
      console.error('Érvénytelen statisztika válasz', result);
      return DEFAULT_STATISZTIKAK;
    }
    
    return result;
  } catch (error) {
    console.error('Hiba a statisztikák lekérése közben:', error);
    // Hiba esetén alapértelmezett adatokat adunk vissza, hogy az UI ne hibásodjon meg
    return DEFAULT_STATISZTIKAK;
  }
}

/**
 * Transform raw statistics data for charts
 */
export function transformStatisztikakForCharts(data: StatisztikaResponse) {
  try {
    console.log('Statisztikák transzformációja kezdődik...');
    
    // Transform building types for pie chart
    const epuletTipusokChart = Object.entries(data.statisztikak.epulet_tipusok || {}).map(
      ([tipus, ertek]) => ({
        id: tipus,
        label: tipus,
        value: ertek,
      })
    );

    // Transform population age distribution for bar chart
    // Ensure we have the expected age groups with fallback to empty object if missing
    const korEloszlasData = data.statisztikak.lakossag_kor_eloszlas || {
      '0-18': 0, 
      '19-39': 0, 
      '40-64': 0, 
      '65+': 0
    };
    
    // Extract and sort age groups in correct order
    const korEloszlasChart = [
      { korosztaly: '0-18', ertek: korEloszlasData['0-18'] || 0 },
      { korosztaly: '19-35', ertek: korEloszlasData['19-39'] || 0 },
      { korosztaly: '36-65', ertek: korEloszlasData['40-64'] || 0 },
      { korosztaly: '65+', ertek: korEloszlasData['65+'] || 0 }
    ];

    // Budget data for gauge charts
    const penzugyiData = {
      keret: data.statisztikak.penzugyi_keret || 0,
      bevetelKiadasok: data.statisztikak.bevetel_kiadasok || { bevetel: 0, kiadas: 0 },
    };

    // General statistics for cards
    const altalanosMutatok = {
      lakossagSzama: data.statisztikak.lakossag_szama || 0,
      elegedettseg: data.statisztikak.lakossag_elegedettseg || 0,
      epuletekSzama: data.statisztikak.epuletek_szama || 0,
      szolgaltatasokSzama: data.statisztikak.szolgaltatasok_szama || 0,
      aktivProjektek: data.statisztikak.aktiv_projektek || 0,
      fordulokSzama: data.statisztikak.fordulok_szama || 0,
      varosNev: data.statisztikak.varos_nev || 'Ismeretlen',
      aktualisDatum: new Date(data.statisztikak.aktualis_datum || new Date().toISOString()),
    };

    const result = {
      epuletTipusokChart,
      korEloszlasChart,
      penzugyiData,
      altalanosMutatok,
    };
    
    console.log('Statisztikák transzformációja sikeres:', korEloszlasChart);
    return result;
  } catch (error) {
    console.error('Hiba a statisztikák transzformációja közben:', error);
    // Default értékek visszaadása, hogy ne törjön el a UI
    return {
      epuletTipusokChart: [],
      korEloszlasChart: [
        { korosztaly: '0-18', ertek: 0 },
        { korosztaly: '19-39', ertek: 0 },
        { korosztaly: '40-64', ertek: 0 },
        { korosztaly: '65+', ertek: 0 }
      ],
      penzugyiData: { keret: 0, bevetelKiadasok: { bevetel: 0, kiadas: 0 } },
      altalanosMutatok: {
        lakossagSzama: 0,
        elegedettseg: 0,
        epuletekSzama: 0,
        szolgaltatasokSzama: 0,
        aktivProjektek: 0,
        fordulokSzama: 0,
        varosNev: 'Ismeretlen',
        aktualisDatum: new Date(),
      }
    };
  }
}

// Constants for the API
export { REFRESH_INTERVAL }; 