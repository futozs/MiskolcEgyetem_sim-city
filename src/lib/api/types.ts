// API Response Types

// Statisztikák API Response
export interface StatisztikaResponse {
  statisztikak: {
    varos_nev: string;
    aktualis_datum: string;
    lakossag_szama: number;
    lakossag_elegedettseg: number;
    penzugyi_keret: number;
    epuletek_szama: number;
    szolgaltatasok_szama: number;
    aktiv_projektek: number;
    bevetel_kiadasok: Record<string, number>;
    epulet_tipusok: Record<string, number>;
    lakossag_kor_eloszlas: Record<string, number>;
    fordulok_szama: number;
  };
}

// Épületek API Response
export interface Epulet {
  azonosito: number;
  nev: string;
  tipus: string;
  alapterulet: number;
  allapot: string;
  epitesi_datum: string;
  cim?: string;
  becsult_ertek?: number;
  funkciok?: string[];
  alkalmazottak_szama?: number;
  energiafogyasztas?: number;
  tulajdonos?: string;
  leiras?: string;
}

export interface EpuletResponse {
  epuletek: Epulet[];
}

// Építések API Response
export interface Epites {
  azonosito: number;
  nev: string;
  tipus: string;
  koltseg: number;
  kezdo_datum: string;
  befejezo_datum: string;
  keszultsegi_fok: number;
  allapot: string;
}

export interface EpitesResponse {
  epitesek: Epites[];
} 