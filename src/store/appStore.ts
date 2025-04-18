import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { 
  StatisztikaResponse,
  EpuletResponse,
  EpitesResponse 
} from '@/lib/api/types';
import { 
  transformStatisztikakForCharts 
} from '@/lib/api/statisztikak';
import { 
  transformEpuletekFor3D,
  transformEpuletekForStats
} from '@/lib/api/epuletek';
import { 
  transformEpitesekForViz,
  transformEpitesekForTimeline
} from '@/lib/api/epitesek';
import { EsemenyekResponse } from '@/lib/api/esemenyek';
import { produce } from 'immer';

// Camera state for 3D view
export type CameraView = 'overhead' | 'isometric' | 'first-person';

// Add performance mode to state
export type PerformanceMode = 'high' | 'medium' | 'low';

// Interface for the main app store
interface AppState {
  // Raw API data
  statisztikakData: StatisztikaResponse | null;
  epuletekData: EpuletResponse | null;
  epitesekData: EpitesResponse | null;
  
  // Loading and error states
  isLoading: {
    statisztikak: boolean;
    epuletek: boolean;
    epitesek: boolean;
  };
  errors: {
    statisztikak: string | null;
    epuletek: string | null;
    epitesek: string | null;
  };
  
  // 3D visualization state
  selectedBuildingId: number | null;
  cameraView: CameraView;
  showLabels: boolean;
  
  // Filters
  filters: {
    buildingType: string | null;
    buildingCondition: string | null;
    constructionStatus: string | null;
  };
  
  // Refresh counter to force updates
  refreshCounter: number;
  
  // Performance settings
  performanceMode: PerformanceMode;
  
  // Actions
  setStatisztikakData: (data: StatisztikaResponse) => void;
  setEpuletekData: (data: EpuletResponse) => void;
  setEpitesekData: (data: EpitesResponse) => void;
  
  setLoading: (key: keyof AppState['isLoading'], value: boolean) => void;
  setError: (key: keyof AppState['errors'], error: string | null) => void;
  
  selectBuilding: (id: number | null) => void;
  setCameraView: (view: CameraView) => void;
  toggleLabels: () => void;
  
  setFilter: <K extends keyof AppState['filters']>(
    key: K, 
    value: AppState['filters'][K]
  ) => void;
  resetFilters: () => void;
  
  // Method to clear all data for refresh
  clearData: () => Promise<void>;
  
  // Method to force a refresh of all components
  forceRefresh: () => void;
  
  // Derived data
  getTransformedData: () => {
    charts: ReturnType<typeof transformStatisztikakForCharts> | null;
    buildings3D: ReturnType<typeof transformEpuletekFor3D> | null;
    buildingStats: ReturnType<typeof transformEpuletekForStats> | null;
    constructionViz: ReturnType<typeof transformEpitesekForViz> | null;
    timeline: ReturnType<typeof transformEpitesekForTimeline> | null;
    esemenyek: any[];
  };
  
  // Performance mode with persistence in localStorage
  setPerformanceMode: (mode: PerformanceMode) => void;
  
  // Events data
  esemenyekData: EsemenyekResponse | null;
  setEsemenyekData: (data: EsemenyekResponse) => void;
}

// More efficient caching with WeakMap that allows garbage collection
const transformedDataCache = new Map();

// Helper function to create a unique cache key
const createCacheKey = (statisztikakData, epuletekData, epitesekData) => {
  return JSON.stringify({
    statisztikak: statisztikakData ? statisztikakData.id : null,
    epuletek: epuletekData ? epuletekData.id : null,
    epitesek: epitesekData ? epitesekData.id : null
  });
};

