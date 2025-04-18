'use client';

import { useState, useEffect } from 'react';
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
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import NextLink from 'next/link';
import { IconHome, IconMap2, IconChartBar, IconBuildingCommunity, IconPresentation, IconBuilding } from '@tabler/icons-react';
import { ThemeSwitch } from './ThemeSwitch';

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
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

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
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Avoid rendering with theme dependencies before mounting
  if (!mounted) {
    return <div className="h-16 w-full" />;
  }

  return (
    <NextUINavbar 
      onMenuOpenChange={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      className={`${
        scrolled 
          ? isDark ? 'bg-black/50' : 'bg-white/50' 
          : 'bg-transparent'
        } backdrop-blur-xl border-b ${isDark ? 'border-white/10' : 'border-black/5'} transition-all duration-300`}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden text-current"
        />
        <NavbarBrand>
          <Link href="/" className="font-bold text-inherit flex items-center gap-2.5" as={NextLink}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                isDark 
                  ? 'from-purple-600 via-blue-700 to-cyan-600' 
                  : 'from-purple-500 via-blue-600 to-cyan-500'
                } flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                ME
              </div>
            </motion.div>
            <motion.span 
              className={`hidden sm:block text-xl font-semibold ${
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
              >
                <Link 
                  href={item.href}
                  as={NextLink}
                  className={`relative px-3 py-2 overflow-hidden group rounded-full flex items-center gap-1.5 ${
                    isActive 
                      ? isDark ? 'text-white' : 'text-black' 
                      : isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black'
                  } transition-all duration-300`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <ItemIcon size={18} className={isActive ? 'text-blue-400' : ''} />
                  <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
                  
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
          <Tooltip content="Forráskód megtekintése">
            <a 
              href="https://github.com/futozs" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 rounded-md px-3 bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:from-purple-500 hover:to-blue-400"
            >
              GitHub
            </a>
          </Tooltip>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu className={`pt-8 ${isDark ? 'bg-black/90' : 'bg-white/90'} backdrop-blur-xl`}>
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const ItemIcon = item.icon;

          return (
            <NavbarMenuItem key={item.href}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link
                  className={`w-full text-lg flex items-center gap-2 py-2 ${
                    isActive 
                      ? isDark ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'
                      : ''
                  }`}
                  href={item.href}
                  as={NextLink}
                >
                  <ItemIcon size={20} /> {item.name}
                </Link>
              </motion.div>
            </NavbarMenuItem>
          );
        })}
      </NavbarMenu>
    </NextUINavbar>
  );
} 