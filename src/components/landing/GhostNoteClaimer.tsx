"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/ui/AuthContext';
import { functions } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';

const GHOST_STORAGE_KEY = 'kylrix_ghost_notes_v2';
const GHOST_SECRET_KEY = 'kylrix_ghost_secret_v2';

/**
 * Background component that claims ghost notes when a user authenticates.
 * Extremely lightweight: only does logic if data exists in localStorage and user is logged in.
 */
export const GhostNoteClaimer = () => {
    const { isAuthenticated, user } = useAuth();
    const isClaiming = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !user?.$id || isClaiming.current) return;

        const claimGhostNotes = async () => {
            const historyRaw = localStorage.getItem(GHOST_STORAGE_KEY);
            const secret = localStorage.getItem(GHOST_SECRET_KEY);

            if (!historyRaw || !secret) return;

            try {
                const history = JSON.parse(historyRaw);
                if (!Array.isArray(history) || history.length === 0) return;

                isClaiming.current = true;
                console.log(`[GhostClaimer] Detected ${history.length} notes to claim for user ${user.$id}`);

                // Call the Appwrite function (skeleton/ready for when function is deployed)
                // Even if it fails (404), we catch it. Once the function is live, it works.
                try {
                    const noteIds = history.map(n => n.id);
                    await functions.createExecution(
                        APPWRITE_CONFIG.FUNCTIONS.CLAIM_GHOST_NOTES || 'claim-ghost-notes', // Function ID
                        JSON.stringify({ noteIds, ghostSecret: secret }),
                        false, // async
                        '/', // path
                        'POST' as any
                    );
                    
                    // On success (or at least attempt), we clear local memory to avoid infinite loops
                    // In a production scenario, we might want to wait for a 200 OK
                    // But here we prioritize "not toiling on each reload" as requested.
                    localStorage.removeItem(GHOST_STORAGE_KEY);
                    localStorage.removeItem(GHOST_SECRET_KEY);
                    
                    console.log('[GhostClaimer] Successfully handed off ghost notes to claim function.');
                } catch (fnErr: any) {
                    // If function doesn't exist yet (404), we don't clear yet so it can try again later
                    // Or we can clear it if we want to be "brutally efficient" and not try again until next session
                    if (fnErr?.code === 404) {
                        console.warn('[GhostClaimer] Claim function not yet deployed. Retaining ghost notes.');
                    } else {
                        // For other errors, we might want to clear to avoid spamming a broken function
                        console.error('[GhostClaimer] Failed to execute claim function:', fnErr);
                    }
                }
            } catch (e) {
                console.error('[GhostClaimer] Error processing ghost history:', e);
            } finally {
                isClaiming.current = false;
            }
        };

        claimGhostNotes();
    }, [isAuthenticated, user?.$id]);

    return null; // Renderless component
};