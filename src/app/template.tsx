'use client';

import { useLoadedData } from '@/lib/api/hooks';
import { Spinner } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

export default function Template({ children }: { children: React.ReactNode }) {
  // Initialize data fetching for all pages with enhanced loading
  const { isLoading, isDataLoaded, data, refreshAllData } = useLoadedData();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Debug
  console.log('Template loading state:', isLoading);
  console.log('Template error state:', false, null);
  console.log('Data loaded state:', isDataLoaded);

  // Set up application-wide auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
      setLastRefresh(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Force a re-render when data changes
  useEffect(() => {
    if (isDataLoaded) {
      console.log('All data properly loaded into store, ready to render components');
    }
  }, [isDataLoaded]);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.div
      key={`template-${theme}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1] 
      }}
      className="contents"
    >
      {/* Page transition overlay */}
      <motion.div
        key={`page-transition-${theme}`}
        className="fixed inset-0 z-50 pointer-events-none"
        initial={{ 
          clipPath: 'circle(0% at 50% 50%)'
        }}
        animate={{ 
          clipPath: 'circle(0% at 50% 50%)',
          transitionEnd: {
            display: 'none'
          }
        }}
        exit={{ 
          clipPath: 'circle(120% at 50% 50%)',
          display: 'block'
        }}
        transition={{ 
          duration: 0.7, 
          ease: [0.22, 1, 0.36, 1] 
        }}
        style={{
          background: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        }}
      />
      
      {isLoading && !isDataLoaded && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <Spinner size="lg" color="primary" />
            <p className="mt-2 text-center">Adatok betöltése...</p>
          </div>
        </div>
      )}
      
      {children}
    </motion.div>
  );
} 