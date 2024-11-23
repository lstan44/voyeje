import { Helmet } from 'react-helmet-async';
import type { Incident } from '../types';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface SEOMetaProps {
  incident: Incident;
}

export default function SEOMeta({ incident }: SEOMetaProps) {
  const { t } = useTranslation();
  const location = useLocation();
  
  const baseUrl = import.meta.env.VITE_SITE_URL;
  const canonicalUrl = `${baseUrl}${location.pathname}`;
  
  const title = `${t(`incident.types.${incident.type}`)} - ${incident.location_zone}`;
  const description = incident.description || 
    `${t(`incident.types.${incident.type}`)} reported in ${incident.location_zone}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonicalUrl} />
      {incident.incident_media?.[0]?.type === 'image' && (
        <meta property="og:image" content={incident.incident_media[0].url} />
      )}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* Schema.org markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": title,
          "description": description,
          "datePublished": incident.created_at,
          "dateModified": incident.created_at,
          "location": {
            "@type": "Place",
            "name": incident.location_zone,
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": incident.location.coordinates[1],
              "longitude": incident.location.coordinates[0]
            }
          }
        })}
      </script>
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}
