import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Incident } from '../types';
import 'leaflet/dist/leaflet.css';
import { useMapBounds as _useMapBounds } from '../hooks/useMapBounds';
import { Target } from 'lucide-react';
import { Button } from './ui/button';
import { useMapPosition } from '../contexts/MapPositionContext';

// Component to handle initial map view updates only
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const hasSetInitialView = useRef(false);
  
  useEffect(() => {
    if (!hasSetInitialView.current) {
      map.setView(center, zoom);
      hasSetInitialView.current = true;
    }
  }, [map, center, zoom]);

  return null;
}

interface IncidentMapProps {
  incidents: Incident[];
  userLocation: { lat: number; lng: number } | null;
  focusLocation?: { lat: number; lng: number } | null;
  zoom?: number;
}

interface BoundsUpdaterProps {
  updateBounds: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

function BoundsUpdater({ updateBounds }: BoundsUpdaterProps) {
  const { setLastPosition } = useMapPosition();
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Store last position
      setLastPosition({
        center: [center.lat, center.lng],
        zoom,
      });
      
      updateBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Store last position
      setLastPosition({
        center: [center.lat, center.lng],
        zoom,
      });
      
      updateBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
  });

  return null;
}

export default function IncidentMap({ 
  incidents, 
  userLocation,
  focusLocation,
  zoom = 18
}: IncidentMapProps) {
  const location = useLocation();
  const returnPosition = location.state?.mapPosition;
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(null);
  const { updateBounds } = _useMapBounds();
  const [map, setMap] = useState<L.Map | null>(null);
  const { lastPosition } = useMapPosition();
  
  const defaultCenter: [number, number] = [18.9712, -72.2852];
  const center: [number, number] = returnPosition?.center || 
    lastPosition?.center || 
    (focusLocation && focusLocation.lat && focusLocation.lng
      ? [focusLocation.lat, focusLocation.lng]
      : userLocation && userLocation.lat && userLocation.lng
        ? [userLocation.lat, userLocation.lng]
        : defaultCenter);
  
  const initialZoom = returnPosition?.zoom || lastPosition?.zoom || zoom;
  
  const MapController = () => {
    const mapInstance = useMap();
    
    useEffect(() => {
      setMap(mapInstance);
      return () => {
        setMap(null);
      };
    }, [mapInstance]);
    
    return null;
  };
  
  const customIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const hoveredIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [30, 49],
    iconAnchor: [15, 49],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const userLocationIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'user-location-marker'
  });

  const handleMarkerClick = (slug: string) => {
    navigate(`/incident/${slug}`);
  };

  const validIncidents = incidents.filter(incident => 
    incident.location && 
    incident.location.coordinates && 
    incident.location.coordinates.length === 2 &&
    !isNaN(incident.location.coordinates[1]) && 
    !isNaN(incident.location.coordinates[0])
  );

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={initialZoom}
        className="h-full w-full"
        zoomControl={false}
        minZoom={12}
        maxZoom={18}
        bounceAtZoomLimits={true}
      >
        <ZoomControl position="bottomleft" className="ml-4 mb-4" />
        <MapController />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={initialZoom} />
        <BoundsUpdater updateBounds={updateBounds} />
        
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>{t('incident.details.yourLocation')}</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {validIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.location.coordinates[1], incident.location.coordinates[0]]}
            icon={hoveredIncidentId === incident.id ? hoveredIcon : customIcon}
            eventHandlers={{
              click: () => handleMarkerClick(incident.slug),
              mouseover: () => setHoveredIncidentId(incident.id),
              mouseout: () => setHoveredIncidentId(null)
            }}
          >
            <Popup>
              <div 
                className="p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleMarkerClick(incident.slug)}
              >
                <h3 className="font-semibold text-lg">
                  {t(`incident.types.${incident.type}`)}
                </h3>
                <p className="text-sm text-gray-600">{incident.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  {incident.location_zone}
                </div>
                <div className="mt-2 text-sm text-red-600 hover:text-red-700">
                  {t('incident.details.clickToView')}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && map && (
          <div className="absolute bottom-24 left-0 z-[1000] recenter-button">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-lg shadow-lg bg-white hover:bg-gray-100"
              onClick={() => {
                if (map) {
                  map.setView(
                    [userLocation.lat, userLocation.lng],
                    initialZoom,
                    { animate: true }
                  );
                }
              }}
            >
              <Target className="h-4 w-4" />
            </Button>
          </div>
        )}
      </MapContainer>
    </div>
  );
}