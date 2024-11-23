import { slugify } from './string';

export function generateSlug(type: string, location: string): string {
  const timestamp = new Date().getTime();
  const baseSlug = `haiti-${slugify(type)}-${slugify(location)}`;
  return `${baseSlug}-${timestamp}`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}