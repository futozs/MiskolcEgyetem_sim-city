'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Button } from '@nextui-org/react';
import { City } from '@/components/3d/City';
import { FiLayers, FiTerminal, FiCpu, FiDatabase, FiArrowLeft, FiPlay } from 'react-icons/fi';
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiPython, SiThreedotjs, SiFramer } from 'react-icons/si';
import Image from 'next/image';
// Add useLoadedData hook to fetch all data including events
import { useLoadedData } from '@/lib/api/hooks';
import { siteConfig } from "@/lib/site-config";
import { IconHeart } from '@tabler/icons-react';

// Interfaces for type safety
interface FloatingParticleProps {
  delay?: number;
  x?: number;
  y?: number;
  size?: string;
  color?: string;
}

interface GlowingTextProps {
  children: React.ReactNode;
  gradient?: string;
  className?: string;
  delay?: number;
}

interface TechBubbleProps {
  icon: React.ReactNode;
  name: string;
  color?: string;
  delay?: number;
  x?: number;
  y?: number;
  orbit?: 'inner' | 'outer';
}

// Chart data types
interface YearData {
  year: number;
  value: number;
}

interface TypeData {
  type: string;
  value: number;
}

interface MonthData {
  month: string;
  value: number;
}

type ChartData = YearData | TypeData | MonthData;

// Add EventCard component to display event information
interface EventCardProps {
  event: {
    fordulo: number;
    esemeny: {
      nev: string;
      leiras: string;
      tipus: string;
      hatas: {
        penz?: number;
        boldogsag?: number;
        lakossag?: number;
      };
    };
  };
  delay?: number;
}

