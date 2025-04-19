'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none gap-1.5',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-br from-purple-600 to-blue-500 text-white hover:from-purple-500 hover:to-blue-400',
        glassmorphism: 'bg-white/10 backdrop-blur-lg text-white border border-white/20 hover:bg-white/20',
        glass: 'bg-background/10 border border-background/20 backdrop-blur-lg hover:bg-background/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'as'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  animate?: boolean;
  href?: string;
  as?: 'button' | 'a' | React.ElementType;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animate = false, children, href, as, ...props }, ref) => {
    // Determine the base component
    let Comp: any = 'button';
    
    if (href) {
      // If href is provided, use Next.js Link
      Comp = Link;
      (props as any).href = href;
    } else if (as) {
      // If a custom element type is specified, use that
      Comp = as;
    }
    
    // Apply motion if animation is enabled
    const MotionComp = animate ? motion(Comp) : Comp;
    
    const animationProps = animate 
      ? {
          whileHover: { scale: 1.05 },
          whileTap: { scale: 0.95 },
          transition: { type: 'spring', stiffness: 400, damping: 10 }
        } 
      : {};
      
    return (
      <MotionComp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...animationProps}
        {...props}
      >
        {children}
      </MotionComp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants }; 