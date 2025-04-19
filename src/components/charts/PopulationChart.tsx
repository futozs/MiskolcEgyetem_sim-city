'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconTrendingUp } from '@tabler/icons-react';

export function PopulationChart() {
  const { getTransformedData } = useAppStore();
  const { charts } = getTransformedData();
  const chartRef = useRef(null);
  
  // State for tooltip
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  // Example data for the chart - in the absence of real data
  const chartData = useMemo(() => {
    const population = charts?.altalanosMutatok?.lakossagSzama || 0;
    
    // Simulate historical data if there are no historical records
    // In reality, this should be fetched from the API
    return [
      { date: 'Jan', value: Math.round(population * 0.85) },
      { date: 'Feb', value: Math.round(population * 0.88) },
      { date: 'Mar', value: Math.round(population * 0.90) },
      { date: 'Apr', value: Math.round(population * 0.92) },
      { date: 'May', value: Math.round(population * 0.94) },
      { date: 'Jun', value: Math.round(population * 0.97) },
      { date: 'Jul', value: population },
    ];
  }, [charts]);
  
  // Calculate min and max values for chart scaling
  const minValue = Math.min(...chartData.map(d => d.value));
  const maxValue = Math.max(...chartData.map(d => d.value));
  
  // Calculate positions for line points
  const points = useMemo(() => {
    const width = 700;
    const height = 250;
    const padding = 40;
    
    return chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2);
      
      // Scale the y value to fit in the chart
      const range = maxValue - minValue;
      const normalized = range === 0 ? 0.5 : (d.value - minValue) / range;
      const y = height - padding - normalized * (height - padding * 2);
      
      // Include the index to help with identification
      return { x, y, value: d.value, date: d.date, index: i };
    });
  }, [chartData, minValue, maxValue]);
  
  // Create the SVG path for the line
  const linePath = useMemo(() => {
    return points.map((p, i) => 
      i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`
    ).join(' ');
  }, [points]);
  
  // Create the SVG path for the area
  const areaPath = useMemo(() => {
    const height = 250;
    const padding = 40;
    const baseline = height - padding;
    
    return `${linePath} L ${points[points.length-1].x},${baseline} L ${points[0].x},${baseline} Z`;
  }, [linePath, points]);
  
  const currentPopulation = charts?.altalanosMutatok?.lakossagSzama || 0;
  
  // Handle hover without causing vibrations
  const handlePointHover = (point) => {
    if (!hoveredPoint || hoveredPoint.index !== point.index) {
      setHoveredPoint(point);
    }
  };
  
  // Handle mouse leave for the entire chart
  const handleChartMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full h-full"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-blue-500/20">
          <IconTrendingUp size={18} className="text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-foreground">Népességi Trend</h3>
          <p className="text-sm text-foreground-500">
            Aktuális lakosságszám: <span className="font-semibold">{currentPopulation.toLocaleString('hu-HU')} fő</span>
          </p>
        </div>
      </div>
      
      <div 
        ref={chartRef}
        className="h-64 mt-4 relative" 
        onMouseLeave={handleChartMouseLeave}
      >
        <svg width="100%" height="100%" viewBox="0 0 700 250" preserveAspectRatio="none">
          {/* Grid lines */}
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <line 
                key={`grid-${i}`}
                x1="40" 
                y1={40 + (i * (250 - 80) / 4)} 
                x2="660" 
                y2={40 + (i * (250 - 80) / 4)}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeDasharray="5,5"
              />
            ))}
          </g>
          
          {/* X-axis */}
          <line 
            x1="40" 
            y1="210" 
            x2="660" 
            y2="210" 
            stroke="rgba(255, 255, 255, 0.2)" 
          />
          
          {/* Y-axis */}
          <line 
            x1="40" 
            y1="40" 
            x2="40" 
            y2="210" 
            stroke="rgba(255, 255, 255, 0.2)" 
          />
          
          {/* Area under the line */}
          <path 
            d={areaPath} 
            fill="url(#gradient)" 
            opacity="0.3"
          />
          
          {/* Line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke="#4f46e5" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* Invisible hit areas */}
          {points.map((p, i) => (
            <rect
              key={`hitarea-${i}`}
              x={p.x - 30}
              y={0}
              width="60"
              height="210"
              fill="transparent"
              onMouseEnter={() => handlePointHover(p)}
              style={{ cursor: 'pointer' }}
            />
          ))}
          
          {/* Data points */}
          {points.map((p, i) => (
            <circle 
              key={`point-${i}`}
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="#4f46e5" 
              stroke="#111827" 
              strokeWidth="2"
            />
          ))}
          
          {/* X-axis labels */}
          {points.map((p, i) => (
            <text 
              key={`label-${i}`}
              x={p.x} 
              y="230" 
              fontSize="12" 
              fill="rgba(255, 255, 255, 0.7)" 
              textAnchor="middle"
            >
              {p.date}
            </text>
          ))}
          
          {/* Gradient for area */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Fixed Tooltip */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div 
              key={`tooltip-${hoveredPoint.index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bg-background/90 backdrop-blur-sm border border-blue-500/20 rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none"
              style={{ 
                left: hoveredPoint.x > 500 ? hoveredPoint.x - 80 : hoveredPoint.x - 40, 
                top: 10,
                minWidth: '120px'
              }}
            >
              <div className="flex flex-col">
                <span className="text-xs text-foreground-500">{hoveredPoint.date}</span>
                <span className="text-lg font-bold text-blue-500">{hoveredPoint.value.toLocaleString('hu-HU')} fő</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Current point indicator */}
        <AnimatePresence>
          {hoveredPoint && (
            <motion.div 
              key={`indicator-${hoveredPoint.index}`}
              className="absolute pointer-events-none"
              style={{ 
                left: hoveredPoint.x - 1,
                top: 0,
                width: '2px',
                height: '210px',
                backgroundColor: 'rgba(79, 70, 229, 0.4)'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="p-3 rounded-lg bg-background/90 border border-white/5 shadow-sm">
          <div className="text-center">
            <p className="text-xs text-foreground-500 mb-1">Szolgáltatások</p>
            <p className="text-xl font-semibold text-blue-400">{charts?.altalanosMutatok?.szolgaltatasokSzama || 0}</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-background/40 border border-white/5 shadow-sm">
          <div className="text-center">
            <p className="text-xs text-foreground-500 mb-1">Épületek</p>
            <p className="text-xl font-semibold text-green-400">{charts?.altalanosMutatok?.epuletekSzama || 0}</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-background/40 border border-white/5 shadow-sm">
          <div className="text-center">
            <p className="text-xs text-foreground-500 mb-1">Projektek</p>
            <p className="text-xl font-semibold text-amber-400">{charts?.altalanosMutatok?.aktivProjektek || 0}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 