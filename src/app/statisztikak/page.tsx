'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLoadedData } from '@/lib/api/hooks';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Chip,
  Tabs,
  Tab,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Tooltip,
  Badge,
  Progress
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
  IconChartPie,
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconArrowUp,
  IconArrowDown,
  IconCurrencyDollar,
  IconFaceId,
  IconHome2,
  IconAlertTriangle,
  IconInfoCircle,
  IconChecks,
  IconX,
  IconServerOff,
  IconCloudOff,
  IconPlugConnected,
  IconServer
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
import { ServicesPanel } from '@/components/services/ServicesPanel';

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

// Interface for EventsDetailPanel component
interface EventsDetailPanelProps {
  events?: Array<{
    fordulo: number;
    esemeny: {
      nev: string;
      leiras: string;
      tipus: string;
      hatas?: {
        penz?: number;
        boldogsag?: number;
        lakossag?: number;
      };
    };
  }>;
}

const EventsDetailPanel = ({ events = [] }: EventsDetailPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<"fordulo" | "penz" | "boldogsag" | "lakossag">("fordulo");

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filter by search query
      const matchesQuery = searchQuery === "" || 
        event.esemeny.nev.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.esemeny.leiras.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by event type
      const matchesType = selectedTypes.length === 0 || 
        selectedTypes.includes(event.esemeny.tipus);
      
      return matchesQuery && matchesType;
    }).sort((a, b) => {
      if (sortField === "fordulo") {
        return sortOrder === "asc" 
          ? a.fordulo - b.fordulo 
          : b.fordulo - a.fordulo;
      } else {
        const valA = a.esemeny.hatas?.[sortField] || 0;
        const valB = b.esemeny.hatas?.[sortField] || 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });
  }, [events, searchQuery, selectedTypes, sortOrder, sortField]);
  
  // Calculate total effects
  const metrics = useMemo(() => {
    const totals = filteredEvents.reduce((acc, event) => {
      if (event.esemeny.hatas) {
        acc.penz += event.esemeny.hatas.penz || 0;
        acc.boldogsag += event.esemeny.hatas.boldogsag || 0;
        acc.lakossag += event.esemeny.hatas.lakossag || 0;
      }
      return acc;
    }, { penz: 0, boldogsag: 0, lakossag: 0 });
    
    // Find the most significant event (by absolute value of financial impact)
    let mostSignificantEvent = filteredEvents[0] || null;
    let maxImpact = 0;
    
    filteredEvents.forEach(event => {
      if (event.esemeny.hatas?.penz) {
        const impact = Math.abs(event.esemeny.hatas.penz);
        if (impact > maxImpact) {
          maxImpact = impact;
          mostSignificantEvent = event;
        }
      }
    });
    
    return {
      ...totals,
      totalEvents: filteredEvents.length,
      mostSignificantEvent
    };
  }, [filteredEvents]);
  
  // Determine available event types
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    events.forEach(event => {
      types.add(event.esemeny.tipus);
    });
    return Array.from(types);
  }, [events]);
  
  const getEventTypeColor = (event: {
    fordulo: number;
    esemeny: {
      nev: string;
      leiras: string;
      tipus: string;
      hatas?: {
        penz?: number;
        boldogsag?: number;
        lakossag?: number;
      };
    };
  }) => {
    if (!event.esemeny.hatas) return "from-gray-500 to-gray-400";
    
    const financialImpact = event.esemeny.hatas.penz || 0;
    const happinessImpact = event.esemeny.hatas.boldogsag || 0;
    const populationImpact = event.esemeny.hatas.lakossag || 0;
    
    if (financialImpact > 0 || happinessImpact > 0 || populationImpact > 0) {
      return "from-green-500 to-emerald-400";
    }
    
    if (financialImpact < 0 || happinessImpact < 0 || populationImpact < 0) {
      return "from-red-500 to-rose-400";
    }
    
    if (event.esemeny.tipus === "rendszer") {
      return "from-blue-500 to-cyan-400";
    }
    
    return "from-gray-500 to-gray-400";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <Card className="border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex justify-between w-full">
            <h2 className="text-xl font-medium">Részletes Eseménynapló</h2>
            <div className="flex gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    size="sm"
                    className="bg-foreground/5"
                    startContent={<IconFilter size={16} />}
                  >
                    Típus
                    {selectedTypes.length > 0 && (
                      <Badge
                        className="ml-1"
                        color="primary"
                        size="sm"
                      >
                        {selectedTypes.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Event Types"
                  closeOnSelect={false}
                  selectionMode="multiple"
                  selectedKeys={new Set(selectedTypes)}
                  onSelectionChange={(keys) => setSelectedTypes(Array.from(keys as Set<string>))}
                >
                  {eventTypes.map(type => (
                    <DropdownItem key={type}>{type}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
              
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    size="sm"
                    className="bg-foreground/5"
                    startContent={sortOrder === "asc" ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
                  >
                    Rendezés
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Sort Options">
                  <DropdownItem 
                    key="fordulo" 
                    startContent={<IconCalendar size={16} />}
                    onClick={() => {
                      setSortField("fordulo");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Forduló szerint
                  </DropdownItem>
                  <DropdownItem 
                    key="penz" 
                    startContent={<IconCurrencyDollar size={16} />}
                    onClick={() => {
                      setSortField("penz");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Pénzügyi hatás szerint
                  </DropdownItem>
                  <DropdownItem 
                    key="boldogsag" 
                    startContent={<IconFaceId size={16} />}
                    onClick={() => {
                      setSortField("boldogsag");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Boldogság hatás szerint
                  </DropdownItem>
                  <DropdownItem 
                    key="lakossag" 
                    startContent={<IconHome2 size={16} />}
                    onClick={() => {
                      setSortField("lakossag");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Lakossági hatás szerint
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          
          <Input
            placeholder="Keresés események közt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<IconSearch size={16} />}
            className="w-full max-w-md"
            size="sm"
            variant="bordered"
          />
          
          {/* Event Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconCalendarEvent size={16} className="text-blue-500" />
                <span className="text-sm text-foreground-500">Események száma</span>
              </div>
              <span className="text-xl font-bold">{metrics.totalEvents}</span>
            </div>
            
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconCurrencyDollar size={16} className={metrics.penz >= 0 ? "text-green-500" : "text-red-500"} />
                <span className="text-sm text-foreground-500">Összes pénzügyi hatás</span>
              </div>
              <span className={`text-xl font-bold ${metrics.penz >= 0 ? "text-green-500" : "text-red-500"}`}>
                {metrics.penz.toLocaleString('hu-HU')} Ft
              </span>
            </div>
            
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconFaceId size={16} className={metrics.boldogsag >= 0 ? "text-green-500" : "text-red-500"} />
                <span className="text-sm text-foreground-500">Boldogság hatás</span>
              </div>
              <span className={`text-xl font-bold ${metrics.boldogsag >= 0 ? "text-green-500" : "text-red-500"}`}>
                {metrics.boldogsag > 0 ? "+" : ""}{metrics.boldogsag}
              </span>
            </div>
            
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconUsers size={16} className={metrics.lakossag >= 0 ? "text-green-500" : "text-red-500"} />
                <span className="text-sm text-foreground-500">Lakosság változás</span>
              </div>
              <span className={`text-xl font-bold ${metrics.lakossag >= 0 ? "text-green-500" : "text-red-500"}`}>
                {metrics.lakossag > 0 ? "+" : ""}{metrics.lakossag} fő
              </span>
            </div>
          </div>
          
          {/* Most Significant Event */}
          {metrics.mostSignificantEvent && (
            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/10 border border-blue-500/20 rounded-lg p-3 mt-1">
              <div className="flex items-center gap-2 mb-2">
                <IconAlertTriangle size={18} className="text-blue-500" />
                <span className="text-sm font-medium">Legjelentősebb esemény:</span>
              </div>
              <h3 className="text-lg font-medium">{metrics.mostSignificantEvent.esemeny.nev}</h3>
              <p className="text-sm text-foreground-600 mt-1">{metrics.mostSignificantEvent.esemeny.leiras}</p>
              
              <div className="flex gap-3 mt-2">
                {metrics.mostSignificantEvent.esemeny.hatas?.penz && (
                  <div className="flex items-center gap-1">
                    <IconCurrencyDollar size={16} className={metrics.mostSignificantEvent.esemeny.hatas.penz >= 0 ? "text-green-500" : "text-red-500"} />
                    <span className={metrics.mostSignificantEvent.esemeny.hatas.penz >= 0 ? "text-green-500" : "text-red-500"}>
                      {metrics.mostSignificantEvent.esemeny.hatas.penz > 0 ? "+" : ""}
                      {metrics.mostSignificantEvent.esemeny.hatas.penz.toLocaleString('hu-HU')} Ft
                    </span>
                  </div>
                )}
                
                {metrics.mostSignificantEvent.esemeny.hatas?.boldogsag && (
                  <div className="flex items-center gap-1">
                    <IconFaceId size={16} className={metrics.mostSignificantEvent.esemeny.hatas.boldogsag >= 0 ? "text-green-500" : "text-red-500"} />
                    <span className={metrics.mostSignificantEvent.esemeny.hatas.boldogsag >= 0 ? "text-green-500" : "text-red-500"}>
                      {metrics.mostSignificantEvent.esemeny.hatas.boldogsag > 0 ? "+" : ""}
                      {metrics.mostSignificantEvent.esemeny.hatas.boldogsag}
                    </span>
                  </div>
                )}
                
                {metrics.mostSignificantEvent.esemeny.hatas?.lakossag && (
                  <div className="flex items-center gap-1">
                    <IconUsers size={16} className={metrics.mostSignificantEvent.esemeny.hatas.lakossag >= 0 ? "text-green-500" : "text-red-500"} />
                    <span className={metrics.mostSignificantEvent.esemeny.hatas.lakossag >= 0 ? "text-green-500" : "text-red-500"}>
                      {metrics.mostSignificantEvent.esemeny.hatas.lakossag > 0 ? "+" : ""}
                      {metrics.mostSignificantEvent.esemeny.hatas.lakossag} fő
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardBody>
          {filteredEvents.length > 0 ? (
            <div className="flex flex-col divide-y divide-foreground/10">
              {filteredEvents.map((event, index) => (
                <div key={`${event.fordulo}-${index}`} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getEventTypeColor(event)} text-white shrink-0`}
                    >
                      {event.fordulo}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-md font-medium">{event.esemeny.nev}</h3>
                        <Chip 
                          size="sm" 
                          variant="flat" 
                          color={
                            event.esemeny.tipus === 'rendszer' ? 'primary' : 
                            getEventTypeColor(event).includes('green') ? 'success' :
                            getEventTypeColor(event).includes('red') ? 'danger' : 
                            'default'
                          }
                        >
                          {event.esemeny.tipus}
                        </Chip>
                      </div>
                      
                      <p className="text-sm text-foreground-500 mt-1">{event.esemeny.leiras}</p>
                      
                      {event.esemeny.hatas && (
                        <div className="flex flex-wrap gap-3 mt-2">
                          {event.esemeny.hatas.penz !== undefined && (
                            <div className="flex items-center gap-1">
                              <IconCurrencyDollar size={16} className={event.esemeny.hatas.penz >= 0 ? "text-green-500" : "text-red-500"} />
                              <span className={event.esemeny.hatas.penz >= 0 ? "text-green-500" : "text-red-500"}>
                                {event.esemeny.hatas.penz > 0 ? "+" : ""}
                                {event.esemeny.hatas.penz.toLocaleString('hu-HU')} Ft
                              </span>
                            </div>
                          )}
                          
                          {event.esemeny.hatas.boldogsag !== undefined && (
                            <div className="flex items-center gap-1">
                              <IconFaceId size={16} className={event.esemeny.hatas.boldogsag >= 0 ? "text-green-500" : "text-red-500"} />
                              <span className={event.esemeny.hatas.boldogsag >= 0 ? "text-green-500" : "text-red-500"}>
                                {event.esemeny.hatas.boldogsag > 0 ? "+" : ""}
                                {event.esemeny.hatas.boldogsag}
                              </span>
                            </div>
                          )}
                          
                          {event.esemeny.hatas.lakossag !== undefined && (
                            <div className="flex items-center gap-1">
                              <IconUsers size={16} className={event.esemeny.hatas.lakossag >= 0 ? "text-green-500" : "text-red-500"} />
                              <span className={event.esemeny.hatas.lakossag >= 0 ? "text-green-500" : "text-red-500"}>
                                {event.esemeny.hatas.lakossag > 0 ? "+" : ""}
                                {event.esemeny.hatas.lakossag} fő
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-foreground/5 rounded-full p-3 mb-3">
                <IconInfoCircle size={24} className="text-foreground-400" />
              </div>
              <p className="text-foreground-500">Nincs esemény a keresési feltételek alapján</p>
              {searchQuery || selectedTypes.length > 0 ? (
                <Button
                  variant="flat"
                  size="sm"
                  className="mt-3"
                  startContent={<IconX size={14} />}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTypes([]);
                  }}
                >
                  Szűrők törlése
                </Button>
              ) : null}
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
};

// Offline state component
const OfflineStateDisplay = ({ onRefreshClick }: { onRefreshClick: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[70vh] flex flex-col items-center justify-center px-4"
    >
      <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 p-8 rounded-3xl border border-red-500/20 w-full max-w-2xl shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-red-500/10" />
            <div className="relative p-6 rounded-full bg-red-500/20">
              <IconServerOff size={64} className="text-red-500" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
            Játékszerver Hiba
          </h2>
          
          <p className="text-foreground-600 mb-6 max-w-md">
            Jelenleg nem sikerült kapcsolódni a játékszerverhez, vagy minden érték nulla. Kérjük, ellenőrizd a kapcsolatot és próbáld újra később.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Button
              variant="flat"
              className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
              startContent={<IconServerOff size={18} />}
              size="lg"
              fullWidth
            >
              Offline Állapot
            </Button>
            
            <Button
              variant="flat"
              className="bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500/20"
              startContent={<IconRefresh size={18} />}
              size="lg"
              fullWidth
              onClick={onRefreshClick}
            >
              Újrapróbálkozás
            </Button>
          </div>
          
          <div className="mt-8 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground-500">Kapcsolódási kísérlet...</span>
              <span className="text-sm text-foreground-500 flex items-center gap-1">
                <IconPlugConnected size={14} />
                Automatikus újracsatlakozás
              </span>
            </div>
            <Progress
              size="sm"
              color="danger"
              isIndeterminate
              aria-label="Kapcsolódási kísérlet"
              className="max-w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-10 flex items-center gap-2 text-foreground-500">
        <IconInfoCircle size={16} />
        <span className="text-sm">A statisztikák automatikusan megjelennek, amint a szerver elérhetővé válik.</span>
      </div>
    </motion.div>
  );
};

export default function StatisticsPage() {
  const { data, isGameOffline, refreshAllData } = useLoadedData();
  // Type assertion to avoid type errors with missing properties
  const typedData = data as unknown as {
    charts: typeof data.charts;
    buildingStats: typeof data.buildingStats;
    esemenyek: typeof data.esemenyek;
    serviceData: any;
    szolgaltatasok: any;
  };
  const { charts, buildingStats, esemenyek, serviceData, szolgaltatasok } = typedData;
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [eventsSubTab, setEventsSubTab] = useState("timeline");
  
  // Check if all values are zero (server is actually offline or not sending data)
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
  
  // Combined offline status - either reported by API or determined by zero values
  const isOffline = isGameOffline || isAllDataZero;
  
  // Set up auto-refresh interval
  useEffect(() => {
    // Set the last updated timestamp on mount
    setLastUpdated(new Date());
    
    const interval = setInterval(() => {
      // First set refreshing state
      setIsRefreshing(true);
      
      // Perform the refresh
      refreshAllData().then(() => {
        // Update the last updated timestamp and reset refreshing state
        setLastUpdated(new Date());
        setTimeout(() => setIsRefreshing(false), 300); // Short delay to show the refresh animation
      }).catch(error => {
        console.error('Error refreshing data:', error);
        setIsRefreshing(false);
      });
    }, 5000); // 5 seconds refresh interval
    
    return () => clearInterval(interval);
  }, [refreshAllData]);
  
  // Update the last updated timestamp every time data changes
  useEffect(() => {
    if (charts || esemenyek) {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  }, [charts, esemenyek]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshAllData().then(() => {
      setTimeout(() => {
        setIsRefreshing(false);
        setLastUpdated(new Date());
      }, 800);
    }).catch(error => {
      console.error('Error during manual refresh:', error);
      setIsRefreshing(false);
    });
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
                    {isOffline ? (
                      <IconServerOff size={22} />
                    ) : activeTab === "stats" ? (
                      <IconChartBar size={22} />
                    ) : (
                      <IconCalendarEvent size={22} />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
                      {metrics.cityName} {isOffline ? "Szerver Állapot" : activeTab === "stats" ? "Statisztikák" : "Események"}
                    </h1>
                    <p className="text-foreground-500 text-sm">
                      {isOffline ? (
                        <span className="flex items-center gap-1 text-red-500">
                          <IconCloudOff size={14} />
                          Offline
                        </span>
                      ) : (
                        <>#{metrics.turn}. forduló</>
                      )}
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
                  
                  {isOffline ? (
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

          {isOffline ? (
            // Offline state display
            <OfflineStateDisplay onRefreshClick={handleRefresh} />
          ) : (
            // Regular content when server is online
            <>
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
                      
                      {/* Bottom Row */}
                      {/* Age Distribution Chart */}
                      <motion.div variants={fadeInUp} className="lg:col-span-6">
                        <Card className="overflow-hidden border border-white/10 bg-background/50 backdrop-blur-sm shadow-xl h-full">
                          <CardBody className="p-4">
                            <AgeDistributionChart />
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
                  
                  {/* Services Section */}
                  {serviceData && (
                    <motion.div variants={fadeInUp} className="px-4 sm:px-6 lg:px-8 mt-6 max-w-7xl mx-auto w-full">
                      <ServicesPanel 
                        services={szolgaltatasok || []} 
                        serviceData={serviceData} 
                      />
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

                  {/* Events Detail Panel - Added here */}
                  <motion.div 
                    variants={fadeInUp} 
                    className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
                  >
                    <EventsDetailPanel events={esemenyek} />
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
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 