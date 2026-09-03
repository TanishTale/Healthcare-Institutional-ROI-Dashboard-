import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats monetary amounts in Indian Rupee format with ₹ prefix,
 * proper comma placement (en-IN standard), and 2 decimal places.
 * Example: 14200000 -> "₹1,42,00,000.00"
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Compact Indian Rupee formatting for chart axis labels / badges if needed
 */
export function formatCompactINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 10000000) {
    return `${isNegative ? '-' : ''}₹${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    return `${isNegative ? '-' : ''}₹${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    return `${isNegative ? '-' : ''}₹${(absAmount / 1000).toFixed(1)} k`;
  }
  return `${isNegative ? '-' : ''}₹${absAmount.toFixed(0)}`;
}

/**
 * Formats values as percentage
 */
export function formatPercent(value: number | null | undefined, includeSign = true): string {
  if (value == null || isNaN(value)) return '0.0%';
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
