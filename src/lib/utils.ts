import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DocumentResponse } from './api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// LocalStorage utilities
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// History management
export interface HistoryItem {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  readability: string;
  purpose: string;
  strength?: string;
  model?: string;
}

export const historyManager = {
  key: 'humanizer-history',
  maxItems: 50,
  
  get: (): HistoryItem[] => {
    try {
      const stored = storage.get(historyManager.key);
      if (!stored || !Array.isArray(stored)) return [];
      return stored;
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  },
  
  add: (item: Omit<HistoryItem, 'timestamp'>): HistoryItem[] => {
    try {
      const history = historyManager.get();
      const newItem: HistoryItem = {
        ...item,
        timestamp: Date.now(),
      };
      
      // Check if item already exists (by id)
      const existingIndex = history.findIndex(h => h.id === item.id);
      if (existingIndex !== -1) {
        // Update existing item
        history[existingIndex] = newItem;
      } else {
        // Add new item to beginning
        history.unshift(newItem);
      }
      
      // Limit size
      const updatedHistory = history.slice(0, historyManager.maxItems);
      storage.set(historyManager.key, updatedHistory);
      
      return updatedHistory;
    } catch (error) {
      console.error('Error adding to history:', error);
      return historyManager.get();
    }
  },
  
  remove: (id: string): HistoryItem[] => {
    try {
      const history = historyManager.get();
      const filtered = history.filter(item => item.id !== id);
      storage.set(historyManager.key, filtered);
      return filtered;
    } catch (error) {
      console.error('Error removing from history:', error);
      return historyManager.get();
    }
  },
  
  clear: (): void => {
    try {
      storage.remove(historyManager.key);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },
  
  fromDocumentResponse: (doc: DocumentResponse): Omit<HistoryItem, 'timestamp'> => ({
    id: doc.id,
    input: doc.input,
    output: doc.output,
    readability: doc.readability,
    purpose: doc.purpose,
  }),
};

// Clipboard utilities
export const clipboard = {
  copy: async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
          document.body.removeChild(textArea);
          return false;
        }
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      return false;
    }
  },
};

// Text utilities
export const textUtils = {
  truncate: (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },
  
  wordCount: (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  },
  
  charCount: (text: string): number => {
    return text ? text.length : 0;
  },
  
  formatDate: (timestamp: number): string => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  },
  
  formatRelativeTime: (timestamp: number): string => {
    try {
      const now = Date.now();
      const diff = now - timestamp;
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      return 'Just now';
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Unknown time';
    }
  },
  
  formatCredits: (credits: number | null | undefined): string => {
    // Handle null, undefined, or invalid numbers
    if (credits === null || credits === undefined || isNaN(credits)) {
      return '0';
    }
    
    // Ensure it's a number
    const numCredits = Number(credits);
    
    if (numCredits >= 1000000) {
      return `${(numCredits / 1000000).toFixed(1)}M`;
    } else if (numCredits >= 1000) {
      return `${(numCredits / 1000).toFixed(1)}K`;
    }
    return numCredits.toString();
  },
};

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Generate unique user ID for WebSocket connections
export function generateUserId(): string {
  return `${Date.now()}x${Math.random().toString(36).substr(2, 9)}`;
}

// Validate URL
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
} 