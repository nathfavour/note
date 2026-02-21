import { APPWRITE_CONFIG } from "@/lib/appwrite/config";

export interface EcosystemApp {
  id: string;
  label: string;
  subdomain: string;
  type: 'app' | 'accounts' | 'support';
  icon: string;
  color: string;
  description: string;
}

export const NEXT_PUBLIC_DOMAIN = APPWRITE_CONFIG.SYSTEM.DOMAIN || 'kylrixnote.space';

export const ECOSYSTEM_APPS: EcosystemApp[] = [
  { id: 'note', label: 'Note', subdomain: 'app', type: 'app', icon: 'file-text', color: '#00F5FF', description: 'Cognitive extension and smart notes.' },
  { id: 'vault', label: 'Vault', subdomain: 'vault', type: 'app', icon: 'shield', color: '#8b5cf6', description: 'Secure vault and identity vault.' },
  { id: 'flow', label: 'Flow', subdomain: 'flow', type: 'app', icon: 'zap', color: '#10b981', description: 'Intelligent task orchestration.' },
  { id: 'connect', label: 'Connect', subdomain: 'connect', type: 'app', icon: 'waypoints', color: '#ec4899', description: 'Secure bridge for communication.' },
  { id: 'id', label: 'Identity', subdomain: 'id', type: 'accounts', icon: 'fingerprint', color: '#ef4444', description: 'Sovereign identity management.' },
];

export const DEFAULT_ECOSYSTEM_LOGO = '/logo/rall.svg';

export function getEcosystemUrl(subdomain: string) {
  if (!subdomain) {
    return '#';
  }
  return `https://${subdomain}.${NEXT_PUBLIC_DOMAIN}`;
}
