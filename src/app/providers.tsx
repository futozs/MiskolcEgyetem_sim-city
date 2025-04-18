'use client';

import { NextUIProvider } from '@nextui-org/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode, useEffect } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

// Create a client
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale, forcing a network request each time
      gcTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
      refetchOnWindowFocus: true,
      retry: 5,
      refetchInterval: 5000, // 5 seconds refetch interval
      refetchOnMount: 'always', // Always refetch on mount, not just when stale
      refetchOnReconnect: true,
      refetchIntervalInBackground: true, // Continue refreshing even when tab is in background
    },
  },
});

// Theme Animator Component for beautiful transitions
const ThemeAnimator = ({ children }: { children: ReactNode }) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Apply theme class to document immediately to avoid flash
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    
    // Force-fix text colors when theme changes to avoid gray text on white background
    const applyProperTextColors = () => {
      // Add a temporary class that will override any existing text colors
      document.documentElement.classList.add('theme-transition');
      
      // Remove it after transition completes
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 1000);
    };
    
    if (mounted) {
      applyProperTextColors();
    }
  }, [theme, resolvedTheme, mounted]);
  
  if (!mounted) return <>{children}</>;
  
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="contents"
        >
          {children}
        </motion.div>
      </AnimatePresence>
      
      {/* Theme transition overlay - appears when theme changes */}
      <AnimatePresence mode="wait">
        {theme && (
          <motion.div
            key={`theme-transition-${theme}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1.5, 
              times: [0, 0.2, 1],
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
            style={{
              background: theme === 'dark' 
                ? 'radial-gradient(circle at center, rgba(124, 58, 237, 0.5) 0%, rgba(0, 0, 0, 0.8) 70%)' 
                : 'radial-gradient(circle at center, rgba(248, 250, 252, 0.9) 0%, rgba(96, 165, 250, 0.3) 70%)'
            }}
          >
            <motion.div 
              className="absolute inset-0"
              animate={{
                scale: [0.8, 1.2],
                opacity: [0.6, 0]
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                background: `${theme === 'dark' 
                  ? 'radial-gradient(circle at center, rgba(124, 58, 237, 0.8) 0%, transparent 70%)' 
                  : 'radial-gradient(circle at center, rgba(248, 250, 252, 0.9) 0%, rgba(79, 70, 229, 0.2) 70%)'}`
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export function Providers({ children }: { children: ReactNode }) {
  // Create a new client for every request
  const [queryClient] = useState(() => createQueryClient());
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  console.log('Query Provider inicializálva');

  return (
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <ThemeAnimator>
            {mounted && children}
          </ThemeAnimator>
        </ThemeProvider>
      </NextUIProvider>
    </QueryClientProvider>
  );
} 