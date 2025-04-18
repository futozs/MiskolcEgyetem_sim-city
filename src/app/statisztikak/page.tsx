'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLoadedData } from '@/lib/api/hooks';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Chip,
  Tabs,
  Tab
} from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconUsers, 
  IconBuilding, 
  IconCalendar,
  IconMoodSmile,
  IconCoin,
  IconChartBar,
  IconRefresh,
  IconCalendarEvent,
  IconHistory,
  IconChartPie
} from '@tabler/icons-react';

// Dynamic imports to improve loading performance
const PopulationChart = dynamic(() => import('@/components/charts/PopulationChart').then(mod => ({ default: mod.PopulationChart })), { ssr: false });
const BuildingDonutChart = dynamic(() => import('@/components/charts/BuildingDonutChart').then(mod => ({ default: mod.BuildingDonutChart })), { ssr: false });
const SatisfactionGauge = dynamic(() => import('@/components/charts/SatisfactionGauge').then(mod => ({ default: mod.SatisfactionGauge })), { ssr: false });
const BudgetBarChart = dynamic(() => import('@/components/charts/BudgetBarChart').then(mod => ({ default: mod.BudgetBarChart })), { ssr: false });
const AgeDistributionChart = dynamic(() => import('@/components/charts/AgeDistributionChart').then(mod => ({ default: mod.AgeDistributionChart })), { ssr: false });
const ServiceRatioChart = dynamic(() => import('@/components/charts/ServiceRatioChart').then(mod => ({ default: mod.ServiceRatioChart })), { ssr: false });
const EventsTimelineChart = dynamic(() => import('@/components/charts/EventsTimelineChart').then(mod => ({ default: mod.EventsTimelineChart })), { ssr: false });
const EventsStatsChart = dynamic(() => import('@/components/charts/EventsStatsChart').then(mod => ({ default: mod.EventsStatsChart })), { ssr: false });
import dynamic from 'next/dynamic';

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

