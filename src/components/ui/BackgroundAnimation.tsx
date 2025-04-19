'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

interface FloatingParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
  angle: number;
  spin: number;
  shape: 'circle' | 'square' | 'triangle';
}

export default function BackgroundAnimation() {
  const particlesRef = useRef<FloatingParticle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Once mounted, we can safely check the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate particles on initial render
  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const isDark = theme === 'dark';
    
    const particles: FloatingParticle[] = [];
    const colors = isDark ? [
      'rgba(167, 139, 250, 0.1)',  // purple/violet
      'rgba(34, 211, 238, 0.08)',  // cyan
      'rgba(147, 197, 253, 0.07)', // blue
      'rgba(129, 140, 248, 0.08)'  // indigo
    ] : [
      'rgba(167, 139, 250, 0.07)', // purple/violet lighter
      'rgba(34, 211, 238, 0.05)',  // cyan lighter
      'rgba(96, 165, 250, 0.06)',  // blue lighter
      'rgba(129, 140, 248, 0.05)'  // indigo lighter
    ];
    
    // Create particles with more variation
    for (let i = 0; i < 25; i++) {
      const shape = Math.random() > 0.6 
        ? 'circle' 
        : Math.random() > 0.5 ? 'square' : 'triangle';
      
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 40 + 15, // Larger but subtle particles
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 0.2 + 0.05, // Slower movement
        opacity: Math.random() * 0.3 + 0.1, // Varying opacity
        angle: Math.random() * 360, // Random rotation angle
        spin: (Math.random() - 0.5) * 0.1, // Rotation speed
        shape
      });
    }
    
    particlesRef.current = particles;
    
    // Start animation
    animate();
    
    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Mouse movement handler for interactive particles
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { 
        x: e.clientX, 
        y: e.clientY,
        active: true
      };
      
      // Reset active state after a while for smooth transitions
      setTimeout(() => {
        mouseRef.current.active = false;
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mounted, theme]);
  
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particlesRef.current.forEach(particle => {
      // Update position with smoother movement
      particle.y -= particle.speed;
      
      // Subtle horizontal drift
      particle.x += Math.sin(Date.now() * 0.001 + particle.y * 0.1) * 0.2;
      
      // Update rotation angle
      particle.angle += particle.spin;
      
      // Interactive effect: repel from mouse
      if (mouseRef.current.active) {
        const dx = particle.x - mouseRef.current.x;
        const dy = particle.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;
        
        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * 2;
          particle.x += dx * force * 0.02;
          particle.y += dy * force * 0.02;
        }
      }
      
      // Reset if particle moves off screen
      if (particle.y < -particle.size) {
        particle.y = canvas.height + particle.size;
        particle.x = Math.random() * canvas.width;
        particle.opacity = Math.random() * 0.3 + 0.1; // Reset opacity for variation
      }
      
      // Save context for rotation
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.angle * Math.PI) / 180);
      
      // Draw different shapes
      ctx.fillStyle = particle.color.replace(')', `, ${particle.opacity})`).replace('rgba', 'rgba');
      
      switch(particle.shape) {
        case 'square':
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -particle.size / 2);
          ctx.lineTo(particle.size / 2, particle.size / 2);
          ctx.lineTo(-particle.size / 2, particle.size / 2);
          ctx.closePath();
          ctx.fill();
          break;
        default: // circle
          ctx.beginPath();
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  };
  
  // Don't render the background if we haven't determined the theme yet
  if (!mounted) return null;
  
  const isDark = theme === 'dark';
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full" 
      />
      
      {/* Theme-aware gradient overlay */}
      <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-to-br from-black via-gray-900/90 to-black/80' 
            : 'bg-gradient-to-br from-white via-gray-50/90 to-white/80'
        } opacity-90`} 
      />
      
      {/* Subtle grid pattern */}
      <div 
        className={`absolute inset-0 bg-[length:30px_30px]`}
        style={{
          backgroundImage: `
            linear-gradient(to right, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)
          `
        }}
      />
      
      {/* Decorative gradients */}
      <div className={`
        absolute top-1/3 -left-20 w-96 h-96 rounded-full filter blur-3xl 
        ${isDark ? 'bg-purple-800/10' : 'bg-purple-400/10'}
      `} />
      <div className={`
        absolute bottom-1/4 -right-20 w-80 h-80 rounded-full filter blur-3xl 
        ${isDark ? 'bg-cyan-800/10' : 'bg-cyan-400/10'}
      `} />
      <div className={`
        absolute top-1/2 right-1/3 w-64 h-64 rounded-full filter blur-3xl 
        ${isDark ? 'bg-blue-800/10' : 'bg-blue-400/10'}
      `} />
    </div>
  );
} 