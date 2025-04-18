'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBuilding } from '@tabler/icons-react';

export function BuildingDonutChart() {
  const { getTransformedData } = useAppStore();
  const { charts } = getTransformedData();
  
  // Get building type data
  const buildingTypes = charts?.epuletTipusokChart || [];
  
  // State for the selected type
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Custom colors for the chart - defined early to avoid initialization errors
  const customColors = [
    '#4f46e5', // indigo
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#10b981', // emerald
    '#ef4444', // red
    '#3b82f6', // blue
  ];
  
  // Prepare chart data with vibrant colors
  const chartData = useMemo(() => {
    if (!buildingTypes.length) {
      return [
        { name: 'Nincs adat', value: 1, color: '#cbd5e1' }
      ];
    }
    
    return buildingTypes.map((item) => ({
      name: item.label,
      value: item.value,
    }));
  }, [buildingTypes]);
  
  // Total buildings count
  const totalBuildings = useMemo(() => {
    return buildingTypes.reduce((sum, item) => sum + item.value, 0);
  }, [buildingTypes]);
  
  // Get details for selected building type
  const selectedTypeDetails = useMemo(() => {
    if (!selectedType) return null;
    const selected = buildingTypes.find(item => item.label === selectedType);
    if (!selected) return null;
    
    return {
      name: selected.label,
      value: selected.value,
      percentage: Math.round((selected.value / totalBuildings) * 100)
    };
  }, [selectedType, buildingTypes, totalBuildings]);
  
  // Handle value select in the chart
  const handleValueSelect = (value: any) => {
    if (value && typeof value === 'object' && 'name' in value) {
      setSelectedType(value.name === selectedType ? null : value.name);
    } else if (typeof value === 'string') {
      setSelectedType(value === selectedType ? null : value);
    }
  };

  return (
    <div className="h-full w-full relative flex flex-col items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1 }}
          className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-blue-500 filter blur-3xl"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-purple-500 filter blur-3xl"
        />
      </div>

      <div className="relative z-10 h-[200px] w-full max-w-[250px]">
        <div className="relative h-full w-full flex items-center justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <g transform="translate(100, 100)">
              {(() => {
                let currentAngle = 0;
                
                return chartData.map((item, i) => {
                  const percentage = item.value / (totalBuildings || 1) * 100;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + (percentage / 100 * 360);
                  
                  // Update current angle for next slice
                  currentAngle = endAngle;
                  
                  const color = customColors[i % customColors.length];
                  
                  // Calculate arc path
                  const startRadians = (startAngle - 90) * Math.PI / 180;
                  const endRadians = (endAngle - 90) * Math.PI / 180;
                  
                  const startX = 70 * Math.cos(startRadians);
                  const startY = 70 * Math.sin(startRadians);
                  const endX = 70 * Math.cos(endRadians);
                  const endY = 70 * Math.sin(endRadians);
                  
                  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                  
                  const pathData = `
                    M ${startX} ${startY}
                    A 70 70 0 ${largeArcFlag} 1 ${endX} ${endY}
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

          {/* Building icon in center */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.5, duration: 0.7 }}
          >
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg border border-white/10">
              <IconBuilding 
                size={28} 
                className="text-blue-500" 
                stroke={1.5}
              />
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Chart info section */}
      <motion.div 
        className="mt-6 w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {selectedType ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium mb-2">
                {selectedTypeDetails?.name}
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-blue-500">{selectedTypeDetails?.value}</span>
                <span className="text-sm text-foreground-500">épület</span>
              </div>
              <div className="text-foreground-400 text-sm mt-1">{selectedTypeDetails?.percentage}% az összes épületből</div>
            </motion.div>
          ) : (
            <motion.div
              key="total"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium mb-2">
                Összes épület
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold">{totalBuildings}</span>
                <span className="text-sm text-foreground-500">épület</span>
              </div>
              <div className="text-foreground-400 text-sm mt-1">Kattints egy szegmensre a részletekért</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Legend section */}
      <div className="mt-4 w-full">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-xs">
          {buildingTypes.map((type, index) => (
            <motion.div 
              key={type.label}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (index * 0.1) }}
              className={`flex items-center cursor-pointer rounded-md p-1.5 transition-colors ${selectedType === type.label ? 'bg-blue-500/10' : 'hover:bg-foreground/5'}`}
              onClick={() => handleValueSelect(type.label)}
            >
              <div 
                className="h-3 w-3 rounded-sm mr-2" 
                style={{ backgroundColor: customColors[index % customColors.length] }}
              />
              <span className={`${selectedType === type.label ? 'font-medium text-blue-500' : 'text-foreground-600'}`}>
                {type.label}
              </span>
              <span className="ml-auto font-medium text-foreground-500">
                {type.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 