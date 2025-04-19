import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale = 'hu-HU'
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

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

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
} 