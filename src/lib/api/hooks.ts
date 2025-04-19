import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/appStore';
import { useEffect, useState, useRef } from 'react';

// Import API functions and constants
import { fetchStatisztikak, REFRESH_INTERVAL as STATS_INTERVAL } from './statisztikak';
import { fetchEpuletek, REFRESH_INTERVAL as EPULETEK_INTERVAL } from './epuletek';
import { fetchEpitesek, REFRESH_INTERVAL as EPITESEK_INTERVAL } from './epitesek';
import { fetchEsemenyek, REFRESH_INTERVAL as ESEMENYEK_INTERVAL } from './esemenyek';
import { fetchSzolgaltatasok, REFRESH_INTERVAL as SZOLGALTATASOK_INTERVAL } from './szolgaltatasok';
import { apiCache } from './cache';

// Query keys
export const QUERY_KEYS = {
  STATISZTIKAK: 'statisztikak',
  EPULETEK: 'epuletek',
  EPITESEK: 'epitesek',
  ESEMENYEK: 'esemenyek',
  SZOLGALTATASOK: 'szolgaltatasok',
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
    staleTime: STATS_INTERVAL - 1000,
    retry: 1,
  });
}

/**
 * Hook for fetching buildings with React Query
 */
export function useEpuletek() {
  const { 
    setEpuletekData, 
    setLoading, 
    setError 
  } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.EPULETEK],
    queryFn: fetchEpuletek,
    onSuccess: (data) => {
      setEpuletekData(data);
      setLoading('epuletek', false);
      
      // Ha alapértelmezett adatokat kaptunk vissza, akkor hibaüzenetet generálunk
      if (data.id === 'default') {
        setError('epuletek', 'Nem sikerült az épület adatok lekérése.');
      } else {
        setError('epuletek', null);
      }
    },
    onError: (error: Error) => {
      console.error('Épület adatok lekérési hiba:', error);
      setLoading('epuletek', false);
      setError('epuletek', error.message);
    },
    staleTime: EPULETEK_INTERVAL - 1000,
    retry: 1,
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
    staleTime: EPITESEK_INTERVAL - 1000,
    retry: 1,
  });
}

/**
 * Hook for fetching city events with React Query
 */
export function useEsemenyek() {
  const { 
    setEsemenyekData, 
    setLoading, 
    setError 
  } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.ESEMENYEK],
    queryFn: fetchEsemenyek,
    onSuccess: (data) => {
      setEsemenyekData(data);
      setLoading('esemenyek', false);
      
      // Ha alapértelmezett adatokat kaptunk vissza, akkor hibaüzenetet generálunk
      if (!data.esemenyek || data.esemenyek.length === 0) {
        setError('esemenyek', 'Nem sikerült az esemény adatok lekérése.');
      } else {
        setError('esemenyek', null);
      }
    },
    onError: (error: Error) => {
      console.error('Esemény adatok lekérési hiba:', error);
      setLoading('esemenyek', false);
      setError('esemenyek', error.message);
    },
    staleTime: ESEMENYEK_INTERVAL - 1000,
    retry: 1,
  });
}

/**
 * Hook for fetching city services with React Query
 */
