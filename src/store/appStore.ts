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
import { AppState } from './appTypes';
import { transformEpuletekForCharts } from '@/lib/api/epuletek';
import { transformEpitesekForCharts } from '@/lib/api/epitesek';
import { transformEsemenyekForCharts } from '@/lib/api/esemenyek';
import { transformSzolgaltatasokForCharts } from '@/lib/api/szolgaltatasok';

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
    esemenyek: boolean;
    szolgaltatasok: boolean;
  };
  errors: {
    statisztikak: string | null;
    epuletek: string | null;
    epitesek: string | null;
    esemenyek: string | null;
    szolgaltatasok: string | null;
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
  
  // New fields for the updated app state
  szolgaltatasokData: any | null;
  setSzolgaltatasokData: (data: any) => void;
}

// Cache for transformed data to avoid recalculation on each getTransformedData call
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
        // State
        refreshCounter: 0,
        statisztikakData: null,
        epuletekData: null,
        epitesekData: null,
        esemenyekData: null,
        szolgaltatasokData: null,
        cameraView: 'overview',
        selectedBuildingId: null,
        showLabels: true,
        isLoading: {
          statisztikak: true,
          epuletek: true,
          epitesek: true,
          esemenyek: true,
          szolgaltatasok: true,
        },
        errors: {
          statisztikak: null,
          epuletek: null,
          epitesek: null,
          esemenyek: null,
          szolgaltatasok: null,
        },
        
        // Filters
        filters: {
          buildingType: null,
          buildingCondition: null,
          constructionStatus: null,
        },
        
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
        setCameraView: (view) => set({ cameraView: view }),
        
        setSelectedBuilding: (building) => set({ selectedBuildingId: building }),
        
        setStatisztikakData: (data) => {
          set((state) => ({
            statisztikakData: data,
            // Reset transformed data cache when receiving new data
            refreshCounter: state.refreshCounter + 1
          }));
          transformedDataCache.clear();
        },
        
        setEpuletekData: (data) => {
          set((state) => ({
            epuletekData: data,
            // Reset transformed data cache when receiving new data
            refreshCounter: state.refreshCounter + 1
          }));
          transformedDataCache.clear();
        },
        
        setEpitesekData: (data) => {
          set((state) => ({
            epitesekData: data,
            // Reset transformed data cache when receiving new data
            refreshCounter: state.refreshCounter + 1
          }));
          transformedDataCache.clear();
        },
        
        setEsemenyekData: (data) => {
          set((state) => ({
            esemenyekData: data,
            // Reset transformed data cache when receiving new data
            refreshCounter: state.refreshCounter + 1
          }));
          transformedDataCache.clear();
        },
        
        setSzolgaltatasokData: (data) => {
          set((state) => ({
            szolgaltatasokData: data,
            // Reset transformed data cache when receiving new data
            refreshCounter: state.refreshCounter + 1
          }));
          transformedDataCache.clear();
        },
        
        setLoading: (key, value) => {
          set((state) => ({
            isLoading: {
              ...state.isLoading,
              [key]: value
            }
          }));
        },
        
        setError: (key, value) => {
          set((state) => ({
            errors: {
              ...state.errors,
              [key]: value
            }
          }));
        },
        
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
              esemenyek: true,
              szolgaltatasok: true,
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
          const state = get();
          const cacheKey = `${state.refreshCounter}-${state.statisztikakData?.id}-${state.epuletekData?.id}-${state.epitesekData?.id}-${state.esemenyekData?.id}-${state.szolgaltatasokData?.id}`;
        
          if (transformedDataCache.has(cacheKey)) {
            return transformedDataCache.get(cacheKey);
          }
          
          // Transform statistics data for charts
          const charts = state.statisztikakData 
            ? transformStatisztikakForCharts(state.statisztikakData)
            : null;
          
          // Transform buildings data for charts
          const buildingCharts = state.epuletekData 
            ? transformEpuletekForCharts(state.epuletekData)
            : null;
            
          // Transform buildings data for stats
          const buildingStats = state.epuletekData 
            ? transformEpuletekForStats(state.epuletekData)
            : null;
            
          // Transform construction projects data for charts
          const epitesCharts = state.epitesekData 
            ? transformEpitesekForCharts(state.epitesekData)
            : null;
            
          // Transform events data for charts
          const events = state.esemenyekData 
            ? transformEsemenyekForCharts(state.esemenyekData)
            : null;
            
          // Transform services data for charts
          const serviceData = state.szolgaltatasokData 
            ? transformSzolgaltatasokForCharts(state.szolgaltatasokData)
            : null;
          
          // Aggregate all chart data together
          const aggregatedData = {
            // If chart data is available, we merge that into the charts object
            charts: charts ? {
              ...charts,
              ...buildingCharts,
              ...epitesCharts,
              // Add services chart data
              szolgaltatasokChart: serviceData?.szolgaltatasokChart || [],
            } : null,
            
            // Buildings specific stats are passed through as is
            buildingStats,
            
            // Events data is stored separately
            events: events?.eventsData || [],
            esemenyek: state.esemenyekData?.esemenyek || [],
            
            // Store services data
            serviceData,
            szolgaltatasok: state.szolgaltatasokData?.szolgaltatasok || []
          };
          
          // Cache the transformed data to avoid recalculation
          transformedDataCache.set(cacheKey, aggregatedData);
          
          return aggregatedData;
        },
        
        // Performance mode with persistence in localStorage
        setPerformanceMode: (mode) => {
          set({ performanceMode: mode });
          if (typeof window !== 'undefined') {
            localStorage.setItem('performanceMode', mode);
          }
        },
        
        // Filters
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
      }),
      {
        name: 'me-varos-storage',
        partialize: (state) => ({ 
          cameraView: state.cameraView,
          selectedBuildingId: state.selectedBuildingId
        }),
      }
    ),
    {
      name: 'MEVarosStore',
    }
  )
); 