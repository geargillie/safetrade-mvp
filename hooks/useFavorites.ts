// hooks/useFavorites.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For now, use localStorage until database table is created
      const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites);
        setFavorites(parsed);
      } else {
        setFavorites([]);
      }

      // TODO: Replace with actual database query when table is created
      // const { data, error: fetchError } = await supabase
      //   .from('favorites')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('created_at', { ascending: false });

      // if (fetchError) throw fetchError;
      // setFavorites(data || []);

    } catch (err: unknown) {
      console.error('Error fetching favorites:', err);
      const error = err as { message?: string };
      setError(error.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  // Add listing to favorites
  const addFavorite = async (listingId: string) => {
    if (!user) {
      throw new Error('Must be logged in to add favorites');
    }

    try {
      setError(null);

      // Check if already favorited
      if (isFavorited(listingId)) {
        return;
      }

      const newFavorite: Favorite = {
        id: crypto.randomUUID(),
        user_id: user.id,
        listing_id: listingId,
        created_at: new Date().toISOString()
      };

      // For now, use localStorage
      const updatedFavorites = [...favorites, newFavorite];
      setFavorites(updatedFavorites);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));

      // TODO: Replace with actual database insert when table is created
      // const { error: insertError } = await supabase
      //   .from('favorites')
      //   .insert({
      //     user_id: user.id,
      //     listing_id: listingId
      //   });

      // if (insertError) throw insertError;
      
      console.log('✅ Added to favorites:', listingId);

    } catch (err: unknown) {
      console.error('Error adding favorite:', err);
      const error = err as { message?: string };
      setError(error.message || 'Failed to add favorite');
      throw error;
    }
  };

  // Remove listing from favorites
  const removeFavorite = async (listingId: string) => {
    if (!user) {
      throw new Error('Must be logged in to remove favorites');
    }

    try {
      setError(null);

      // Remove from local state and storage
      const updatedFavorites = favorites.filter(fav => fav.listing_id !== listingId);
      setFavorites(updatedFavorites);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(updatedFavorites));

      // TODO: Replace with actual database delete when table is created
      // const { error: deleteError } = await supabase
      //   .from('favorites')
      //   .delete()
      //   .eq('user_id', user.id)
      //   .eq('listing_id', listingId);

      // if (deleteError) throw deleteError;
      
      console.log('✅ Removed from favorites:', listingId);

    } catch (err: unknown) {
      console.error('Error removing favorite:', err);
      const error = err as { message?: string };
      setError(error.message || 'Failed to remove favorite');
      throw error;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (listingId: string) => {
    if (isFavorited(listingId)) {
      await removeFavorite(listingId);
    } else {
      await addFavorite(listingId);
    }
  };

  // Check if listing is favorited
  const isFavorited = (listingId: string) => {
    return favorites.some(fav => fav.listing_id === listingId);
  };

  // Get favorite listing IDs
  const getFavoriteListingIds = () => {
    return favorites.map(fav => fav.listing_id);
  };

  // Get favorites count
  const getFavoritesCount = () => {
    return favorites.length;
  };

  // Load favorites when user changes
  useEffect(() => {
    fetchFavorites();
  }, [user?.id]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    getFavoriteListingIds,
    getFavoritesCount,
    fetchFavorites
  };
}