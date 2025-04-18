'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // After mounting, we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsTransitioning(true);
    // Small delay to allow transition to start
    setTimeout(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }, 50);
    // Reset after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1500);
  };

  if (!mounted) return null;
  
  const isDark = theme === 'dark';

  return (
    <div className="relative">
      <motion.div
        whileHover={{ rotate: 15 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button 
          onClick={toggleTheme}
          variant="glass" 
          size="icon"
          className={`rounded-full relative overflow-hidden ${isDark ? 'bg-opacity-20' : 'bg-opacity-10'} ${isTransitioning ? 'pointer-events-none' : ''}`}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div
            initial={false}
            animate={{ 
              rotate: isDark ? 0 : 180,
              scale: isDark ? 1 : 0,
              opacity: isDark ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute"
          >
            <IconSun size={20} className="text-yellow-400" />
          </motion.div>
          
          <motion.div
            initial={false}
            animate={{ 
              rotate: isDark ? 180 : 0,
              scale: isDark ? 0 : 1,
              opacity: isDark ? 0 : 1,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute"
          >
            <IconMoon size={20} className="text-blue-400" />
          </motion.div>
          
          <span className="sr-only">
            {isDark ? "Switch to light mode" : "Switch to dark mode"}
          </span>
        </Button>
      </motion.div>
      
      {/* Particles Effect on Click */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-0 h-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Generate particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className={`absolute w-2 h-2 rounded-full ${
                  isDark ? 'bg-yellow-400' : 'bg-blue-400'
                }`}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50,
                  opacity: 0,
                  scale: [1, Math.random() * 1.5 + 0.5, 0]
                }}
                transition={{ 
                  duration: Math.random() * 0.8 + 0.7,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 