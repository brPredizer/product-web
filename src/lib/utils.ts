import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const isIframe: boolean = typeof window !== 'undefined'
  ? window.self !== window.top
  : false;
