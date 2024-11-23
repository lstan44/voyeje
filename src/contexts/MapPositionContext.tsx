import React, { createContext, useContext, useState } from 'react';

interface MapPosition {
  center: [number, number];
  zoom: number;
}

interface MapContextType {
  lastPosition: MapPosition | null;
  setLastPosition: (position: MapPosition) => void;
}

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [lastPosition, setLastPosition] = useState<MapPosition | null>(null);

  return (
    <MapContext.Provider value={{ lastPosition, setLastPosition }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapPosition() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapPosition must be used within a MapProvider');
  }
  return context;
}
