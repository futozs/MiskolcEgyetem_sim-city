import { StatisztikaResponse } from '@/lib/api/types';
import { EpuletResponse } from '@/lib/api/types';
import { EpitesResponse } from '@/lib/api/types';
import { EsemenyResponse } from '@/lib/api/types';
import { SzolgaltatasResponse } from '@/lib/api/types';

export interface AppState {
  // State
  refreshCounter: number;
  statisztikakData: StatisztikaResponse | null;
  epuletekData: EpuletResponse | null;
  epitesekData: EpitesResponse | null;
  esemenyekData: EsemenyResponse | null;
  szolgaltatasokData: SzolgaltatasResponse | null;
  cameraView: string;
  selectedBuilding: any;
  
  isLoading: {
    statisztikak: boolean;
    epuletek: boolean;
    epitesek: boolean;
    esemenyek: boolean;
    szolgaltatasok: boolean;
  };
  
  error: {
    statisztikak: string | null;
    epuletek: string | null;
    epitesek: string | null;
    esemenyek: string | null;
    szolgaltatasok: string | null;
  };
  
  // Actions
  setCameraView: (view: string) => void;
  setSelectedBuilding: (building: any) => void;
  
  setStatisztikakData: (data: StatisztikaResponse) => void;
  setEpuletekData: (data: EpuletResponse) => void;
  setEpitesekData: (data: EpitesResponse) => void;
  setEsemenyekData: (data: EsemenyResponse) => void;
  setSzolgaltatasokData: (data: SzolgaltatasResponse) => void;
  
  setLoading: (key: string, value: boolean) => void;
  setError: (key: string, value: string | null) => void;
  
  clearData: () => Promise<void>;
  forceRefresh: () => void;
  
  // Derived data
  getTransformedData: () => any;
} 