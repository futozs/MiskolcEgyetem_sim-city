'use client';

import { Card, CardBody, CardHeader, Divider, Chip, Button, Switch } from '@nextui-org/react';
import { useAppStore } from '@/store/appStore';
import { useLoadedData, useEpuletek } from '@/lib/api/hooks';
import { motion } from 'framer-motion';
import { IconAlertTriangle, IconRefresh, IconSun, IconMoon, IconCloud, IconCloudRain } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';
import { Epulet } from '@/lib/api/types';
import { City } from '@/components/3d/City';

export default function CityMapPage() {
  const { isGameOffline, refreshAllData } = useLoadedData();
  const { getTransformedData, cameraView, setCameraView } = useAppStore();
  const { charts } = getTransformedData();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Buildings data
  const { data: buildingsData, isLoading: buildingsLoading, isError: buildingsError, refetch: refetchBuildings } = useEpuletek();
  const [selectedBuilding, setSelectedBuilding] = useState<Epulet | null>(null);
  const buildingListRef = useRef<HTMLDivElement>(null);
  
  // City visualization state
  const [isDaytime, setIsDaytime] = useState(true);
  const [rainIntensity, setRainIntensity] = useState(0);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  
  // Set up auto-refresh interval (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
      refetchBuildings();
      setLastUpdated(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshAllData, refetchBuildings]);
  
  // Handle building selection from 3D city
  const handleSelectBuilding = (building: Epulet | null) => {
    if (building) {
      console.log('Selected building from 3D:', building);
      // Find the full building data from buildingsData
      const fullBuildingData = buildingsData?.epuletek?.find(
        (b: Epulet) => b.azonosito === building.azonosito
      );
      setSelectedBuilding(fullBuildingData || building);

      // Scroll to the selected building in the list
      setTimeout(() => {
        if (buildingListRef.current) {
          const selectedElement = buildingListRef.current.querySelector(`[data-building-id="${building.azonosito}"]`);
          if (selectedElement) {
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    } else {
      setSelectedBuilding(null);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    refreshAllData();
    refetchBuildings();
    setLastUpdated(new Date());
  };
  
  // Calculate building age
  const calculateBuildingAge = (buildingDate: string | Date) => {
    const date = new Date(buildingDate);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365));
  };
  
  // Format building status with appropriate color
  const getBuildingStatusChip = (status: string) => {
    const color = status.includes('kiváló') ? 'success' : 
                  status.includes('megfelelő') ? 'warning' : 'danger';
    
    return (
      <Chip 
        size="sm" 
        color={color}
      >
        {status}
      </Chip>
    );
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Fixed header */}
      <motion.div 
        className="py-4 px-6 bg-background/60 backdrop-blur-md border-b border-primary/10 flex-shrink-0"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-2 text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Álomváros Térkép
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          A város épületeinek 3D megjelenítése
        </p>
      </motion.div>
      
      {/* Main content area with sidebar and 3D map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable sidebar */}
        <motion.div 
          className="w-full lg:w-1/4 h-full flex-shrink-0 overflow-hidden border-r border-primary/10"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="h-full overflow-y-auto p-4 pr-2">
            {/* Alert messages */}
            {(isGameOffline || buildingsError) && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p>{isGameOffline ? 'A játékszerver jelenleg nem fut. Az adatok nem frissülnek, amíg a szerver újra el nem indul.' : 'Az API jelenleg nem elérhető. Az adatok nem frissülnek.'}</p>
                </div>
              </div>
            )}
            
            {/* City Stats Card */}
            <Card className="border border-primary/10 bg-background/80 backdrop-blur-md shadow-md mb-4">
              <CardHeader className="pb-0 pt-4 px-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-large text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {charts?.altalanosMutatok?.varosNev || 'Álomváros'}
                  </h4>
                  <p className="text-tiny text-default-500">
                    {charts?.altalanosMutatok?.aktualisDatum?.toLocaleDateString('hu-HU') || (isGameOffline ? 'Offline' : 'Ismeretlen dátum')}
                  </p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={handleRefresh}
                  isLoading={buildingsLoading}
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardBody className="py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span>Lakosság:</span>
                  <Chip 
                    color="primary" 
                    variant="flat" 
                    classNames={{
                      base: "bg-primary/10",
                      content: "text-primary-600 font-medium"
                    }}
                  >
                    {charts?.altalanosMutatok?.lakossagSzama?.toLocaleString('hu-HU') || '0'} fő
                  </Chip>
                </div>
                <Divider />
                <div className="flex justify-between items-center">
                  <span>Elégedettség:</span>
                  <Chip 
                    color={(charts?.altalanosMutatok?.elegedettseg || 0) > 75 ? "success" : 
                           (charts?.altalanosMutatok?.elegedettseg || 0) > 50 ? "warning" : "danger"}
                    variant="flat"
                    classNames={{
                      base: (charts?.altalanosMutatok?.elegedettseg || 0) > 75 ? "bg-success/10" : 
                            (charts?.altalanosMutatok?.elegedettseg || 0) > 50 ? "bg-warning/10" : "bg-danger/10",
                    }}
                  >
                    {(charts?.altalanosMutatok?.elegedettseg || 0) + '%'}
                  </Chip>
                </div>
                <Divider />
                <div className="flex justify-between items-center">
                  <span>Fordulók száma:</span>
                  <Chip
                    color="secondary"
                    variant="flat"
                    classNames={{
                      base: "bg-secondary/10",
                      content: "text-secondary-600 font-medium"
                    }}
                  >
                    {charts?.altalanosMutatok?.fordulokSzama || '0'}
                  </Chip>
                </div>
                <Divider />
                <div className="flex justify-between items-center">
                  <span>Költségvetés:</span>
                  <Chip
                    color="success"
                    variant="flat"
                    classNames={{
                      base: "bg-success/10",
                      content: "text-success-600 font-medium"
                    }}
                  >
                    {(charts?.penzugyiData?.keret || 0).toLocaleString('hu-HU')} Ft
                  </Chip>
                </div>
              </CardBody>
            </Card>
            
            {/* Building Info Card - Show when a building is selected */}
            {selectedBuilding && (
              <Card className="border border-primary/10 bg-background/80 backdrop-blur-md shadow-md mb-4">
                <CardHeader className="pb-0 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-large text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Kiválasztott Épület
                      </h4>
                      <Chip 
                        color="primary" 
                        variant="flat" 
                        size="sm"
                        className="mt-1"
                      >
                        #{selectedBuilding.azonosito}
                      </Chip>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onClick={() => setSelectedBuilding(null)}
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <Divider className="my-2" />
                <CardBody className="py-3 px-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedBuilding.nev}</h3>
                      <p className="text-sm text-default-500 capitalize">
                        {selectedBuilding.tipus}
                      </p>
                      
                      {/* Camera control buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          color="primary" 
                          variant="flat"
                          onClick={() => setCameraView('isometric')}
                          className="flex-1"
                        >
                          Izometrikus nézet
                        </Button>
                        <Button 
                          size="sm" 
                          color="secondary" 
                          variant="flat"
                          onClick={() => setCameraView('first-person')}
                          className="flex-1"
                        >
                          Közeli nézet
                        </Button>
                      </div>
                    </div>
                    
                    <Divider />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-500">Alapterület:</span>
                        <span className="text-sm font-medium">{selectedBuilding.alapterulet?.toLocaleString('hu-HU') || 'N/A'} m²</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-500">Építés dátuma:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedBuilding.epitesi_datum).toLocaleDateString('hu-HU')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-500">Állapot:</span>
                        {getBuildingStatusChip(selectedBuilding.allapot)}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-500">Épület kora:</span>
                        <span className="text-sm font-medium">
                          {calculateBuildingAge(selectedBuilding.epitesi_datum)} év
                        </span>
                      </div>

                      {selectedBuilding.cim && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-500">Cím:</span>
                          <span className="text-sm font-medium">{selectedBuilding.cim}</span>
                        </div>
                      )}

                      {selectedBuilding.becsult_ertek && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-500">Becsült érték:</span>
                          <span className="text-sm font-medium">{selectedBuilding.becsult_ertek.toLocaleString('hu-HU')} Ft</span>
                        </div>
                      )}

                      {selectedBuilding.funkciok && selectedBuilding.funkciok.length > 0 && (
                        <div className="pt-2">
                          <span className="text-sm text-default-500 block mb-2">Funkciók:</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedBuilding.funkciok.map((funkcio: string, idx: number) => (
                              <Chip 
                                key={idx} 
                                size="sm" 
                                color="secondary" 
                                variant="flat"
                              >
                                {funkcio}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedBuilding.alkalmazottak_szama !== undefined && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-default-500">Alkalmazottak:</span>
                          <span className="text-sm font-medium">{selectedBuilding.alkalmazottak_szama} fő</span>
                        </div>
                      )}
                      
                      {selectedBuilding.energiafogyasztas !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-500">Energiafogyasztás:</span>
                          <Chip 
                            size="sm" 
                            color={
                              selectedBuilding.energiafogyasztas < 100 ? 'success' : 
                              selectedBuilding.energiafogyasztas < 200 ? 'warning' : 'danger'
                            }
                          >
                            {selectedBuilding.energiafogyasztas} kWh
                          </Chip>
                        </div>
                      )}

                      {selectedBuilding.tulajdonos && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-default-500">Tulajdonos:</span>
                          <span className="text-sm font-medium">{selectedBuilding.tulajdonos}</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedBuilding.leiras && (
                      <>
                        <Divider />
                        <div>
                          <span className="text-sm text-default-500 block mb-1">Leírás:</span>
                          <p className="text-sm">{selectedBuilding.leiras}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
            
            {/* View Controls Card */}
            <Card className="border border-primary/10 bg-background/80 backdrop-blur-md shadow-md mb-4">
              <CardHeader className="pb-0 pt-4 px-4">
                <h4 className="font-bold text-large text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Nézet Beállítások
                </h4>
              </CardHeader>
              <CardBody className="py-4 space-y-4">
                {/* Time of Day Control */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconMoon size={18} className={!isDaytime ? "text-primary" : "text-gray-400"} />
                    <Switch 
                      isSelected={isDaytime}
                      onValueChange={setIsDaytime}
                      size="sm"
                      color="primary"
                    />
                    <IconSun size={18} className={isDaytime ? "text-primary" : "text-gray-400"} />
                  </div>
                  <span className="text-sm">{isDaytime ? 'Nappal' : 'Éjszaka'}</span>
                </div>
                
                <Divider />
                
                {/* Weather Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Időjárás:</span>
                    <div className="flex items-center gap-1">
                      <IconCloud 
                        size={18} 
                        className={rainIntensity === 0 ? "text-primary" : "text-gray-400"} 
                      />
                      <IconCloudRain 
                        size={18} 
                        className={rainIntensity > 0 ? "text-primary" : "text-gray-400"} 
                      />
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={rainIntensity}
                    onChange={(e) => setRainIntensity(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <Divider />
                
                {/* Performance Mode */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Teljesítmény mód:</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      color="success" 
                      variant={performanceMode === 'high' ? 'solid' : 'flat'}
                      onClick={() => setPerformanceMode('high')}
                    >
                      Magas
                    </Button>
                    <Button 
                      size="sm" 
                      color="warning" 
                      variant={performanceMode === 'medium' ? 'solid' : 'flat'}
                      onClick={() => setPerformanceMode('medium')}
                    >
                      Közepes
                    </Button>
                    <Button 
                      size="sm" 
                      color="danger" 
                      variant={performanceMode === 'low' ? 'solid' : 'flat'}
                      onClick={() => setPerformanceMode('low')}
                    >
                      Alacsony
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Building List Card */}
            <Card className="border border-primary/10 bg-background/80 backdrop-blur-md shadow-md mb-4">
              <CardHeader className="pb-0 pt-4 px-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-large text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Épületek Listája
                  </h4>
                  <p className="text-tiny text-default-500">
                    Összesen: {buildingsData?.epuletek?.length || 0} db
                  </p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={handleRefresh}
                  isLoading={buildingsLoading}
                >
                  <IconRefresh className="h-4 w-4" />
                </Button>
              </CardHeader>
              <Divider className="my-2" />
              <CardBody className="py-3 px-4">
                <div className="max-h-64 overflow-y-auto" ref={buildingListRef}>
                  {buildingsData?.epuletek?.length > 0 ? (
                    <div className="space-y-2">
                      {buildingsData.epuletek.map((building: Epulet) => (
                        <Card 
                          key={building.azonosito}
                          isPressable
                          isHoverable
                          className={`p-2 ${selectedBuilding?.azonosito === building.azonosito ? 'bg-primary/10 border-primary' : ''}`}
                          onClick={() => setSelectedBuilding(building)}
                          data-building-id={building.azonosito}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{building.nev}</p>
                              <p className="text-xs text-default-500">{building.tipus}</p>
                            </div>
                            {getBuildingStatusChip(building.allapot)}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-default-500">Nincs elérhető épület</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </motion.div>
        
        {/* 3D City Map Area - Fixed, not scrollable */}
        <motion.div 
          className="flex-1 relative overflow-hidden rounded-xl border border-primary/10 bg-background/80 backdrop-blur-md shadow-xl m-4 ml-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {/* 3D City Visualization */}
          <City 
            rainIntensity={rainIntensity}
            isDaytime={isDaytime}
            initialPerformance={performanceMode}
            onSelectBuilding={handleSelectBuilding}
            selectedBuildingId={selectedBuilding?.azonosito}
          />
        </motion.div>
      </div>
      
      {/* Fixed Footer */}
      <div className="py-3 px-6 bg-background/60 backdrop-blur-md border-t border-primary/10 flex-shrink-0">
        <div className="flex justify-between items-center">
          <p className="text-sm text-default-500">
            Utolsó frissítés: {lastUpdated.toLocaleTimeString()}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-default-500">
              Kamera: {cameraView === 'overhead' ? 'Felülnézet' : cameraView === 'isometric' ? 'Izometrikus' : 'Földi'}
            </p>
            <Divider orientation="vertical" className="h-4" />
            <p className="text-sm text-default-500">
              {isDaytime ? 'Nappal' : 'Éjszaka'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 