import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/appStore';
import { useEffect, useState, useRef } from 'react';

// Import API functions and constants
import { fetchStatisztikak, REFRESH_INTERVAL as STATS_INTERVAL } from './statisztikak';
import { fetchEpuletek, REFRESH_INTERVAL as EPULETEK_INTERVAL } from './epuletek';
import { fetchEpitesek, REFRESH_INTERVAL as EPITESEK_INTERVAL } from './epitesek';
import { fetchEsemenyek, REFRESH_INTERVAL as ESEMENYEK_INTERVAL } from './esemenyek';

// Query keys
export const QUERY_KEYS = {
  STATISZTIKAK: 'statisztikak',
  EPULETEK: 'epuletek',
  EPITESEK: 'epitesek',
  ESEMENYEK: 'esemenyek',
};

/**
 * Hook for fetching city statistics with React Query
 */
export function useStatisztikak() {
  const { 
    setStatisztikakData, 
    setLoading, 
    setError 
  } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.STATISZTIKAK],
    queryFn: fetchStatisztikak,
    refetchInterval: STATS_INTERVAL,
    onSuccess: (data) => {
      setStatisztikakData(data);
      setLoading('statisztikak', false);
      
      // Ha alapértelmezett adatokat kaptunk vissza, akkor hibaüzenetet generálunk
      // Ez jelzi, hogy a fetch sikeres volt, de nem valódi adatokat kaptunk
      if (data.id === 'default') {
        setError('statisztikak', 'Nem sikerült az adatok lekérése a szerverről.');
      } else {
        setError('statisztikak', null);
      }
    },
    onError: (error: Error) => {
      console.error('Statisztika adatok lekérési hiba:', error);
      setLoading('statisztikak', false);
      setError('statisztikak', error.message);
    },
    staleTime: 0,
    retry: 1,
  });
}

/**
 * Hook for directly fetching buildings data
 */
export function useEpuletek() {
  const fetchDirectEpuletek = async () => {
    try {
      // Use the Next.js API route as a proxy instead of direct call to localhost:6666
      const response = await fetch('/api/epuletek');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      return { epuletek: [] };
    }
  };

  return useQuery({
    queryKey: [QUERY_KEYS.EPULETEK],
    queryFn: fetchDirectEpuletek,
    refetchInterval: EPULETEK_INTERVAL,
  });
}

/**
 * Hook for fetching construction projects with React Query
 */
export function useEpitesek() {
  const { 
    setEpitesekData, 
    setLoading, 
    setError 
  } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.EPITESEK],
    queryFn: fetchEpitesek,
    refetchInterval: EPITESEK_INTERVAL,
    onSuccess: (data) => {
      setEpitesekData(data);
      setLoading('epitesek', false);
      
      // Ha alapértelmezett adatokat kaptunk vissza, akkor hibaüzenetet generálunk
      if (data.id === 'default') {
        setError('epitesek', 'Nem sikerült az építés adatok lekérése.');
      } else {
        setError('epitesek', null);
      }
    },
    onError: (error: Error) => {
      console.error('Építés adatok lekérési hiba:', error);
      setLoading('epitesek', false);
      setError('epitesek', error.message);
    },
    staleTime: 0,
    retry: 1,
  });
}

/**
 * Hook for fetching events data with React Query
 */
export function useEsemenyek() {
  const { 
    setEsemenyekData, 
    setLoading, 
    setError 
  } = useAppStore();
  
  const fetchDirectEsemenyek = async () => {
    try {
      // Use the Next.js API route as a proxy instead of direct call to localhost:6666
      const response = await fetch('/api/esemenyek');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      console.log('Fetching events from API');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return { esemenyek: [] };
    }
  };
  
  return useQuery({
    queryKey: [QUERY_KEYS.ESEMENYEK],
    queryFn: fetchDirectEsemenyek,
    refetchInterval: ESEMENYEK_INTERVAL,
    onSuccess: (data) => {
      setEsemenyekData(data);
      setLoading('esemenyek', false);
      setError('esemenyek', null);
    },
    onError: (error: Error) => {
      console.error('Események adatok lekérési hiba:', error);
      setLoading('esemenyek', false);
      setError('esemenyek', error.message);
    },
    staleTime: 0,
    retry: 1,
  });
}

/**
 * Hook that combines all data fetching hooks
 */
