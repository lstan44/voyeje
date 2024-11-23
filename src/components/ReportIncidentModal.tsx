import React, { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { IncidentCreate } from '../types';
import { logger } from '../lib/logger';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: IncidentCreate) => Promise<void>;
}

async function getLocationDetails(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&zoom=18&format=jsonv2`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'LakayAlert/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location details');
    }

    const data = await response.json();
    
    return data.address?.suburb || 
           data.address?.neighbourhood || 
           data.address?.city_district || 
           data.address?.city ||
           data.address?.town ||
           data.address?.municipality ||
           `${data.address?.state || 'Haiti'}`;
  } catch (error) {
    logger.error(error, 'geocoding');
    // Fallback to coordinates if service fails
    return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W`;
  }
}

export default function ReportIncidentModal({ isOpen, onClose, onSubmit }: ReportIncidentModalProps) {
  const { t } = useTranslation();
  const [location, setLocation] = useState<{ coordinates: [number, number]; zone: string } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    severity: '',
    media: [] as File[]
  });

  useEffect(() => {
    if (isOpen) {
      getLocation();
    }
  }, [isOpen]);

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError(t('incident.report.location.error'));
      return;
    }

    setIsLoadingLocation(true);
    setLocationError('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const locationZone = await getLocationDetails(latitude, longitude);

      setLocation({
        coordinates: [longitude, latitude],
        zone: locationZone
      });
    } catch (error) {
      logger.error(error, 'getLocation');
      setLocationError(t('incident.report.location.permission'));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      media: [...prev.media, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    setError('');

    try {
      const incidentData: IncidentCreate = {
        type: formData.type as IncidentCreate['type'],
        description: formData.description,
        severity: formData.severity as IncidentCreate['severity'],
        location: {
          type: "Point",
          coordinates: location.coordinates
        },
        location_zone: location.zone,
        anonymous: true, // Always anonymous
        media: formData.media
      };

      await onSubmit(incidentData);
      
      // Reset form
      setFormData({
        type: '',
        description: '',
        severity: '',
        media: []
      });
    } catch (err) {
      logger.error(err, 'submitReport');
      setError(err instanceof Error ? err.message : t('incident.report.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white h-[calc(100dvh-16px)] sm:h-auto mt-2 mb-2 mx-2 sm:m-auto overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4 sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {t('incident.report.title')}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pb-20 sm:pb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('incident.report.type.label')}
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="">{t('incident.report.type.placeholder')}</option>
              {Object.keys(t('incident.types', { returnObjects: true })).map(type => (
                <option key={type} value={type}>
                  {t(`incident.types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('incident.report.description.label')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              placeholder={t('incident.report.description.placeholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('incident.report.severity.label')}
            </label>
            <select
              required
              value={formData.severity}
              onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="">{t('incident.report.severity.placeholder')}</option>
              {Object.keys(t('incident.severity', { returnObjects: true })).map(severity => (
                <option key={severity} value={severity}>
                  {t(`incident.severity.${severity}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('incident.report.media.label')}
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="media-upload" className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500">
                    <span>{t('incident.report.media.upload')}</span>
                    <input
                      id="media-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {t('incident.report.media.types')}
                </p>
              </div>
            </div>
            {formData.media.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.media.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-500"
                    >
                      {t('incident.report.media.remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-500" />
            {isLoadingLocation ? (
              <div className="flex items-center text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('incident.report.location.detecting')}
              </div>
            ) : location ? (
              <span className="text-green-600">
                {t('incident.report.location.detected', { zone: location.zone })}
              </span>
            ) : (
              <span className="text-red-600">{locationError}</span>
            )}
          </div>

          <div className="text-sm text-gray-600 italic">
            {t('incident.report.alwaysAnonymous')}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t sm:relative sm:border-t-0 sm:p-0 sm:bg-transparent">
            <button
              type="submit"
              disabled={!location || isLoadingLocation || isSubmitting}
              className="w-full bg-red-600 text-white py-3 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('incident.report.submitting')}
                </div>
              ) : (
                t('incident.report.submit')
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}