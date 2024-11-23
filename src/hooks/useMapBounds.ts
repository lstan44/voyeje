import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { supabase } from '../lib/supabase';
import type { Incident } from '../types';
import { logger } from '../lib/logger';
import { trackEvent, EventCategories, EventActions } from '../lib/analytics';
import { mapCache } from '../services/cache';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function useMapBounds() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const queryClient = useQueryClient();

  const fetchIncidentsInBounds = async (bounds: MapBounds): Promise<Incident[]> => {
    try {
      logger.performance.start('fetchIncidentsInBounds');

      const { data, error } = await supabase
        .rpc('get_incidents_in_bounds', {
          min_lat: bounds.south,
          max_lat: bounds.north,
          min_lng: bounds.west,
          max_lng: bounds.east
        })
        .select(`
          *,
          incident_media (
            id,
            type,
            url
          )
        `);

      if (error) {
        logger.error(error, 'fetch_incidents_bounds');
        return [];
      }

      logger.performance.end('fetchIncidentsInBounds');
      
      // Track map movement analytics
      trackEvent(
        EventCategories.Map,
        EventActions.Pan,
        'Map bounds updated',
        data?.length // number of incidents found
      );

      return data || [];
    } catch (error) {
      logger.error(error, 'fetch_incidents_bounds');
      return [];
    }
  };

  const updateBounds = useCallback(
    debounce(async (newBounds: MapBounds) => {
      if (
        !newBounds ||
        newBounds.north < newBounds.south ||
        newBounds.east < newBounds.west ||
        Math.abs(newBounds.north - newBounds.south) > 4 ||
        Math.abs(newBounds.east - newBounds.west) > 4
      ) {
        logger.error('Invalid or too large map bounds', 'map_bounds');
        return;
      }

      setBounds(newBounds);
      queryClient.setQueryData(['incidents', 'bounds', 'loading'], true);

      try {
        // Check cache first
        const cachedData = await mapCache.getCachedIncidents(newBounds);
        if (cachedData) {
          queryClient.setQueryData(['incidents', 'bounds'], cachedData);
          return;
        }

        // If not in cache, fetch from API
        const incidents = await fetchIncidentsInBounds(newBounds);
        await mapCache.cacheIncidents(newBounds, incidents);
        queryClient.setQueryData(['incidents', 'bounds'], incidents);
      } finally {
        queryClient.setQueryData(['incidents', 'bounds', 'loading'], false);
      }
    }, 500),
    [queryClient]
  );

  return {
    bounds,
    updateBounds,
    isLoading: queryClient.getQueryData(['incidents', 'bounds', 'loading']) as boolean
  };
}