// Build the App Store with Zustand
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        statisztikakData: null,
        epuletekData: null,
        epitesekData: null,
        
        isLoading: {
          statisztikak: false,
          epuletek: false,
          epitesek: false,
        },
        
        errors: {
          statisztikak: null,
          epuletek: null,
          epitesek: null,
        },
        
        selectedBuildingId: null,
        cameraView: 'isometric',
        showLabels: true,
        
        filters: {
          buildingType: null,
          buildingCondition: null,
          constructionStatus: null,
        },
        
        // Refresh counter for triggering updates
        refreshCounter: 0,
        
        // Performance mode with persistence in localStorage
        performanceMode: (() => {
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('performanceMode');
            if (saved && ['high', 'medium', 'low'].includes(saved)) {
              return saved as PerformanceMode;
            }
            
            // Auto-detect initial performance based on device
            if (/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)) {
              return 'low';
            }
          }
          return 'high';
        })(),
        
        // Actions
        setStatisztikakData: (data) => set((state) => {
          // Clear cache if data has changed
          if (JSON.stringify(data?.id) !== JSON.stringify(state.statisztikakData?.id)) {
            transformedDataCache.clear();
          }
          return { 
            statisztikakData: data,
            refreshCounter: state.refreshCounter + 1
          };
        }),
        
        setEpuletekData: (data) => set((state) => {
          // Clear cache if data has changed
          if (JSON.stringify(data?.id) !== JSON.stringify(state.epuletekData?.id)) {
            transformedDataCache.clear();
          }
          return { 
            epuletekData: data,
            refreshCounter: state.refreshCounter + 1
          };
        }),
        
        setEpitesekData: (data) => set((state) => {
          // Clear cache if data has changed
          if (JSON.stringify(data?.id) !== JSON.stringify(state.epitesekData?.id)) {
            transformedDataCache.clear();
          }
          return { 
            epitesekData: data,
            refreshCounter: state.refreshCounter + 1
          };
        }),
        
        setLoading: (key, value) => set((state) => ({
          isLoading: { ...state.isLoading, [key]: value }
        })),
        
        setError: (key, error) => set((state) => ({
          errors: { ...state.errors, [key]: error }
        })),
        
        selectBuilding: (id) => set({ selectedBuildingId: id }),
        setCameraView: (view) => set({ cameraView: view }),
        toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
        
        setFilter: (key, value) => set((state) => ({
          filters: { ...state.filters, [key]: value }
        })),
        
        resetFilters: () => set({
          filters: {
            buildingType: null,
            buildingCondition: null,
            constructionStatus: null,
          }
        }),
        
        // Method to clear all data for refresh
        clearData: async () => {
          // Clear all cached data
          transformedDataCache.clear();
          
          // Only update the loading state, don't clear existing data
          // This ensures we don't show "offline" during refresh
          set((state) => ({
            isLoading: {
              statisztikak: true,
              epuletek: true,
              epitesek: true,
            },
            refreshCounter: state.refreshCounter + 1
          }));
          
          return Promise.resolve();
        },
        
        // Method to force a refresh of all components
        forceRefresh: () => set((state) => ({
          refreshCounter: state.refreshCounter + 1
        })),
        
        // Derived data
        getTransformedData: () => {
          const { statisztikakData, epuletekData, epitesekData, esemenyekData, refreshCounter } = get();
          
          // Use cached value if refresh counter hasn't changed
          const cacheKey = refreshCounter;
          if (transformedDataCache.has(cacheKey)) {
            return transformedDataCache.get(cacheKey);
          }
          
          // Transform data for visualization & stats
          const charts = statisztikakData 
            ? transformStatisztikakForCharts(statisztikakData) 
            : null;
            
          const buildings3D = epuletekData 
            ? transformEpuletekFor3D(epuletekData) 
            : null;
            
          const buildingStats = epuletekData 
            ? transformEpuletekForStats(epuletekData) 
            : null;
            
          const constructionViz = epitesekData 
            ? transformEpitesekForViz(epitesekData) 
            : null;
            
          const timeline = epitesekData 
            ? transformEpitesekForTimeline(epitesekData) 
            : null;
            
          // Get events data
          const esemenyek = esemenyekData?.esemenyek || [];
          
          // Return a single object with all data
          const result = {
            charts,
            buildings3D,
            buildingStats,
            constructionViz,
            timeline,
            esemenyek,
          };
          
          // Cache the result
          transformedDataCache.set(cacheKey, result);
          
          return result;
        },
        
        // Performance mode with persistence in localStorage
        setPerformanceMode: (mode) => {
          set({ performanceMode: mode });
          if (typeof window !== 'undefined') {
            localStorage.setItem('performanceMode', mode);
          }
        },
        
        // Events data
        esemenyekData: null,
        setEsemenyekData: (data) => set((state) => {
          return { 
            esemenyekData: data,
            refreshCounter: state.refreshCounter + 1
          };
        }),
      }),
      { name: 'app-store' }
    )
  )
); 