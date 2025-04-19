// API Response Types

// Statisztikák API Response
export interface StatisztikaResponse {
  id?: string;
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
export interface EpuletResponse {
  id?: string;
  epuletek: Array<Epulet>;
}

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

// Építések API Response
export interface EpitesResponse {
  id?: string;
  epitesek: Array<Epites>;
}

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

// Események API Response
export interface EsemenyResponse {
  id?: string;
  esemenyek: Array<Esemeny>;
}

export interface Esemeny {
  fordulo: number;
  esemeny: {
    nev: string;
    leiras: string;
    tipus: string;
    hatas?: {
      penz?: number;
      boldogsag?: number;
      lakossag?: number;
    };
  };
}

// Szolgáltatások API Response
export interface SzolgaltatasResponse {
  id?: string;
  szolgaltatasok: Array<Szolgaltatas>;
}

export interface Szolgaltatas {
  azonosito: number;
  nev: string;
  tipus: string;
  havi_koltseg: number;
  elegedettseg_hatas: number;
  lakossag_hatas: number;
  ertek: number;
  indulas_datum: string;
  aktiv: boolean;
  allami_tamogatas: number;
} 