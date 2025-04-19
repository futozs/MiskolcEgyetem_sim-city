'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Navbar as NextUINavbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Tooltip
} from '@nextui-org/react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import NextLink from 'next/link';
import { IconHome, IconMap2, IconChartBar, IconBuildingCommunity, IconPresentation, IconBuilding, IconBrandGithub } from '@tabler/icons-react';
import { ThemeSwitch } from './ThemeSwitch';
import { config } from '@/lib/config';

const navItems = [
  { name: 'Főoldal', href: '/', icon: IconHome },
  { name: '3D Térkép', href: '/varosterkep', icon: IconMap2 },
  { name: 'Statisztikák', href: '/statisztikak', icon: IconChartBar },
  { name: 'Projektek', href: '/projektek', icon: IconBuildingCommunity },
  { name: 'Prezentáció', href: '/prezentacio', icon: IconPresentation },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  // After mounting, we can safely show the UI that depends on the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update dark mode state when theme or systemTheme changes
  useEffect(() => {
    if (mounted) {
      setIsDark(theme === 'dark' || (theme === 'system' && systemTheme === 'dark'));
    }
  }, [theme, systemTheme, mounted]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > prevScrollY) {
        setScrollDirection('down');
        if (currentScrollY > 100) {
          setVisible(false);
        }
      } else {
        setScrollDirection('up');
        setVisible(true);
      }
      
      // Update scroll state
      setPrevScrollY(currentScrollY);
      
      // Set scrolled state for background effect
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prevScrollY]);

  // Handle navigation with proper client-side routing
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    
    // Show ripple effect on click
    const ripple = document.createElement('div');
    ripple.className = `absolute rounded-full bg-white/30 dark:bg-white/20 animate-ripple`;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    e.currentTarget.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
    
    // Navigate with small delay for visual effect
    setTimeout(() => {
      router.push(href);
    }, 150);
  };

  // Avoid rendering with theme dependencies before mounting
  if (!mounted) {
    return <div className="h-16 w-full" />;
  }

  return (
    <motion.div 
      className="fixed w-full top-0 left-0 z-50 px-4 pt-3"
      initial={{ y: 0 }}
      animate={{ 
        y: visible ? 0 : -100,
        scale: visible ? 1 : 0.98,
        opacity: visible ? 1 : 0,
        transition: { 
          duration: 0.4, 
          ease: visible ? "backOut" : "easeIn",
          opacity: { duration: 0.2 }
        }
      }}
    >
      <div className="mx-auto max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%]">
        <NextUINavbar 
          ref={navbarRef}
          onMenuOpenChange={setIsMenuOpen}
          isMenuOpen={isMenuOpen}
          maxWidth="xl"
          position="static"
          className={`${
            scrolled 
              ? isDark 
                ? 'bg-black/60 shadow-md shadow-purple-900/15' 
                : 'bg-white/60 shadow-md shadow-blue-500/5' 
              : isDark 
                ? 'bg-black/30'
                : 'bg-white/30'
            } backdrop-blur-xl border-2 ${
              isDark 
                ? 'border-purple-500/20 hover:border-purple-500/30' 
                : 'border-blue-500/20 hover:border-blue-500/30'
            } transition-all duration-300 rounded-2xl overflow-hidden mx-auto`}
        >
          <NavbarContent>
            <NavbarMenuToggle
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              className="sm:hidden text-current"
            />
            <NavbarBrand>
              <Link 
                href="/" 
                className="font-bold text-inherit flex items-center gap-2.5"
                onClick={(e) => handleNavigation(e, '/')}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${
                    isDark 
                      ? 'from-purple-600 via-blue-700 to-cyan-600 shadow-lg shadow-purple-500/20' 
                      : 'from-purple-500 via-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20'
                    } flex items-center justify-center text-white font-bold text-xl`}>
                    ME
                  </div>
                </motion.div>
                <motion.span 
                  className={`hidden sm:block text-lg md:text-xl font-semibold ${
                    isDark 
                      ? 'bg-gradient-to-r from-purple-400 via-blue-300 to-cyan-400' 
                      : 'bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-600'
                    } bg-clip-text text-transparent`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Álomváros
                </motion.span>
              </Link>
            </NavbarBrand>
          </NavbarContent>

          <NavbarContent className="hidden sm:flex gap-4" justify="center">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const ItemIcon = item.icon;
              
              return (
                <NavbarItem key={item.href} isActive={isActive}>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, delay: index * 0.1 }}
                    onHoverStart={() => setHoveredItem(item.href)}
                    onHoverEnd={() => setHoveredItem(null)}
                  >
                    <Link 
                      href={item.href}
                      className={`relative px-2 sm:px-3 md:px-4 py-2 md:py-3 overflow-hidden group rounded-full flex items-center gap-1.5 ${
                        isActive 
                          ? isDark ? 'text-white' : 'text-black' 
                          : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
                      } transition-all duration-300`}
                      aria-current={isActive ? "page" : undefined}
                      onClick={(e) => handleNavigation(e, item.href)}
                    >
                      <motion.div 
                        animate={{ 
                          y: hoveredItem === item.href || isActive ? -2 : 0,
                          rotate: hoveredItem === item.href ? [-5, 5, 0] : 0,
                          transition: { duration: 0.3 }
                        }}
                      >
                        <ItemIcon size={16} className={isActive ? 'text-blue-400' : ''} />
                      </motion.div>
                      
                      <span className={`text-sm md:text-base ${isActive ? 'font-medium' : ''}`}>{item.name}</span>
                      
                      {isActive && (
                        <motion.div 
                          className={`absolute inset-0 -z-10 ${
                            isDark 
                              ? 'bg-white/10' 
                              : 'bg-black/5'
                          } rounded-full`}
                          layoutId="navbar-active-item"
                          initial={false}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      {/* Hover effect */}
                      <AnimatePresence>
                        {hoveredItem === item.href && !isActive && (
                          <motion.div 
                            className={`absolute inset-0 -z-10 ${
                              isDark 
                                ? 'bg-white/5' 
                                : 'bg-black/5'
                            } rounded-full`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </AnimatePresence>
                    </Link>
                  </motion.div>
                </NavbarItem>
              );
            })}
          </NavbarContent>

          <NavbarContent justify="end" className="gap-2">
            <NavbarItem>
              <ThemeSwitch />
            </NavbarItem>
            
            <NavbarItem>
              <Tooltip 
                content="Forráskód megtekintése" 
                classNames={{
                  content: [
                    "py-2 px-4 shadow-xl", 
                    "text-black dark:text-white",
                    "bg-white/90 dark:bg-black/90", 
                    "border border-default-200 dark:border-default-800"
                  ]
                }}
                showArrow
                placement="bottom"
              >
                <motion.a 
                  href={config.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 md:h-10 rounded-md px-3 md:px-4 bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:from-purple-500 hover:to-blue-400 relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconBrandGithub size={18} />
                  <span className="absolute inset-0 bg-white/20 rounded-md opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
                </motion.a>
              </Tooltip>
            </NavbarItem>
          </NavbarContent>

          <NavbarMenu className={`pt-8 ${isDark ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-xl rounded-2xl mt-2`}>
            <div className="mt-5 px-3">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                const ItemIcon = item.icon;

                return (
                  <NavbarMenuItem key={item.href} className="my-1.5">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <Link
                        className={`w-full text-lg flex items-center gap-2 py-2.5 px-3 rounded-xl relative overflow-hidden ${
                          isActive 
                            ? isDark 
                              ? 'text-blue-400 font-medium bg-white/5' 
                              : 'text-blue-600 font-medium bg-black/5'
                            : ''
                        }`}
                        href={item.href}
                        onClick={(e) => handleNavigation(e, item.href)}
                      >
                        <ItemIcon size={20} /> 
                        <span>{item.name}</span>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div 
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 rounded-r-md ${
                              isDark ? 'bg-blue-500' : 'bg-blue-600'
                            }`}
                            layoutId="sidebar-active"
                            initial={{ height: 0 }}
                            animate={{ height: '50%' }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  </NavbarMenuItem>
                );
              })}
            </div>
          </NavbarMenu>
        </NextUINavbar>
      </div>
      
      {/* Navbar reveal animation - draws attention to navbar when visible */}
      <AnimatePresence>
        {scrollDirection === 'up' && scrolled && visible && (
          <motion.div 
            className={`absolute -inset-1 -z-10 rounded-3xl ${
              isDark 
                ? 'bg-gradient-to-r from-transparent via-purple-500/10 to-transparent' 
                : 'bg-gradient-to-r from-transparent via-blue-500/5 to-transparent'
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
      
      {/* Add global styles for effects */}
      <style jsx global>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
        
        .animate-ripple {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          animation: ripple 0.6s linear;
        }
        
        @keyframes glow-dark {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(168, 85, 247, 0.15);
            border-color: rgba(168, 85, 247, 0.2);
          }
          50% { 
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
            border-color: rgba(168, 85, 247, 0.3);
          }
        }
        
        @keyframes glow-light {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.15);
          }
          50% { 
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.2);
          }
        }
        
        .glow-navbar-dark {
          animation: glow-dark 3s infinite;
          border-width: 1px;
        }
        
        .glow-navbar-light {
          animation: glow-light 3s infinite;
          border-width: 1px;
        }
        
        /* Add extra space at the top of the body to account for fixed navbar */
        body {
          padding-top: 100px;
        }
        
        /* Adjust padding-top for smaller screens */
        @media (max-width: 640px) {
          body {
            padding-top: 80px;
          }
        }
      `}</style>
    </motion.div>
  );
} 