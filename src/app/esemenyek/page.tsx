'use client';

import { useState, useEffect } from 'react';
import { useLoadedData } from '@/lib/api/hooks';
import { 
  Card, 
  CardBody,
  Chip
} from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconCalendarEvent,
  IconRefresh,
  IconHistory,
  IconChartPie
} from '@tabler/icons-react';
import dynamic from 'next/dynamic';

// Dynamic imports to improve loading performance
const EventsTimelineChart = dynamic(() => import('@/components/charts/EventsTimelineChart').then(mod => ({ default: mod.EventsTimelineChart })), { ssr: false });
const EventsStatsChart = dynamic(() => import('@/components/charts/EventsStatsChart').then(mod => ({ default: mod.EventsStatsChart })), { ssr: false });

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export default function EventsPage() {
  const { data, isGameOffline, refreshAllData } = useLoadedData();
  const { esemenyek } = data;
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats'>('timeline');
  
  // Set up auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
      setLastUpdated(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshAllData]);
  
  // Update the last updated timestamp every time data changes
  useEffect(() => {
    if (esemenyek) {
      setLastUpdated(new Date());
    }
  }, [esemenyek]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshAllData();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background/70 to-background/95">
      <AnimatePresence>
        <motion.div 
          className="flex flex-col pb-16"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Header with title and real-time indicator */}
          <motion.div 
            variants={fadeInUp} 
            className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl py-4 border-b border-purple-500/10 shadow-md"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <IconCalendarEvent size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600">
                      Város Eseményei
                    </h1>
                    <p className="text-foreground-500 text-sm">
                      Városi események és hatásuk nyomon követése
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
                    disabled={isRefreshing}
                  >
                    <IconRefresh 
                      size={16} 
                      className={`${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                    <span className="hidden sm:inline">Frissítés</span>
                  </button>
                  
                  {lastUpdated && (
                    <div className="flex items-center gap-2 text-sm text-foreground-500">
                      <IconHistory className="h-4 w-4" />
                      {lastUpdated.toLocaleTimeString('hu-HU')}
                    </div>
                  )}
                  
                  {isGameOffline ? (
                    <Chip 
                      color="danger" 
                      variant="flat"
                      size="sm"
                      classNames={{
                        base: "border border-white/10",
                        content: "font-medium text-xs"
                      }}
                    >
                      Offline
                    </Chip>
                  ) : (
                    <div className="relative">
                      <Chip 
                        color="success" 
                        variant="flat"
                        size="sm"
                        classNames={{
                          base: "border border-white/10 relative z-10",
                          content: "font-medium text-xs"
                        }}
                      >
                        Élő adatok
                      </Chip>
                      <motion.div
                        className="absolute inset-0 rounded-full z-0"
                        style={{ top: "2px" }}
                        animate={{
                          boxShadow: ["0 0 0 0 rgba(52, 211, 153, 0)", "0 0 0 4px rgba(52, 211, 153, 0.3)", "0 0 0 0 rgba(52, 211, 153, 0)"]
                        }}
                        transition={{
                          duration: 2,
                          ease: "easeInOut",
                          repeat: Infinity
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Navigation tabs */}
          <motion.div 
            variants={fadeInUp} 
            className="px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full"
          >
            <div className="flex gap-2 border-b border-foreground/10 pb-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'timeline' 
                    ? 'bg-purple-500/10 text-purple-500' 
                    : 'hover:bg-foreground/5 text-foreground-500'
                }`}
              >
                <IconHistory size={18} />
                <span>Idővonalon</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'stats' 
                    ? 'bg-purple-500/10 text-purple-500' 
                    : 'hover:bg-foreground/5 text-foreground-500'
                }`}
              >
                <IconChartPie size={18} />
                <span>Statisztikák</span>
              </button>
            </div>
          </motion.div>
          
          {/* Main content */}
          <motion.div 
            variants={fadeInUp} 
            className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
          >
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
              {activeTab === 'timeline' ? (
                <>
                  {/* Timeline view */}
                  <motion.div 
                    className="lg:col-span-7"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-[600px] overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl">
                      <CardBody className="p-0">
                        <EventsTimelineChart />
                      </CardBody>
                    </Card>
                  </motion.div>
                  
                  {/* Stats view on the side */}
                  <motion.div 
                    className="lg:col-span-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card className="h-[600px] overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl">
                      <CardBody className="p-0">
                        <EventsStatsChart />
                      </CardBody>
                    </Card>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Stats view full width */}
                  <motion.div 
                    className="lg:col-span-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-[600px] overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl">
                      <CardBody className="p-0">
                        <EventsStatsChart />
                      </CardBody>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 