'use client';

import { useLoadedData } from '@/lib/api/hooks';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimate, useInView, animate } from 'framer-motion';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IconBuilding, IconUsers, IconMoodSmile, IconChartBar, IconMap, IconArrowUpRight, IconMapPin, IconBuildingCommunity, IconCheckbox, IconAlertTriangle, IconBrandGithub, IconRotate3d } from '@tabler/icons-react';
import { config } from '@/lib/config';

// Gradient Background component
const BackgroundGradient = ({ children, className = "", intensity = "medium", glowColor = "from-purple-500" }: { 
  children: React.ReactNode; 
  className?: string;
  intensity?: "low" | "medium" | "high";
  glowColor?: string;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const getIntensity = () => {
    switch (intensity) {
      case "low":
        return isDark ? "opacity-35 group-hover:opacity-45" : "opacity-15 group-hover:opacity-25";
      case "high":
        return isDark ? "opacity-65 group-hover:opacity-75" : "opacity-35 group-hover:opacity-45";
      default:
        return isDark ? "opacity-45 group-hover:opacity-55" : "opacity-25 group-hover:opacity-35";
    }
  };
  
  return (
    <div className={`relative group ${className}`}>
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${glowColor} to-blue-600 rounded-xl blur-md ${getIntensity()} transition-all duration-700 group-hover:duration-300 animate-pulse-slow`}></div>
      <div className={`relative ${isDark ? '' : 'bg-white bg-opacity-60 rounded-xl'}`}>
        {children}
      </div>
    </div>
  );
};

// Floating particle component for background effects
const FloatingParticle = ({ 
  delay = 0, 
  x = 0, 
  y = 0, 
  size = '8px', 
  color = 'rgba(124, 58, 237, 0.5)' 
}: { 
  delay?: number; 
  x?: number; 
  y?: number; 
  size?: string; 
  color?: string; 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="absolute rounded-full z-0 pointer-events-none"
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

// Animated text by character with wave effect
const WavyText = ({ 
  text, 
  delay = 0, 
  className = "" 
}: { 
  text: string; 
  delay?: number; 
  className?: string; 
}) => {
  const characters = Array.from(text);
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i, staggerDirection: 1 }
    })
  };
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    }
  };
  
  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {characters.map((character, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block"
        >
          {character === " " ? "\u00A0" : character}
        </motion.span>
      ))}
    </motion.h1>
  );
};

// 3D Perspective Card Component with depth effect
const Perspective3DCard = ({ 
  children, 
  className = "", 
  depth = 20,
  initialRotateX = 0,
  initialRotateY = 0
}: { 
  children: React.ReactNode; 
  className?: string; 
  depth?: number;
  initialRotateX?: number;
  initialRotateY?: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(initialRotateX);
  const [rotateY, setRotateY] = useState(initialRotateY);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const percentX = (mouseX - centerX) / (rect.width / 2);
    const percentY = (mouseY - centerY) / (rect.height / 2);
    
    setRotateX(-percentY * depth);
    setRotateY(percentX * depth);
  };
  
  const handleMouseLeave = () => {
    setRotateX(initialRotateX);
    setRotateY(initialRotateY);
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={`perspective-card relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </motion.div>
  );
};

// Animated counter component
function CountUp({ 
  value, 
  format = 'hu-HU', 
  prefix = '', 
  suffix = '',
  duration = 2000
}: {
  value: number | string;
  format?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  
  useEffect(() => {
    const startTime = Date.now();
    const endValue = numericValue;
    const startValue = 0;
    
    const updateCount = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: cubic-bezier
      const easedProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const currentValue = startValue + (endValue - startValue) * easedProgress;
      countRef.current = currentValue;
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
    
    return () => {
      countRef.current = endValue;
    };
  }, [numericValue, duration]);
  
  return (
    <span>
      {prefix}
      {Math.round(count).toLocaleString(format)}
      {suffix}
    </span>
  );
}

// Glowing text component with interactive hover effect
const GlowingText = ({ 
  children, 
  gradient = "from-blue-500 via-purple-500 to-pink-500", 
  className = "", 
  delay = 0 
}: { 
  children: React.ReactNode; 
  gradient?: string; 
  className?: string; 
  delay?: number; 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePosition({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
  };
  
  return (
    <motion.div
      ref={ref}
      className={`inline-block relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <span className={`font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent relative z-10`}>
        {children}
      </span>
      {isHovered && (
        <motion.div 
          className={`absolute bg-gradient-to-r ${gradient} filter blur-xl opacity-40 z-0 rounded-full`}
          style={{
            width: 80,
            height: 80,
            left: mousePosition.x - 40,
            top: mousePosition.y - 40,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};

// Animated button glow effect
const AnimatedGlowButton = ({ 
  children, 
  className = "",
  onClick = () => {},
  href,
  variant = "gradient",
  glowColor = "rgba(124, 58, 237, 0.6)"
}: { 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: string;
  glowColor?: string;
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current || !isHovered) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMousePosition({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
  };
  
  return (
    <motion.div
      ref={buttonRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {isHovered && (
        <motion.div 
          className="absolute rounded-full blur-xl pointer-events-none z-0"
          style={{
            background: glowColor,
            width: 80,
            height: 80,
            left: mousePosition.x - 40,
            top: mousePosition.y - 40,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <Button 
        href={href} 
        onClick={onClick}
        variant={variant} 
        className={className}
      >
        {children}
      </Button>
    </motion.div>
  );
};

// Main component
export default function Home() {
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const { data, isGameOffline, refreshAllData } = useLoadedData();
  const { charts } = data || { charts: {} };
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Check if there is valid data
  const noDataAvailable = isGameOffline || !charts?.altalanosMutatok;
  
  // Set up auto-refresh interval (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
      setLastRefresh(Date.now());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshAllData]);
  
  // Format last refresh time
  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - lastRefresh) / 1000);
    return `${seconds} másodperce`;
  };
  
  // Parallax effect refs
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  // Generate random points for floating particles
  const floatingPoints = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      x: Math.random() * window.innerWidth - window.innerWidth / 2,
      y: Math.random() * window.innerHeight - window.innerHeight / 2,
      delay: Math.random() * 5,
      size: 4 + Math.random() * 8 + 'px',
      color: i % 3 === 0 
        ? 'rgba(124, 58, 237, 0.6)' 
        : i % 3 === 1 
          ? 'rgba(37, 99, 235, 0.6)' 
          : 'rgba(56, 189, 248, 0.6)'
    }));
  }, []);
  
  // Add mouse parallax effect for header section
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({
      x: (e.clientX - window.innerWidth / 2) / 20,
      y: (e.clientY - window.innerHeight / 2) / 20
    });
  };
  
  // Track section visibility for scroll animations
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.3 });
  
  // For scroll progress indicator
  const scrollYProgressSpring = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-purple-600 origin-left z-[9999]"
        style={{ scaleX: scrollYProgressSpring }}
      />

      {/* Hero Section */}
      <section 
        className="relative w-full overflow-hidden pt-24 md:pt-32 lg:pt-40 pb-20 transition-colors duration-500" 
        ref={heroRef}
        onMouseMove={handleMouseMove}
      >
        {/* Animated background elements */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y, opacity }}
          aria-hidden="true"
        >
          <div 
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl transition-all duration-500"
            style={{ 
              transform: `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * -0.5}px)`,
              animation: 'float 8s ease-in-out infinite' 
            }}
          ></div>
          <div 
            className="absolute top-40 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl transition-all duration-500" 
            style={{ 
              transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
              animation: 'float 8s ease-in-out infinite 2s' 
            }}
          ></div>
          <div 
            className="absolute bottom-40 right-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-500" 
            style={{ 
              transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
              animation: 'float 8s ease-in-out infinite 4s' 
            }}
          ></div>
          
          {/* Floating particles */}
          {floatingPoints.map((point, index) => (
            <FloatingParticle 
              key={index}
              x={point.x}
              y={point.y}
              delay={point.delay}
              size={point.size}
              color={point.color}
            />
          ))}
        </motion.div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div 
              className="flex flex-col justify-center space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.1
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Badge variant="gradient" animate={true} className="w-fit mb-2">
                  Miskolci Egyetem Verseny
                </Badge>
              </motion.div>
              
              <div className="space-y-4">
                <WavyText 
                  text="Álomváros Szimuláció" 
                  className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl/none font-heading transition-colors duration-300"
                  delay={0.2}
                />
                
                <motion.p 
                  className="max-w-[600px] text-lg text-primary transition-colors duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Fedezd fel a modern városépítés izgalmas világát 3D vizualizációval és valós idejű adatokkal.
                </motion.p>
              </div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <AnimatedGlowButton 
                  href="/varosterkep" 
                  variant="gradient"
                  className="font-medium transition-all duration-300 text-lg"
                  glowColor="rgba(124, 58, 237, 0.6)"
                >
                  <IconMap size={18} />
                  3D Térkép
                </AnimatedGlowButton>
                
                <AnimatedGlowButton 
                  href="/statisztikak" 
                  variant="outline" 
                  className="font-medium transition-colors duration-300 text-lg"
                  glowColor="rgba(59, 130, 246, 0.6)"
                >
                  <IconChartBar size={18} />
                  Élő Statisztikák
                </AnimatedGlowButton>
              </motion.div>
              
              <motion.div 
                className={`flex items-center gap-3 pt-4 text-sm transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`relative ${!noDataAvailable ? 'flex' : ''}`}>
                    <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${noDataAvailable ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    {!noDataAvailable && (
                      <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <span>{noDataAvailable ? 'Nincs online játék' : 'Élő adatok'}</span>
                </div>
                
                <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                
                <div className="flex items-center gap-1.5">
                  <IconCheckbox size={16} className="text-blue-500" />
                  <span>Valós idejű frissítések</span>
                </div>
              </motion.div>
            </motion.div>
            
            <Perspective3DCard
              className="mx-auto"
              depth={5}
              initialRotateX={0}
              initialRotateY={0}
            >
              <motion.div 
                className="mx-auto flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.95, rotateY: 0 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeOut", 
                  delay: 0.3 
                }}
              >
                <BackgroundGradient intensity="low" glowColor="from-purple-600">
                  <Card
                    variant="glass"
                    hover="glow"
                    className={`w-full min-w-[250px] md:min-w-[350px] h-[320px] sm:h-[400px] md:h-[450px] flex items-center justify-center overflow-hidden transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-800 hover:border-gray-700' 
                        : 'border-gray-200 hover:border-gray-300 shadow-md'
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Animated gradient dots in background - removing the dynamic animation */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className="absolute rounded-full bg-purple-500"
                              style={{
                                width: 4 + Math.random() * 6,
                                height: 4 + Math.random() * 6,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: 0.4
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="relative z-10 text-center p-6">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                        >
                          <GlowingText 
                            className="text-2xl font-semibold mb-3 font-heading"
                            gradient="from-purple-400 via-pink-500 to-blue-500"
                          >
                            Város szimuláció letöltése
                          </GlowingText>
                          
                          <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
                            Egy testreszabható városszimuláció játék és még sok más egybe! 
                          </p>
                          
                          <AnimatedGlowButton 
                            href={config.links.github}
                            variant="glass"
                            className="text-sm"
                            glowColor="rgba(168, 85, 247, 0.6)"
                          >
                            <IconBrandGithub size={16} />
                            Részletek
                          </AnimatedGlowButton>
                        </motion.div>
                      </div>
                    </div>
                  </Card>
                </BackgroundGradient>
              </motion.div>
            </Perspective3DCard>
          </div>
        </div>
        
        {/* Down arrow scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 cursor-pointer"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, 10, 0] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            delay: 1.5 
          }}
          onClick={() => window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
          })}
        >
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            <path 
              d="M5 13l7 7 7-7M12 20V4" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </section>
      
      {/* Stats Section */}
      <Section className="py-20 transition-colors duration-500">
        <div 
          className="container px-4 sm:px-6 lg:px-8 mx-auto"
          ref={statsRef}
        >
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-3">
                Élő Adatok
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 transition-colors duration-300">
                Milyen most <GlowingText gradient="from-purple-400 via-blue-500 to-indigo-500">a városod?</GlowingText>
              </h2>
              <p className={`max-w-2xl mx-auto transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Kövesd nyomon a város legfontosabb mutatóit valós időben, a szimuláció minden aspektusának áttekintéséhez.
              </p>
            </motion.div>
          </div>
          
          {noDataAvailable ? (
            <motion.div 
              className={`text-center p-8 rounded-xl max-w-2xl mx-auto transition-all duration-500 ${
                isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-50 text-gray-700'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center justify-center mb-4">
                <IconAlertTriangle size={48} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nincs elérhető játék adat</h3>
              <p className="mb-4">Indítsd el a város szimulációt, hogy lásd az élő statisztikákat.</p>
              <AnimatedGlowButton
                href={config.links.github}
                variant="outline"
                className="inline-flex items-center"
              >
                <span>Játék letöltése</span>
                <IconBrandGithub size={18} className="ml-1" />
              </AnimatedGlowButton>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Manuálisan meghatározott statisztikák, mivel az API-ból nem tömb érkezik */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="group"
              >
                <Perspective3DCard depth={10} className="h-full w-full">
                  <StatCard
                    title="Lakosság"
                    value={charts?.altalanosMutatok?.lakossagSzama || 0}
                    description="A város jelenlegi lakosainak száma"
                    icon={<IconUsers className="h-5 w-5" />}
                    color="blue"
                  />
                </Perspective3DCard>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="group"
              >
                <Perspective3DCard depth={10} className="h-full w-full">
                  <StatCard
                    title="Elégedettség"
                    value={charts?.altalanosMutatok?.elegedettseg || 0}
                    description="A lakosság általános boldogsága"
                    icon={<IconMoodSmile className="h-5 w-5" />}
                    color="green"
                    suffix="%"
                  />
                </Perspective3DCard>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="group"
              >
                <Perspective3DCard depth={10} className="h-full w-full">
                  <StatCard
                    title="Épületek"
                    value={charts?.altalanosMutatok?.epuletekSzama || 0}
                    description="Az összes épület száma"
                    icon={<IconBuilding className="h-5 w-5" />}
                    color="purple"
                  />
                </Perspective3DCard>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="group"
              >
                <Perspective3DCard depth={10} className="h-full w-full">
                  <StatCard
                    title="Aktív Projektek"
                    value={charts?.altalanosMutatok?.aktivProjektek || 0}
                    description="Folyamatban lévő fejlesztések"
                    icon={<IconMapPin className="h-5 w-5" />}
                    color="amber"
                  />
                </Perspective3DCard>
              </motion.div>
            </div>
          )}
          
          {!noDataAvailable && (
            <motion.div 
              className="flex justify-center mt-8"
              initial={{ opacity: 0 }}
              animate={statsInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <AnimatedGlowButton
                href="/statisztikak"
                variant="outline"
                className="inline-flex items-center gap-1 transition-all duration-300"
              >
                Összes statisztika megtekintése
                <IconArrowUpRight size={18} />
              </AnimatedGlowButton>
            </motion.div>
          )}
        </div>
      </Section>

      {/* Features Section */}
      <Section 
        className="py-20 md:py-28 transition-colors duration-500 overflow-hidden relative"
        ref={featuresRef}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Background grid pattern */}
          <div 
            className={`absolute inset-0 transition-opacity duration-700 ${
              isDark ? 'opacity-5' : 'opacity-[0.02]'
            }`}
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), 
                                linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Background gradient shapes */}
          <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full bg-purple-500/5 dark:bg-purple-400/10 blur-3xl" />
          <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-blue-500/5 dark:bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-cyan-400/5 dark:bg-cyan-500/10 blur-3xl" />
        </div>
        
        <div className="container px-4 sm:px-6 lg:px-8 mx-auto relative z-10">
          <motion.div 
            className="text-center mx-auto max-w-3xl mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-3">
              Funkciók
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 transition-colors duration-300">
              <GlowingText gradient="from-blue-400 via-purple-500 to-indigo-500">
                Modern technológiák
              </GlowingText> a városépítéshez
            </h2>
            <p className={`max-w-2xl mx-auto transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Fedezd fel a városépítő szimulációnk funkcióit, amelyek segítenek megérteni és tökéletesíteni a városi infrastruktúrát.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Perspective3DCard depth={8} className="h-full">
                <FeatureCard
                  title="3D Városmodell"
                  description="Fedezd fel városodat 3D-ben, és lásd a változásokat valós időben."
                  icon={<IconMap className="h-6 w-6 text-blue-500" />}
                />
              </Perspective3DCard>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Perspective3DCard depth={8} className="h-full">
                <FeatureCard
                  title="Valós idejű adatok"
                  description="Kövesd nyomon a város teljesítményét részletes statisztikákkal és grafikonokkal."
                  icon={<IconChartBar className="h-6 w-6 text-purple-500" />}
                />
              </Perspective3DCard>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Perspective3DCard depth={8} className="h-full">
                <FeatureCard
                  title="Interaktív elemek"
                  description="Kattints az épületekre a részletes információkért és a testreszabási lehetőségekért."
                  icon={<IconBuildingCommunity className="h-6 w-6 text-cyan-500" />}
                />
              </Perspective3DCard>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Perspective3DCard depth={8} className="h-full">
                <FeatureCard
                  title="Csak indits el a játékot!"
                  description="Nem kell semmi beállítás, csak indits el a játékot és lásd a városodat 3D-ben."
                  icon={<IconRotate3d className="h-6 w-6 text-amber-500" />}
                />
              </Perspective3DCard>
            </motion.div>
            
            {/* Feature 5 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Perspective3DCard depth={8} className="h-full">
                <FeatureCard
                  title="Gazdasági elemzés"
                  description="Elemezd a város gazdaságát és hozz adatvezérelt döntéseket a fejlesztésekről."
                  icon={<IconChartBar className="h-6 w-6 text-green-500" />}
                />
              </Perspective3DCard>
            </motion.div>
            
            {/* Feature 6 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Perspective3DCard depth={8} className="h-full">
                <FeatureCard
                  title="Lakosság követése"
                  description="Kövesd a lakosság elégedettségét és az életminőség változását a városodban."
                  icon={<IconUsers className="h-6 w-6 text-rose-500" />}
                />
              </Perspective3DCard>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex justify-center mt-12"
            initial={{ opacity: 0 }}
            animate={featuresInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <AnimatedGlowButton
              href="/prezentacio"
              variant="gradient"
              className="inline-flex items-center gap-1 transition-all duration-300"
              glowColor="rgba(124, 58, 237, 0.6)"
            >
              Prezentáció megtekintése
              <IconArrowUpRight size={18} />
            </AnimatedGlowButton>
          </motion.div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800 transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="h-1 w-24 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Segédfüggvények 
// Ikonok a stat kártyákhoz
function getStatIcon(name: string) {
  switch (name.toLowerCase()) {
    case 'lakossag':
    case 'lakossága':
    case 'lakossága száma':
    case 'lakosság':
    case 'lakosság száma':
      return <IconUsers className="h-5 w-5" />;
    case 'elégedettség':
    case 'boldogság':
    case 'hangulat':
      return <IconMoodSmile className="h-5 w-5" />;
    case 'épületek száma':
    case 'épületek':
    case 'épület':
      return <IconBuilding className="h-5 w-5" />;
    case 'aktív projektek':
    case 'projektek':
      return <IconMapPin className="h-5 w-5" />;
    default:
      return <IconChartBar className="h-5 w-5" />;
  }
}

// Szín a stat kártyákhoz
function getStatColor(index: number) {
  const colors = ['blue', 'green', 'purple', 'amber', 'cyan'];
  return colors[index % colors.length] as 'blue' | 'green' | 'purple' | 'cyan' | 'amber';
}

// Komponensek

// Stat kártya komponens 
interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'cyan' | 'amber';
  suffix?: string;
  prefix?: string;
  animate?: boolean;
  delay?: number;
}

function StatCard({ 
  title, 
  value, 
  description,
  icon,
  color = 'blue',
  suffix = '',
  prefix = '',
  animate = false,
  delay = 0
}: StatCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Color variations based on the color prop
  const getColors = () => {
    const colors = {
      blue: {
        bg: isDark ? 'bg-blue-500/10' : 'bg-blue-100/60',
        border: isDark ? 'border-blue-500/20' : 'border-blue-200',
        text: 'text-blue-600 dark:text-blue-400',
        shadow: isDark ? 'shadow-blue-500/5' : 'shadow-blue-200/70'
      },
      green: {
        bg: isDark ? 'bg-green-500/10' : 'bg-green-100/60',
        border: isDark ? 'border-green-500/20' : 'border-green-200',
        text: 'text-green-600 dark:text-green-400',
        shadow: isDark ? 'shadow-green-500/5' : 'shadow-green-200/70'
      },
      purple: {
        bg: isDark ? 'bg-purple-500/10' : 'bg-purple-100/60',
        border: isDark ? 'border-purple-500/20' : 'border-purple-200',
        text: 'text-purple-600 dark:text-purple-400',
        shadow: isDark ? 'shadow-purple-500/5' : 'shadow-purple-200/70'
      },
      amber: {
        bg: isDark ? 'bg-amber-500/10' : 'bg-amber-100/60',
        border: isDark ? 'border-amber-500/20' : 'border-amber-200',
        text: 'text-amber-600 dark:text-amber-400',
        shadow: isDark ? 'shadow-amber-500/5' : 'shadow-amber-200/70'
      },
      cyan: {
        bg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-100/60',
        border: isDark ? 'border-cyan-500/20' : 'border-cyan-200',
        text: 'text-cyan-600 dark:text-cyan-400',
        shadow: isDark ? 'shadow-cyan-500/5' : 'shadow-cyan-200/70'
      }
    };
    
    return colors[color];
  };
  
  const colorClasses = getColors();
  
  return (
    <Card 
      className={`h-full transition-all duration-300 overflow-hidden border-2 ${colorClasses.border} ${colorClasses.bg} shadow-sm backdrop-blur-sm hover:shadow-md`}
      hover="lift"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-lg transition-colors duration-300">{title}</h3>
          <div className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
            {icon}
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`text-3xl font-bold ${colorClasses.text} transition-colors duration-300`}>
            {animate ? (
              <CountUp 
                value={value} 
                prefix={prefix} 
                suffix={suffix} 
              />
            ) : (
              `${prefix}${value}${suffix}`
            )}
          </div>
        </div>
        
        <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// Feature card component
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

function FeatureCard({ title, description, icon, delay = 0 }: FeatureCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <Card 
      className={`h-full group transition-all duration-300 overflow-hidden border ${
        isDark ? 'border-gray-800 hover:border-gray-700' : 'border-gray-200 hover:border-gray-300'
      }`}
      hover="lift"
    >
      <CardContent className="p-6">
        <div className={`p-3 rounded-xl w-fit mb-5 transition-all duration-300 ${
          isDark ? 'bg-gray-800 group-hover:bg-gray-700' : 'bg-gray-100 group-hover:bg-gray-200'
        }`}>
          {icon}
        </div>
        
        <h3 className="font-semibold text-xl mb-2 transition-colors duration-300">{title}</h3>
        
        <p className={`transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
} 