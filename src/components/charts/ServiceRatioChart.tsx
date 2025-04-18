'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBuildings } from '@tabler/icons-react';

// Helper function to convert polar coordinates to cartesian - moved outside to avoid initialization issues
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export function ServiceRatioChart() {
  const { getTransformedData } = useAppStore();
  const { charts } = getTransformedData();
  
  // Get services data - adjust this to match your actual data structure
  const serviceTypes = charts?.szolgaltatasokChart || [];
  
  // State for the selected service type
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Custom colors for the chart - defined early to avoid initialization errors
  const customColors = [
    '#4f46e5', // indigo
    '#ec4899', // pink
    '#10b981', // emerald
    '#f97316', // orange
    '#06b6d4', // cyan
    '#eab308', // yellow
    '#8b5cf6', // purple
    '#ef4444', // red
  ];
  
  // Prepare chart data with vibrant colors
  const chartData = useMemo(() => {
    if (!serviceTypes.length) {
      return [
        { name: 'Nincs adat', value: 1, color: '#cbd5e1' }
      ];
    }
    
    return serviceTypes.map((item) => ({
      name: item.label,
      value: item.value,
    }));
  }, [serviceTypes]);
  
  // Total services count
  const totalServices = useMemo(() => {
    return serviceTypes.reduce((sum, item) => sum + item.value, 0);
  }, [serviceTypes]);
  
  // Get details for selected service type
  const selectedTypeDetails = useMemo(() => {
    if (!selectedType) return null;
    const selected = serviceTypes.find(item => item.label === selectedType);
    if (!selected) return null;
    
    return {
      name: selected.label,
      value: selected.value,
      percentage: Math.round((selected.value / totalServices) * 100)
    };
  }, [selectedType, serviceTypes, totalServices]);
  
  // Handle value select in the chart
  const handleValueSelect = (value: any) => {
    if (value && typeof value === 'object' && 'name' in value) {
      setSelectedType(value.name === selectedType ? null : value.name);
    } else if (typeof value === 'string') {
      setSelectedType(value === selectedType ? null : value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full relative"
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-md bg-purple-500/20">
          <IconBuildings size={18} className="text-purple-500" />
        </div>
        <span className="text-sm font-medium text-foreground">Szolgáltatások megoszlása</span>
      </div>
      
      <div className="h-52 relative">
        <div className="h-full w-full flex items-center justify-center">
          <div className="relative">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <g transform="translate(75, 75)">
                {(() => {
                  let currentAngle = 0;
                  
                  return chartData.map((item, i) => {
                    const percentage = item.value / (totalServices || 1) * 100;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + (percentage / 100 * 360);
                    
                    // Update current angle for next slice
                    currentAngle = endAngle;
                    
                    const color = customColors[i % customColors.length];
                    
                    // Calculate arc path
                    const startRadians = (startAngle - 90) * Math.PI / 180;
                    const endRadians = (endAngle - 90) * Math.PI / 180;
                    
                    const startX = 60 * Math.cos(startRadians);
                    const startY = 60 * Math.sin(startRadians);
                    const endX = 60 * Math.cos(endRadians);
                    const endY = 60 * Math.sin(endRadians);
                    
                    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                    
                    const pathData = `
                      M ${startX} ${startY}
                      A 60 60 0 ${largeArcFlag} 1 ${endX} ${endY}
                      L 0 0
                      Z
                    `;
                    
                    return (
                      <path
                        key={item.name}
                        d={pathData}
                        fill={color}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                        onClick={() => handleValueSelect(item)}
                        style={{ 
                          cursor: 'pointer',
                          opacity: selectedType && selectedType !== item.name ? 0.6 : 1,
                          transition: 'opacity 0.3s ease' 
                        }}
                      />
                    );
                  });
                })()}
                {/* Inner circle (donut hole) */}
                <circle cx="0" cy="0" r="40" fill="#111827" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              </g>
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {selectedType ? (
                  <motion.div
                    key="selected"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <p className="text-xs text-foreground-500">{selectedTypeDetails?.name}</p>
                    <p className="text-lg font-bold text-foreground">{selectedTypeDetails?.value}</p>
                    <p className="text-xs text-foreground-500">{selectedTypeDetails?.percentage}%</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <p className="text-xs text-foreground-500">Összes</p>
                    <p className="text-lg font-bold text-foreground">{totalServices}</p>
                    <p className="text-xs text-foreground-500">szolgáltatás</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="grid grid-cols-2 gap-2">
          {chartData.map((item, i) => (
            <div 
              key={item.name}
              className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => handleValueSelect(item)}
              style={{
                opacity: selectedType && selectedType !== item.name ? 0.6 : 1
              }}
            >
              <div 
                className="h-3 w-3 rounded-sm" 
                style={{ backgroundColor: customColors[i % customColors.length] }}
              />
              <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Service type details */}
      <div className="mt-4 p-3 rounded-lg bg-foreground/5 border border-white/5">
        <p className="text-xs text-foreground-500 mb-2">A szolgáltatások típus szerinti megoszlása mutatja a város szolgáltatási struktúráját és ellátottságát.</p>
        
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></div>
            <span className="text-xs text-foreground-400">Közszolgáltatások</span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></div>
            <span className="text-xs text-foreground-400">Közművek</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 