'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconMap, IconBuilding, IconChartBar, IconSearch } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavigationItem = ({ icon, label, description, isActive, onClick }: NavigationItemProps) => {
  return (
    <motion.div
      className={cn(
        "relative w-full py-5 px-5 cursor-pointer",
        isActive ? "text-white" : "text-white/70 hover:text-white"
      )}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-4">
        <div className="text-white/90 text-2xl">
          {icon}
        </div>
        <div>
          <div className="font-medium text-lg">{label}</div>
          {description && (
            <p className="text-sm text-white/60 mt-1">{description}</p>
          )}
        </div>
      </div>
      {isActive && (
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"
          layoutId="activeIndicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

export function CityNavigationMenu() {
  const [activeItem, setActiveItem] = useState<string | null>('search');
  
  return (
    <motion.div
      className="absolute top-1/2 left-6 -translate-y-1/2 z-20 rounded-xl overflow-hidden w-72"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Purple glowing background with enhanced glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl blur-md opacity-70 animate-pulse-slow"></div>
      <div className="absolute -inset-0.5 bg-purple-500/30 rounded-xl blur-sm"></div>

      <div className="relative bg-black/80 backdrop-blur-md rounded-xl border border-purple-500/50 shadow-lg shadow-purple-500/20 h-[500px]">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[length:20px_20px] opacity-20" style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), 
                            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`
        }}></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="p-5 text-center border-b border-purple-500/30">
            <h3 className="text-2xl font-bold text-white">Navigáció</h3>
          </div>
          
          <div className="py-4 flex-grow">
            <NavigationItem
              icon={<IconSearch size={26} stroke={1.5} />}
              label="Keresés"
              description="épületek és helyek keresése"
              isActive={activeItem === 'search'}
              onClick={() => setActiveItem('search')}
            />
          </div>
          
          <div className="px-5 py-4 border-t border-purple-500/30 text-center mt-auto">
            <span className="text-sm text-white/70">Felfedezés</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 