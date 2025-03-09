import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPriceLevel(level: number): string {
  switch (level) {
    case 1:
      return '$';
    case 2:
      return '$$';
    case 3:
      return '$$$';
    default:
      return '';
  }
}

export function getPriceLevelDescription(level: number): string {
  switch (level) {
    case 1:
      return 'Budget';
    case 2:
      return 'Moderate';
    case 3:
      return 'Luxury';
    default:
      return '';
  }
}

export function categoryToColor(category: string): string {
  switch (category) {
    case 'Beach':
      return 'bg-cyan-500/80 text-white';
    case 'Mountain':
      return 'bg-emerald-600/80 text-white';
    case 'City':
      return 'bg-blue-600/80 text-white';
    case 'Cultural':
      return 'bg-teal-500/80 text-white';
    case 'Adventure':
      return 'bg-sky-500/80 text-white';
    case 'Relaxation':
      return 'bg-green-500/80 text-white';
    default:
      return 'bg-blue-gray-500/80 text-white';
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}