export function useSzolgaltatasok() {
  const { 
    setSzolgaltatasokData, 
    setLoading, 
    setError 
  } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.SZOLGALTATASOK],
    queryFn: fetchSzolgaltatasok,
    onSuccess: (data) => {
      setSzolgaltatasokData(data);
      setLoading('szolgaltatasok', false);
      
      // Ha alapértelmezett adatokat kaptunk vissza, akkor hibaüzenetet generálunk
      if (data.id === 'default') {
        setError('szolgaltatasok', 'Nem sikerült a szolgáltatás adatok lekérése.');
      } else {
        setError('szolgaltatasok', null);
      }
    },
    onError: (error: Error) => {
      console.error('Szolgáltatás adatok lekérési hiba:', error);
      setLoading('szolgaltatasok', false);
      setError('szolgaltatasok', error.message);
    },
    staleTime: SZOLGALTATASOK_INTERVAL - 1000,
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
  const szolgaltatasokQuery = useSzolgaltatasok();
  
  const isLoading = 
    statisztikakQuery.isLoading || 
    epuletekQuery.isLoading || 
    epitesekQuery.isLoading ||
    esemenyekQuery.isLoading ||
    szolgaltatasokQuery.isLoading;
  
  const isError = 
    statisztikakQuery.isError || 
    epuletekQuery.isError || 
    epitesekQuery.isError ||
    esemenyekQuery.isError ||
    szolgaltatasokQuery.isError;
    
  const error = 
    statisztikakQuery.error || 
    epuletekQuery.error || 
    epitesekQuery.error ||
    esemenyekQuery.error ||
    szolgaltatasokQuery.error;
  
  return {
    statisztikakQuery,
    epuletekQuery,
    epitesekQuery,
    esemenyekQuery,
    szolgaltatasokQuery,
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
  const { isLoading, isError, statisztikakQuery, epuletekQuery, epitesekQuery, esemenyekQuery, szolgaltatasokQuery } = useAllData();
  const { getTransformedData, statisztikakData, epuletekData, epitesekData, esemenyekData, szolgaltatasokData, forceRefresh } = useAppStore();
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
      // Töröljük a cache-t a frissítés előtt
      apiCache.clearCache();
      
      // Force refetch all queries to trigger immediate refresh
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.STATISZTIKAK], type: 'active' }),
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.EPULETEK], type: 'active' }),
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.EPITESEK], type: 'active' }),
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.ESEMENYEK], type: 'active' }),
        queryClient.refetchQueries({ queryKey: [QUERY_KEYS.SZOLGALTATASOK], type: 'active' })
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
  
  useEffect(() => {
    if (szolgaltatasokQuery.data) {
      useAppStore.getState().setSzolgaltatasokData(szolgaltatasokQuery.data);
      // Force global refresh for all components
      forceRefresh();
    }
  }, [szolgaltatasokQuery.data, forceRefresh]);
  
  // Automatic refetch timer that respects the cache intervals
  useEffect(() => {
    // 5 másodpercenként próbáljuk frissíteni az adatokat
    // a Cache service fogja biztosítani, hogy csak akkor történik
    // fetch, ha az adott cache lejárt
    const timer = setInterval(() => {
      if (!isRefreshing) {
        // Ezt a metódust a React Query fogja automatikusan kezelni
        // és csak akkor fog egy tényleges fetch-et indítani, ha az adat régi
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STATISZTIKAK] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EPULETEK] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EPITESEK] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ESEMENYEK] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SZOLGALTATASOK] });
      }
    }, 5000);
    
    return () => clearInterval(timer);
  }, [queryClient, isRefreshing]);
  
  // Check if we have valid data from any source
  const hasValidData = Boolean(
    (statisztikakData && statisztikakData.id !== 'default') || 
    (epuletekData && epuletekData.id !== 'default') || 
    (epitesekData && epitesekData.id !== 'default') ||
    (esemenyekData && esemenyekData.esemenyek && esemenyekData.esemenyek.length > 0) ||
    (szolgaltatasokData && szolgaltatasokData.id !== 'default')
  );
  
  // Csak akkor legyen offline, ha tényleg nincs adat (nem refetch közben)
  const isGameOffline = !hasValidData && !isRefreshing;
  
  // Ez biztosítja, hogy a komponens mindig friss adatokkal térjen vissza minden rendereléskor
  const transformedData = getTransformedData();
  
  // Ellenőrizzük, hogy nem minden érték nulla/alapértelmezett-e az adatokban
  // JAVÍTVA: Használjunk olyan mezőneveket, amelyek tényleg léteznek a transformedData-ban
  const hasNonZeroValues = (() => {
    if (!transformedData || !transformedData.charts) return false;
    
    const { altalanosMutatok } = transformedData.charts;
    if (!altalanosMutatok) return false;
    
    // Ellenőrizzük, hogy bármelyik lényeges mező tartalmaz-e nem nulla értéket
    // Csak olyan mezőket használjunk, amelyek biztosan léteznek
    return (
      (altalanosMutatok.lakossagSzama > 0) || 
      (altalanosMutatok.epuletekSzama > 0) || 
      (altalanosMutatok.fordulokSzama > 0)
    );
  })();
  
  // JAVÍTVA: Az offline érzékelés logikája - csak akkor offline, ha nincs adat VAGY nincs hálózati kapcsolat
  // Ne használjuk a hasNonZeroValues-t az offline meghatározására, mivel a szervertől kapott 
  // adatok lehetnek "zéró" értékkel is, miközben a kapcsolat él
  const isActuallyOffline = isGameOffline;
  
  return {
    isLoading: false, // Mindig false-ot adunk vissza a betöltésre, hogy az UI azonnal megjelenjen
    isError: false, // Soha nem adunk vissza hiba állapotot, hogy a weblap működőképes maradjon
    data: transformedData,
    isDataLoaded: Boolean(statisztikakData || epuletekData || epitesekData || esemenyekData || szolgaltatasokData),
    isGameOffline: isActuallyOffline, // Most megfelelően jelzi a játék állapotát az érdemi adatok alapján
    isRefreshing, // Jelzi, hogy az adatok frissítése folyamatban van-e
    lastRefreshTime, // Az utolsó sikeres frissítés időbélyege
    refreshAllData, // Függvény az összes adat manuális frissítéséhez
    forceUpdate // Update-számláló olyan komponensek számára, amelyeknek szükséges a kényszerített frissítés
  };
} 