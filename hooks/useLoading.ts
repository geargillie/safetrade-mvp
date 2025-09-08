import { useState, useCallback } from 'react';

interface UseLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Centralized loading state hook
 * Provides consistent loading state management across components
 */
export function useLoading(initialState: boolean = false): UseLoadingReturn {
  const [loading, setLoading] = useState<boolean>(initialState);

  /**
   * Wrapper function that automatically manages loading state
   * @param fn - Async function to execute
   * @returns Promise with the result of the function
   */
  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setLoading,
    withLoading
  };
}