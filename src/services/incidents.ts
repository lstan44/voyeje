import { supabase } from '../lib/supabase';
import { generateSlug } from '../utils/slug';
import type { Incident, IncidentCreate } from '../types';
import { logger } from '../lib/logger';

export async function fetchIncidents(
  userLocation?: { lat: number; lng: number },
  radius: number = 5 // Radius in miles
): Promise<Incident[]> {
  try {
    logger.performance.start('fetchIncidents');

    let query = supabase
      .from('incidents')
      .select(`
        *,
        incident_media (
          id,
          type,
          url
        )
      `)
      .order('created_at', { ascending: false });

    if (userLocation?.lat && userLocation?.lng) {
      try {
        const userPoint = {
          type: 'Point',
          coordinates: [userLocation.lng, userLocation.lat]
        };

        const { data: nearbyIncidents, error: rpcError } = await supabase.rpc(
          'incidents_within_radius',
          {
            user_location: userPoint,
            radius_miles: radius
          }
        );

        if (rpcError) {
          logger.error(rpcError, 'postgis_query');
          return [];
        }

        if (nearbyIncidents && nearbyIncidents.length > 0) {
          query = query.in('id', nearbyIncidents.map(inc => inc.id));
        }
      } catch (error) {
        logger.error(error, 'postgis_query');
        return [];
      }
    }

    const { data, error } = await query;

    if (error) {
      logger.error(error, 'fetchIncidents');
      return [];
    }

    const incidents = (data || []).map(record => ({
      ...record,
      incident_media: record.incident_media || []
    })) as Incident[];

    logger.performance.end('fetchIncidents');
    return incidents;
  } catch (error) {
    logger.error(error, 'fetchIncidents');
    return [];
  }
}

export async function createIncident(incident: IncidentCreate): Promise<Incident> {
  try {
    logger.performance.start('createIncident');
    logger.info('Creating incident', 'createIncident', { incident });

    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User must be authenticated to create an incident');
    }

    const slug = generateSlug(incident.type, incident.location_zone);
    const point = {
      type: 'Point',
      coordinates: [incident.location.coordinates[1], incident.location.coordinates[0]]
    };

    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents')
      .insert([{
        type: incident.type,
        description: incident.description,
        location: point,
        location_zone: incident.location_zone,
        severity: incident.severity,
        anonymous: incident.anonymous,
        verified: false,
        still_here_count: 0,
        no_longer_here_count: 0,
        reporter_id: session.session.user.id,
        created_at: new Date().toISOString(),
        slug
      }])
      .select()
      .single();

    if (incidentError || !incidentData) {
      logger.error(incidentError, 'createIncident');
      throw incidentError;
    }

    if (incident.media?.length) {
      const mediaPromises = incident.media.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${incidentData.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('incident-media')
          .upload(fileName, file);

        if (uploadError) {
          logger.error(uploadError, 'mediaUpload');
          throw uploadError;
        }

        const { data: mediaUrl } = supabase.storage
          .from('incident-media')
          .getPublicUrl(fileName);

        const { error: mediaError } = await supabase
          .from('incident_media')
          .insert([{
            incident_id: incidentData.id,
            url: mediaUrl.publicUrl,
            type: file.type.startsWith('image/') ? 'image' : 'video'
          }]);

        if (mediaError) {
          logger.error(mediaError, 'mediaRecord');
          throw mediaError;
        }
      });

      await Promise.all(mediaPromises);
    }

    const { data: finalIncident, error: fetchError } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_media (
          id,
          type,
          url
        )
      `)
      .eq('id', incidentData.id)
      .single();

    if (fetchError || !finalIncident) {
      logger.error(fetchError, 'fetchFinalIncident');
      throw fetchError;
    }

    logger.performance.end('createIncident');
    return finalIncident as Incident;
  } catch (error) {
    logger.error(error, 'createIncident');
    throw error;
  }
}

export async function updateIncidentPresence(
  id: string,
  type: 'still-here' | 'no-longer-here'
): Promise<void> {
  try {
    logger.performance.start('updateIncidentPresence');
    logger.info('Updating incident presence', 'updateIncidentPresence', { id, type });

    const column = type === 'still-here' ? 'still_here_count' : 'no_longer_here_count';
    
    const { data: currentIncident, error: fetchError } = await supabase
      .from('incidents')
      .select(column)
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error(fetchError, 'fetchCurrentCount');
      throw new Error(`Failed to fetch current count: ${fetchError.message}`);
    }

    const currentCount = currentIncident?.[column] || 0;
    
    const { error: updateError } = await supabase
      .from('incidents')
      .update({ [column]: currentCount + 1 })
      .eq('id', id);

    if (updateError) {
      logger.error(updateError, 'updatePresence');
      throw new Error(`Failed to update presence: ${updateError.message}`);
    }

    logger.performance.end('updateIncidentPresence');
  } catch (error) {
    logger.error(error, 'updateIncidentPresence');
    throw error;
  }
}

export async function fetchIncidentBySlug(slug: string): Promise<Incident | null> {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_media (
          id,
          type,
          url
        )
      `)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      incident_media: data.incident_media || []
    } as Incident;
  } catch (error) {
    logger.error(error, 'fetchIncidentBySlug');
    return null;
  }
}