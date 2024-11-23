import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  X, 
  Volume2, 
  VolumeX, 
  Share2, 
  CheckCircle2, 
  XCircle,
  MapPin,
  Link2,
  Facebook,
  Twitter,
  MessageCircle,
  Mail,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import type { Incident } from '../types';
import { updateIncidentPresence } from '../services/incidents';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from './ui/use-toast';
import { useMapPosition } from '../contexts/MapPositionContext';
import { fetchIncidentBySlug } from '../services/incidents';
import SEOMeta from './SEOMeta';
import Header from './Header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EventCategories, EventActions } from '../lib/analytics';
import { trackEvent, trackException } from '../lib/analytics';

interface IncidentPageProps {
  incident?: Incident;
  onBack: () => void;
}

export default function IncidentPage({ incident, onBack }: IncidentPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedMedia, setSelectedMedia] = useState<{ type: string; url: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const { lastPosition } = useMapPosition();
  const [hasCopied, setHasCopied] = useState(false);
  
  // Pre-fetch incident data
  const { slug } = useParams();
  const { data: fetchedIncident, isLoading } = useQuery({
    queryKey: ['incident', slug],
    queryFn: () => fetchIncidentBySlug(slug!),
    enabled: !incident && !!slug,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const currentIncident = incident || fetchedIncident;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentIncident) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 pt-16">
        <div className="sticky top-16 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b px-4 py-3">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 -ml-3"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('nav.back')}
          </Button>
        </div>
        <div className="p-4 text-center">
          <h1 className="text-lg font-semibold">{t('incident.notFound')}</h1>
        </div>
      </div>
    );
  }

  const handlePresenceUpdate = async (type: 'still-here' | 'no-longer-here') => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      await updateIncidentPresence(currentIncident.id, type);
      
      trackEvent(
        EventCategories.Incident,
        EventActions.UpdatePresence,
        type,
        currentIncident.id
      );

      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
    } catch (error) {
      trackException(
        `Failed to update presence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const shareData = {
    title: t(`incident.types.${currentIncident.type}`),
    text: currentIncident.description || t(`incident.types.${currentIncident.type}`),
    url: `${window.location.origin}/incident/${currentIncident.slug}`,
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share(shareData);
      toast({
        title: t('incident.share.success'),
        description: t('incident.share.shared'),
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: t('incident.share.error'),
          description: t('incident.share.tryAgain'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setHasCopied(true);
      toast({
        title: t('incident.share.success'),
        description: t('incident.share.copied'),
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      toast({
        title: t('incident.share.error'),
        description: t('incident.share.copyFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedText = encodeURIComponent(shareData.text);
    const encodedTitle = encodeURIComponent(shareData.title);

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      sms: `sms:?body=${encodedText} ${encodedUrl}`,
    };

    trackEvent(
      EventCategories.Incident,
      EventActions.Share,
      platform,
    );

    const url = shareUrls[platform as keyof typeof shareUrls];
    if (!url) return;

    // Open in a new window with specific dimensions
    const width = 550;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    if (platform === 'email' || platform === 'sms') {
      window.location.href = url;
    } else {
      window.open(
        url,
        'share',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );
    }
  };

  const handleBack = () => {
    navigate('/', {
      state: {
        returnFromIncident: true,
        mapPosition: lastPosition
      }
    });
  };

  return (
    <>
      <SEOMeta incident={currentIncident} />
      
      {/* Fixed Header */}
      <Header onAuthRequired={() => {}} />

      {/* Main Content - starts below header */}
      <main className="pt-16"> {/* Add padding to start below fixed header */}
        {/* Back Navigation Bar */}
        <div className="bg-white border-b px-4 py-3">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 -ml-3"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('nav.back')}
          </Button>
        </div>

        {/* Incident Content */}
        <div className="bg-gray-50 min-h-[calc(100vh-8rem)]"> {/* Adjust height to account for header + nav */}
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-start gap-3 mb-6">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="bg-red-100 text-red-600">
                  {currentIncident.anonymous ? 'AN' : 'LA'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge 
                    variant={currentIncident.severity === 'CRITICAL' ? 'destructive' : 'secondary'}
                    className="font-medium"
                  >
                    {t(`incident.severity.${currentIncident.severity}`)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {format(new Date(currentIncident.created_at), 'PPp')}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t(`incident.types.${currentIncident.type}`)}
                </h2>
                <div className="flex items-center text-gray-500 text-sm">
                  <MapPin className="h-4 w-4 mr-1 shrink-0" />
                  <span className="truncate">{currentIncident.location_zone}</span>
                </div>
              </div>
            </div>

            {currentIncident.description && (
              <p className="text-gray-700 text-base leading-relaxed mb-6 whitespace-pre-wrap">
                {currentIncident.description}
              </p>
            )}

            {currentIncident.incident_media && currentIncident.incident_media.length > 0 && (
              <ScrollArea className="w-full mb-6">
                <div className="flex gap-2 pb-4">
                  {currentIncident.incident_media.map((item, index) => (
                    <motion.div
                      key={index}
                      className="relative shrink-0 cursor-pointer first:ml-0 last:mr-0"
                      whileHover={{ scale: 0.98 }}
                      onClick={() => setSelectedMedia(item)}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={`Incident media ${index + 1}`}
                          className="h-[280px] w-auto rounded-lg object-cover"
                        />
                      ) : (
                        <div className="relative h-[280px] w-auto">
                          <video
                            src={item.url}
                            className="h-full w-auto rounded-lg object-cover"
                            muted={isMuted}
                            autoPlay
                            loop
                          />
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsMuted(!isMuted);
                            }}
                          >
                            {isMuted ? (
                              <VolumeX className="h-4 w-4 text-white" />
                            ) : (
                              <Volume2 className="h-4 w-4 text-white" />
                            )}
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t">
              <div className="grid grid-cols-2 gap-2 flex-1">
                <Button
                  variant="outline"
                  className={`gap-2 h-auto py-3 ${
                    currentIncident.still_here_count > currentIncident.no_longer_here_count
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
                      : ''
                  }`}
                  onClick={() => handlePresenceUpdate('still-here')}
                  disabled={isUpdating}
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">Still here</span>
                    <span className="text-xs opacity-90">({currentIncident.still_here_count})</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className={`gap-2 h-auto py-3 ${
                    currentIncident.no_longer_here_count > currentIncident.still_here_count
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
                      : ''
                  }`}
                  onClick={() => handlePresenceUpdate('no-longer-here')}
                  disabled={isUpdating}
                >
                  <XCircle className="h-5 w-5 shrink-0" />
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">No longer here</span>
                    <span className="text-xs opacity-90">({currentIncident.no_longer_here_count})</span>
                  </div>
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="sm:w-auto w-full gap-2"
                    aria-label="Share incident"
                  >
                    <Share2 className="h-5 w-5" aria-hidden="true" />
                    <span>Share</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {navigator.share && (
                    <DropdownMenuItem 
                      onClick={handleNativeShare}
                      role="button"
                      aria-label="Share using device options"
                    >
                      <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      <span>Share using device options</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => handleSocialShare('facebook')}
                    role="button"
                  >
                    <Facebook className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Share on Facebook</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSocialShare('whatsapp')}
                    role="button"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Share on WhatsApp</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSocialShare('twitter')}
                    role="button"
                  >
                    <Twitter className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Share on X</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSocialShare('email')}
                    role="button"
                  >
                    <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Share by email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleSocialShare('sms')}
                    role="button"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Share by SMS</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleCopyLink}
                    role="button"
                  >
                    {hasCopied ? (
                      <Check className="h-4 w-4 mr-2 text-green-600" aria-hidden="true" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    <span>{hasCopied ? 'Link copied' : 'Copy link'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Media View */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          >
            <div className="fixed inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-4 z-50 text-white hover:bg-white/20"
                onClick={() => setSelectedMedia(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="w-full h-full flex items-center justify-center p-4">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt="Expanded view"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-w-full max-h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}