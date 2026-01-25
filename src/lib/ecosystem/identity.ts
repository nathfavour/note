import { databases, CONNECT_DATABASE_ID, CONNECT_COLLECTION_ID_USERS, Query, Permission, Role } from '../appwrite';
import { getEffectiveUsername, getEffectiveDisplayName } from '../utils';

const PROFILE_SYNC_KEY = 'whisperr_ecosystem_identity_synced';
const SESSION_SYNC_KEY = 'whisperr_ecosystem_session_synced';

/**
 * Ensures the user has a record in the global WhisperrConnect Directory.
 * This is the 'Universal Identity Hook' that enables ecosystem discovery.
 */
export async function ensureGlobalIdentity(user: any, force = false) {
    if (!user?.$id) return;

    if (typeof window !== 'undefined' && !force) {
        // Step 1: Session-level skip (Fastest)
        if (sessionStorage.getItem(SESSION_SYNC_KEY)) return;

        // Step 2: Global device-level skip (24h TTL)
        const lastSync = localStorage.getItem(PROFILE_SYNC_KEY);
        if (lastSync && (Date.now() - parseInt(lastSync)) < 24 * 60 * 60 * 1000) {
            sessionStorage.setItem(SESSION_SYNC_KEY, '1');
            return;
        }
    }

    try {
        // 1. Get or Generate Normalized Username
        const { account } = await import('../appwrite');
        const prefs = await account.getPrefs();
        let username = user.username || prefs?.username || user.name || user.email?.split('@')[0];
        
        // Strict Normalization: lowercase, no @, clean alphanumeric
        username = String(username).toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
        if (!username) username = `user_${user.$id.slice(0, 8)}`;

        // 2. Check global directory (Connect DB)
        let profile;
        try {
            profile = await databases.getDocument(CONNECT_DATABASE_ID, CONNECT_COLLECTION_ID_USERS, user.$id);
        } catch (e: any) {
            if (e.code !== 404) throw e;
            profile = null;
        }

        const now = new Date().toISOString();
        const profileData = {
            username,
            displayName: user.name || username,
            updatedAt: now,
            privacySettings: JSON.stringify({ public: true, searchable: true }), // ALWAYS true here
            avatarUrl: user.avatarUrl || user.avatar || null,
            walletAddress: user.walletAddress || null,
        };

        if (!profile) {
            console.log('[Identity] Initializing global identity:', user.$id);
            await databases.createDocument(
                CONNECT_DATABASE_ID,
                CONNECT_COLLECTION_ID_USERS,
                user.$id,
                {
                    ...profileData,
                    createdAt: now,
                    appsActive: ['note'],
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id))
                ]
            );
        } else {
            // Healing Logic: Force fix usernames and discoverability
            const isMalformed = profile.username !== username || !profile.privacySettings || profile.privacySettings.includes('"public":false');
            if (isMalformed) {
                console.log('[Identity] Healing global identity:', user.$id);
                await databases.updateDocument(
                    CONNECT_DATABASE_ID,
                    CONNECT_COLLECTION_ID_USERS,
                    user.$id,
                    profileData
                );
            }
        }

        // 3. Sync back to account prefs if needed
        if (prefs.username !== username) {
            await account.updatePrefs({ ...prefs, username });
        }

        // Mark as successfully synced
        if (typeof window !== 'undefined') {
            localStorage.setItem(PROFILE_SYNC_KEY, Date.now().toString());
            sessionStorage.setItem(SESSION_SYNC_KEY, '1');
        }
    } catch (error) {
        console.warn('[Identity] Global identity sync failed:', error);
    }
}

/**
 * Searches for users across the entire ecosystem via the global directory.
 * Supports email, username, and display name.
 */
export async function searchGlobalUsers(query: string, limit = 10) {
    if (!query || query.length < 2) return [];

    const isEmail = /@/.test(query) && /\./.test(query);

    try {
        // 1. Primary search in Global Directory (Connect)
        const res = await databases.listDocuments(
            CONNECT_DATABASE_ID,
            CONNECT_COLLECTION_ID_USERS,
            [
                Query.or([
                    Query.startsWith('username', query.toLowerCase().replace(/^@/, '')),
                    Query.startsWith('displayName', query)
                ]),
                Query.limit(limit)
            ]
        );

        const results = res.documents.map(doc => ({
            id: doc.$id,
            type: 'user' as const,
            title: doc.displayName || doc.username,
            subtitle: `@${doc.username}`,
            icon: 'person',
            avatar: doc.avatarUrl,
            profilePicId: doc.avatarFileId || doc.profilePicId,
            apps: doc.appsActive || []
        }));

        // 2. Secondary Fallback to main users table if results are low
        if (results.length < 5) {
            try {
                const { APPWRITE_DATABASE_ID, APPWRITE_TABLE_ID_USERS } = await import('../appwrite');
                const noteRes = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    APPWRITE_TABLE_ID_USERS,
                    [
                        Query.or([
                            Query.startsWith('name', query),
                            Query.startsWith('email', query.toLowerCase())
                        ]),
                        Query.limit(5)
                    ]
                );

                for (const doc of noteRes.documents) {
                    if (!results.find(r => r.id === doc.$id)) {
                        results.push({
                            id: doc.$id,
                            type: 'user' as const,
                            title: doc.name || doc.email.split('@')[0],
                            subtitle: doc.email,
                            icon: 'person',
                            avatar: doc.avatar || null,
                            profilePicId: doc.profilePicId || doc.avatarFileId,
                            apps: ['note']
                        });
                    }
                }
            } catch (err) {
                // Secondary search failure is non-fatal
            }
        }

        return results;
    } catch (error) {
        console.error('[Identity] Global search failed:', error);
        return [];
    }
}
