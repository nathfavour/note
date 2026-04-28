"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/ui/AuthContext';

export type PotatoSnippetKind = 'note' | 'tag' | 'shared' | 'extension' | 'settings' | 'context';

export type PotatoSnippet = {
  id: string;
  kind: PotatoSnippetKind;
  title: string;
  description: string;
  href?: string | null;
  disabled?: boolean;
};

export type PotatoAction = PotatoSnippet & {
  accent: string;
  terms: string[];
  onSelect: () => void;
};

type PotatoSurface = {
  routeLabel: string;
  currentApp: 'note';
  snippets: PotatoSnippet[];
  quickActions: PotatoAction[];
  searchTargets: PotatoAction[];
};

type PotatoContextType = {
  routeLabel: string;
  currentApp: 'note';
  snippets: PotatoSnippet[];
  pushSnippet: (snippet: Omit<PotatoSnippet, 'id'>) => string;
  clearSnippets: () => void;
  buildSearchSurface: (query: string) => PotatoSurface;
};

const PotatoContext = createContext<PotatoContextType | undefined>(undefined);

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function routeLabelFromPath(pathname: string | null) {
  if (!pathname) return 'Note';
  if (pathname === '/' || pathname === '/landing') return 'Landing';
  if (pathname === '/notes') return 'Notes';
  if (pathname.startsWith('/notes/')) return 'Note';
  if (pathname === '/shared' || pathname.startsWith('/shared/')) return 'Shared';
  if (pathname === '/tags') return 'Tags';
  if (pathname === '/extensions') return 'Extensions';
  if (pathname === '/settings') return 'Settings';
  if (pathname === '/pitch') return 'Pitch';
  if (pathname === '/popout') return 'Popout';
  return 'Note';
}

function routeSnippets(pathname: string | null, user: any | null): PotatoSnippet[] {
  const name = user?.name || user?.email || 'your notes';
  if (!pathname) {
    return [
      {
        id: 'note-default',
        kind: 'context',
        title: 'Note is ready',
        description: 'Search notes, tags, shared links, and extensions from one place.',
      },
    ];
  }

  if (pathname === '/notes') {
    return [
      {
        id: 'notes-current',
        kind: 'note',
        title: 'Active notebook',
        description: 'Capture a new note or continue your latest draft.',
      },
      {
        id: 'notes-personal',
        kind: 'context',
        title: name,
        description: 'Your private workspace and note graph.',
      },
    ];
  }

  if (pathname.startsWith('/notes/')) {
    return [
      {
        id: 'note-editor',
        kind: 'note',
        title: 'Editor context',
        description: 'Use the current note as a source for search, tags, or sharing.',
      },
      {
        id: 'note-share',
        kind: 'shared',
        title: 'Sharing context',
        description: 'Jump to public links or shared copies of this note.',
      },
    ];
  }

  if (pathname === '/shared' || pathname.startsWith('/shared/')) {
    return [
      {
        id: 'shared-vault',
        kind: 'shared',
        title: 'Shared notes',
        description: 'Review notes shared with you and your public notes.',
      },
      {
        id: 'shared-author',
        kind: 'context',
        title: name,
        description: 'Share from your current identity without losing context.',
      },
    ];
  }

  if (pathname === '/tags') {
    return [
      {
        id: 'tags-organize',
        kind: 'tag',
        title: 'Tag organization',
        description: 'Organize notes by tags, colors, and relevance.',
      },
      {
        id: 'tags-search',
        kind: 'context',
        title: 'Tag search',
        description: 'Find notes by label, topic, or theme.',
      },
    ];
  }

  if (pathname === '/extensions') {
    return [
      {
        id: 'extensions-ai',
        kind: 'extension',
        title: 'Extensions workspace',
        description: 'Automate revisions, extraction, and safety checks.',
      },
      {
        id: 'extensions-graph',
        kind: 'context',
        title: 'Note graph',
        description: 'Wire notes into richer workflows without leaving Note.',
      },
    ];
  }

  if (pathname === '/settings') {
    return [
      {
        id: 'settings-security',
        kind: 'settings',
        title: 'Security settings',
        description: 'Adjust encryption, access, and account preferences.',
      },
      {
        id: 'settings-identity',
        kind: 'context',
        title: 'Identity context',
        description: 'Keep your profile preview and search identity up to date.',
      },
    ];
  }

  return [
    {
      id: 'note-default',
      kind: 'context',
      title: 'Note context',
      description: 'Search notes, tags, shared links, and extensions from one place.',
    },
  ];
}

function matchesTerms(query: string, terms: string[]) {
  return terms.some((term) => term.includes(query) || query.includes(term));
}

