import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, MapPin, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import type { Incident } from '../types';
import { updateIncidentPresence } from '../services/incidents';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '../lib/logger';

interface IncidentCardProps {
  incident: Incident;
}

export default function IncidentCard({ incident }: IncidentCardProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useTranslation();

  const renderMediaItem = (item: { type: string; url: string }, index: number) => {
    if (item.type === 'image') {
      return (
        <img 
          src={item.url} 
          alt={`${t(`incident.types.${incident.type}`)} - ${index + 1}`}
          className="w-full h-48 object-cover rounded-lg"
          loading="lazy"
        />
      );
    } else if (item.type === 'video') {
      return (
        <video 
          src={item.url} 
          controls 
          className="w-full h-48 object-cover rounded-lg"
          preload="metadata"
        >
          <track kind="captions" />
        </video>
      );
    }
    return null;
  };

  const handlePresenceUpdate = async (e: React.MouseEvent, type: 'still-here' | 'no-longer-here') => {
    e.preventDefault();
    if (isUpdating) return;

    try {
      logger.info('Updating incident presence', 'incident_presence', { id: incident.id, type });
      setIsUpdating(true);
      await updateIncidentPresence(incident.id, type);
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
    } catch (error) {
      logger.error(error, 'update_presence');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Link to={`/incident/${incident.slug}`}>
      <Card className="w-full max-w-md mx-auto overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-sm font-semibold">
              {t(`incident.types.${incident.type}`)}
            </Badge>
            <Badge 
              variant={incident.severity === 'CRITICAL' ? 'destructive' : 'secondary'} 
              className="text-sm"
            >
              {t(`incident.severity.${incident.severity}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {incident.incident_media && incident.incident_media.length > 0 && (
            <div className="relative mb-4">
              <Carousel>
                <CarouselContent>
                  {incident.incident_media.map((item, index) => (
                    <CarouselItem key={item.id}>
                      {renderMediaItem(item, index)}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {incident.incident_media.length > 1 && (
                  <>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                  </>
                )}
              </Carousel>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{incident.location_zone}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>{format(new Date(incident.created_at), 'PPp')}</span>
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              className={`gap-2 ${incident.still_here_count > incident.no_longer_here_count ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300' : ''}`}
              onClick={(e) => handlePresenceUpdate(e, 'still-here')}
              disabled={isUpdating}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="whitespace-nowrap">Still here ({incident.still_here_count})</span>
            </Button>
            <Button
              variant="outline"
              className={`gap-2 ${incident.no_longer_here_count > incident.still_here_count ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300' : ''}`}
              onClick={(e) => handlePresenceUpdate(e, 'no-longer-here')}
              disabled={isUpdating}
            >
              <XCircle className="w-4 h-4" />
              <span className="whitespace-nowrap">No longer here ({incident.no_longer_here_count})</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}