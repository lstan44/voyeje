import React, { useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  AlertTriangle, 
  ChevronLeft, 
  CheckCircle2,
  XCircle,
  MapPin, 
  Clock, 
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Map
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { Incident } from '../types';
import { updateIncidentPresence } from '../services/incidents';
import { useQueryClient } from '@tanstack/react-query';
import { LocationContext } from '../App';

interface IncidentDetailProps {
  incidents: Incident[];
}

export default function IncidentDetail({ incidents }: IncidentDetailProps) {
  const { slug } = useParams<{ slug: string }>();
  const incident = incidents.find(inc => inc.slug === slug);
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ type: string; url: string } | null>(null);
  const { setMapView } = useContext(LocationContext);
  const navigate = useNavigate();

  const handlePresenceUpdate = async (type: 'still-here' | 'no-longer-here') => {
    if (!incident || isUpdating) return;

    try {
      setIsUpdating(true);
      await updateIncidentPresence(incident.id, type);
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
    } catch (error) {
      console.error('Error updating presence:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShowOnMap = () => {
    if (incident?.location) {
      setMapView(incident.location);
      navigate('/');
    }
  };

  if (!incident || !incident.location) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Incident Not Found</h2>
            <Link to="/" className="text-red-600 hover:text-red-700 font-medium">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityVariant = (severity: Incident['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'destructive';
      case 'MODERATE': return 'secondary';
      case 'LOW': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="inline-flex items-center text-red-600 hover:text-red-700">
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Incidents
          </Link>
          <Button
            variant="outline"
            onClick={handleShowOnMap}
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            Show on Map
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h1 className="text-2xl font-bold">
                        {incident.type.replace('_', ' ')}
                      </h1>
                      <Badge variant={getSeverityVariant(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <Clock className="h-5 w-5 mr-2" />
                      <span>{format(new Date(incident.created_at), 'PPP p')}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{incident.location.zone}</span>
                    </div>
                  </div>
                </div>

                {incident.incident_media && incident.incident_media.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {incident.incident_media.map((media, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 0.98 }}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setSelectedMedia(media)}
                      >
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt={`Incident media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {incident.description && (
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-6">
                    {incident.description}
                  </p>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className={`gap-2 ${incident.still_here_count > incident.no_longer_here_count ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                      onClick={() => handlePresenceUpdate('still-here')}
                      disabled={isUpdating}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Still here ({incident.still_here_count})</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className={`gap-2 ${incident.no_longer_here_count > incident.still_here_count ? 'bg-red-100 text-red-700 border-red-300' : ''}`}
                      onClick={() => handlePresenceUpdate('no-longer-here')}
                      disabled={isUpdating}
                    >
                      <XCircle className="w-5 h-5" />
                      <span>No longer here ({incident.no_longer_here_count})</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </motion.div>

        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <DialogHeader>
              <DialogTitle className="sr-only">Media Preview</DialogTitle>
            </DialogHeader>
            <div className="relative h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-50"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
                wheel={{ step: 0.1 }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
                      <Button variant="secondary" size="icon" onClick={() => zoomIn()}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" size="icon" onClick={() => zoomOut()}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" size="icon" onClick={() => resetTransform()}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <TransformComponent>
                      {selectedMedia?.type === 'image' ? (
                        <img
                          src={selectedMedia.url}
                          alt="Expanded view"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <video
                          src={selectedMedia?.url}
                          controls
                          className="w-full h-full object-contain"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}