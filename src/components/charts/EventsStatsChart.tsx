'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Chip, Divider, Progress } from '@nextui-org/react';
import { 
  IconChartPie, 
  IconCoin, 
  IconMoodSmile, 
  IconUsers
} from '@tabler/icons-react';

export function EventsStatsChart() {
  const { getTransformedData } = useAppStore();
  const { esemenyek } = getTransformedData();

  // Calculate event statistics
  const stats = useMemo(() => {
    if (!esemenyek || esemenyek.length === 0) return null;

    // Count events by type
    const typeCount = {};
    let totalFinancialImpact = 0;
    let totalHappinessImpact = 0;
    let totalPopulationImpact = 0;

    // Go through each event and gather statistics
    esemenyek.forEach(event => {
      const { esemeny, hatas } = event;
      const { tipus } = esemeny;
      
      // Count event types
      if (!typeCount[tipus]) {
        typeCount[tipus] = 0;
      }
      typeCount[tipus]++;
      
      // Sum up impacts
      totalFinancialImpact += hatas?.penz || 0;
      totalHappinessImpact += hatas?.boldogsag || 0;
      totalPopulationImpact += hatas?.lakossag || 0;
      
      // Look for financial information in the title
      if (esemeny.nev.includes('Ft')) {
        // Try to extract amount from title (e.g., "Adóbevétel: 1,388,038,106 Ft")
        const amountMatch = esemeny.nev.match(/[+-]?[\d,.]+/g);
        if (amountMatch) {
          // Remove non-digit characters except for decimal point
          const cleanAmount = amountMatch[0].replace(/[^\d.-]/g, '');
          const amount = parseFloat(cleanAmount);
          if (!isNaN(amount)) {
            // If we're dealing with tax revenue or similar, add to financial impact
            if (esemeny.nev.toLowerCase().includes('bevétel')) {
              totalFinancialImpact += amount;
            } else if (esemeny.nev.toLowerCase().includes('költség') || esemeny.nev.toLowerCase().includes('kiadás')) {
              totalFinancialImpact -= amount;
            }
          }
        }
      }
    });
    
    // Convert type counts to array for visualization
    const typeData = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: ((count as number) / esemenyek.length) * 100
    }));
    
    // Sort by count in descending order
    typeData.sort((a, b) => b.count - a.count);
    
    return {
      typeData,
      totalEvents: esemenyek.length,
      financialImpact: totalFinancialImpact,
      happinessImpact: totalHappinessImpact,
      populationImpact: totalPopulationImpact
    };
  }, [esemenyek]);

  // Custom colors for different event types
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'politikai':
        return 'text-red-500';
      case 'gazdasági':
        return 'text-amber-500';
      case 'infrastruktúra':
        return 'text-blue-500';
      case 'rendszer':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  // Progress bar variant based on type
  const getProgressColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'politikai':
        return 'danger';
      case 'gazdasági':
        return 'warning';
      case 'infrastruktúra':
        return 'primary';
      case 'rendszer':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // If no stats available, show placeholder
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <IconChartPie size={48} className="text-foreground-500 mb-4 opacity-50" />
        <p className="text-foreground-600">Nincs elegendő adat az elemzéshez</p>
        <p className="text-xs text-foreground-500 mt-2">
          A statisztikák a játékmenet során frissülnek
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <CardHeader className="pb-0 px-4 flex-col items-start">
        <div className="flex w-full justify-between items-center">
          <h4 className="text-lg font-medium flex items-center gap-2">
            <IconChartPie size={20} />
            Események Statisztikái
          </h4>
          <Chip size="sm" variant="flat" color="secondary">
            {stats.totalEvents} esemény
          </Chip>
        </div>
        <p className="text-sm text-foreground-500 mt-1">
          Az események típus szerinti megoszlása
        </p>
        <Divider className="my-3" />
      </CardHeader>
      
      <CardBody className="overflow-y-auto px-4 pt-0">
        {/* Event type breakdown */}
        <div className="space-y-4 mb-6">
          {stats.typeData.map((item, index) => (
            <motion.div 
              key={item.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium ${getTypeColor(item.type)}`}>
                  {item.type}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-500">
                    {item.count} esemény
                  </span>
                  <span className="text-xs font-medium">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={item.percentage} 
                color={getProgressColor(item.type)} 
                size="sm"
                radius="sm"
                classNames={{
                  base: "max-w-full",
                  track: "bg-foreground/10",
                  indicator: "bg-gradient-to-r shadow-md"
                }}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Impact summary */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Financial impact */}
          <div className="bg-content1 rounded-lg p-3 border border-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-amber-500/20">
                <IconCoin size={18} className="text-amber-500" />
              </div>
              <span className="text-sm font-medium">Pénzügyi hatás</span>
            </div>
            <p className={`text-xl font-bold ${stats.financialImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(stats.financialImpact / 1000000).toFixed(1)} M Ft
            </p>
          </div>
          
          {/* Happiness impact */}
          <div className="bg-content1 rounded-lg p-3 border border-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-blue-500/20">
                <IconMoodSmile size={18} className="text-blue-500" />
              </div>
              <span className="text-sm font-medium">Elégedettségi hatás</span>
            </div>
            <p className={`text-xl font-bold ${stats.happinessImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.happinessImpact > 0 ? '+' : ''}{stats.happinessImpact}%
            </p>
          </div>
          
          {/* Population impact */}
          <div className="bg-content1 rounded-lg p-3 border border-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-purple-500/20">
                <IconUsers size={18} className="text-purple-500" />
              </div>
              <span className="text-sm font-medium">Lakossági hatás</span>
            </div>
            <p className={`text-xl font-bold ${stats.populationImpact >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.populationImpact > 0 ? '+' : ''}{stats.populationImpact.toLocaleString('hu-HU')} fő
            </p>
          </div>
        </motion.div>
      </CardBody>
    </div>
  );
} 