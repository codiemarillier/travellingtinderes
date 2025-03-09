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
      return 'bg-secondary/80 text-white';
    case 'Mountain':
      return 'bg-emerald-500/80 text-white';
    case 'City':
      return 'bg-blue-500/80 text-white';
    case 'Cultural':
      return 'bg-purple-500/80 text-white';
    case 'Adventure':
      return 'bg-accent/80 text-amber-700';
    case 'Relaxation':
      return 'bg-pink-400/80 text-white';
    default:
      return 'bg-gray-500/80 text-white';
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
