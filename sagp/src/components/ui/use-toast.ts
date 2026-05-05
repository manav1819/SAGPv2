'use client';

import React from 'react';

// Re-export the base hook
export { ToastProvider } from './toast';

// Types
export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

// Import the base context hook
import { useToast as useBaseToast } from './toast';

// Enhanced hook
export function useToast() {
  const { addToast } = useBaseToast();

  return {
    toast: (props: ToastProps) => {
      const typeMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
        default: 'info',
        destructive: 'error',
        success: 'success',
      };

      const message = props.description
        ? `${props.title}\n${props.description}`
        : props.title;

      addToast({
        message,
        type: typeMap[props.variant || 'default'],
        duration: 5000,
      });
    },
  };
}
