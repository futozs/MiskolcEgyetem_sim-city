'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconUsers } from '@tabler/icons-react';

export function AgeDistributionChart() {
  const { getTransformedData } = useAppStore();
  const { charts } = getTransformedData();
  
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get age distribution data with fallback to empty array
  const ageData = useMemo(() => {
    // Add a small delay to show the loading state
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
    
    // Return the age data or empty array if not available
    return charts?.korEloszlasChart || [
      { korosztaly: '0-18', ertek: 0 },
      { korosztaly: '19-39', ertek: 0 },
      { korosztaly: '40-64', ertek: 0 },
      { korosztaly: '65+', ertek: 0 }
    ];
  }, [charts]);
  
  // Get color for age group
  const getColorForAge = (age: string) => {
    switch (age) {
      case '0-18':
        return '#4f46e5'; // indigo
      case '19-39':
        return '#8b5cf6'; // vibrant purple
      case '40-64':
        return '#ec4899'; // vibrant pink
      case '65+':
        return '#f59e0b'; // amber
      default:
        return '#4f46e5';
    }
  };
  
  // Format data for chart
  const chartData = useMemo(() => {
    return ageData.map((item) => ({
      age: item.korosztaly,
      value: item.ertek,
      color: getColorForAge(item.korosztaly),
    }));
  }, [ageData]);
  
  // Get total population
  const totalPopulation = useMemo(() => {
    return ageData.reduce((sum, item) => sum + item.ertek, 0);
  }, [ageData]);
  
  // Calculate percentages for each age group
  const agePercentages = useMemo(() => {
    const result = {};
    if (totalPopulation > 0) {
      ageData.forEach(item => {
        result[item.korosztaly] = Math.round((item.ertek / totalPopulation) * 100);
      });
    } else {
      // If total population is 0, set all percentages to 0
      ageData.forEach(item => {
        result[item.korosztaly] = 0;
      });
    }
    return result;
  }, [ageData, totalPopulation]);
  
  // Get description for age group
  const getAgeDescription = (age: string) => {
    switch (age) {
      case '0-18':
        return 'Gyermekek és fiatalkorúak';
      case '19-39':
        return 'Fiatal felnőttek';
      case '40-64':
        return 'Középkorúak';
      case '65+':
        return 'Idősek';
      default:
        return '';
    }
  };
  
  // Handle bar click
  const handleBarClick = (value: any) => {
    if (value && typeof value === 'object' && 'age' in value) {
      setSelectedAge(value.age === selectedAge ? null : value.age);
    }
  };

  return (
    <div className="h-full w-full relative flex flex-col">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1 }}
          className="absolute -left-10 top-10 w-40 h-40 rounded-full bg-blue-500 filter blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute right-10 bottom-10 w-40 h-40 rounded-full bg-purple-500 filter blur-3xl"
        />
      </div>
      
      {/* Title with icon */}
      <motion.div 
        className="flex items-center gap-2 mb-4 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-1.5 rounded-md bg-blue-500/10">
          <IconUsers size={18} className="text-blue-500" />
        </div>
        <span className="text-sm font-medium">Korcsoportok megoszlása</span>
      </motion.div>
      
      {/* Loading state */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm bg-background/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </motion.div>
      )}
      
      {/* Selection info */}
      {selectedAge && (
        <motion.div 
          className="absolute top-0 right-0 z-20 bg-background/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          key={selectedAge}
        >
          <div className="text-xs text-foreground-500">{getAgeDescription(selectedAge)}</div>
          <div className="font-bold text-lg" style={{ color: getColorForAge(selectedAge) }}>
            {ageData.find(a => a.korosztaly === selectedAge)?.ertek.toLocaleString()} fő
          </div>
          <div className="text-xs text-foreground-500">
            {agePercentages[selectedAge]}% a teljes lakosságból
          </div>
        </motion.div>
      )}
      
      {/* Main chart */}
      <motion.div 
        className="flex-grow relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-end space-x-6 py-8 px-8 relative">
            {chartData.map((item) => {
              // Calculate the max value safely
              const maxValue = Math.max(...chartData.map(d => d.value), 1);
              // Calculate height percentage (min 5% to always show something)
              const heightPercentage = maxValue > 0 
                ? Math.max(5, (item.value / maxValue) * 100) 
                : 5;
              
              return (
                <div 
                  key={item.age} 
                  className="flex-1 flex flex-col items-center cursor-pointer"
                  onClick={() => handleBarClick({ age: item.age })}
                >
                  <div 
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{ 
                      backgroundColor: selectedAge === item.age ? getColorForAge(item.age) : getColorForAge(item.age),
                      height: `${heightPercentage * 1.8}px`, // Max height 180px
                      opacity: selectedAge && selectedAge !== item.age ? 0.5 : 1
                    }}
                  />
                  <div className="mt-2 text-xs text-center">{item.age}</div>
                  <div className="mt-1 text-xs text-foreground/70">{item.value.toLocaleString()} fő</div>
                </div>
              );
            })}

            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-white/5" />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Age group cards */}
      <motion.div 
        className="grid grid-cols-4 gap-1 mt-5 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {ageData.map((age, index) => (
          <motion.div
            key={age.korosztaly}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              selectedAge === age.korosztaly 
                ? 'bg-foreground/10 border-blue-500/30' 
                : 'bg-foreground/5 border-white/5 hover:bg-foreground/10'
            }`}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleBarClick({ age: age.korosztaly })}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
          >
            <div className="flex flex-col items-center text-center">
              <div 
                className="h-2 w-8 rounded-sm mb-1"
                style={{ backgroundColor: getColorForAge(age.korosztaly) }}
              />
              <p className="text-xs font-medium">{age.korosztaly}</p>
              <p className="text-xs text-foreground-500">{agePercentages[age.korosztaly]}%</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 