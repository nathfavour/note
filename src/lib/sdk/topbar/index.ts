import { KylrixApp, TOPBAR_LAYOUT, getAppTone } from '../design';

export type TopbarPanel = 'ecosystem' | 'profile' | 'search';

export interface TopbarSnippet {
  id: string;
  kind: string;
  title: string;
  description: string;
  href?: string | null;
  disabled?: boolean;
}

export interface TopbarAction extends TopbarSnippet {
  accent: string;
  terms: string[];
  onSelect: () => void;
}

export interface TopbarSurface {
  routeLabel: string;
  currentApp: KylrixApp;
  snippets: TopbarSnippet[];
  quickActions: TopbarAction[];
  searchTargets: TopbarAction[];
  layout: typeof TOPBAR_LAYOUT;
}

export interface TopbarNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'pro' | 'system' | 'suggestion' | 'connect';
  title: string;
  message?: string;
  app?: KylrixApp;
  duration?: number;
  majestic?: boolean;
  defaultExpanded?: boolean;
}

export interface ConnectTopbarIdentity {
  displayName: string;
  username?: string | null;
  profilePicId?: string | null;
  profilePreviewUrl?: string | null;
  walletConnected?: boolean;
}

export interface ConnectTopbarSurface extends TopbarSurface {
  identity: ConnectTopbarIdentity;
  searchPlaceholder: string;
  walletLabel: string;
  showConnectCta: boolean;
}

export function createTopbarAction(action: Omit<TopbarAction, 'accent'> & { app?: KylrixApp; accent?: string }): TopbarAction {
  const accent = action.accent || getAppTone(action.app || 'root').secondary;
  return {
    ...action,
    accent,
  };
}

export function createTopbarSurface(params: Omit<TopbarSurface, 'layout'>): TopbarSurface {
  return {
    ...params,
    layout: TOPBAR_LAYOUT,
  };
}

export function createConnectTopbarSurface(params: {
  routeLabel?: string;
  snippets?: TopbarSnippet[];
  identity: ConnectTopbarIdentity;
  searchPlaceholder?: string;
  walletLabel?: string;
  showConnectCta?: boolean;
}): ConnectTopbarSurface {
  return {
    routeLabel: params.routeLabel || 'Connect',
    currentApp: 'connect',
    snippets: params.snippets || [],
    quickActions: [],
    searchTargets: [],
    layout: TOPBAR_LAYOUT,
    identity: params.identity,
    searchPlaceholder: params.searchPlaceholder || 'Search notes, goals, moments, calls, people, apps',
    walletLabel: params.walletLabel || 'Wallet',
    showConnectCta: params.showConnectCta ?? !params.identity.walletConnected,
  };
}

export function topbarMatches(query: string, terms: string[]) {
  const normalized = query.trim().toLowerCase();
  return terms.some((term) => term.includes(normalized) || normalized.includes(term));
}