function buildSurface(query: string, routeLabel: string, snippets: PotatoSnippet[]): PotatoSurface {
  const normalized = normalizeQuery(query);

  const quickActions: PotatoAction[] = [
    {
      id: 'draft-note',
      kind: 'note',
      title: 'Draft a note',
      description: 'Capture a new thought immediately.',
      href: '/notes?mode=compose',
      accent: '#EC4899',
      terms: ['note', 'draft', 'write', 'capture', 'compose'],
      onSelect: () => window.location.assign('/notes?mode=compose'),
    },
    {
      id: 'open-notes',
      kind: 'note',
      title: 'Open notes',
      description: 'Jump back into the notes index.',
      href: '/notes',
      accent: '#EC4899',
      terms: ['notes', 'notebook', 'library', 'home'],
      onSelect: () => window.location.assign('/notes'),
    },
    {
      id: 'shared-notes',
      kind: 'shared',
      title: 'Shared notes',
      description: 'Review public and shared note surfaces.',
      href: '/shared',
      accent: '#F59E0B',
      terms: ['shared', 'public', 'links', 'collab'],
      onSelect: () => window.location.assign('/shared'),
    },
    {
      id: 'manage-tags',
      kind: 'tag',
      title: 'Manage tags',
      description: 'Organize your knowledge graph by tags.',
      href: '/tags',
      accent: '#A855F7',
      terms: ['tag', 'tags', 'organize', 'label'],
      onSelect: () => window.location.assign('/tags'),
    },
    {
      id: 'open-extensions',
      kind: 'extension',
      title: 'Open extensions',
      description: 'Apply note automation and revision tools.',
      href: '/extensions',
      accent: '#10B981',
      terms: ['extension', 'extensions', 'automation', 'ai'],
      onSelect: () => window.location.assign('/extensions'),
    },
  ];

  const searchTargets: PotatoAction[] = [
    {
      id: 'search-notes',
      kind: 'note',
      title: 'Search notes',
      description: 'Search across your notes library.',
      href: `/notes?search=${encodeURIComponent(query)}`,
      accent: '#EC4899',
      terms: ['note', 'notes', 'draft', 'writing'],
      onSelect: () => window.location.assign(`/notes?search=${encodeURIComponent(query)}`),
    },
    {
      id: 'search-shared',
      kind: 'shared',
      title: 'Search shared notes',
      description: 'Find shared or public note links.',
      href: `/shared?search=${encodeURIComponent(query)}`,
      accent: '#F59E0B',
      terms: ['shared', 'public', 'share', 'link'],
      onSelect: () => window.location.assign(`/shared?search=${encodeURIComponent(query)}`),
    },
    {
      id: 'search-tags',
      kind: 'tag',
      title: 'Search tags',
      description: 'Jump to notes organized by tag.',
      href: `/tags?search=${encodeURIComponent(query)}`,
      accent: '#A855F7',
      terms: ['tag', 'tags', 'label', 'topic'],
      onSelect: () => window.location.assign(`/tags?search=${encodeURIComponent(query)}`),
    },
    {
      id: 'search-settings',
      kind: 'settings',
      title: 'Search settings',
      description: 'Find settings and security controls.',
      href: `/settings?search=${encodeURIComponent(query)}`,
      accent: '#6366F1',
      terms: ['settings', 'security', 'account', 'profile'],
      onSelect: () => window.location.assign(`/settings?search=${encodeURIComponent(query)}`),
    },
    {
      id: 'search-pitch',
      kind: 'context',
      title: 'Open pitch deck',
      description: 'Review the Note pitch deck.',
      href: '/pitch',
      accent: '#EC4899',
      terms: ['pitch', 'deck', 'presentation'],
      onSelect: () => window.location.assign('/pitch'),
    },
  ];

  const contextualHints = snippets.map((snippet) => ({
    id: snippet.id,
    kind: snippet.kind,
    title: snippet.title,
    description: snippet.description,
    href: snippet.href || undefined,
    accent:
      snippet.kind === 'tag'
        ? '#A855F7'
        : snippet.kind === 'shared'
          ? '#F59E0B'
          : snippet.kind === 'extension'
            ? '#10B981'
            : '#EC4899',
    terms: [snippet.title, snippet.description, routeLabel].map((value) => value.toLowerCase()),
    onSelect: () => {
      if (snippet.href) window.location.assign(snippet.href);
    },
  }));

  const pool = [...quickActions, ...searchTargets, ...contextualHints];
  const filtered = normalized ? pool.filter((item) => matchesTerms(normalized, item.terms)) : pool;

  return {
    routeLabel,
    currentApp: 'note',
    snippets,
    quickActions: (normalized ? filtered : quickActions).slice(0, 5),
    searchTargets: (normalized ? filtered : searchTargets).slice(0, 6),
  };
}

export function PotatoProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [snippets, setSnippets] = useState<PotatoSnippet[]>(() => routeSnippets(pathname, user));

  useEffect(() => {
    setSnippets(routeSnippets(pathname, user));
  }, [pathname, user]);

  const pushSnippet = useCallback((snippet: Omit<PotatoSnippet, 'id'>) => {
    const id = makeId(snippet.kind);
    setSnippets((current) => [...current, { ...snippet, id }]);
    return id;
  }, []);

  const clearSnippets = useCallback(() => {
    setSnippets(routeSnippets(pathname, user));
  }, [pathname, user]);

  const value = useMemo<PotatoContextType>(() => ({
    routeLabel: routeLabelFromPath(pathname),
    currentApp: 'note',
    snippets,
    pushSnippet,
    clearSnippets,
    buildSearchSurface: (query: string) => buildSurface(query, routeLabelFromPath(pathname), snippets),
  }), [clearSnippets, pathname, pushSnippet, snippets]);

  return <PotatoContext.Provider value={value}>{children}</PotatoContext.Provider>;
}

export function usePotato() {
  const context = useContext(PotatoContext);
  if (!context) {
    throw new Error('usePotato must be used within a PotatoProvider');
  }
  return context;
}