export default function StatisticsPage() {
  const { data, isGameOffline, refreshAllData } = useLoadedData();
  const { charts, buildingStats, esemenyek } = data;
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [eventsSubTab, setEventsSubTab] = useState("timeline");
  
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
    if (charts || esemenyek) {
      setLastUpdated(new Date());
    }
  }, [charts, esemenyek]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshAllData();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 800);
  };

  // Memoize key metrics for performance
  const metrics = useMemo(() => {
    return {
      population: charts?.altalanosMutatok?.lakossagSzama || 0,
      satisfaction: charts?.altalanosMutatok?.elegedettseg || 0,
      buildings: charts?.altalanosMutatok?.epuletekSzama || 0,
      services: charts?.altalanosMutatok?.szolgaltatasokSzama || 0,
      budget: charts?.penzugyiData?.keret || 0,
      cityName: charts?.altalanosMutatok?.varosNev || 'Álomváros',
      turn: charts?.altalanosMutatok?.fordulokSzama || 0,
      events: esemenyek?.length || 0
    };
  }, [charts, esemenyek]);
  
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
            className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl py-4 border-b border-blue-500/10 shadow-md"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    {activeTab === "stats" ? (
                      <IconChartBar size={22} />
                    ) : (
                      <IconCalendarEvent size={22} />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
                      {metrics.cityName} {activeTab === "stats" ? "Statisztikák" : "Események"}
                    </h1>
                    <p className="text-foreground-500 text-sm">
                      #{metrics.turn}. forduló
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
                  
                  <div className="flex items-center gap-2 text-sm text-foreground-500">
                    <IconCalendar className="h-4 w-4" />
                    {lastUpdated ? lastUpdated.toLocaleTimeString('hu-HU') : '---'}
                  </div>
                  
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

          {/* Main Tabs */}
          <motion.div variants={fadeInUp} className="px-4 sm:px-6 lg:px-8 pt-4 max-w-7xl mx-auto w-full">
            <Tabs 
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key.toString())}
              color="primary"
              variant="underlined"
              classNames={{
                base: "w-full",
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-primary"
              }}
            >
              <Tab
                key="stats"
                title={
                  <div className="flex items-center gap-2">
                    <IconChartBar size={18} />
                    <span>Városi Statisztikák</span>
                    <Chip size="sm" variant="flat" color="primary">{metrics.buildings}</Chip>
                  </div>
                }
              />
              <Tab
                key="events"
                title={
                  <div className="flex items-center gap-2">
                    <IconCalendarEvent size={18} />
                    <span>Városi Események</span>
                    <Chip size="sm" variant="flat" color="secondary">{metrics.events}</Chip>
                  </div>
                }
              />
            </Tabs>
          </motion.div>
          
          {activeTab === "stats" && (
            <>
              {/* Key Metrics Panel */}
              <motion.div variants={fadeInUp} className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
                  {/* Population */}
                  <motion.div 
                    variants={fadeInUp} 
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/5 to-indigo-500/10 border border-white/10 p-4 shadow-lg"
                  >
                    <div className="absolute right-0 bottom-0 opacity-10">
                      <IconUsers size={64} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-md bg-blue-500/20">
                          <IconUsers size={16} className="text-blue-500" />
                        </div>
                        <p className="text-sm text-foreground-500">Lakosság</p>
                      </div>
                      <p className="text-2xl font-bold">{metrics.population.toLocaleString('hu-HU')}</p>
                      <p className="text-xs text-foreground-400 mt-1">fő</p>
                    </div>
                  </motion.div>
                  
                  {/* Satisfaction */}
                  <motion.div 
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/10 border border-white/10 p-4 shadow-lg"
                  >
                    <div className="absolute right-0 bottom-0 opacity-10">
                      <IconMoodSmile size={64} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-md bg-green-500/20">
                          <IconMoodSmile size={16} className="text-green-500" />
                        </div>
                        <p className="text-sm text-foreground-500">Elégedettség</p>
                      </div>
                      <p className="text-2xl font-bold">{metrics.satisfaction}</p>
                      <p className="text-xs text-foreground-400 mt-1">százalék</p>
                    </div>
                  </motion.div>
                  
                  {/* Buildings */}
                  <motion.div 
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/5 to-yellow-500/10 border border-white/10 p-4 shadow-lg"
                  >
                    <div className="absolute right-0 bottom-0 opacity-10">
                      <IconBuilding size={64} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-md bg-amber-500/20">
                          <IconBuilding size={16} className="text-amber-500" />
                        </div>
                        <p className="text-sm text-foreground-500">Épületek</p>
                      </div>
                      <p className="text-2xl font-bold">{metrics.buildings}</p>
                      <p className="text-xs text-foreground-400 mt-1">darab</p>
                    </div>
                  </motion.div>
                  
                  {/* Budget */}
                  <motion.div 
                    variants={fadeInUp}
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/5 to-violet-500/10 border border-white/10 p-4 shadow-lg"
                  >
                    <div className="absolute right-0 bottom-0 opacity-10">
                      <IconCoin size={64} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-md bg-purple-500/20">
                          <IconCoin size={16} className="text-purple-500" />
                        </div>
                        <p className="text-sm text-foreground-500">Költségvetés</p>
                      </div>
                      <p className="text-2xl font-bold">{(metrics.budget / 1000000).toFixed(1)}</p>
                      <p className="text-xs text-foreground-400 mt-1">millió Ft</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Main Dashboard */}
              <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
                  {/* Top Row */}
                  {/* Satisfaction Gauge */}
                  <motion.div variants={fadeInUp} className="lg:col-span-4">
                    <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl h-full">
                      <CardBody className="p-4">
                        <SatisfactionGauge />
                      </CardBody>
                    </Card>
                  </motion.div>
                  
                  {/* Population Chart */}
                  <motion.div variants={fadeInUp} className="lg:col-span-8">
                    <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl h-full">
                      <CardBody className="p-4">
                        <PopulationChart />
                      </CardBody>
                    </Card>
                  </motion.div>
                  
                  {/* Middle Row */}
                  {/* Building Type Chart */}
                  <motion.div variants={fadeInUp} className="lg:col-span-6">
                    <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl h-full">
                      <CardBody className="p-4">
                        <BuildingDonutChart />
                      </CardBody>
                    </Card>
                  </motion.div>
                  
                  {/* Budget Bar Chart */}
                  <motion.div variants={fadeInUp} className="lg:col-span-6">
                    <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl h-full">
                      <CardBody className="p-4">
                        <BudgetBarChart />
                      </CardBody>
                    </Card>
                  </motion.div>
                  
                  {/* Bottom Row */}
                  {/* Age Distribution Chart */}
                  <motion.div variants={fadeInUp} className="lg:col-span-6">
                    <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl h-full">
                      <CardBody className="p-4">
                        <AgeDistributionChart />
                      </CardBody>
                    </Card>
                  </motion.div>
              
                  {/* Service Ratio */}
                  <motion.div variants={fadeInUp} className="lg:col-span-6">
                    <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl h-full">
                      <CardBody className="p-4">
                        <ServiceRatioChart />
                      </CardBody>
                    </Card>
                  </motion.div>
                </div>
              </div>
              
              {/* Building Conditions Section */}
              {buildingStats?.conditionCounts && (
                <motion.div variants={fadeInUp} className="px-4 sm:px-6 lg:px-8 mt-6 max-w-7xl mx-auto w-full">
                  <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-2">
                      <h2 className="text-lg font-medium">Épületek Állapota</h2>
                    </CardHeader>
                    <CardBody className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(buildingStats.conditionCounts).map(([condition, count], index) => (
                          <motion.div
                            key={condition}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-background/50 to-background/30 border border-white/10 p-4 shadow-md"
                          >
                            <div 
                              className="absolute inset-0 opacity-20"
                              style={{ 
                                background: `linear-gradient(to top, 
                                  ${condition === 'Kiváló' ? '#10b981' : 
                                    condition === 'Jó' ? '#3b82f6' : 
                                    condition === 'Közepes' ? '#f59e0b' : 
                                    condition === 'Rossz' ? '#f97316' : '#ef4444'} 
                                  ${100 - (count as number) * 2}%, transparent)` 
                              }}
                            />
                            <div className="relative z-10">
                              <p className="text-xs uppercase tracking-wider text-foreground-500 mb-1">{condition}</p>
                              <p className="text-2xl font-bold">{count}</p>
                              <p className="text-xs text-foreground-400 mt-1">épület</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              )}
            </>
          )}

          {activeTab === "events" && (
            <>
              {/* Events Tab Navigation */}
              <motion.div 
                variants={fadeInUp} 
                className="px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full"
              >
                <div className="flex gap-2 border-b border-foreground/10 pb-2">
                  <button
                    onClick={() => setEventsSubTab('timeline')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      eventsSubTab === 'timeline' 
                        ? 'bg-purple-500/10 text-purple-500' 
                        : 'hover:bg-foreground/5 text-foreground-500'
                    }`}
                  >
                    <IconHistory size={18} />
                    <span>Idővonalon</span>
                  </button>
                  <button
                    onClick={() => setEventsSubTab('stats')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      eventsSubTab === 'stats' 
                        ? 'bg-purple-500/10 text-purple-500' 
                        : 'hover:bg-foreground/5 text-foreground-500'
                    }`}
                  >
                    <IconChartPie size={18} />
                    <span>Statisztikák</span>
                  </button>
                </div>
              </motion.div>

              {/* Events Content */}
              <motion.div 
                variants={fadeInUp} 
                className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
              >
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
                  {eventsSubTab === 'timeline' ? (
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
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 