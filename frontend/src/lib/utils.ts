import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUserColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#48C9B0', '#5DADE2', '#AF7AC5', '#F8B739', '#58D68D',
    '#EC7063', '#85C1E2', '#F8C471', '#82E0AA', '#D7BDE2',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
