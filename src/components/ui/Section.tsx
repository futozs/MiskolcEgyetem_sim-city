'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article';
  containerClassName?: string;
  animate?: boolean;
  delay?: number;
}

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ as: Component = 'section', className, containerClassName, animate = false, delay = 0, children, ...props }, ref) => {
    const Wrapper = animate ? motion.section : Component;
    
    const animationProps = animate 
      ? {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay },
          viewport: { once: true, margin: '-100px' }
        } 
      : {};
      
    return (
      <Wrapper
        ref={ref}
        className={cn('py-12 md:py-16 lg:py-24', className)}
        {...animationProps}
        {...props}
      >
        <div className={cn('container mx-auto px-4 sm:px-6 lg:px-8', containerClassName)}>
          {children}
        </div>
      </Wrapper>
    );
  }
);

Section.displayName = 'Section';

export { Section }; 