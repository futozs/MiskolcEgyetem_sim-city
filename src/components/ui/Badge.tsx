'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500 text-white',
        warning: 'border-transparent bg-yellow-500 text-white',
        info: 'border-transparent bg-blue-500 text-white',
        gradient: 'border-transparent bg-gradient-to-r from-purple-500 to-blue-500 text-white',
        glass: 'border-white/20 bg-white/10 backdrop-blur-md text-white',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  animate?: boolean;
}

function Badge({ 
  className, 
  variant, 
  size, 
  animate = false,
  children,
  ...props 
}: BadgeProps) {
  const Comp = animate ? motion.div : 'div';
  
  const animationProps = animate 
    ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', stiffness: 500, damping: 20 }
      } 
    : {};
    
  return (
    <Comp
      className={cn(badgeVariants({ variant, size, className }))}
      {...animationProps}
      {...props}
    >
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants }; 