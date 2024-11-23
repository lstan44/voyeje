import { supabase } from '../lib/supabase';
import fs from 'fs/promises';
import path from 'path';

async function generateSitemap() {
  // Fetch all incident slugs
  const { data: incidents } = await supabase
    .from('incidents')
    .select('slug, created_at')
    .order('created_at', { ascending: false });

  const baseUrl = process.env.SITE_URL || 'https://yourdomain.com';
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}/</loc>
        <changefreq>hourly</changefreq>
        <priority>1.0</priority>
      </url>
      ${(incidents || [])
        .map(incident => `
          <url>
            <loc>${baseUrl}/incident/${incident.slug}</loc>
            <lastmod>${new Date(incident.created_at).toISOString()}</lastmod>
            <changefreq>daily</changefreq>
            <priority>0.8</priority>
          </url>
        `)
        .join('')}
    </urlset>`;

  return xml;
}

async function main() {
  try {
    const sitemap = await generateSitemap();
    await fs.writeFile(
      path.join(process.cwd(), 'public', 'sitemap.xml'),
      sitemap
    );
    console.log('✅ Sitemap generated successfully');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

main();
