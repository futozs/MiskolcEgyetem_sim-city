import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and resolves Tailwind class conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with a given locale and options
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale = 'hu-HU'
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a date with a given locale and options
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale = 'hu-HU'
) {
  const dateToFormat = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateToFormat);
}

/**
 * Create a delay for animations
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generate a unique ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
} 