import ReactGA from 'react-ga4';
import * as Sentry from "@sentry/react";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID;

if (!GA_MEASUREMENT_ID) {
  console.warn('Google Analytics Measurement ID is missing');
}

// Initialize GA4
export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    try {
      ReactGA.initialize(GA_MEASUREMENT_ID, {
        testMode: import.meta.env.MODE !== 'production',
        debug: import.meta.env.MODE !== 'production'
      });
      return true;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: 'analytics',
          action: 'initialize'
        }
      });
      return false;
    }
  }
  return false;
};

// Track pageview
export const trackPageview = (path: string) => {
  try {
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: 'pageview', page: path });
    }
  } catch (error) {
    console.error('Failed to track pageview:', error);
  }
};

// Custom event tracking
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number,
  nonInteraction?: boolean,
  transport?: 'beacon' | 'xhr' | 'image'
) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
      nonInteraction,
      transport
    });
  }
};

// User Properties
export const setUserProperties = (properties: { [key: string]: any }) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.set(properties);
  }
};

// Custom Dimensions
export const setCustomDimension = (dimensionIndex: number, value: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.set({ [`dimension${dimensionIndex}`]: value });
  }
};

// Track Exceptions
export const trackException = (description: string, fatal: boolean = false) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.exception({
      description,
      fatal
    });
  }
};

// Track User Timing
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.timing({
      category,
      variable,
      value,
      label
    });
  }
};

// Predefined event categories
export const EventCategories = {
  Auth: 'Authentication',
  Incident: 'Incident',
  Map: 'Map',
  Navigation: 'Navigation',
  UserInteraction: 'User Interaction',
  Error: 'Error',
  Performance: 'Performance'
} as const;

// Predefined event actions
export const EventActions = {
  // Auth events
  SignUp: 'Sign Up',
  SignIn: 'Sign In',
  SignOut: 'Sign Out',
  GoogleSignIn: 'Google Sign In',
  
  // Incident events
  Create: 'Create Incident',
  View: 'View Incident',
  Share: 'Share Incident',
  UpdatePresence: 'Update Presence',
  AddMedia: 'Add Media',
  
  // Map events
  Pan: 'Pan Map',
  Zoom: 'Zoom Map',
  ClickMarker: 'Click Marker',
  
  // Navigation events
  ChangeView: 'Change View',
  ChangeLanguage: 'Change Language',
  
  // Error events
  ApiError: 'API Error',
  AuthError: 'Auth Error',
  LocationError: 'Location Error',
  
  // Performance events
  LoadTime: 'Load Time',
  ApiLatency: 'API Latency'
} as const;