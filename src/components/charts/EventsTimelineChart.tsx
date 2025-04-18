'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Chip, Divider } from '@nextui-org/react';
import { 
  IconCalendarEvent, 
  IconInfoCircle, 
  IconAlertCircle, 
  IconBuildingCommunity, 
  IconCoin
} from '@tabler/icons-react';

export function EventsTimelineChart() {
  const { getTransformedData } = useAppStore();
  const { esemenyek } = getTransformedData();
  
  // Sort events by round (fordulo) in descending order
  const sortedEvents = useMemo(() => {
    return [...esemenyek].sort((a, b) => b.fordulo - a.fordulo);
  }, [esemenyek]);

  // Group events by round (fordulo)
  const groupedEvents = useMemo(() => {
    const groups = {};
    
    sortedEvents.forEach(event => {
      if (!groups[event.fordulo]) {
        groups[event.fordulo] = [];
      }
      groups[event.fordulo].push(event);
    });
    
    return groups;
  }, [sortedEvents]);

  // Get event icon based on its type
  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'politikai':
        return <IconAlertCircle className="text-red-500" />;
      case 'gazdasági':
        return <IconCoin className="text-amber-500" />;
      case 'infrastruktúra':
        return <IconBuildingCommunity className="text-blue-500" />;
      default:
        return <IconInfoCircle className="text-gray-500" />;
    }
  };

  // Get event chip color based on its type
  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'politikai':
        return 'danger';
      case 'gazdasági':
        return 'warning';
      case 'infrastruktúra':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Extract impact from event description if it's in a special format
  const extractImpact = (event) => {
    const { hatas, esemeny } = event;
    
    const financialImpact = hatas?.penz || 0;
    const happinessImpact = hatas?.boldogsag || 0;
    const populationImpact = hatas?.lakossag || 0;
    
    // Parse event name for financial data
    const name = esemeny.nev;
    const moneyRegex = /\d{1,3}([\s,.]\d{3})*([\s,.]\d{1,2})?\s*Ft/;
    const moneyMatch = name.match(moneyRegex);
    
    // Extract financial impact from name if available
    const displayAmount = moneyMatch 
      ? moneyMatch[0]
      : financialImpact !== 0 
        ? `${financialImpact.toLocaleString('hu-HU')} Ft`
        : null;
    
    return {
      financialImpact,
      happinessImpact,
      populationImpact,
      displayAmount
    };
  };

  // Check if there are any events to display
  if (!esemenyek || esemenyek.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <IconCalendarEvent size={48} className="text-foreground-500 mb-4 opacity-50" />
        <p className="text-foreground-600">Nincsenek megjeleníthető események</p>
        <p className="text-xs text-foreground-500 mt-2">
          Az események a játék során jelennek meg
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden relative">
      <CardHeader className="pb-0 px-4 flex-col items-start">
        <div className="flex w-full justify-between items-center">
          <h4 className="text-lg font-medium flex items-center gap-2">
            <IconCalendarEvent size={20} />
            Események
          </h4>
          <Chip size="sm" variant="flat" color="primary">
            {esemenyek.length} esemény
          </Chip>
        </div>
        <p className="text-sm text-foreground-500 mt-1">
          A város eseményeinek összefoglalója
        </p>
        <Divider className="my-3" />
      </CardHeader>
      
      <CardBody className="overflow-y-auto px-4 pt-0 h-[calc(100%-90px)]">
        <div className="timeline-container relative">
          {Object.entries(groupedEvents).map(([round, events]) => (
            <div key={round} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconCalendarEvent size={18} className="text-primary" />
                </div>
                <h5 className="text-md font-medium">{round}. forduló</h5>
              </div>
              
              <div className="space-y-3 ml-2">
                {(events as any[]).map((event, index) => {
                  const impact = extractImpact(event);
                  
                  return (
                    <motion.div
                      key={`${round}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="relative pl-6 border-l border-foreground/10"
                    >
                      <div className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full -translate-x-[7px] translate-y-1" />
                      
                      <div className="bg-content1 rounded-lg border border-foreground/10 p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.esemeny.tipus)}
                            <span className="font-medium text-sm">
                              {event.esemeny.nev.split(':')[0]}
                            </span>
                          </div>
                          
                          <Chip size="sm" variant="flat" color={getEventColor(event.esemeny.tipus)}>
                            {event.esemeny.tipus}
                          </Chip>
                        </div>
                        
                        <p className="text-sm text-foreground-600 mb-2">
                          {event.esemeny.leiras.length > 200 
                            ? `${event.esemeny.leiras.substring(0, 200)}...` 
                            : event.esemeny.leiras}
                        </p>
                        
                        {impact.displayAmount && (
                          <div className="flex items-center gap-2 text-sm text-foreground-500">
                            <IconCoin size={16} />
                            <span>{impact.displayAmount}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </div>
  );
} 