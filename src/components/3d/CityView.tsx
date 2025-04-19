'use client';

import { useAppStore } from '@/store/appStore';
import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useMemo } from 'react';
import { CityModel } from './CityModel';
import { CityNavigationMenu } from './CityNavigationMenu';
import { 
  Button, 
  ButtonGroup,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Card,
  CardBody,
  Progress,
  Spinner,
  Badge,
  Switch,
  Slider,
  RadioGroup,
  Radio,
  Divider
} from '@nextui-org/react';
import { CameraView } from '@/store/appStore';
import { motion } from 'framer-motion';

// Add a performance settings menu component
function PerformanceSettingsMenu() {
  const { performanceMode, setPerformanceMode } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <Button 
        size="sm" 
        color={showSettings ? "primary" : "default"} 
        variant="flat"
        isIconOnly
        onClick={() => setShowSettings(!showSettings)}
        title="Performance Settings"
      >
        <span className="text-xl">⚙️</span>
      </Button>
      
      {showSettings && (
        <div className="mt-2 p-3 bg-background/80 backdrop-blur-md border border-divider rounded-lg shadow-lg">
          <h3 className="text-sm font-bold mb-2">Performance Settings</h3>
          
          <div className="flex flex-col gap-2">
            <RadioGroup 
              value={performanceMode}
              onChange={(value) => setPerformanceMode(value as 'high' | 'medium' | 'low')}
              label="Quality Level"
              orientation="horizontal"
              size="sm"
            >
              <Radio value="low">Low</Radio>
              <Radio value="medium">Medium</Radio>
              <Radio value="high">High</Radio>
            </RadioGroup>
            
            <Divider className="my-1" />
            
            <div className="text-xs text-foreground-500">
              <p>Current mode: <span className="font-bold">{performanceMode.charAt(0).toUpperCase() + performanceMode.slice(1)}</span></p>
              <p className="mt-1">Lower the quality if you experience lag.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CityView() {
  const { 
    getTransformedData,
    selectedBuildingId,
    cameraView,
    showLabels,
    setCameraView,
    toggleLabels,
    filters,
    setFilter,
    resetFilters,
    statisztikakData,
    epuletekData,
    epitesekData,
    performanceMode,
    setPerformanceMode
  } = useAppStore();
  
  // Memoize the transformed data to prevent infinite render loops
  // Depend on the raw data instead of the getTransformedData function
  const { buildings3D, buildingStats, constructionViz } = useMemo(() => {
    return getTransformedData();
  }, [statisztikakData, epuletekData, epitesekData]);
  
  // Find selected building details
  const selectedBuilding = useMemo(() => 
    buildings3D?.find(b => b.id === selectedBuildingId), 
    [buildings3D, selectedBuildingId]
  );
  
  const selectedConstruction = useMemo(() => 
    constructionViz?.find(c => c.id === selectedBuildingId),
    [constructionViz, selectedBuildingId]
  );
  
  // Available building types for filtering
  const buildingTypes = useMemo(() => 
    buildingStats?.typeCounts ? Object.keys(buildingStats.typeCounts) : [],
    [buildingStats]
  );
  
  // Available building conditions for filtering
  const buildingConditions = useMemo(() => 
    buildingStats?.conditionCounts ? Object.keys(buildingStats.conditionCounts) : [],
    [buildingStats]
  );
  
  // Animation state
  const [isControlsOpen, setControlsOpen] = useState(true);
    
  return (
    <div className="relative h-full w-full flex flex-col">
      {/* City Navigation Menu */}
      <CityNavigationMenu />
      
      {/* Top control bar */}
      <div className="absolute top-2 right-2 left-2 z-10 flex justify-between items-center">
        <Badge content="3D" color="primary" size="lg" className="hidden sm:flex">
          <h2 className="font-bold text-lg bg-background/70 backdrop-blur-md px-3 py-1 rounded-lg">
            Álomváros Térkép
          </h2>
        </Badge>
        
        <div className="flex gap-2 items-center">
          {filters.buildingType && (
            <Chip 
              color="primary" 
              variant="flat" 
              onClose={() => setFilter('buildingType', null)}
            >
              {filters.buildingType}
            </Chip>
          )}
          
          {filters.buildingCondition && (
            <Chip 
              color="secondary" 
              variant="flat" 
              onClose={() => setFilter('buildingCondition', null)}
            >
              {filters.buildingCondition}
            </Chip>
          )}
          
          {filters.constructionStatus && (
            <Chip 
              color="warning" 
              variant="flat" 
              onClose={() => setFilter('constructionStatus', null)}
            >
              {filters.constructionStatus}
            </Chip>
          )}
          
          {(filters.buildingType || filters.buildingCondition || filters.constructionStatus) && (
            <Button 
              size="sm" 
              color="danger" 
              variant="flat"
              onClick={resetFilters}
            >
              Törlés
            </Button>
          )}
        </div>
      </div>
      
      {/* Performance Settings Menu */}
      <PerformanceSettingsMenu />
      
      {/* 3D City Canvas */}
      <div className="flex-grow relative">
        <Canvas
          shadows
          camera={{ position: [40, 40, 40], fov: 50 }}
          gl={{ 
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true,
            precision: "highp",
            powerPreference: "high-performance"
          }}
          className="h-full w-full"
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          dpr={[1, 2]} // Limit pixel ratio to improve performance
        >
          <Suspense fallback={null}>
            <CityModel />
          </Suspense>
        </Canvas>
        
        {/* Loading overlay */}
        {!buildings3D && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Spinner size="lg" color="primary" />
            <p className="mt-4 text-primary">Város betöltése...</p>
          </div>
        )}
        
        {/* Error message */}
        {!buildings3D && !!constructionViz && (
          <div className="absolute bottom-4 right-4 bg-danger/80 text-white p-2 rounded shadow">
            <p className="text-small">Hiba történt a 3D térkép betöltésekor.</p>
          </div>
        )}
        
        {/* Building Info Panel */}
        {selectedBuilding && (
          <motion.div 
            className="absolute bottom-20 left-4 max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-background/80 backdrop-blur-md border border-primary/20">
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{selectedBuilding.name}</h3>
                    <p className="text-sm text-default-500 capitalize">
                      {selectedBuilding.type} ({selectedBuilding.condition})
                    </p>
                  </div>
                  <Chip color="primary" variant="flat" size="sm">{selectedBuilding.id}</Chip>
                </div>
                <div className="mt-2">
                  <p className="text-small">
                    Alapterület: {selectedBuilding.floorArea} m²
                  </p>
                  <p className="text-small">
                    Építés: {selectedBuilding.constructionDate.toLocaleDateString('hu-HU')}
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    onClick={() => window.open(`/epuletek/${selectedBuilding.id}`, '_blank')}
                  >
                    Részletek
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
        
        {/* Construction Site Info Panel */}
        {selectedConstruction && (
          <motion.div 
            className="absolute bottom-20 left-4 max-w-xs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-background/80 backdrop-blur-md border border-warning/20">
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{selectedConstruction.name}</h3>
                    <p className="text-sm text-default-500">
                      {selectedConstruction.type} - {selectedConstruction.status}
                    </p>
                  </div>
                  <Chip color="warning" variant="flat" size="sm">{selectedConstruction.id}</Chip>
                </div>
                <div className="mt-2">
                  <Progress 
                    size="sm"
                    value={selectedConstruction.completionPercentage}
                    color={
                      selectedConstruction.progressStatus === 'behind' ? 'danger' :
                      selectedConstruction.progressStatus === 'ahead' ? 'success' :
                      'warning'
                    }
                    showValueLabel
                    className="mb-2"
                  />
                  <p className="text-small">
                    Költség: {selectedConstruction.cost.toLocaleString('hu-HU')} Ft
                  </p>
                  <p className="text-small">
                    Kezdés: {selectedConstruction.startDate.toLocaleDateString('hu-HU')}
                  </p>
                  <p className="text-small">
                    Befejezés: {selectedConstruction.endDate.toLocaleDateString('hu-HU')}
                  </p>
                  <p className="text-small">
                    Hátralévő idő: {Math.ceil(selectedConstruction.daysRemaining)} nap
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    color="warning"
                    variant="light"
                    onClick={() => window.open(`/projektek/${selectedConstruction.id}`, '_blank')}
                  >
                    Részletek
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Control panel toggle button */}
      <Button
        isIconOnly
        color="primary"
        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10"
        onClick={() => setControlsOpen(!isControlsOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isControlsOpen ? (
            <polyline points="18 15 12 9 6 15"></polyline>
          ) : (
            <polyline points="6 9 12 15 18 9"></polyline>
          )}
        </svg>
      </Button>
      
      {/* Control panel at the bottom */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-divider px-4 py-2 flex flex-col gap-2 z-10"
        initial={{ height: 'auto' }}
        animate={{ height: isControlsOpen ? 'auto' : '0px', opacity: isControlsOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* View controls */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="text-small font-medium">Kamera:</div>
            <ButtonGroup variant="flat" size="sm">
              <Tooltip content="Felülnézet">
                <Button
                  isIconOnly
                  onClick={() => setCameraView('overhead')}
                  className={cameraView === 'overhead' ? 'bg-primary-100 text-primary' : ''}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </Button>
              </Tooltip>
              <Tooltip content="Izometrikus nézet">
                <Button
                  isIconOnly
                  onClick={() => setCameraView('isometric')}
                  className={cameraView === 'isometric' ? 'bg-primary-100 text-primary' : ''}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5l10-5l-10-5z" />
                    <path d="M2 17l10 5l10-5M2 12l10 5l10-5" />
                  </svg>
                </Button>
              </Tooltip>
              <Tooltip content="Első személyű nézet">
                <Button
                  isIconOnly
                  onClick={() => setCameraView('first-person')}
                  className={cameraView === 'first-person' ? 'bg-primary-100 text-primary' : ''}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </Button>
              </Tooltip>
            </ButtonGroup>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-small font-medium">Címkék:</div>
            <Switch
              size="sm"
              isSelected={showLabels}
              onChange={toggleLabels}
              color="primary"
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-small font-medium">Szűrők:</div>
          
          {/* Building type filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="flat"
                endContent={<span className="text-small">▼</span>}
                className="capitalize min-w-[150px]"
              >
                {filters.buildingType ? filters.buildingType : 'Épület típus'}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Épület típusok"
              variant="flat"
              onAction={(key) => {
                if (key === 'all') {
                  setFilter('buildingType', null);
                } else {
                  setFilter('buildingType', key as string);
                }
              }}
            >
              <DropdownItem key="all">Összes</DropdownItem>
              {buildingTypes.map((type) => (
                <DropdownItem key={type}>{type}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          
          {/* Building condition filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="flat"
                endContent={<span className="text-small">▼</span>}
                className="capitalize min-w-[150px]"
              >
                {filters.buildingCondition ? filters.buildingCondition : 'Állapot'}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Épületek állapota"
              variant="flat"
              onAction={(key) => {
                if (key === 'all') {
                  setFilter('buildingCondition', null);
                } else {
                  setFilter('buildingCondition', key as string);
                }
              }}
            >
              <DropdownItem key="all">Összes</DropdownItem>
              {buildingConditions.map((condition) => (
                <DropdownItem key={condition}>{condition}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          
          {/* Construction status filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="flat"
                endContent={<span className="text-small">▼</span>}
                className="capitalize min-w-[150px]"
              >
                {filters.constructionStatus ? filters.constructionStatus : 'Építkezés állapota'}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Építkezések állapota"
              variant="flat"
              onAction={(key) => {
                if (key === 'all') {
                  setFilter('constructionStatus', null);
                } else {
                  setFilter('constructionStatus', key as string);
                }
              }}
            >
              <DropdownItem key="all">Összes</DropdownItem>
              <DropdownItem key="on-time">Időben</DropdownItem>
              <DropdownItem key="behind">Késésben</DropdownItem>
              <DropdownItem key="ahead">Előrehaladott</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          
          <Button
            size="sm"
            color="danger"
            variant="light"
            onClick={resetFilters}
          >
            Szűrők törlése
          </Button>
        </div>

        <div className="flex items-center justify-end">
          <p className="text-tiny text-default-500">Épületek: {buildingStats?.totalBuildings || 0}</p>
        </div>
      </motion.div>
    </div>
  );
} 