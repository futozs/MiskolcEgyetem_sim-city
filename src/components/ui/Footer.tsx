'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { IconBrandGithub } from '@tabler/icons-react';

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const footerLinks = [
    { section: 'Oldalak', links: [
      { name: 'Főoldal', href: '/' },
      { name: 'Várostérkép', href: '/varosterkep' },
      { name: 'Statisztikák', href: '/statisztikak' },
      { name: 'Projektek', href: '/projektek' },
    ]},
  ];
  
  return (
    <footer className={`w-full border-t ${isDark ? 'border-white/10 bg-black/40' : 'border-black/5 bg-white/40'} backdrop-blur-xl z-10`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
              isDark 
                ? 'from-purple-600 via-blue-700 to-cyan-600' 
                : 'from-purple-500 via-blue-600 to-cyan-500'
              } flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              ME
            </div>
            <span className={`text-xl font-semibold ${
              isDark 
                ? 'bg-gradient-to-r from-purple-400 via-blue-300 to-cyan-400' 
                : 'bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-600'
              } bg-clip-text text-transparent`}>
              Álomváros
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex gap-6">
            {footerLinks[0].links.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className={`text-sm ${
                  isDark 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  } transition-colors`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* GitHub Link */}
          <Link href="https://github.com" target="_blank" rel="noreferrer" 
            className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} transition-colors`}>
            <IconBrandGithub size={20} />
          </Link>
        </div>
      </div>
    </footer>
  );
} 