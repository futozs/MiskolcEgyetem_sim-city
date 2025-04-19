'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Badge
} from '@nextui-org/react';
import {
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconCoin,
  IconMoodSmile,
  IconCheck,
  IconX,
  IconCalendar,
  IconBuilding,
  IconInfoCircle
} from '@tabler/icons-react';
import { Szolgaltatas } from '@/lib/api/types';

interface ServicesPanelProps {
  services?: Array<Szolgaltatas>;
  serviceData?: any;
}

export function ServicesPanel({ services = [], serviceData = null }: ServicesPanelProps) {
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'azonosito' | 'havi_koltseg' | 'allami_tamogatas' | 'elegedettseg_hatas'>('azonosito');

  // Get all available service types
  const serviceTypes = useMemo(() => {
    const types = new Set<string>();
    services.forEach(service => {
      types.add(service.tipus);
    });
    return Array.from(types);
  }, [services]);

  // Filter and sort services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Filter by search query
      const matchesQuery = searchQuery === '' ||
        service.nev.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.tipus.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by service type
      const matchesType = selectedTypes.length === 0 ||
        selectedTypes.includes(service.tipus);
      
      // Filter by status
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && service.aktiv) ||
        (statusFilter === 'inactive' && !service.aktiv);
      
      return matchesQuery && matchesType && matchesStatus;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [services, searchQuery, selectedTypes, statusFilter, sortOrder, sortField]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCost = filteredServices.reduce((sum, service) => sum + service.havi_koltseg, 0);
    const totalSubsidy = filteredServices.reduce((sum, service) => sum + service.allami_tamogatas, 0);
    const totalSatisfactionImpact = filteredServices.reduce((sum, service) => sum + service.elegedettseg_hatas, 0);
    const activeCount = filteredServices.filter(service => service.aktiv).length;
    
    return {
      totalCount: filteredServices.length,
      totalCost,
      totalSubsidy,
      totalSatisfactionImpact,
      activeCount,
      activePercentage: filteredServices.length > 0 
        ? Math.round((activeCount / filteredServices.length) * 100)
        : 0
    };
  }, [filteredServices]);

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
            <h2 className="text-xl font-medium">Szolgáltatások Áttekintése</h2>
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
                        content={selectedTypes.length}
                        size="sm"
                        color="primary"
                        placement="top-right"
                        className="ml-1"
                      />
                    )}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Service Types"
                  closeOnSelect={false}
                  selectionMode="multiple"
                  selectedKeys={new Set(selectedTypes)}
                  onSelectionChange={(keys) => setSelectedTypes(Array.from(keys as Set<string>))}
                >
                  {serviceTypes.map(type => (
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
                    startContent={statusFilter !== 'all' ? (
                      statusFilter === 'active' ? <IconCheck size={16} /> : <IconX size={16} />
                    ) : <IconFilter size={16} />}
                  >
                    Státusz
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Status Filter">
                  <DropdownItem 
                    key="all" 
                    startContent={<IconFilter size={16} />}
                    onClick={() => setStatusFilter('all')}
                  >
                    Összes
                  </DropdownItem>
                  <DropdownItem 
                    key="active" 
                    startContent={<IconCheck size={16} className="text-green-500" />}
                    onClick={() => setStatusFilter('active')}
                  >
                    Aktív
                  </DropdownItem>
                  <DropdownItem 
                    key="inactive" 
                    startContent={<IconX size={16} className="text-red-500" />}
                    onClick={() => setStatusFilter('inactive')}
                  >
                    Inaktív
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    size="sm"
                    className="bg-foreground/5"
                    startContent={sortOrder === 'asc' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
                  >
                    Rendezés
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Sort Options">
                  <DropdownItem 
                    key="azonosito" 
                    startContent={<IconFilter size={16} />}
                    onClick={() => {
                      setSortField('azonosito');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Azonosító szerint
                  </DropdownItem>
                  <DropdownItem 
                    key="havi_koltseg" 
                    startContent={<IconCoin size={16} />}
                    onClick={() => {
                      setSortField('havi_koltseg');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Havi költség szerint
                  </DropdownItem>
                  <DropdownItem 
                    key="allami_tamogatas" 
                    startContent={<IconCoin size={16} />}
                    onClick={() => {
                      setSortField('allami_tamogatas');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Állami támogatás szerint
                  </DropdownItem>
                  <DropdownItem 
                    key="elegedettseg_hatas" 
                    startContent={<IconMoodSmile size={16} />}
                    onClick={() => {
                      setSortField('elegedettseg_hatas');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Elégedettségi hatás szerint
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          
          <Input
            placeholder="Keresés szolgáltatások közt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<IconSearch size={16} />}
            className="w-full max-w-md"
            size="sm"
            variant="bordered"
          />

          {/* Service Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mt-2">
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconBuilding size={16} className="text-blue-500" />
                <span className="text-sm text-foreground-500">Szolgáltatások száma</span>
              </div>
              <span className="text-xl font-bold">{metrics.totalCount}</span>
            </div>
            
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconCheck size={16} className="text-green-500" />
                <span className="text-sm text-foreground-500">Aktív szolgáltatások</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{metrics.activeCount}</span>
                <span className="text-sm text-foreground-500">({metrics.activePercentage}%)</span>
              </div>
            </div>
            
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconCoin size={16} className="text-amber-500" />
                <span className="text-sm text-foreground-500">Havi összköltség</span>
              </div>
              <span className="text-xl font-bold">{metrics.totalCost.toLocaleString('hu-HU')} Ft</span>
            </div>
            
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconCoin size={16} className="text-purple-500" />
                <span className="text-sm text-foreground-500">Állami támogatás</span>
              </div>
              <span className="text-xl font-bold">{metrics.totalSubsidy.toLocaleString('hu-HU')} Ft</span>
            </div>
            
            <div className="bg-foreground/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <IconMoodSmile size={16} className="text-green-500" />
                <span className="text-sm text-foreground-500">Elégedettségi hatás</span>
              </div>
              <span className="text-xl font-bold">{metrics.totalSatisfactionImpact > 0 ? '+' : ''}{metrics.totalSatisfactionImpact}</span>
            </div>
          </div>
          
          {/* Show type distribution if available */}
          {serviceData && serviceData.typeDetails && serviceData.typeDetails.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {serviceData.typeDetails.slice(0, 6).map((typeDetail: any) => (
                <div 
                  key={typeDetail.tipus}
                  className="bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-lg p-3 border border-white/5"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{typeDetail.tipus}</span>
                    <Chip size="sm" variant="flat" color="primary">{typeDetail.count}</Chip>
                  </div>
                  <div className="text-sm text-foreground-500 mt-1">
                    <div className="flex items-center justify-between">
                      <span>Átlagos költség:</span>
                      <span>{Math.round(typeDetail.averageCost).toLocaleString('hu-HU')} Ft</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Összes költség:</span>
                      <span>{Math.round(typeDetail.totalCost).toLocaleString('hu-HU')} Ft</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        <CardBody>
          {filteredServices.length > 0 ? (
            <Table 
              aria-label="Szolgáltatások táblázat"
              classNames={{
                base: "max-h-[400px]",
                table: "min-w-[800px]",
              }}
            >
              <TableHeader>
                <TableColumn key="azonosito">Azonosító</TableColumn>
                <TableColumn key="nev">Név</TableColumn>
                <TableColumn key="tipus">Típus</TableColumn>
                <TableColumn key="havi_koltseg">Havi költség</TableColumn>
                <TableColumn key="allami_tamogatas">Állami támogatás</TableColumn>
                <TableColumn key="elegedettseg_hatas">Elégedettségi hatás</TableColumn>
                <TableColumn key="indulas_datum">Indulás dátuma</TableColumn>
                <TableColumn key="aktiv">Státusz</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredServices.map(service => (
                  <TableRow key={service.azonosito}>
                    <TableCell>{service.azonosito}</TableCell>
                    <TableCell>{service.nev}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">{service.tipus}</Chip>
                    </TableCell>
                    <TableCell>{service.havi_koltseg.toLocaleString('hu-HU')} Ft</TableCell>
                    <TableCell>{service.allami_tamogatas.toLocaleString('hu-HU')} Ft</TableCell>
                    <TableCell>
                      <span className={service.elegedettseg_hatas > 0 ? "text-green-500" : "text-red-500"}>
                        {service.elegedettseg_hatas > 0 ? '+' : ''}{service.elegedettseg_hatas}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconCalendar size={14} />
                        {new Date(service.indulas_datum).toLocaleDateString('hu-HU')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.aktiv ? (
                        <Chip color="success" size="sm" variant="flat">Aktív</Chip>
                      ) : (
                        <Chip color="danger" size="sm" variant="flat">Inaktív</Chip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-foreground/5 rounded-full p-3 mb-3">
                <IconInfoCircle size={24} className="text-foreground-400" />
              </div>
              <p className="text-foreground-500">Nincs szolgáltatás a keresési feltételek alapján</p>
              {(searchQuery || selectedTypes.length > 0 || statusFilter !== 'all') && (
                <Button
                  variant="flat"
                  size="sm"
                  className="mt-3"
                  startContent={<IconX size={14} />}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTypes([]);
                    setStatusFilter('all');
                  }}
                >
                  Szűrők törlése
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
} 