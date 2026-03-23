"use client";


import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, useMemo } from 'react';
import { 
  listNotesPaginated, 
  getPinnedNoteIds, 
  pinNote as appwritePinNote, 
  unpinNote as appwriteUnpinNote,
  realtime,
  APPWRITE_DATABASE_ID,
  APPWRITE_TABLE_ID_NOTES
} from '@/lib/appwrite';
import type { Notes } from '@/types/appwrite';
import { useAuth } from '@/components/ui/AuthContext';

interface NotesContextType {
  notes: Notes[];
  totalNotes: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetchNotes: () => void;
  upsertNote: (note: Notes) => void;
  removeNote: (noteId: string) => void;
  pinnedIds: string[];
  pinNote: (noteId: string) => Promise<void>;
  unpinNote: (noteId: string) => Promise<void>;
  isPinned: (noteId: string) => boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Notes[]>([]);
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null); // last fetched document id
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Plan-based pinning limits for UI
  const effectivePinnedIds = useMemo(() => {
    if (!user) return [];
    const plan = user.prefs?.subscriptionTier || 'FREE';
    const limit = (plan === 'PRO' || plan === 'ORG' || plan === 'LIFETIME') ? 10 : 3;
    return pinnedIds.slice(0, limit);
  }, [pinnedIds, user]);

  const CACHE_KEY = useMemo(() => user?.$id ? `notes_cache_${user.$id}` : null, [user?.$id]);

  // Load from cache on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !CACHE_KEY || isCacheLoaded) return;

    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotes(parsed.notes || []);
        setTotalNotes(parsed.totalNotes || 0);
        setCursor(parsed.cursor || null);
        setHasMore(parsed.hasMore ?? true);
        setPinnedIds(parsed.pinnedIds || []);
        // If we have cached notes, we can stop the initial loading spinner immediately
        if (parsed.notes?.length > 0) {
          setIsLoading(false);
        }
      }
    } catch (e: any) {
      console.warn('Failed to load notes from cache', e);
    } finally {
      setIsCacheLoaded(true);
    }
  }, [CACHE_KEY, isCacheLoaded]);

  // Save to cache whenever relevant state changes
  useEffect(() => {
    if (typeof window === 'undefined' || !CACHE_KEY || !isCacheLoaded) return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          notes,
          totalNotes,
          cursor,
          hasMore,
          pinnedIds,
          timestamp: Date.now()
        }));
      } catch (e: any) {
        console.warn('Failed to save notes to cache', e);
      }
    }, 1000); // Debounce saves

    return () => clearTimeout(timer);
  }, [notes, totalNotes, cursor, hasMore, pinnedIds, CACHE_KEY, isCacheLoaded]);

  // Refs to avoid unnecessary re-creations / dependency loops
  const isFetchingRef = useRef(false);
  const notesRef = useRef<Notes[]>([]);
  const cursorRef = useRef<string | null>(null);
  useEffect(() => { notesRef.current = notes; }, [notes]);
  useEffect(() => { cursorRef.current = cursor; }, [cursor]);

  const PAGE_SIZE = Number(process.env.NEXT_PUBLIC_NOTES_PAGE_SIZE || 50);

  const fetchBatch = useCallback(async (reset: boolean = false) => {
    if (isFetchingRef.current) return;

    if (!isAuthenticated) {
      if (!isAuthLoading) {
        setNotes([]);
        setTotalNotes(0);
        setIsLoading(false);
        setHasMore(false);
        setError(null);
        setPinnedIds([]);
      }
      return;
    }

    // Smart fetch: If we are doing a reset fetch but already have notes from cache, 
    // and it's not a "force" refetch, we can skip or defer.
    // For now, we'll implement the logic to skip if we have notes and it's the first auto-call.
    
    isFetchingRef.current = true;
    if (reset && notesRef.current.length === 0) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // Fetch pinned IDs along with first batch
      if (reset) {
        const pIds = await getPinnedNoteIds();
        setPinnedIds(pIds);
      }

      const res = await listNotesPaginated({
        limit: PAGE_SIZE,
        cursor: reset ? null : (cursorRef.current || null),
        userId: user?.$id,
      });

      const batch = res.documents as Notes[];

      setNotes(prev => {
        if (reset) return batch;
        const existingIds = new Set(prev.map(n => n.$id));
        const newOnes = batch.filter(n => !existingIds.has(n.$id));
        return [...prev, ...newOnes];
      });

      setTotalNotes(res.total || 0);
      setHasMore(!!res.hasMore);
      if (res.nextCursor) {
        setCursor(res.nextCursor);
      } else if (reset) {
        setCursor(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notes');
      if (reset && notesRef.current.length === 0) {
        setNotes([]);
        setTotalNotes(0);
      }
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, user?.$id, PAGE_SIZE]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingRef.current) return;
    await fetchBatch(false);
  }, [hasMore, fetchBatch]);

  const refetchNotes = useCallback(() => {
    setCursor(null);
    cursorRef.current = null;
    setHasMore(true);
    fetchBatch(true);
  }, [fetchBatch]);

  // Initial fetch logic - decoupled from reload if cache exists
  const hasInitiallyFetched = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user?.$id && isCacheLoaded) {
      // If we have cached notes, we don't fetch immediately on reload
      // This makes reloads "instant"
      if (notes.length > 0 && !hasInitiallyFetched.current) {
        hasInitiallyFetched.current = true;
        // background refresh: 
        // We still perform a background refresh to stay in sync with remote changes
        // while the app was closed.
        console.log('Instant reload: Using cached notes with background refresh');
        setIsLoading(false);
        fetchBatch(true);
        return;
      }

      // If no cache or already fetched once, proceed with normal fetch
      if (!hasInitiallyFetched.current) {
        fetchBatch(true);
        hasInitiallyFetched.current = true;
      }
    } else if (!isAuthLoading && !isAuthenticated) {
      setNotes([]);
      setTotalNotes(0);
      setHasMore(false);
      setIsLoading(false);
      setError(null);
      setPinnedIds([]);
      hasInitiallyFetched.current = false;
    }
  }, [isAuthenticated, isAuthLoading, user?.$id, fetchBatch, isCacheLoaded, notes.length]);

  const upsertNote = useCallback((note: Notes) => {
    const existed = notesRef.current.some((n) => n.$id === note.$id);
    setNotes((prev) => {
      if (existed) {
        return prev.map((item) => (item.$id === note.$id ? note : item));
      }
      return [note, ...prev];
    });
    if (!existed) {
      setTotalNotes((prev) => prev + 1);
    }
  }, []);

  const removeNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.$id !== noteId));
    setTotalNotes((prev) => Math.max(0, prev - 1));
    // Also remove from pinned if it was pinned
    setPinnedIds((prev) => prev.filter(id => id !== noteId));
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!isAuthenticated || !user?.$id) return;

    // Listen to the entire collection to catch all relevant changes
    const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TABLE_ID_NOTES}.documents`;
    
    console.log('Subscribing to realtime notes:', channel);

    const sub = realtime.subscribe(channel, (response) => {
      const payload = response.payload as Notes;
      
      // Only handle notes belonging to the current user
      const isOwner = payload.userId === user.$id || (payload as any).owner_id === user.$id;
      if (!isOwner) return;

      const isCreate = response.events.some(e => e.endsWith('.create'));
      const isUpdate = response.events.some(e => e.endsWith('.update'));
      const isDelete = response.events.some(e => e.endsWith('.delete'));

      if (isCreate) {
        setNotes(prev => {
          // Avoid duplicates if we already added it via optimistic UI or manual call
          if (prev.some(n => n.$id === payload.$id)) return prev;
          return [payload, ...prev];
        });
        setTotalNotes(prev => prev + 1);
      } else if (isUpdate) {
        setNotes(prev => prev.map(n => n.$id === payload.$id ? payload : n));
      } else if (isDelete) {
        setNotes(prev => prev.filter(n => n.$id !== payload.$id));
        setTotalNotes(prev => Math.max(0, prev - 1));
        setPinnedIds(prev => prev.filter(id => id !== payload.$id));
      }
    });
    
    return () => {
      if (typeof sub === 'function') {
        sub();
      } else if (sub && typeof (sub as any).unsubscribe === 'function') {
        (sub as any).unsubscribe();
      }
    };
  }, [isAuthenticated, user?.$id]);

  const pinNote = useCallback(async (noteId: string) => {
    try {
      const newPins = await appwritePinNote(noteId);
      setPinnedIds(newPins);
    } catch (err: any) {
      throw err;
    }
  }, []);

  const unpinNote = useCallback(async (noteId: string) => {
    try {
      const newPins = await appwriteUnpinNote(noteId);
      setPinnedIds(newPins);
    } catch (err: any) {
      throw err;
    }
  }, []);

  const isPinned = useCallback((noteId: string) => {
    return effectivePinnedIds.includes(noteId);
  }, [effectivePinnedIds]);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const aPinned = effectivePinnedIds.includes(a.$id);
      const bPinned = effectivePinnedIds.includes(b.$id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [notes, effectivePinnedIds]);

  return (
    <NotesContext.Provider
      value={{
        notes: sortedNotes,
        totalNotes: totalNotes || 0,
        isLoading,
        error,
        hasMore,
        loadMore,
        refetchNotes,
        upsertNote,
        removeNote,
        pinnedIds: effectivePinnedIds,
        pinNote,
        unpinNote,
        isPinned,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
