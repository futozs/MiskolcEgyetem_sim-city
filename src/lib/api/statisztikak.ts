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
    const result = await fetchWithRetry<StatisztikaResponse>(ENDPOINT);
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
    const epuletTipusokChart = Object.entries(data.statisztikak.epulet_tipusok).map(
      ([tipus, ertek]) => ({
        id: tipus,
        label: tipus,
        value: ertek,
      })
    );

    // Transform population age distribution for bar chart
    const korEloszlasChart = Object.entries(data.statisztikak.lakossag_kor_eloszlas).map(
      ([korosztaly, ertek]) => ({
        korosztaly,
        ertek,
      })
    );

    // Budget data for gauge charts
    const penzugyiData = {
      keret: data.statisztikak.penzugyi_keret,
      bevetelKiadasok: data.statisztikak.bevetel_kiadasok,
    };

    // General statistics for cards
    const altalanosMutatok = {
      lakossagSzama: data.statisztikak.lakossag_szama,
      elegedettseg: data.statisztikak.lakossag_elegedettseg,
      epuletekSzama: data.statisztikak.epuletek_szama,
      szolgaltatasokSzama: data.statisztikak.szolgaltatasok_szama,
      aktivProjektek: data.statisztikak.aktiv_projektek,
      fordulokSzama: data.statisztikak.fordulok_szama,
      varosNev: data.statisztikak.varos_nev,
      aktualisDatum: new Date(data.statisztikak.aktualis_datum),
    };

    const result = {
      epuletTipusokChart,
      korEloszlasChart,
      penzugyiData,
      altalanosMutatok,
    };
    
    console.log('Statisztikák transzformációja sikeres');
    return result;
  } catch (error) {
    console.error('Hiba a statisztikák transzformációja közben:', error);
    // Default értékek visszaadása, hogy ne törjön el a UI
    return {
      epuletTipusokChart: [],
      korEloszlasChart: [],
      penzugyiData: { keret: 0, bevetelKiadasok: {} },
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