'use client';

import { ProjectCard } from '@/components/ui/ProjectCard';
import { useAppStore } from '@/store/appStore';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tab, Tabs, Card, CardBody, Badge } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ProjectsPage() {
  const { getTransformedData } = useAppStore();
  const { constructionViz, charts } = getTransformedData();
  
  const [sortBy, setSortBy] = useState<string>('name');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('active');
  
  // Get projects
  const projects = constructionViz || [];
  
  // Get active/completed projects
  const activeProjects = projects.filter(p => p.status === 'folyamatban');
  const completedProjects = projects.filter(p => p.status !== 'folyamatban');
  
  // Filter projects based on selected status
  const filteredProjects = selectedTab === 'active' 
    ? activeProjects 
    : completedProjects;
  
  // Apply additional status filter
  const statusFilteredProjects = filterStatus === 'all'
    ? filteredProjects
    : filteredProjects.filter(p => p.progressStatus === filterStatus);
  
  // Sort projects
  const sortedProjects = [...statusFilteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'cost':
        return b.cost - a.cost;
      case 'completion':
        return b.completionPercentage - a.completionPercentage;
      case 'endDate':
        return a.endDate.getTime() - b.endDate.getTime();
      default:
        return a.name.localeCompare(b.name);
    }
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-8 relative z-10">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge color="primary" className="mb-2">Projektek</Badge>
              <h1 className="text-3xl font-bold mb-2">Városi <span className="gradient-text">Projektek</span></h1>
              <p className="text-gray-400">
                Építési és fejlesztési projektek áttekintése
              </p>
            </div>
            <div className="text-right glass p-3 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">
                Aktív projektek
              </p>
              <p className="text-2xl font-bold gradient-text">
                {charts?.altalanosMutatok.aktivProjektek || 0} <span className="text-sm font-normal text-gray-400">db</span>
              </p>
            </div>
          </motion.div>
          
          {/* Tabs for active/completed projects */}
          <Tabs 
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            className="mb-6"
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab 
              key="active" 
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-sm">👷‍♂️</span>
                  <span>Aktív Projektek</span>
                </div>
              } 
            />
            <Tab 
              key="completed" 
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-sm">✅</span>
                  <span>Befejezett Projektek</span>
                </div>
              } 
            />
          </Tabs>
          
          {/* Filters and sorting */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex gap-2 flex-wrap">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="flat" 
                    size="sm"
                    className="capitalize glass border-none"
                  >
                    {filterStatus === 'all' ? 'Összes állapot' : 
                      filterStatus === 'behind' ? 'Csúszik' : 
                      filterStatus === 'ahead' ? 'Előre halad' : 
                      'Időben'}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu 
                  aria-label="Állapot szűrés"
                  onAction={(key) => setFilterStatus(key as string)}
                  selectedKeys={[filterStatus]}
                  selectionMode="single"
                  className="glass"
                >
                  <DropdownItem key="all">Összes állapot</DropdownItem>
                  <DropdownItem key="on-time">Időben</DropdownItem>
                  <DropdownItem key="behind">Csúszik</DropdownItem>
                  <DropdownItem key="ahead">Előre halad</DropdownItem>
                </DropdownMenu>
              </Dropdown>
              
              <Button 
                variant="light" 
                size="sm"
                onClick={() => {
                  setFilterStatus('all');
                  setSortBy('name');
                }}
                className="text-gray-400"
              >
                Alaphelyzet
              </Button>
            </div>
            
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  variant="flat" 
                  size="sm"
                  className="capitalize glass border-none"
                >
                  {sortBy === 'name' ? 'Név szerint' : 
                  sortBy === 'cost' ? 'Költség szerint' : 
                  sortBy === 'completion' ? 'Készültség szerint' : 
                  'Határidő szerint'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Rendezés"
                onAction={(key) => setSortBy(key as string)}
                selectedKeys={[sortBy]}
                selectionMode="single"
                className="glass"
              >
                <DropdownItem key="name">Név szerint</DropdownItem>
                <DropdownItem key="cost">Költség szerint</DropdownItem>
                <DropdownItem key="completion">Készültség szerint</DropdownItem>
                <DropdownItem key="endDate">Határidő szerint</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </motion.div>
          
          {/* Projects list */}
          {sortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  type={project.type}
                  cost={project.cost}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  completionPercentage={project.completionPercentage}
                  status={project.status}
                  progressStatus={project.progressStatus}
                  daysRemaining={project.daysRemaining}
                  totalDays={project.totalDays}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="glass border-none shadow-none">
                <CardBody className="py-12">
                  <div className="text-center">
                    <div className="text-5xl mb-5">{selectedTab === 'active' ? '🏗️' : '🏙️'}</div>
                    <p className="text-xl font-medium mb-2 gradient-text">
                      Nincs {selectedTab === 'active' ? 'aktív' : 'befejezett'} projekt
                    </p>
                    <p className="text-gray-400 max-w-md mx-auto">
                      {selectedTab === 'active' 
                        ? 'Jelenleg nincs folyamatban lévő építkezés a városban. Az erőforrások és új projektek tervezés alatt állhatnak.'
                        : 'Nincsenek befejezett építkezések a városban. A folyamatban lévő projektek még építés alatt állnak.'}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
          
          {sortedProjects.length > 0 && (
            <div className="text-center text-sm text-gray-400 mt-8">
              Összesen {sortedProjects.length} projekt | {selectedTab === 'active' ? 'Aktív' : 'Befejezett'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 