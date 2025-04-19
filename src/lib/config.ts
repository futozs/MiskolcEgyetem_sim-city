import { siteConfig } from './site-config';

// Ez az export helyettesíti a régi konfig metódust
// Lásd: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Re-export the site configuration for backward compatibility
export { siteConfig as config }; 