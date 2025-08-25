/**
 * Hook for managing Safe Zone favorites
 * Handles local storage and API sync for user favorites
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { SafeZone } from '@/types/safe-zones';

interface UseSafeZoneFavoritesResult {
  /** Array of favorite safe zone IDs */
  favorites: string[];
  /** Check if a safe zone is favorited */
  isFavorite: (safeZoneId: string) => boolean;
  /** Toggle favorite status */
  toggleFavorite: (safeZone: SafeZone, currentState?: boolean) => Promise<void>;
  /** Add to favorites */
  addToFavorites: (safeZone: SafeZone) => Promise<void>;
  /** Remove from favorites */
  removeFromFavorites: (safeZoneId: string) => Promise<void>;
  /** Clear all favorites */
  clearFavorites: () => Promise<void>;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
}

const FAVORITES_STORAGE_KEY = 'safezone_favorites';

export function useSafeZoneFavorites(userId?: string): UseSafeZoneFavoritesResult {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem(
          userId ? `${FAVORITES_STORAGE_KEY}_${userId}` : FAVORITES_STORAGE_KEY
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }
      } catch (err) {
        console.error('Error loading favorites from localStorage:', err);
      }
    };

    loadFavorites();
  }, [userId]);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: string[]) => {
    try {
      localStorage.setItem(
        userId ? `${FAVORITES_STORAGE_KEY}_${userId}` : FAVORITES_STORAGE_KEY,
        JSON.stringify(newFavorites)
      );
    } catch (err) {
      console.error('Error saving favorites to localStorage:', err);
    }
  }, [userId]);

  // Sync with API (if user is authenticated)
  const syncWithAPI = useCallback(async (action: 'add' | 'remove', safeZoneId: string) => {
    if (!userId) return; // Skip API sync if not authenticated

    try {
      const response = await fetch('/api/user/safe-zone-favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          safeZoneId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync favorites with server');
      }
    } catch (err) {
      console.error('Error syncing favorites with API:', err);
      // Don't throw here - allow offline functionality
    }
  }, [userId]);

  // Check if a safe zone is favorited
  const isFavorite = useCallback((safeZoneId: string): boolean => {
    return favorites.includes(safeZoneId);
  }, [favorites]);

  // Add to favorites
  const addToFavorites = useCallback(async (safeZone: SafeZone) => {
    if (favorites.includes(safeZone.id)) return;

    setLoading(true);
    setError(null);

    try {
      const newFavorites = [...favorites, safeZone.id];
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      
      // Sync with API
      await syncWithAPI('add', safeZone.id);
      
      // Analytics event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'safe_zone_favorited', {
          safe_zone_id: safeZone.id,
          safe_zone_name: safeZone.name,
          safe_zone_type: safeZone.zoneType,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to favorites');
      // Revert on error
      setFavorites(prev => prev.filter(id => id !== safeZone.id));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [favorites, saveFavorites, syncWithAPI]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (safeZoneId: string) => {
    if (!favorites.includes(safeZoneId)) return;

    setLoading(true);
    setError(null);

    try {
      const newFavorites = favorites.filter(id => id !== safeZoneId);
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      
      // Sync with API
      await syncWithAPI('remove', safeZoneId);
      
      // Analytics event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'safe_zone_unfavorited', {
          safe_zone_id: safeZoneId,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites');
      // Revert on error
      setFavorites(prev => [...prev, safeZoneId]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [favorites, saveFavorites, syncWithAPI]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (safeZone: SafeZone, currentState?: boolean) => {
    const isCurrentlyFavorite = currentState !== undefined ? currentState : isFavorite(safeZone.id);
    
    if (isCurrentlyFavorite) {
      await removeFromFavorites(safeZone.id);
    } else {
      await addToFavorites(safeZone);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // Clear all favorites
  const clearFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setFavorites([]);
      saveFavorites([]);
      
      // Clear from server if authenticated
      if (userId) {
        await fetch('/api/user/safe-zone-favorites/clear', {
          method: 'POST',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear favorites');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saveFavorites, userId]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    loading,
    error,
  };
}

// Additional hook for getting favorite safe zones with full data
export function useFavoriteSafeZones(userId?: string) {
  const { favorites } = useSafeZoneFavorites(userId);
  const [favoriteSafeZones, setFavoriteSafeZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFavoriteDetails = async () => {
      if (favorites.length === 0) {
        setFavoriteSafeZones([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/safe-zones?ids=${favorites.join(',')}`);
        if (!response.ok) {
          throw new Error('Failed to load favorite safe zones');
        }

        const data = await response.json();
        setFavoriteSafeZones(data.safeZones || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
        setFavoriteSafeZones([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteDetails();
  }, [favorites]);

  return {
    favoriteSafeZones,
    loading,
    error,
  };
}

// Type for global analytics
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: any) => void;
  }
}