const EventCard = ({ event, delay = 0 }: EventCardProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get event icon based on its financial impact
  const getEventTypeColor = () => {
    if (!event.esemeny.hatas) return "from-gray-500 to-gray-400";
    
    const impact = event.esemeny.hatas.penz || 0;
    if (impact > 0) return "from-green-500 to-emerald-400";
    if (impact < 0) return "from-red-500 to-rose-400";
    return "from-blue-500 to-cyan-400";
  };

  return (
    <motion.div
      className="rounded-lg overflow-hidden relative bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 mb-2"
      initial={{ opacity: 0, y: 20 }}
      animate={isInitialized ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
    >
      <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b" style={{ 
        backgroundImage: `linear-gradient(to bottom, ${getEventTypeColor().replace('from-', '').replace(' to-', ', ')})` 
      }}/>
      
      <div className="p-3 pl-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-sm">{event.esemeny.nev}</h4>
            <p className="text-xs text-gray-500 mt-1">{event.esemeny.leiras}</p>
          </div>
          <div className="bg-black/20 rounded-full px-2 py-0.5 text-xs">
            {event.fordulo}. forduló
          </div>
        </div>
        
        {/* Show financial impact if available */}
        {event.esemeny.hatas && (event.esemeny.hatas.penz || event.esemeny.hatas.boldogsag || event.esemeny.hatas.lakossag) && (
          <div className="flex gap-2 mt-2 text-xs">
            {event.esemeny.hatas.penz !== undefined && event.esemeny.hatas.penz !== 0 && (
              <div className={`px-2 py-0.5 rounded-full ${
                event.esemeny.hatas.penz > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {event.esemeny.hatas.penz > 0 ? '+' : ''}{event.esemeny.hatas.penz.toLocaleString()} Ft
              </div>
            )}
            
            {event.esemeny.hatas.boldogsag !== undefined && event.esemeny.hatas.boldogsag !== 0 && (
              <div className={`px-2 py-0.5 rounded-full ${
                event.esemeny.hatas.boldogsag > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                Elégedettség: {event.esemeny.hatas.boldogsag > 0 ? '+' : ''}{event.esemeny.hatas.boldogsag}%
              </div>
            )}
            
            {event.esemeny.hatas.lakossag !== undefined && event.esemeny.hatas.lakossag !== 0 && (
              <div className={`px-2 py-0.5 rounded-full ${
                event.esemeny.hatas.lakossag > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-purple-500/20 text-purple-300'
              }`}>
                Lakosság: {event.esemeny.hatas.lakossag > 0 ? '+' : ''}{event.esemeny.hatas.lakossag}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Floating particle component
const FloatingParticle = ({ 
  delay = 0, 
  x = 0, 
  y = 0, 
  size = '10px', 
  color = '#4F46E5' 
}: FloatingParticleProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="absolute rounded-full z-10 pointer-events-none"
      style={{ 
        width: size, 
        height: size, 
        background: color,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
        x, 
        y 
      }}
      initial={{ opacity: 0 }}
      animate={isInitialized ? { 
        opacity: [0, 0.8, 0.4, 0.7, 0.2, 0.5, 0],
        y: y + Math.random() * 100 - 50
      } : {}}
      transition={{ 
        repeat: Infinity, 
        duration: 10 + Math.random() * 10, 
        delay: delay,
        ease: "easeInOut" 
      }}
    />
  );
};

// Glowing text component
const GlowingText = ({ 
  children, 
  gradient = "from-blue-500 via-purple-500 to-pink-500", 
  className = "", 
  delay = 0 
}: GlowingTextProps) => {
  // Access animationsInitialized from parent component's context
  // We'll use a ref to the global animationsInitialized state
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Ensure animations run regardless of the global state after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <motion.div
      className={`inline-block relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInitialized ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
    >
      <span className={`font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent relative z-10 px-1`}>
        {children}
      </span>
      <span className={`absolute inset-0 bg-gradient-to-r ${gradient} filter blur-xl opacity-30 z-0`}></span>
    </motion.div>
  )
};

// Technology bubble component
const TechBubble = ({ 
  icon, 
  name, 
  color = "bg-blue-500", 
  delay = 0, 
  x = 0, 
  y = 0,
  orbit = 'inner'
}: TechBubbleProps) => {
  // Similar to GlowingText, ensure animations run after component mounts
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculate orbit animation
  const orbitalMovement = {
    x: [x, x + (orbit === 'inner' ? 15 : -15), x],
    y: [y, y + (orbit === 'inner' ? -15 : 15), y],
    rotate: [0, orbit === 'inner' ? 10 : -10, 0],
  };

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        marginLeft: x,
        marginTop: y,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={isInitialized ? { 
        opacity: 1, 
        scale: 1
      } : {}}
      transition={{ 
        delay,
        duration: 0.8,
        type: "spring"
      }}
    >
      <TechTooltip content={name} placement="bottom">
        <motion.div 
          className={`p-2 rounded-full ${color} text-white shadow-lg`}
          style={{
            boxShadow: `0 0 15px ${color.includes('blue') ? '#3B82F6' : 
                        color.includes('purple') ? '#8B5CF6' : 
                        color.includes('pink') ? '#EC4899' : 
                        color.includes('green') ? '#10B981' : '#3B82F6'}`
          }}
          whileHover={{ scale: 1.2 }}
          animate={isInitialized ? orbitalMovement : {}}
          transition={{ 
            duration: 5 + Math.random() * 5, 
            repeat: Infinity,
            repeatType: "reverse",
            delay: Math.random() * 0.5, // Small random delay for more natural movement
          }}
        >
          {icon}
        </motion.div>
      </TechTooltip>
    </motion.div>
  );
};

// Simple tooltip component for TechBubble
function TechTooltip({ 
  children, 
  content, 
  placement = "bottom" 
}: { 
  children: React.ReactNode; 
  content: string; 
  placement?: "top" | "right" | "bottom" | "left" 
}) {
  const [show, setShow] = useState(false);
  return (
    <div 
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`absolute ${
          placement === "top" ? "bottom-full mb-2" :
          placement === "right" ? "left-full ml-2" :
          placement === "left" ? "right-full mr-2" :
          "top-full mt-2"
        } left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap`}>
          {content}
        </div>
      )}
    </div>
  );
}

// Animated background grid
const AnimatedGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
      <div className="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-500 to-transparent"></div>
      <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-gray-500 to-transparent"></div>
      
      {/* Horizontal lines */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div 
          key={`h-${i}`} 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"
          style={{ top: `${(i + 1) * 10}%` }}
        />
      ))}
      
      {/* Vertical lines */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div 
          key={`v-${i}`} 
          className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-500 to-transparent"
          style={{ left: `${(i + 1) * 10}%` }}
        />
      ))}
    </div>
  </div>
);

// Add a new component for displaying the image
const PythonCodeImage = ({ 
  delay = 0,
  activeTab = 0
}) => {
  // Map of image URLs for different tabs
  const imageUrls = [
    "http://cdn.futozsombor.hu/u/TtDfLg.png",
    "http://cdn.futozsombor.hu/u/HaifIx.png",
    "http://cdn.futozsombor.hu/u/CuMIil.png"
  ];

  return (
    <motion.div
      className="rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8 }}
    >
      {/* Terminal window top bar with dots */}
      <div className="flex items-center gap-2 bg-black/90 px-4 py-3 border-b border-gray-800">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      
      {/* Image container with padding */}
      <div className="bg-black/90 p-2.5 rounded-b-lg">
        <img 
          src={imageUrls[activeTab]} 
          alt={`Python Implementation Tab ${activeTab + 1}`} 
          style={{ 
            width: "100%", 
            height: "auto", 
            display: "block",
            imageRendering: "auto"
          }}
          className="rounded"
        />
      </div>
    </motion.div>
  );
};

export default function PresentationPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });
  
  const smoothScrollProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  });

  // Add intro state to track if the presentation has been started
  const [showIntro, setShowIntro] = useState(true);
  
  // State for command typing animation
  const [displayedCommand, setDisplayedCommand] = useState("");
  const [isCommandComplete, setIsCommandComplete] = useState(false);
  const [isInstallComplete, setIsInstallComplete] = useState(false);
  const fullCommand = "npm install @miskolc-egyetem/verseny";
  
  // Check localStorage on mount to see if user has viewed the presentation before
  useEffect(() => {
    const hasViewedPresentation = localStorage.getItem('hasViewedPresentation');
    if (hasViewedPresentation === 'true') {
      setShowIntro(false);
    }
  }, []);

  // Command typing effect
  useEffect(() => {
    if (!showIntro) return;
    
    let position = 0;
    const typingInterval = setInterval(() => {
      if (position < fullCommand.length) {
        setDisplayedCommand(fullCommand.slice(0, position + 1));
        position++;
      } else {
        clearInterval(typingInterval);
        setIsCommandComplete(true);
        
        // Simulate installation completion after delay
        setTimeout(() => {
          setIsInstallComplete(true);
        }, 1500);
      }
    }, 100);
    
    return () => clearInterval(typingInterval);
  }, [showIntro]);

  // Function to start the presentation
  const startPresentation = () => {
    setShowIntro(false);
    localStorage.setItem('hasViewedPresentation', 'true');
  };

  // Function to reset to intro screen
  const resetToIntro = () => {
    setShowIntro(true);
    setDisplayedCommand("");
    setIsCommandComplete(false);
    setIsInstallComplete(false);
    
    // Scroll back to top
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Reset current section to 0
    setCurrentSection(0);
  };

  // Set initial section to 0 to ensure first section is visible immediately
  const [currentSection, setCurrentSection] = useState(0);
  
  // Add a state to track if animation has been initialized
  const [animationsInitialized, setAnimationsInitialized] = useState(false);
  
  // Force animations to start on initial load
  useEffect(() => {
    // Small timeout to ensure all components are mounted properly
    const timer = setTimeout(() => {
      setAnimationsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Monitor scroll position to update current section
  useEffect(() => {
    // Force immediate visibility of first section
    setCurrentSection(0);
    
    const unsubscribe = scrollYProgress.on("change", (value) => {
      // Calculate which section we're in based on scroll progress
      const sectionIndex = Math.min(
        Math.floor(value * 7),
        6
      );
      setCurrentSection(sectionIndex);
    });
    
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Generate random particles
  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
      y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      size: Math.random() * 8 + 2 + 'px',
      color: [
        '#3B82F6', // blue
        '#8B5CF6', // purple
        '#EC4899', // pink
        '#10B981', // green
        '#6366F1',  // indigo
        '#A855F7'   // purple
      ][Math.floor(Math.random() * 6)],
      delay: Math.random() * 5
    }));
  }, []);

  // Added state for active code tab
  const [activeCodeTab, setActiveCodeTab] = useState(0);
  
  // These code snippets are no longer used, removing to fix linter warnings
  /*
  const codeSnippets = [
    `<img src="http://cdn.futozsombor.hu/u/TtDfLg.png" alt="Python City Implementation" style="width: 100%; height: auto;" />`,
    
    `<img src="http://cdn.futozsombor.hu/u/TtDfLg.png" alt="Python Simulation Implementation" style="width: 100%; height: auto;" />`,
    
    `<img src="http://cdn.futozsombor.hu/u/TtDfLg.png" alt="Python Data Processor Implementation" style="width: 100%; height: auto;" />`
  ];
  */

  // Helper function to determine the chart item type
  const getChartItemType = (item: ChartData, index: number) => {
    if ('year' in item) {
      return (
        <motion.div 
          key={index}
          className="w-full bg-gradient-to-t from-blue-500 to-cyan-300 rounded-t-sm"
          initial={{ height: 0 }}
          animate={{ height: `${(item.value / 25000) * 100}%` }}
          transition={{ duration: 1.5, delay: 1 + (index * 0.2) }}
        />
      );
    } else if ('type' in item) {
      return (
        <motion.div
          key={index}
          className="h-full bg-gradient-to-r from-pink-500 to-rose-300"
          initial={{ width: 0 }}
          animate={{ width: `${item.value}%` }}
          transition={{ duration: 1.5, delay: 1 + (index * 0.2) }}
          style={{ marginLeft: index > 0 ? '-2px' : 0 }}
        >
          <div className="flex h-full items-center justify-center text-xs font-medium text-white">
            {item.value}%
          </div>
        </motion.div>
      );
    } else if ('month' in item) {
      return (
        <motion.div 
          key={index}
          className="w-full bg-gradient-to-t from-green-500 to-emerald-300 rounded-t-sm relative overflow-hidden"
          initial={{ height: 0 }}
          animate={{ height: `${item.value}%` }}
          transition={{ duration: 1.5, delay: 1 + (index * 0.2) }}
        >
          <motion.div 
            className="absolute top-0 left-0 right-0 h-1/3 bg-white/20"
            animate={{ y: [0, 30, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>
      );
    }
    
    return null;
  };

  // Calculate positions for tech bubbles in a scattered pattern around the main heading
  const getOrbitingBubblePositions = (count: number): Array<{x: number, y: number, delay: number, orbit: 'inner' | 'outer'}> => {
    if (typeof window === 'undefined') return [];
    
    const positions: Array<{x: number, y: number, delay: number, orbit: 'inner' | 'outer'}> = [];
    
    // Min and max radius range - creates more randomness while still surrounding the heading
    const minRadius = 160;
    const maxRadius = 320;
    
    // Minimum distance between bubbles to prevent overlap
    const minDistanceBetweenBubbles = 50;
    
    // Try to place each bubble with collision avoidance
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let validPositionFound = false;
      let x = 0;
      let y = 0;
      
      // Try up to 20 different positions for each bubble before giving up
      while (!validPositionFound && attempts < 20) {
        // Randomize radius within range
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        
        // Randomize angle for more natural distribution
        // Adding some noise to avoid perfect circular patterns
        const angle = Math.random() * 2 * Math.PI;
        
        // Convert angle to x,y coordinates
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        
        // Check if this position would overlap with any existing bubble
        validPositionFound = true; // Assume valid until proven otherwise
        
        for (const existing of positions) {
          // Calculate distance between this position and existing bubble
          const dx = existing.x - x;
          const dy = existing.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If too close, mark as invalid and try again
          if (distance < minDistanceBetweenBubbles) {
            validPositionFound = false;
            break;
          }
        }
        
        attempts++;
      }
      
      // Even if we couldn't find a non-overlapping position, still add the bubble
      // with the last attempted position (better than not showing it)
      const orbit = Math.random() > 0.5 ? 'inner' : 'outer';
      
      positions.push({
        x,
        y,
        delay: 0.2 + (i * 0.1), // Sequential delays for a wave effect
        orbit
      });
    }
    
    return positions;
  };

  // Tech bubble configurations
  const techBubbles = [
    { icon: <SiReact className="w-6 h-6" />, name: "React", color: "bg-blue-500" },
    { icon: <SiNextdotjs className="w-6 h-6" />, name: "Next.js", color: "bg-black" },
    { icon: <SiTypescript className="w-6 h-6" />, name: "TypeScript", color: "bg-blue-600" },
    { icon: <SiTailwindcss className="w-6 h-6" />, name: "Tailwind CSS", color: "bg-cyan-500" },
    { icon: <SiThreedotjs className="w-6 h-6" />, name: "Three.js", color: "bg-black" },
    { icon: <SiPython className="w-6 h-6" />, name: "Python", color: "bg-blue-700" },
    { icon: <SiFramer className="w-6 h-6" />, name: "Framer", color: "bg-purple-600" },
    { icon: <FiDatabase className="w-6 h-6" />, name: "Database", color: "bg-green-600" },
    { icon: <FiLayers className="w-6 h-6" />, name: "UI/UX", color: "bg-pink-600" },
    { icon: <FiTerminal className="w-6 h-6" />, name: "Terminal", color: "bg-gray-800" },
    { icon: <FiCpu className="w-6 h-6" />, name: "AI Tools", color: "bg-amber-600" }
  ];

  // Generate positions for tech bubbles
  const [bubblePositions, setBubblePositions] = useState<Array<{x: number, y: number, delay: number, orbit: 'inner' | 'outer'}>>([]);
  
  // Force initial render of bubbles with useEffect that runs once on component mount
  useEffect(() => {
    // Immediate initial positioning
    setBubblePositions(getOrbitingBubblePositions(techBubbles.length));
    
    // Ensure positioning is applied even in SSR context
    const initialTimer = setTimeout(() => {
      setBubblePositions(getOrbitingBubblePositions(techBubbles.length));
    }, 50);
    
    // Update positions on window resize
    const handleResize = () => {
      setBubblePositions(getOrbitingBubblePositions(techBubbles.length));
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialTimer);
    };
  }, []);

  // Add hook to fetch statistics data from API
  const { data, isGameOffline, refreshAllData } = useLoadedData();
  const { charts, esemenyek } = data;

  // Add check for all values being zero
  const isAllDataZero = useMemo(() => {
    if (!charts || !charts.altalanosMutatok) return true;
    
    const { lakossagSzama, elegedettseg, epuletekSzama, szolgaltatasokSzama } = charts.altalanosMutatok;
    const budget = charts.penzugyiData?.keret || 0;
    
    return (
      lakossagSzama === 0 && 
      elegedettseg === 0 && 
      epuletekSzama === 0 && 
      szolgaltatasokSzama === 0 &&
      budget === 0
    );
  }, [charts]);

  // Combined offline status
  const isOffline = isGameOffline || isAllDataZero;

  // Add auto-refresh when offline
  useEffect(() => {
    if (isOffline) {
      const interval = setInterval(() => {
        refreshAllData().catch(error => {
          console.error('Error refreshing data:', error);
        });
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isOffline, refreshAllData]);

  return (
    <div className="relative min-h-[700vh]" ref={containerRef}>
      {/* Back to intro button */}
      {!showIntro && (
        <motion.div
          className="fixed top-4 left-4 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full p-3"
            isIconOnly
            onClick={resetToIntro}
            aria-label="Vissza a prezentáció elejére"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
      
      {/* Fixed progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50"
        style={{ scaleX: smoothScrollProgress }}
      />
      
      {/* Intro Screen */}
      {showIntro && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            {/* Terminal frame */}
            <motion.div 
              className="relative w-11/12 md:w-3/4 max-w-4xl bg-black border border-gray-700 rounded-lg overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Terminal header */}
              <div className="bg-gray-900 px-4 py-2 flex items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="mx-auto text-gray-400 text-sm font-mono">
                  terminal — me-verseny
                </div>
              </div>
              
              {/* Terminal content */}
              <div className="p-6 h-80 font-mono text-lg text-gray-100">
                {/* Rising bubbles effect */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={`bubble-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 8 + 2,
                      height: Math.random() * 8 + 2,
                      left: `${Math.random() * 100}%`,
                      bottom: `-10px`,
                      background: [
                        '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#10B981'
                      ][Math.floor(Math.random() * 5)],
                      opacity: 0.7,
                    }}
                    animate={{
                      y: [0, -300 - Math.random() * 100],
                      opacity: [0.7, 0]
                    }}
                    transition={{
                      duration: 5 + Math.random() * 7,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                  />
                ))}
                
                {/* Command prompt and typing animation */}
                <div className="relative">
                  <motion.div
                    className="mb-2 flex items-center"
                    animate={{ opacity: [0.8, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-green-500">user@me-verseny</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-blue-400">~</span>
                    <span className="text-gray-400">$</span>
                    <span className="ml-2">{displayedCommand}</span>
                    {!isCommandComplete && (
                      <motion.span 
                        className="inline-block w-3 h-5 bg-gray-200 ml-0.5"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  
                  {/* Command execution output */}
                  {isCommandComplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-300"
                    >
                      <div className="text-gray-500 text-sm">
                        {`> @miskolc-egyetem/verseny@1.0.0 install`}
                      </div>
                      
                      {/* Progress animation */}
                      <motion.div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Letöltés...</span>
                          <motion.span
                            animate={{ opacity: isInstallComplete ? 1 : [0.4, 1] }}
                            transition={{ 
                              duration: 1, 
                              repeat: isInstallComplete ? 0 : Infinity,
                              repeatType: "reverse"
                            }}
                          >
                            {isInstallComplete ? "100%" : "98%"}
                          </motion.span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: "80%" }}
                            animate={{ width: isInstallComplete ? "100%" : ["90%", "95%", "92%", "98%"] }}
                            transition={{ 
                              duration: 2, 
                              repeat: isInstallComplete ? 0 : Infinity,
                              repeatType: "reverse" 
                            }}
                          />
                        </div>
                        
                        {/* Package details */}
                        <div className="mt-4 text-sm space-y-1">
                          <div className="text-gray-500">
                            <span className="text-green-400">{'└─'}</span> Csomagok telepítése...
                          </div>
                          <div className="ml-4 text-gray-500">
                            <span className="text-yellow-400">{'├─'}</span> Függőségek telepítése...
                          </div>
                          <div className="ml-8 text-gray-500">
                            <span className="text-cyan-400">{'├─'}</span> react, next, framer-motion
                          </div>
                          <div className="ml-8 text-gray-500">
                            <span className="text-purple-400">{'└─'}</span> tailwindcss, three.js
                          </div>
                        </div>
                        
                        {/* Success message */}
                        {isInstallComplete && (
                          <motion.div 
                            className="mt-4 text-green-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <span>✓</span> Telepítés sikeres! @miskolc-egyetem/verseny@1.0.0
                            <motion.div 
                              className="mt-2 text-gray-300"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.5, duration: 0.5 }}
                            >
                              Kész a rendszerindításra...
                            </motion.div>
                          </motion.div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Enter button */}
            {isInstallComplete && (
              <motion.div
                className="mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-6 text-lg rounded-md shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all group"
                  endContent={
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <FiPlay className="w-5 h-5" />
                    </motion.div>
                  }
                  onClick={startPresentation}
                >
                  <span className="font-mono tracking-wider">&gt;&gt;&gt; Csatlakozás a rendszerhez</span>
                </Button>
              </motion.div>
            )}
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ 
                opacity: [0.05, 0.1, 0.05] 
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full"></div>
            </motion.div>
          </div>
        </motion.div>
      )}
      
      {/* Sticky container */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <AnimatedGrid />
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <FloatingParticle 
            key={particle.id}
            x={particle.x}
            y={particle.y}
            size={particle.size}
            color={particle.color}
            delay={particle.delay}
          />
        ))}

        {/* Section 1: Team Introduction */}
        <section className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentSection === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="relative z-10 text-center p-8 max-w-7xl">
            {/* Tech bubbles with random positions */}
            {techBubbles.map((tech, index) => (
              bubblePositions[index] && (
                <TechBubble 
                  key={index}
                  icon={tech.icon} 
                  name={tech.name} 
                  color={tech.color}
                  x={bubblePositions[index].x}
                  y={bubblePositions[index].y}
                  delay={bubblePositions[index].delay}
                  orbit={bubblePositions[index].orbit}
                />
              )
            ))}

            <div className="relative">
              <motion.div
                className="w-48 h-48 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto mb-8 opacity-20 blur-2xl"
                initial={{ scale: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full opacity-20 blur-2xl"
                initial={{ scale: 0 }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 1
                }}
              />
            </div>

            <motion.div 
              className="text-8xl md:text-9xl font-bold relative"
              initial={{ opacity: 0, y: 50 }}
              animate={animationsInitialized ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1 }}
            >
              <h1 className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
                <GlowingText gradient="from-blue-600 via-indigo-600 to-purple-600">
                  npm
                </GlowingText>
                <GlowingText gradient="from-purple-600 via-pink-600 to-red-600" delay={0.2}>
                  install
                </GlowingText>
                <GlowingText gradient="from-red-600 via-orange-600 to-yellow-500" delay={0.4}>
                  ME
                </GlowingText>
              </h1>
              
              {/* Animated code snippet below title */}
              <motion.div 
                className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-sm"
                initial={{ opacity: 0 }}
                animate={animationsInitialized ? { opacity: 1 } : {}}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                <div className="font-mono text-gray-400 dark:text-gray-500 bg-black/20 dark:bg-white/10 px-4 py-1 rounded-full backdrop-blur-sm">
                  $ <span className="text-green-500">npm install</span> <span className="text-blue-400">@miskolc-egyetem</span>/<span className="text-purple-400">verseny</span>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="text-xl md:text-2xl mt-20 max-w-3xl mx-auto text-gray-600 dark:text-gray-300 relative z-20"
              initial={{ opacity: 0 }}
              animate={animationsInitialized ? { opacity: 1 } : {}}
              transition={{ delay: 1, duration: 1 }}
            >
              A csapat, amely életre kelti az <GlowingText gradient="from-emerald-500 to-green-500" className="text-2xl md:text-3xl">álomváros</GlowingText> vízióját, ahol technológia és design összeér.
            </motion.div>
          </div>
        </section>

        {/* Section 2: Team Members */}
        <section className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentSection === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="container mx-auto px-4 relative z-10">
            <motion.h2 
              className="text-5xl font-bold text-center mb-20 relative"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlowingText gradient="from-pink-500 via-red-500 to-yellow-500" className="text-5xl">
                A Csapatunk
              </GlowingText>
            </motion.h2>
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16">
                {[
                  { name: "Futó Zsombor", role: "Full stack developer", specialty: "Next.js & Three.js & Python", gradient: "from-blue-500 to-cyan-400", delay: 0.2, image: "https://cdn.futozsombor.hu/u/futozsmid-01.jpg" },
                  { name: "Fodor Levente", role: "Python developer", specialty: "Python & Algoritmusok", gradient: "from-yellow-500 to-amber-400", delay: 0.6, image: "https://cdn.futozsombor.hu/u/futozsmid-01.jpg" },
                  { name: "Szűcs Noel Gergő", role: "UI/UX Designer", specialty: "Animációk & Dizájn", gradient: "from-pink-500 to-rose-400", delay: 0.4, image: "https://cdn.futozsombor.hu/u/futozsmid-01.jpg" },
                  { name: "Kasza László Róbert", role: "Mentor", specialty: "Vezetés & Stratégia", gradient: "from-purple-500 to-indigo-400", delay: 0.8, image: "https://cdn.futozsombor.hu/u/futozsmid-01.jpg" }
                ].map((member, index) => (
                  <motion.div 
                    key={index}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: member.delay, duration: 0.8 }}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  >
                  <div className="w-56 h-56 md:w-48 md:h-48 rounded-2xl relative overflow-hidden">
                    {/* Animated background */}
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-br ${member.gradient}`}
                      animate={{ 
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }}
                      style={{
                        backgroundSize: "200% 200%"
                      }}
                    />
                    
                    {/* Animated dots */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-white rounded-full opacity-30"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                          animate={{
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.5, 1]
                          }}
                          transition={{
                            duration: 2 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 2
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Placeholder Image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-full h-full">
                        <Image 
                          src={member.image} 
                          alt={member.name}
                          width={500}
                          height={500}
                          className="object-cover w-full h-full"
                          unoptimized
                          onError={(e) => {
                            // Fallback to placeholder color on error
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Glowing border */}
                    <motion.div 
                      className="absolute inset-0 rounded-2xl"
                      style={{ 
                        boxShadow: `0 0 20px rgba(255,255,255,0.3)` 
                      }}
                      animate={{ 
                        boxShadow: [
                          `0 0 20px rgba(255,255,255,0.1)`,
                          `0 0 30px rgba(255,255,255,0.3)`,
                          `0 0 20px rgba(255,255,255,0.1)`
                        ] 
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity 
                      }}
                    />
                  </div>
                  
                  <motion.div 
                    className="mt-6 text-center relative z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: member.delay + 0.3, duration: 0.8 }}
                  >
                    <h3 className="text-2xl font-bold">{member.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      {member.role}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm bg-gradient-to-r ${member.gradient} text-white font-medium`}>
                        {member.specialty}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: City Statistics */}
        <section className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentSection === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="container mx-auto px-4 relative z-10">
            <motion.h2 
              className="text-5xl font-bold text-center mb-12 relative"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlowingText gradient="from-cyan-500 to-blue-500" className="text-5xl">
                Álomváros Statisztikák
              </GlowingText>
              {isOffline && (
                <motion.div 
                  className="absolute -right-10 top-0"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-sm font-medium border border-red-500/20 flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-red-500"
                    />
                    Offline
                  </div>
                </motion.div>
              )}
            </motion.h2>
            
            {isOffline ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-4xl mx-auto bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-8 shadow-xl text-center"
              >
                <div className="mb-6 mx-auto w-20 h-20 relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-red-500/10" />
                  <div className="relative flex items-center justify-center w-full h-full bg-red-500/20 rounded-full">
                    <svg className="w-10 h-10 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                      <line x1="6" y1="6" x2="6.01" y2="6"></line>
                      <line x1="6" y1="18" x2="6.01" y2="18"></line>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                  Játékszerver Hiba
                </h3>
                
                <p className="text-foreground-600 mb-8 max-w-lg mx-auto">
                  Jelenleg nem sikerült kapcsolódni a játékszerverhez. Az adatok automatikusan megjelennek, amint a szerver elérhetővé válik.
                </p>
                
                <div className="flex justify-center">
                  <Button
                    className="bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20"
                    startContent={
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.5 15.5c-.7 1.2-1.8 2.2-3 3-2.3 1.5-5 2-7.5 1.5-2.5-.5-4.8-2-6.5-4C2.6 13.7 2 11 2 8.5c0-1.3.2-2.6.7-3.8"></path>
                        <path d="M2 12c0-1.7.5-3.4 1.5-5 1-1.5 2.3-2.7 4-3.5 1.6-.8 3.4-1.2 5.2-1 1.8.2 3.5.8 5 1.8M2 2v6h6"></path>
                      </svg>
                    }
                    onClick={() => refreshAllData()}
                  >
                    Újrapróbálkozás
                  </Button>
                </div>
                
                <div className="mt-8 w-full">
                  <div className="flex items-center justify-between mb-2 text-sm text-foreground-500">
                    <span>Automatikus újracsatlakozás...</span>
                    <motion.span 
                      animate={{ opacity: [0.5, 1, 0.5] }} 
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Csatlakozás...
                    </motion.span>
                  </div>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-red-500 to-amber-500"
                      animate={{ 
                        width: ["0%", "40%", "60%", "40%", "80%", "60%"], 
                        x: ["-5%", "5%", "-5%"] 
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        repeatType: "loop" 
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* First two stat cards remain the same */}
                {[
                  { 
                    title: "Lakosság", 
                    value: charts?.altalanosMutatok?.lakossagSzama?.toLocaleString() || "0", 
                    icon: "👥", 
                    gradient: "from-blue-500 to-cyan-300",
                    details: [
                      { 
                        label: "0-18 év", 
                        value: charts?.korEloszlasChart?.find(k => k.korosztaly === '0-18')?.ertek.toLocaleString() || "0", 
                        percent: charts?.korEloszlasChart && charts.altalanosMutatok.lakossagSzama ? 
                          Math.round((charts.korEloszlasChart.find(k => k.korosztaly === '0-18')?.ertek || 0) / 
                          charts.altalanosMutatok.lakossagSzama * 100) : 0 
                      },
                      { 
                        label: "19-35 év", 
                        value: charts?.korEloszlasChart?.find(k => k.korosztaly === '19-35')?.ertek.toLocaleString() || "0", 
                        percent: charts?.korEloszlasChart && charts.altalanosMutatok.lakossagSzama ? 
                          Math.round((charts.korEloszlasChart.find(k => k.korosztaly === '19-35')?.ertek || 0) / 
                          charts.altalanosMutatok.lakossagSzama * 100) : 0
                      },
                      { 
                        label: "36-65 év", 
                        value: charts?.korEloszlasChart?.find(k => k.korosztaly === '36-65')?.ertek.toLocaleString() || "0", 
                        percent: charts?.korEloszlasChart && charts.altalanosMutatok.lakossagSzama ? 
                          Math.round((charts.korEloszlasChart.find(k => k.korosztaly === '36-65')?.ertek || 0) / 
                          charts.altalanosMutatok.lakossagSzama * 100) : 0
                      },
                      { 
                        label: "65+ év", 
                        value: charts?.korEloszlasChart?.find(k => k.korosztaly === '65+')?.ertek.toLocaleString() || "0", 
                        percent: charts?.korEloszlasChart && charts.altalanosMutatok.lakossagSzama ? 
                          Math.round((charts.korEloszlasChart.find(k => k.korosztaly === '65+')?.ertek || 0) / 
                          charts.altalanosMutatok.lakossagSzama * 100) : 0
                      },
                    ],
                    chartData: charts?.korEloszlasChart?.map((item, idx) => ({
                      year: parseInt(item.korosztaly.split('-')[0]) || idx,
                      value: item.ertek
                    })) || []
                  },
                  { 
                    title: "Épületek", 
                    value: charts?.altalanosMutatok?.epuletekSzama?.toLocaleString() || "0", 
                    icon: "🏢", 
                    gradient: "from-pink-500 to-rose-300",
                    details: charts?.epuletTipusokChart?.map(type => ({
                      label: type.label,
                      value: type.value.toLocaleString(),
                      percent: Math.round((type.value / (charts?.altalanosMutatok?.epuletekSzama || 1)) * 100)
                    })) || [],
                    chartData: charts?.epuletTipusokChart?.map(type => ({
                      type: type.label,
                      value: Math.round((type.value / (charts?.altalanosMutatok?.epuletekSzama || 1)) * 100)
                    })) || []
                  },
                  // Third card shows events
                  { 
                    title: "Események", 
                    value: `${esemenyek?.length || 0}`, 
                    icon: "📅", 
                    gradient: "from-purple-500 to-indigo-300",
                    details: [], // Empty details, we'll use custom content for events
                    chartData: [] // Empty chart data, we'll use custom content for events
                  },
                  // Fourth card for satisfaction/elégedettség
                  { 
                    title: "Elégedettség", 
                    value: `${charts?.altalanosMutatok?.elegedettseg || 0}%`, 
                    icon: "😊", 
                    gradient: "from-green-500 to-emerald-300",
                    details: [
                      { 
                        label: "Városi szolgáltatások", 
                        value: `${charts?.altalanosMutatok?.szolgaltatasokSzama || 0}`, 
                        percent: charts?.altalanosMutatok?.szolgaltatasokSzama || 0 
                      },
                      { 
                        label: "Aktív projektek", 
                        value: `${charts?.altalanosMutatok?.aktivProjektek || 0}`, 
                        percent: charts?.altalanosMutatok?.aktivProjektek || 0 
                      },
                      { 
                        label: "Pénzügyi keret", 
                        value: `${(charts?.penzugyiData?.keret || 0).toLocaleString()} Ft`, 
                        percent: charts?.penzugyiData?.keret ? Math.min(((charts.penzugyiData.keret / 10000000) * 2), 100) : 0 
                      },
                      { 
                        label: "Forduló", 
                        value: `${charts?.altalanosMutatok?.fordulokSzama || 0}`, 
                        percent: Math.min(charts?.altalanosMutatok?.fordulokSzama || 0, 100)
                      },
                    ],
                    chartData: [
                      { month: "Elég.", value: charts?.altalanosMutatok?.elegedettseg || 0 },
                      { month: "Szolg.", value: charts?.altalanosMutatok?.szolgaltatasokSzama || 0 },
                      { month: "Proj.", value: charts?.altalanosMutatok?.aktivProjektek || 0 },
                      { month: "Pénz", value: charts?.penzugyiData?.keret 
                        ? Math.min(((charts.penzugyiData.keret / 10000000) * 2), 100) 
                        : 0 
                      },
                      { month: "Ford.", value: Math.min(charts?.altalanosMutatok?.fordulokSzama || 0, 100) },
                    ]
                  }
                ].map((stat, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2 * index, duration: 0.8 }}
                    whileHover={{ 
                      y: -10,
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    }}
                    className="rounded-xl overflow-hidden relative bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10"
                  >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 opacity-20">
                      <motion.div 
                        className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`}
                        animate={{ 
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        style={{
                          backgroundSize: "200% 200%"
                        }}
                      />
                    </div>
                    
                    {/* Stat card header */}
                    <div className="p-6 border-b border-white/10 relative">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{stat.title}</h3>
                          <p className="text-4xl font-bold mt-1">{stat.value}</p>
                        </div>
                        <div className="text-5xl">{stat.icon}</div>
                      </div>
                    </div>
                    
                    {/* Special handling for the Events card (index 2) */}
                    {index === 2 ? (
                      <div className="p-4 max-h-[340px] overflow-y-auto">
                        {esemenyek && esemenyek.length > 0 ? (
                          <>
                            {/* Get recent events, handling different event formats */}
                            {esemenyek
                              .filter(event => 
                                event.esemeny && 
                                // Only show real events that have actual effects, not just round-end notices
                                (event.esemeny.tipus !== 'rendszer' || 
                                 (event.esemeny.hatas && 
                                  (event.esemeny.hatas.penz || event.esemeny.hatas.boldogsag || event.esemeny.hatas.lakossag)))
                              )
                              .slice(0, 4)
                              .map((event, idx) => (
                                <EventCard key={idx} event={event} delay={0.1 * idx} />
                              ))
                            }
                            
                            {/* Show "View more" if there are more than 4 events */}
                            {esemenyek.length > 4 && (
                              <motion.div 
                                className="text-center mt-2 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                              >
                                + {esemenyek.length - 4} további esemény...
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            Nincsenek események
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Standard stat card details */}
                        <div className="p-6 space-y-4">
                          {stat.details.map((detail, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-300">{detail.label}</span>
                                <span className="font-medium">{detail.value}</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div 
                                  className={`h-full bg-gradient-to-r ${stat.gradient}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${detail.percent}%` }}
                                  transition={{ duration: 1.5, delay: 0.5 + (idx * 0.2) }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Animated mini chart at the bottom */}
                        <div className="p-4 bg-white/5 border-t border-white/10">
                          {index === 0 && (
                            <div className="h-24 flex items-end space-x-2">
                              {stat.chartData.map((item, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center">
                                  {getChartItemType(item, idx)}
                                  <span className="text-xs mt-1 text-gray-500">
                                    {'year' in item ? (typeof item.year === 'string' ? item.year : item.year.toString()) : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {index === 1 && (
                            <div className="h-24 w-full relative">
                              <div className="absolute inset-0 flex">
                                {stat.chartData.map((item, idx) => (
                                  <motion.div
                                    key={idx}
                                    className={`h-full bg-gradient-to-r ${idx % 2 === 0 ? stat.gradient : stat.gradient.replace('from-', 'from-').replace('to-', 'to-')}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.value}%` }}
                                    transition={{ duration: 1.5, delay: 1 + (idx * 0.2) }}
                                    style={{ marginLeft: idx > 0 ? '-2px' : 0 }}
                                  >
                                    <div className="flex h-full items-center justify-center text-xs font-medium text-white">
                                      {item.value}%
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {index === 3 && (
                            <div className="h-24 flex items-end space-x-1">
                              {stat.chartData.map((item, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center">
                                  {getChartItemType(item, idx)}
                                  <span className="text-xs mt-1 text-gray-500">
                                    {'month' in item ? item.month : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Glowing border effect */}
                    <motion.div 
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      animate={{ 
                        boxShadow: [
                          `0 0 0 1px rgba(255,255,255,0.1)`,
                          `0 0 0 2px rgba(255,255,255,0.2)`,
                          `0 0 0 1px rgba(255,255,255,0.1)`
                        ] 
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Updated animated fact with latest actual event */}
            <motion.div
              className="mt-16 text-center max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              <div className="p-4 bg-white/5 dark:bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                <h4 className="text-xl font-medium mb-2">
                  <GlowingText gradient="from-amber-500 to-yellow-300">Tudtad?</GlowingText>
                </h4>
                {esemenyek && esemenyek.length > 0 ? (
                  <>
                    {/* Find the latest important event (not system event) */}
                    {(() => {
                      const latestEvent = esemenyek
                        .filter(event => 
                          event.esemeny && 
                          event.esemeny.tipus !== 'rendszer' && 
                          event.esemeny.nev !== 'Nem történt semmi'
                        )
                        .sort((a, b) => b.fordulo - a.fordulo)[0];
                        
                      const currentRound = Math.max(...esemenyek.map(e => e.fordulo), 0);
                      
                      if (latestEvent) {
                        return (
                          <p className="text-gray-600 dark:text-gray-300">
                            Az {charts?.altalanosMutatok?.varosNev || 'Álomváros'} jelenleg a {currentRound}. fordulónál tart.
                            A legutóbbi jelentős esemény: <span className="text-amber-400 font-medium">{latestEvent.esemeny.nev}</span>. 
                            {latestEvent.esemeny.hatas && latestEvent.esemeny.hatas.penz ? 
                              ` Ez ${latestEvent.esemeny.hatas.penz > 0 ? 'pozitív' : 'negatív'} hatással volt a város gazdaságára.` : 
                              ''}
                          </p>
                        );
                      } else {
                        return (
                          <p className="text-gray-600 dark:text-gray-300">
                            Az {charts?.altalanosMutatok?.varosNev || 'Álomváros'} jelenleg a {currentRound}. fordulónál tart.
                            A város célja az adatok folyamatos követése és a fenntartható fejlődés biztosítása.
                          </p>
                        );
                      }
                    })()}
                  </>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">
                    Az {charts?.altalanosMutatok?.varosNev || 'Álomváros'} jelenleg a {charts?.altalanosMutatok?.fordulokSzama || 0}. fordulónál tart.
                    A város célja az adatok folyamatos követése és a fenntartható fejlődés biztosítása.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 4: 3D City Map */}
        <section className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentSection === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="h-full w-full flex flex-col relative">
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-28 h-28 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl"></div>
            
            <motion.h2 
              className="text-5xl font-bold text-center my-6 relative z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlowingText gradient="from-orange-400 to-red-500" className="text-5xl">
                3D Városi Térkép
              </GlowingText>
            </motion.h2>
            
            {/* Main 3D map container */}
            <motion.div 
              className="flex-1 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1.2 }}
            >
              {/* City component */}
              <div className="h-full w-full relative">
                <City isDaytime={true} />
                
                {/* Glowing overlay for 3D map */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top gradient */}
                  <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/20 to-transparent"></div>
                  
                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent"></div>
                  
                  {/* Edge glow */}
                  <div className="absolute inset-0 border border-white/5 rounded-lg"></div>
                </div>
              </div>
            </motion.div>
            
            {/* Tooltips/Legend */}
            <motion.div 
              className="absolute bottom-6 right-6 z-10 p-3 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-lg border border-white/10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                  <span>Lakóház</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600"></div>
                  <span>Kereskedelmi</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600"></div>
                  <span>Középület</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5: Python Implementation */}
        <section className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentSection === 4 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="container mx-auto px-4 relative z-10">
            {/* Decorative elements */}
            <div className="absolute top-20 -left-20 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            
            <motion.h2 
              className="text-5xl font-bold text-center mb-12 relative z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlowingText gradient="from-yellow-400 to-amber-600" className="text-5xl">
                Python Implementáció
              </GlowingText>
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Python code column */}
              <div className="md:col-span-2 relative">
                {/* Floating Python logo */}
                <motion.div
                  className="absolute -top-10 -left-10 z-10"
                  initial={{ opacity: 0, rotate: -20 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 blur-xl"></div>
                    <div className="relative z-10 flex items-center justify-center h-full">
                      <SiPython className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                </motion.div>
                
                {/* Code Editor Tabs */}
                <div className="flex gap-1 mb-2">
                  {['varos.py', 'kezdolap.py', 'adatok.py'].map((tab, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 text-sm font-medium rounded-t-md cursor-pointer transition-colors
                        ${activeCodeTab === index ? 'bg-black/80 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'}`}
                      onClick={() => setActiveCodeTab(index)}
                    >
                      {tab}
                    </div>
                  ))}
                </div>

                {/* Main code editor with glowing effect */}
                <div className="relative">
                  {/* Remove the blur effect that was causing blurriness */}
                  <PythonCodeImage delay={0.2} activeTab={activeCodeTab} />
                </div>
              </div>
              
              {/* Features column */}
              <div className="mt-20">
                <div className="space-y-4">
                  {/* Feature cards with animations */}
                  {[
                    {
                      title: "Városmodellezés",
                      icon: <FiCpu />,
                      description: "Egyszerű szimuláció, amely életszerűen modellezi a város fejlődését és működését.",
                      gradient: "from-blue-500 to-cyan-500",
                      delay: 0.3
                    },
                    {
                      title: "Intelligens Döntések",
                      icon: <FiDatabase />,
                      description: "Okos algoritmusok segítenek megtalálni a legjobb városi megoldásokat.",
                      gradient: "from-purple-500 to-indigo-500",
                      delay: 0.6
                    },
                    {
                      title: "Adatelemzés",
                      icon: <FiTerminal />,
                      description: "A számok mögé nézünk, hogy érthetőbbé váljon a város működése.",
                      gradient: "from-amber-500 to-orange-500",
                      delay: 0.9
                    },
                    {
                      title: "Látványos Grafikonok",
                      icon: <FiLayers />,
                      description: "Színes, könnyen értelmezhető ábrák mutatják be a város fejlődését.",
                      gradient: "from-pink-500 to-rose-500",
                      delay: 1.2
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      className="rounded-xl overflow-hidden relative bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: feature.delay, duration: 0.8 }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                    >
                      {/* Gradient border */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20`}></div>
                      </div>
                      
                      <div className="p-3 relative">
                        <div className="flex items-center mb-1">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${feature.gradient} text-white mr-2`}>
                            <motion.div
                              animate={{ rotate: [0, 10, 0, -10, 0] }}
                              transition={{ duration: 5, repeat: Infinity }}
                            >
                              {feature.icon}
                            </motion.div>
                          </div>
                          <h3 className="text-base font-medium">{feature.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Python stats */}
                <motion.div
                  className="mt-4 p-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.8 }}
                >
                  <h3 className="text-base font-medium mb-2">Fejlesztési Adatok</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Kódsorok</span>
                        <span className="font-medium">8,246</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: "85%" }}
                          transition={{ duration: 1.5, delay: 1.7 }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Tesztek</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: "92%" }}
                          transition={{ duration: 1.5, delay: 1.9 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Python libraries showcase */}
            <motion.div
              className="mt-8 py-4 relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
            >
              <h3 className="text-lg font-medium text-center mb-4">Felhasznált Python Könyvtárak</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { name: "NumPy", color: "bg-blue-500" },
                  { name: "Pandas", color: "bg-indigo-500" },
                  { name: "Matplotlib", color: "bg-cyan-500" },
                  { name: "SciPy", color: "bg-green-500" },
                  { name: "scikit-learn", color: "bg-purple-500" },
                  { name: "Plotly", color: "bg-pink-500" }
                ].map((lib, index) => (
                  <motion.div
                    key={index}
                    className={`${lib.color} px-2 py-1 rounded-full text-white text-xs font-medium`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2.2 + (index * 0.1), duration: 0.5, type: "spring" }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {lib.name}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 6: Technologies */}
        <section className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentSection === 5 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="container mx-auto px-4 relative z-10">
            {/* Decorative elements */}
            <div className="absolute top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
            
            <motion.h2 
              className="text-5xl font-bold text-center mb-16 relative z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlowingText gradient="from-indigo-500 to-purple-600" className="text-5xl">
                Felhasznált Technológiák
              </GlowingText>
            </motion.h2>
            
            {/* Technology hexagons */}
            <div className="relative h-[450px] mb-16">
              {/* Center technologies */}
              <motion.div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl transform rotate-45 shadow-lg shadow-indigo-500/20">
                  <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                    <div className="text-center">
                      <SiNextdotjs className="w-12 h-12 mx-auto text-white mb-1" />
                      <span className="text-white font-medium text-sm">Next.js 15.3</span>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Orbiting technologies */}
              {[
                { icon: <SiReact />, name: "React 19", color: "from-cyan-400 to-blue-500", delay: 0.1, distance: 180, angle: 0 },
                { icon: <SiTypescript />, name: "TypeScript", color: "from-blue-600 to-blue-700", delay: 0.2, distance: 180, angle: 60 },
                { icon: <SiTailwindcss />, name: "Tailwind CSS", color: "from-cyan-500 to-teal-500", delay: 0.3, distance: 180, angle: 120 },
                { icon: <SiFramer />, name: "Framer", color: "from-purple-500 to-purple-800", delay: 0.4, distance: 180, angle: 180 },
                { icon: <SiThreedotjs />, name: "React Three Fiber", color: "from-gray-800 to-black", delay: 0.5, distance: 180, angle: 240 },
                { icon: <FiDatabase />, name: "TanStack Query", color: "from-blue-600 to-blue-800", delay: 0.6, distance: 180, angle: 300 }
              ].map((tech, index) => {
                const angle = (tech.angle * Math.PI) / 180;
                const x = Math.cos(angle) * tech.distance;
                const y = Math.sin(angle) * tech.distance;
                
                return (
                  <motion.div
                    key={index}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ marginLeft: x, marginTop: y }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: tech.delay, duration: 0.8 }}
                  >
                    <motion.div 
                      className={`relative w-24 h-24 bg-gradient-to-br ${tech.color} rounded-2xl transform rotate-45 shadow-lg`}
                      whileHover={{ scale: 1.2 }}
                      animate={{ 
                        rotate: [45, 50, 45, 40, 45],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 5, 
                        repeat: Infinity,
                        repeatType: "reverse" 
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                        <div className="text-center w-full px-1">
                          <div className="w-10 h-10 mx-auto text-white mb-1 flex items-center justify-center">
                            {tech.icon}
                          </div>
                          <span className="text-white font-medium text-xs whitespace-normal">{tech.name}</span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
              
              {/* Connecting lines */}
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  transition={{ delay: 0.8, duration: 1.2 }}
                >
                  {[0, 60, 120, 180, 240, 300].map((angle, index) => {
                    const radians = (angle * Math.PI) / 180;
                    const x = Math.cos(radians) * 180 + 50 + '%';
                    const y = Math.sin(radians) * 180 + 50 + '%';
                    
                    return (
                      <motion.line
                        key={index}
                        x1="50%"
                        y1="50%"
                        x2={x}
                        y2={y}
                        stroke="url(#techGradient)"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        animate={{ strokeDashoffset: [0, 50] }}
                        transition={{ 
                          duration: 10, 
                          repeat: Infinity,
                          repeatType: "loop" 
                        }}
                      />
                    );
                  })}
                </motion.g>
                <defs>
                  <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Additional technologies */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              {[
                { name: "NextUI", icon: "🎭", desc: "UI komponensek" },
                { name: "Tremor", icon: "📊", desc: "Adatvizualizáció" },
                { name: "React Three Drei", icon: "🧊", desc: "3D komponensek" },
                { name: "Nivo", icon: "📈", desc: "Grafikonok" },
                { name: "Zustand", icon: "🧸", desc: "Állapotkezelés" },
                { name: "Axios", icon: "🔄", desc: "HTTP kérések" },
                { name: "Socket.io", icon: "🔌", desc: "Valós idejű kommunikáció" },
                { name: "SWR", icon: "🔄", desc: "Adat lekérdezés" },
                { name: "Lucide React", icon: "🎨", desc: "Ikonok" },
                { name: "Tabler Icons", icon: "🖌️", desc: "Icon készlet" }
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  className="bg-white/5 dark:bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 + (index * 0.05), duration: 0.5 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-1">{tech.icon}</div>
                    <div>
                      <h3 className="font-medium">{tech.name}</h3>
                      <p className="text-xs text-gray-500">{tech.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section 7: Thank You */}
        <section className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${currentSection === 6 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="relative z-10 text-center p-8 max-w-7xl">
            {/* Tech bubbles with random positions */}
            {techBubbles.map((tech, index) => (
              bubblePositions[index] && (
                <TechBubble 
                  key={index}
                  icon={tech.icon} 
                  name={tech.name} 
                  color={tech.color}
                  x={bubblePositions[index].x}
                  y={bubblePositions[index].y}
                  delay={bubblePositions[index].delay}
                  orbit={bubblePositions[index].orbit}
                />
              )
            ))}

            <div className="relative">
              <motion.div
                className="w-48 h-48 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto mb-8 opacity-20 blur-2xl"
                initial={{ scale: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full opacity-20 blur-2xl"
                initial={{ scale: 0 }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 1
                }}
              />
            </div>

            <motion.div 
              className="text-7xl md:text-8xl font-bold relative mb-16"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h1 className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
                <GlowingText gradient="from-blue-600 via-indigo-600 to-purple-600">
                  Köszönjük
                </GlowingText>
                <GlowingText gradient="from-purple-600 via-pink-600 to-red-600" delay={0.2}>
                  a
                </GlowingText>
                <GlowingText gradient="from-red-600 via-orange-600 to-yellow-500" delay={0.4}>
                  figyelmet!
                </GlowingText>
              </h1>
              
              {/* Confetti effect */}
              <motion.div
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              >
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-8 origin-top"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `-${Math.random() * 20}%`,
                      background: [
                        '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B72AA'
                      ][Math.floor(Math.random() * 5)],
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                    animate={{
                      y: [0, window.innerHeight * 1.5],
                      opacity: [1, 0],
                      rotate: [`${Math.random() * 360}deg`, `${Math.random() * 720}deg`]
                    }}
                    transition={{
                      duration: 2 + Math.random() * 3,
                      repeat: Infinity,
                      delay: Math.random() * 5,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
            
            <motion.p 
              className="text-xl md:text-2xl mt-10 mb-12 max-w-3xl mx-auto text-gray-600 dark:text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              <span className="inline-flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 font-semibold">
                Made with <IconHeart className="text-red-500 animate-pulse" fill="currentColor" size={24} /> by {siteConfig.presentation.team}
              </span>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
                <Button
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium px-8 py-6 text-lg rounded-full"
                  endContent={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4.16666 10H15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 4.16666L15.8333 10L10 15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  onClick={() => window.location.href = siteConfig.presentation.ctaLink}
                >
                  {siteConfig.presentation.ctaText}
                </Button>
            </motion.div>
            
            {/* Version info */}
            <div className="mt-16 text-xs text-gray-500 dark:text-gray-400">
              Verzió: 1.0.0 | 2024 © {siteConfig.metadata.teamName}
            </div>
          </div>
        </section>
      </div>
      
      {/* Scroll indicator */}
      <div className="fixed bottom-8 right-8 z-40 flex gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
          <motion.div 
            key={index}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              currentSection === index 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: currentSection === index ? [1, 1.2, 1] : 1,
              opacity: 1
            }}
            transition={{ 
              duration: currentSection === index ? 0.8 : 0.3,
              repeat: currentSection === index ? Infinity : 0,
              repeatType: "reverse"
            }}
            whileHover={{ scale: 1.5 }}
          />
        ))}
      </div>
    </div>
  );
} 