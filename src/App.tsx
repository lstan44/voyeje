import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Header from './components/Header';
import IncidentDashboard from './components/IncidentDashboard';
import IncidentPage from './components/IncidentPage';
import { fetchIncidents } from './services/incidents';
import { ToastProvider } from './components/ui/use-toast';
import { AuthProvider } from './contexts/AuthContext';
import AuthCallback from './routes/auth/callback';
import { initGA, trackPageview, trackException, trackTiming } from './lib/analytics';
import { MapProvider } from './contexts/MapPositionContext';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import * as Sentry from "@sentry/react";
import { logger } from './lib/logger';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchInterval: 1000 * 30,
      retry: 1,
      networkMode: 'online',
    },
  },
});

interface LocationContextType {
  userLocation: { lat: number; lng: number } | null;
  setMapView: (location: { lat: number; lng: number }) => void;
}

export const LocationContext = React.createContext<LocationContextType>({
  userLocation: null,
  setMapView: () => {},
});

// Analytics wrapper component
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      initGA();
    } catch (error) {
      setHasError(true);
      console.error('Failed to initialize analytics:', error);
    }
  }, []);

  // If analytics fails, still render the app
  if (hasError) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isInitialLocationSet, setIsInitialLocationSet] = useState(false);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents', userLocation],
    queryFn: () => fetchIncidents(userLocation),
    onError: (error) => {
      logger.error(error, 'incidents.fetch', {
        extra: { userLocation }
      });
      trackException('Error fetching incidents: ' + (error instanceof Error ? error.message : String(error)));
    },
  });

  useEffect(() => {
    const getUserLocation = () => {
      if (!navigator.geolocation) {
        const defaultLocation = { lat: 18.9712, lng: -72.2852 }; // Default to Haiti
        setUserLocation(defaultLocation);
        if (!isInitialLocationSet) {
          navigate('/', { state: { focusLocation: defaultLocation } });
          setIsInitialLocationSet(true);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          
          if (!isInitialLocationSet) {
            navigate('/', { state: { focusLocation: newLocation } });
            setIsInitialLocationSet(true);
          }
        },
        (error) => {
          const defaultLocation = { lat: 18.9712, lng: -72.2852 }; // Default to Haiti
          setUserLocation(defaultLocation);
          if (!isInitialLocationSet) {
            navigate('/', { state: { focusLocation: defaultLocation } });
            setIsInitialLocationSet(true);
          }
          Sentry.captureException(error, {
            tags: {
              feature: 'geolocation',
              action: 'getCurrentPosition'
            },
            extra: {
              errorCode: error.code,
              errorMessage: error.message
            }
          });
        },
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    };

    getUserLocation();
  }, []);

  const setMapView = (location: { lat: number; lng: number }) => {
    navigate('/', { state: { focusLocation: location } });
  };

  return (
    <LocationContext.Provider value={{ userLocation, setMapView }}>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route
            path="/"
            element={
              <IncidentDashboard
                incidents={incidents}
                isLoading={isLoading}
                userLocation={userLocation}
              />
            }
          />
          <Route
            path="/incident/:slug"
            element={
              <IncidentPage
                incident={incidents.find(inc => inc.slug === window.location.pathname.split('/').pop())}
                onBack={() => navigate('/')}
              />
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </div>
    </LocationContext.Provider>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MapProvider>
            <ToastProvider>
              <Router>
                <ErrorBoundary>
                  <AnalyticsWrapper>
                    <AppContent />
                  </AnalyticsWrapper>
                </ErrorBoundary>
              </Router>
            </ToastProvider>
          </MapProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}