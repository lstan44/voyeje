import type { IncidentCreate } from '../types';
import { slugify } from './string';

export function generateSlug(incident: IncidentCreate, id?: string): string {
  const parts = [
    'haiti',
    incident.location.zone,
    incident.type.toLowerCase().replace(/_/g, '-'),
    incident.severity.toLowerCase()
  ];

  if (id) {
    parts.push(id);
  }

  return slugify(parts.join('-'));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}