export function useAllData() {
  const statisztikakQuery = useStatisztikak();
  const epuletekQuery = useEpuletek();
  const epitesekQuery = useEpitesek();
  const esemenyekQuery = useEsemenyek();
  
  const isLoading = 
    statisztikakQuery.isLoading || 
    epuletekQuery.isLoading || 
    epitesekQuery.isLoading ||
    esemenyekQuery.isLoading;
  
  const isError = 
    statisztikakQuery.isError || 
    epuletekQuery.isError || 
    epitesekQuery.isError ||
    esemenyekQuery.isError;
    
  const error = 
    statisztikakQuery.error || 
    epuletekQuery.error || 
    epitesekQuery.error ||
    esemenyekQuery.error;
  
  return {
    statisztikakQuery,
    epuletekQuery,
    epitesekQuery,
    esemenyekQuery,
    isLoading,
    isError,
    error,
  };
}

/**
 * New hook to ensure data is properly loaded in components
 * This hook ensures that data from API is synchronously loaded into the app store
 */
export function useLoadedData() {
  const { isLoading, isError, statisztikakQuery, epuletekQuery, epitesekQuery, esemenyekQuery } = useAllData();
  const { getTransformedData, statisztikakData, epuletekData, epitesekData, esemenyekData, forceRefresh } = useAppStore();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a state to force component rerender when data changes
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Function to manually refresh all data with debounce protection
  const refreshAllData = async () => {
    // Prevent multiple refreshes within 2 seconds
    if (isRefreshing || Date.now() - lastRefreshTime < 2000) {
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // Force refetch all queries to trigger immediate refresh
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.STATISZTIKAK], type: 'active' }),
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.EPULETEK], type: 'active' }),
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.EPITESEK], type: 'active' }),
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.ESEMENYEK], type: 'active' })
      ]);
      
      // Force update store and all components using it
      forceRefresh();
      
      // Force component rerenders
      setForceUpdate(prev => prev + 1);
      
      // Update refresh timestamp
      setLastRefreshTime(Date.now());
    } finally {
      // Reset refreshing state after a short delay to prevent rapid refreshes
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        setIsRefreshing(false);
      }, 2000);
    }
  };
  
  // Manual force update for components when data changes
  useEffect(() => {
    if (statisztikakQuery.data) {
      useAppStore.getState().setStatisztikakData(statisztikakQuery.data);
      // Force global refresh for all components
      forceRefresh();
    }
  }, [statisztikakQuery.data, forceRefresh]);
  
  useEffect(() => {
    if (epuletekQuery.data) {
      useAppStore.getState().setEpuletekData(epuletekQuery.data);
      // Force global refresh for all components
      forceRefresh();
    }
  }, [epuletekQuery.data, forceRefresh]);
  
  useEffect(() => {
    if (epitesekQuery.data) {
      useAppStore.getState().setEpitesekData(epitesekQuery.data);
      // Force global refresh for all components
      forceRefresh();
    }
  }, [epitesekQuery.data, forceRefresh]);
  
  useEffect(() => {
    if (esemenyekQuery.data) {
      useAppStore.getState().setEsemenyekData(esemenyekQuery.data);
      // Force global refresh for all components
      forceRefresh();
    }
  }, [esemenyekQuery.data, forceRefresh]);
  
  // Check if we have valid data from any source
  const hasValidData = Boolean(
    (statisztikakData && statisztikakData.id !== 'default') || 
    (epuletekData && epuletekData.id !== 'default') || 
    (epitesekData && epitesekData.id !== 'default') ||
    (esemenyekData && esemenyekData.esemenyek && esemenyekData.esemenyek.length > 0)
  );
  
  // Only set offline if we genuinely have no valid data (not just during refresh)
  const isGameOffline = !hasValidData && !isRefreshing;
  
  // This ensures that the component always returns fresh data on every render
  const transformedData = getTransformedData();
  
  return {
    isLoading: false, // Always return false for loading to ensure UI shows up immediately
    isError: false, // Never return error state to keep website functional
    data: transformedData,
    isDataLoaded: Boolean(statisztikakData || epuletekData || epitesekData || esemenyekData),
    isGameOffline, // Now properly indicates game status based on data availability
    isRefreshing, // Indicate if data is currently being refreshed
    lastRefreshTime, // Timestamp of the last successful refresh
    refreshAllData, // Function to manually refresh all data
    forceUpdate // Provide the update counter for components that need to force update
  };
} 