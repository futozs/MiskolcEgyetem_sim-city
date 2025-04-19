'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-lg shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        glass: 'bg-white/10 backdrop-blur-lg border border-white/20',
        glassDark: 'bg-black/30 backdrop-blur-lg border border-white/10 text-white',
        gradient: 'bg-gradient-to-br from-purple-600/80 to-blue-600/80 text-white',
        outline: 'bg-transparent border border-border',
        premium: 'bg-gradient-to-br from-black to-zinc-800 text-white border border-zinc-700 shadow-xl',
      },
      hover: {
        default: '',
        lift: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-md',
        glow: 'transition-all duration-200 hover:shadow-[0_0_15px_rgba(167,139,250,0.5)]',
        none: '',
      },
      padding: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
        none: 'p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'default',
      padding: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  animate?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, animate = false, children, ...props }, ref) => {
    const Comp = animate ? motion.div : 'div';
    
    const animationProps = animate 
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5 },
          whileHover: hover === 'lift' ? { y: -8, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' } : undefined
        } 
      : {};
      
    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, hover, padding, className }))}
        {...animationProps}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}; 