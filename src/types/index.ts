export interface Incident {
  id: string;
  type: 'GANG_ACTIVITY' | 'SEXUAL_VIOLENCE' | 'CIVIL_UNREST' | 'KIDNAPPING' | 'ROBBERY' | 'NATURAL_DISASTER' | 'ROAD_CLOSURE';
  description?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  location_zone: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  verified: boolean;
  still_here_count: number;
  no_longer_here_count: number;
  reporter_id: string;
  anonymous: boolean;
  created_at: string;
  slug: string;
  incident_media?: {
    id: string;
    url: string;
    type: 'image' | 'video';
  }[];
}

export interface IncidentCreate {
  type: Incident['type'];
  description?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  location_zone: string;
  severity: Incident['severity'];
  anonymous: boolean;
  media?: File[];
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
}