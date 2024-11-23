import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error.auth(error, 'auth_callback');
          throw error;
        }

        if (!session) {
          logger.warn('No session found in callback');
          throw new Error('No session found');
        }

        // Ensure session is fresh
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          logger.error.auth(refreshError, 'refresh_session');
          throw refreshError;
        }

        // Log successful auth
        logger.auth.sessionChange(session);

        // Return to home
        navigate('/', { 
          replace: true,
          state: { from: 'auth' }
        });
      } catch (error) {
        logger.error.auth(error, 'auth_callback_failed');
        navigate('/auth/error', { 
          replace: true,
          state: { error: 'Authentication failed. Please try again.' }
        });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}