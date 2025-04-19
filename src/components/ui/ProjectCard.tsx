'use client';

import { Card, CardBody, Chip, Divider, Progress, Tooltip } from '@nextui-org/react';
import { motion } from 'framer-motion';

type ProjectCardProps = {
  id: number;
  name: string;
  type: string;
  cost: number;
  startDate: Date;
  endDate: Date;
  completionPercentage: number;
  status: string;
  progressStatus: 'behind' | 'on-time' | 'ahead';
  daysRemaining: number;
  totalDays: number;
};

export function ProjectCard({
  id,
  name,
  type,
  cost,
  startDate,
  endDate,
  completionPercentage,
  status,
  progressStatus,
  daysRemaining,
  totalDays,
}: ProjectCardProps) {
  // Get the color based on progress status
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'behind':
        return 'danger';
      case 'ahead':
        return 'success';
      default:
        return 'primary';
    }
  };
  
  // Get the gradient colors for progress
  const getProgressGradient = (status: string) => {
    switch (status) {
      case 'behind':
        return "from-red-700 to-red-900";
      case 'ahead':
        return "from-green-700 to-green-900";
      default:
        return "from-blue-700 to-blue-900";
    }
  };
  
  // Get the status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'behind':
        return 'Csúszik';
      case 'ahead':
        return 'Előre halad';
      default:
        return 'Időben';
    }
  };
  
  // Calculate days elapsed
  const daysElapsed = totalDays - daysRemaining;
  
  // Calculate expected completion percentage based on time
  const expectedCompletion = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  
  // Get building icon based on type
  const getBuildingIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lakóház':
      case 'lakóépület':
        return '🏘️';
      case 'középület':
        return '🏢';
      case 'vallási':
        return '⛪';
      case 'iroda':
        return '🏢';
      case 'kereskedelmi':
        return '🏪';
      case 'ipari':
        return '🏭';
      default:
        return '🏗️';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="w-full h-full glass border-none shadow-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/90 to-gray-900/70 z-0" />
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getProgressGradient(progressStatus)}`}></div>
        
        <CardBody className="p-5 z-10 relative">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center text-xl">
                {getBuildingIcon(type)}
              </div>
              <div>
                <h3 className="text-lg font-bold">{name}</h3>
                <p className="text-small text-gray-400">{type}</p>
              </div>
            </div>
            <Tooltip content={status === 'folyamatban' ? 'A projekt aktív' : 'A projekt befejezve'}>
              <Chip
                color={status === 'folyamatban' ? 'primary' : 'success'}
                size="sm"
                variant="flat"
                className="border-none"
              >
                {status}
              </Chip>
            </Tooltip>
          </div>
          
          <Divider className="my-3 opacity-10" />
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-small mb-1">
                <span className="text-gray-400">Készültség</span>
                <span className="font-semibold">{completionPercentage}%</span>
              </div>
              <Progress 
                value={completionPercentage} 
                color={getProgressColor(progressStatus)} 
                size="sm"
                radius="sm"
                classNames={{
                  base: "max-w-full",
                  track: "drop-shadow-md border border-default",
                  indicator: `bg-gradient-to-r ${getProgressGradient(progressStatus)}`,
                }}
                aria-label="Készültség"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-small mb-1">
                <span className="text-gray-400">Várható készültség</span>
                <span className="font-semibold">{Math.round(expectedCompletion)}%</span>
              </div>
              <Progress 
                value={expectedCompletion} 
                color="default" 
                size="sm"
                radius="sm"
                classNames={{
                  base: "max-w-full",
                  track: "drop-shadow-md border border-default",
                  indicator: "bg-gray-600",
                }}
                aria-label="Várható készültség"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4 text-small">
              <div>
                <p className="text-gray-400">Költség</p>
                <p className="font-medium">{cost.toLocaleString('hu-HU')} Ft</p>
              </div>
              <div>
                <p className="text-gray-400">Állapot</p>
                <p className="font-medium">
                  <span 
                    className={progressStatus === 'behind' 
                      ? 'text-red-500' 
                      : progressStatus === 'ahead' 
                        ? 'text-green-500' 
                        : 'text-blue-500'
                    }
                  >
                    {getStatusText(progressStatus)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-400">Kezdés</p>
                <p className="font-medium">{startDate.toLocaleDateString('hu-HU')}</p>
              </div>
              <div>
                <p className="text-gray-400">Befejezés</p>
                <p className="font-medium">{endDate.toLocaleDateString('hu-HU')}</p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Chip 
                size="sm" 
                variant="flat" 
                className={`${progressStatus === 'behind' 
                  ? 'bg-red-900/20 text-red-400' 
                  : progressStatus === 'ahead' 
                    ? 'bg-green-900/20 text-green-400' 
                    : 'bg-blue-900/20 text-blue-400'} border-none`}
              >
                {Math.ceil(daysRemaining)} nap van hátra
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
} 