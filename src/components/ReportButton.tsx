import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface ReportButtonProps {
  onClick: () => void;
  onAuthRequired: () => void;
}

export default function ReportButton({ onClick, onAuthRequired }: ReportButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleClick = () => {
    if (user) {
      onClick();
    } else {
      onAuthRequired();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-full px-6 py-3 shadow-lg flex items-center space-x-2 transition-colors ${
        user
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <AlertCircle className="h-5 w-5" />
      <span className="font-medium">
        {user ? t('incident.report.button') : t('auth.loginToReport')}
      </span>
    </button>
  );
}