import React from 'react';
import { Shield, Menu, Globe, LogOut, Lock, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback } from './ui/avatar';

interface HeaderProps {
  onAuthRequired: () => void;
}

export default function Header({ onAuthRequired }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { profile, signOut, user } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ht' : 'en';
    i18n.changeLanguage(newLang);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthClick = () => {
    setIsMenuOpen(false);
    onAuthRequired();
  };

  return (
    <>
      <header className="bg-red-700 text-white h-16 fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-4">
          <div className="flex justify-between items-center h-full">
            <Link to="/" className="flex items-center">
              <Shield className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold">{t('app.name')}</span>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-red-600"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {t('menu.title')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {/* User Profile Section */}
            {profile ? (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">{profile.username}</div>
                    <div className="text-sm text-gray-500">{t('menu.anonymousUser')}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <LogIn className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <Button
                      variant="default"
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={handleAuthClick}
                    >
                      {t('auth.login.title')}
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('auth.menuPrompt')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Message */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-3">
                <Lock className="h-5 w-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {t('menu.privacy.title')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('menu.privacy.message')}
                  </p>
                </div>
              </div>
            </div>

            {/* Language Switcher */}
            <div 
              onClick={toggleLanguage}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors mb-4"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-base font-medium text-gray-900">
                    {t('language.switch')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {t(`language.${i18n.language}`)}
                  </span>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className="font-medium bg-white border-gray-200"
              >
                {t(`language.${i18n.language === 'en' ? 'ht' : 'en'}`)}
              </Badge>
            </div>

            {/* Sign Out Button */}
            {user && (
              <Button
                variant="outline"
                className="w-full gap-2 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                {t('menu.signOut')}
              </Button>
            )}

            {/* App Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col items-center text-center space-y-2">
                <Shield className="h-8 w-8 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('app.name')}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('app.version', { version: '1.0.0' })}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}