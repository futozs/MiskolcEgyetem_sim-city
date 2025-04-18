'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IconMoodSmile, IconMoodSad, IconMoodNeutral } from '@tabler/icons-react';

export function SatisfactionGauge() {
  const { getTransformedData } = useAppStore();
  const { charts } = getTransformedData();
  
  const satisfaction = charts?.altalanosMutatok?.elegedettseg || 0;
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Animate the satisfaction value on load and when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(satisfaction);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [satisfaction]);
  
  // Choose color based on satisfaction
  const getColor = (value) => {
    if (value >= 75) return '#10b981'; // green
    if (value >= 50) return '#f59e0b'; // yellow
    if (value >= 25) return '#f97316'; // orange
    return '#ef4444'; // red
  };
  
  // Choose background gradient based on satisfaction
  const getGradient = (value) => {
    if (value >= 75) return 'from-green-500/5 to-blue-500/5'; 
    if (value >= 50) return 'from-yellow-500/5 to-green-500/5';
    if (value >= 25) return 'from-orange-500/5 to-yellow-500/5';
    return 'from-red-500/5 to-orange-500/5';
  };
  
  // Choose message based on satisfaction
  const getMessage = (value) => {
    if (value >= 90) return "A lakosság rendkívül elégedett és boldog!";
    if (value >= 75) return "A polgárok nagyon elégedettek a város vezetésével.";
    if (value >= 60) return "A városlakók alapvetően elégedettek, de vannak kívánságaik.";
    if (value >= 45) return "A lakosság közepesen elégedett, fejlesztésekre lenne szükség.";
    if (value >= 30) return "A városlakók többsége elégedetlen a jelenlegi helyzettel.";
    if (value >= 15) return "A lakosság kritikusan elégedetlen, komoly változtatásokra van szükség!";
    return "Vészhelyzet! A polgárok rendkívül elégedetlenek!";
  };
  
  // Calculate the rotation based on satisfaction (0-100)
  const rotation = useMemo(() => {
    // Map 0-100 to -90 to 90 degrees (half circle)
    return -90 + (animatedValue / 100) * 180;
  }, [animatedValue]);
  
  // Apply color getter for current value
  const currentColor = useMemo(() => {
    return getColor(animatedValue);
  }, [animatedValue]);
  
  // Apply gradient getter for current value
  const currentGradient = useMemo(() => {
    return getGradient(animatedValue);
  }, [animatedValue]);
  
  // Choose satisfaction icon
  const SatisfactionIcon = useMemo(() => {
    if (animatedValue >= 75) return IconMoodSmile;
    if (animatedValue >= 40) return IconMoodNeutral;
    return IconMoodSad;
  }, [animatedValue]);
  
  // Apply message getter for current value
  const currentMessage = useMemo(() => {
    return getMessage(animatedValue);
  }, [animatedValue]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <motion.div 
        className={`w-full max-w-[320px] bg-gradient-to-b ${currentGradient} rounded-2xl p-6 md:p-8 relative overflow-hidden border border-white/10 backdrop-blur-sm shadow-lg`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {/* Background decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-500/10 filter blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-purple-500/10 filter blur-3xl"></div>
        
        <div className="relative">
          {/* Gauge title */}
          <div className="text-center mb-4">
            <motion.div 
              className="inline-block px-3 py-1 rounded-full bg-foreground/5 text-foreground-600 text-xs font-medium"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Lakossági Hangulat
            </motion.div>
          </div>
            
          {/* Main gauge */}
          <div className="relative h-[150px] w-full">
            {/* Gauge background */}
            <svg className="w-full h-full" viewBox="0 0 120 65">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Outer gauge background */}
              <path 
                d="M 10,60 A 50,50 0 0 1 110,60" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="4" 
                strokeLinecap="round"
              />
              
              {/* Colored gauge based on satisfaction */}
              <motion.path 
                d="M 10,60 A 50,50 0 0 1 110,60" 
                fill="none" 
                stroke="url(#gaugeGradient)" 
                strokeWidth="4" 
                strokeLinecap="round"
                strokeDasharray="157"  // Total length of the path (π * r)
                initial={{ strokeDashoffset: 157 }}
                animate={{ strokeDashoffset: 157 - (157 * animatedValue / 100) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                filter="url(#glow)"
              />
              
              {/* Tick marks */}
              <g strokeWidth="1" stroke="rgba(255,255,255,0.3)">
                <line x1="10" y1="60" x2="15" y2="60" />
                <line x1="35" y1="25.5" x2="38.5" y2="30" />
                <line x1="60" y1="10" x2="60" y2="15" />
                <line x1="85" y1="25.5" x2="81.5" y2="30" />
                <line x1="110" y1="60" x2="105" y2="60" />
              </g>
              
              {/* Text labels */}
              <text x="6" y="70" fontSize="6" fill="rgba(255,255,255,0.5)">0%</text>
              <text x="35" y="20" fontSize="6" fill="rgba(255,255,255,0.5)">25%</text>
              <text x="60" y="6" fontSize="6" fill="rgba(255,255,255,0.5)">50%</text>
              <text x="80" y="20" fontSize="6" fill="rgba(255,255,255,0.5)">75%</text>
              <text x="106" y="70" fontSize="6" fill="rgba(255,255,255,0.5)">100%</text>
            </svg>
            
            {/* Gauge needle with animation */}
            <motion.div 
              className="absolute top-[60px] left-1/2 w-0.5 h-[50px] -ml-[1px] origin-bottom rounded-full"
              style={{ backgroundColor: currentColor, filter: "drop-shadow(0 0 2px rgba(255,255,255,0.5))" }}
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ 
                type: "spring", 
                stiffness: 60, 
                damping: 15,
                delay: 0.2
              }}
            />
            
            {/* Center point */}
            <motion.div 
              className="absolute top-[60px] left-1/2 w-6 h-6 rounded-full bg-background/80 border border-white/20 backdrop-blur-sm -ml-3 -mt-3 flex items-center justify-center shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <SatisfactionIcon size={16} stroke={2} style={{ color: currentColor }} />
            </motion.div>
          </div>
          
          {/* Satisfaction value */}
          <motion.div 
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <h3 className="text-3xl font-bold" style={{ color: currentColor }}>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={animatedValue}
              >
                {animatedValue}%
              </motion.span>
            </h3>
            
            <div className="mt-3 text-sm text-foreground-500 leading-relaxed bg-foreground/5 rounded-lg p-3 border border-white/5">
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentMessage}
                transition={{ delay: 1.2 }}
              >
                {currentMessage}
              </motion.p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 