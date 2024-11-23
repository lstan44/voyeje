import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, defaultView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'signup'>(defaultView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithPassword, signInWithGoogle, signUp } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (view === 'login') {
        await signInWithPassword(email, password);
      } else {
        await signUp(email, password);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const toggleView = () => {
    setError(null);
    setEmail('');
    setPassword('');
    setView(view === 'login' ? 'signup' : 'login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 bg-white overflow-hidden">
        <div className="relative h-2">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600"
          />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-2xl font-bold">
              {view === 'login' ? t('auth.login.title') : t('auth.signup.title')}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 rounded-lg border border-gray-300 bg-gray-50 py-2.5 text-gray-900 placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500 focus:ring-1 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 rounded-lg border border-gray-300 bg-gray-50 py-2.5 text-gray-900 placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500 focus:ring-1 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {view === 'login' ? t('auth.login.submit') : t('auth.signup.submit')}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {t('auth.or')}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-2 py-2.5 rounded-lg font-medium"
            onClick={handleGoogleSignIn}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            {t('auth.continueWithGoogle')}
          </Button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleView}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {view === 'login' 
                ? t('auth.login.switchToSignup') 
                : t('auth.signup.switchToLogin')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}