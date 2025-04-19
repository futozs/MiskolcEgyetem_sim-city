'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconBrandGithub, 
  IconHeart, 
  IconHeartFilled,
  IconCode, 
  IconMeteor,
  IconRocket,
  IconWand,
  IconClick
} from '@tabler/icons-react';
import { siteConfig as config } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [hearts, setHearts] = useState<{id: number, x: number, y: number, size: number, opacity: number, duration: number}[]>([]);
  const [showSecretMessage, setShowSecretMessage] = useState(false);
  const [showNpmLogo, setShowNpmLogo] = useState(false);
  const [autoHearts, setAutoHearts] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const heartTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const footerLinks = [
    { name: 'Főoldal', href: '/' },
    { name: 'Várostérkép', href: '/varosterkep' },
    { name: 'Statisztikák', href: '/statisztikak' },
    { name: 'Projektek', href: '/projektek' },
  ];

  // Show hint after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showEasterEgg) {
        setShowHint(true);
        
        // Hide hint after 4 seconds
        const hideTimer = setTimeout(() => {
          setShowHint(false);
        }, 4000);
        
        return () => clearTimeout(hideTimer);
      }
    }, 5000); // Show hint after 5 seconds
    
    return () => clearTimeout(timer);
  }, [showEasterEgg]);

  // Generate random hearts
  const generateHeart = () => {
    if (footerRef.current) {
      const rect = footerRef.current.getBoundingClientRect();
      const x = Math.random() * rect.width;
      const size = Math.random() * 15 + 10; // 10-25px
      const opacity = Math.random() * 0.5 + 0.5; // 0.5-1.0
      const duration = Math.random() * 3 + 2; // 2-5s
      
      const newHeart = {
        id: Date.now() + Math.random(),
        x,
        y: 0,
        size,
        opacity,
        duration
      };
      
      setHearts(prev => [...prev, newHeart]);

      // Remove heart after animation completes
      setTimeout(() => {
        setHearts(prev => prev.filter(h => h.id !== newHeart.id));
      }, duration * 1000);
    }
  };

  // Heart animation easter egg
  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    setShowHint(false); // Hide hint when logo is clicked
    
    if (clickCount === 1) { // 2 clicks needed
      setShowEasterEgg(true);
      setClickCount(0);
      setAutoHearts(true);
      
      // Generate multiple hearts for initial burst
      for (let i = 0; i < 10; i++) {
        setTimeout(() => generateHeart(), i * 100);
      }
    }

    // Create a floating heart on each click
    generateHeart();
  };

  // Auto hearts generator
  useEffect(() => {
    if (autoHearts) {
      // Create timer to generate hearts continuously
      heartTimerRef.current = setInterval(() => {
        generateHeart();
      }, 500); // New heart every 500ms
    } else if (heartTimerRef.current) {
      clearInterval(heartTimerRef.current);
      heartTimerRef.current = null;
    }
    
    return () => {
      if (heartTimerRef.current) {
        clearInterval(heartTimerRef.current);
      }
    };
  }, [autoHearts]);

  // Easter egg reset
  useEffect(() => {
    if (showEasterEgg) {
      const timer = setTimeout(() => {
        setShowEasterEgg(false);
        setAutoHearts(false);
        
        // Clear any remaining hearts after easter egg is done
        setTimeout(() => {
          setHearts([]);
        }, 3000);
      }, 7000); // Extended to 7s to enjoy more hearts
      
      return () => clearTimeout(timer);
    }
  }, [showEasterEgg]);

  // Secret message toggle
  const toggleSecretMessage = () => {
    setShowSecretMessage(!showSecretMessage);
  };

  // npm logo toggle
  const toggleNpmLogo = () => {
    setShowNpmLogo(!showNpmLogo);
  };
  
  return (
    <footer 
      ref={footerRef}
      className={cn(
        "relative w-full border-t",
        isDark ? 'border-white/10 bg-black/30' : 'border-black/5 bg-white/30',
        "backdrop-blur-lg z-10 overflow-hidden"
      )}
    >
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          {/* Logo with Easter Egg */}
          <motion.div 
            className="flex items-center gap-2 relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoClick}
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
              isDark 
                ? 'from-purple-600 via-blue-700 to-cyan-600' 
                : 'from-purple-500 via-blue-600 to-cyan-500'
              } flex items-center justify-center text-white font-bold text-sm shadow-md cursor-pointer`}>
              ME
            </div>
            <motion.span 
              className={`text-base font-semibold ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-400 via-blue-300 to-cyan-400' 
                  : 'bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-600'
                } bg-clip-text text-transparent`}
              whileHover={{ letterSpacing: "0.05em" }}
            >
              Álomváros
            </motion.span>
            
            {/* Logo hint bubble */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  className={`absolute -top-10 left-0 px-2 py-1 text-xs rounded-full ${
                    isDark ? 'bg-white/10 text-white/80' : 'bg-black/5 text-black/70'
                  } backdrop-blur-md border ${isDark ? 'border-white/10' : 'border-black/5'} whitespace-nowrap`}
                  initial={{ opacity: 0, y: 5, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 15
                    }
                  }}
                  exit={{ opacity: 0, y: 5, scale: 0.8 }}
                >
                  <div className="flex items-center gap-1">
                    <IconClick size={12} className={isDark ? "text-pink-300" : "text-pink-500"} />
                    <span>kattints duplán</span>
                    <IconHeart size={10} className="text-red-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Navigation Links - Hide when easter egg is active */}
          <AnimatePresence>
            {!showEasterEgg && (
              <motion.div 
                className="flex gap-6 md:gap-8"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {footerLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link 
                      href={link.href}
                      className={`text-sm ${
                        isDark 
                          ? 'text-gray-400 hover:text-white' 
                          : 'text-gray-600 hover:text-black'
                        } transition-colors`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Interactive Icons - Hide when easter egg is active */}
          <AnimatePresence>
            {!showEasterEgg && (
              <motion.div 
                className="flex items-center gap-4 md:gap-6"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  whileHover={{ 
                    rotate: [0, -10, 10, -10, 0],
                    transition: { duration: 0.5 }
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="text-sm text-gray-500 flex items-center gap-1 cursor-pointer"
                  onClick={toggleSecretMessage}
                >
                  <IconWand size={16} className={isDark ? "text-purple-400" : "text-purple-600"} />
                </motion.button>

                <motion.button
                  whileHover={{ y: [-1, -3, -1] }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm cursor-pointer"
                  onClick={toggleNpmLogo}
                >
                  <IconRocket size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                </motion.button>
                
                <motion.a 
                  href={config.links.github} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} transition-colors`}
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <IconBrandGithub size={16} />
                </motion.a>
                
                <motion.div
                  whileHover={{ 
                    scale: 1.2,
                    transition: { repeat: Infinity, repeatType: "reverse", duration: 0.5 }
                  }}
                >
                  <IconCode size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Floating hearts animation */}
        <AnimatePresence>
          {hearts.map(heart => (
            <motion.div
              key={heart.id}
              className="absolute pointer-events-none"
              initial={{ y: 0, x: heart.x, opacity: 0, scale: 0 }}
              animate={{ 
                y: -150, 
                x: heart.x + (Math.random() * 40 - 20),
                opacity: [0, heart.opacity, 0], 
                scale: [0, 1, 0.5],
                rotate: Math.random() * 60 - 30,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: heart.duration, ease: "easeOut" }}
              style={{ zIndex: 30 }}
            >
              <IconHeartFilled 
                size={heart.size} 
                className={`text-red-500 ${Math.random() > 0.7 ? 'text-pink-500' : Math.random() > 0.7 ? 'text-rose-400' : 'text-red-500'}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Easter egg message */}
        <AnimatePresence>
          {showEasterEgg && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'} flex items-center gap-1`}>
                Made with <IconHeart size={14} className="text-red-500" /> by npm install
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Secret message */}
        <AnimatePresence>
          {showSecretMessage && (
            <motion.div 
              className="absolute inset-x-0 -top-10 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`text-sm px-4 py-2 rounded-full inline-flex items-center gap-1 ${
                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              }`}>
                <IconMeteor size={14} />
                Made with <IconHeart size={12} className="text-red-500 inline mx-0.5" /> by npm install csapata
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* npm Logo animation */}
        <AnimatePresence>
          {showNpmLogo && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  rotate: [0, 15, 0],
                }}
                exit={{ scale: 0, rotate: 0 }}
                transition={{ duration: 0.5 }}
                className={`px-3 py-1 rounded-lg text-white ${isDark ? 'bg-red-600' : 'bg-red-500'} shadow-lg`}
              >
                <span className="font-mono font-bold tracking-tighter">npm install</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </footer>
  );
} 