'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { updateNote } from '@/lib/appwrite';
import type { Notes } from '@/types/appwrite';

interface AutosaveOptions {
  minChangeThreshold?: number; // Minimum length diff before saving
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (note: Notes) => void;
  onError?: (error: Error) => void;
}

function arraysEqual(a?: string[] | null, b?: string[] | null) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function shouldSave(
  previous: Notes | null,
  current: Notes,
  minChangeThreshold: number
) {
  if (!previous) return true;
  if (previous.title !== current.title) return true;
  if (previous.format !== current.format) return true;
  if (!arraysEqual(previous.tags, current.tags)) return true;

  const prevContent = (previous.content || '').trim();
  const currContent = (current.content || '').trim();
  if (prevContent === currContent) return false;

  const diff = Math.abs(currContent.length - prevContent.length);
  if (diff >= minChangeThreshold || prevContent === '' || currContent === '') {
    return true;
  }

  return false;
}

export function useAutosave(note: Notes | null, options: AutosaveOptions = {}) {
  const {
    minChangeThreshold = 0,
    debounceMs = 500,
    enabled = true,
    onSave,
    onError,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef<Notes | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const performSave = useCallback(
    async (candidate: Notes) => {
      if (!enabled || isSavingRef.current || !candidate.$id) return;
      if (!shouldSave(lastSavedRef.current, candidate, minChangeThreshold)) {
        return;
      }

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const saved = await updateNote(candidate.$id, candidate);
        lastSavedRef.current = candidate;
        onSave?.(saved);
      } catch (error) {
        console.error('Autosave failed:', error);
        onError?.(error as Error);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [enabled, minChangeThreshold, onSave, onError]
  );

  useEffect(() => {
    if (!note) {
      lastSavedRef.current = null;
      return;
    }
    if (!lastSavedRef.current || lastSavedRef.current.$id !== note.$id) {
      lastSavedRef.current = note;
    }
  }, [note?.$id]);

  useEffect(() => {
    if (!enabled || !note) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSave(note);
    }, debounceMs);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [note, enabled, debounceMs, performSave]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isSaving,
  };
}

export default useAutosave;
