import { PROJECT_ID, ENDPOINT } from '../../appwrite/constants';

export const APPWRITE_CONFIG = {
    ENDPOINT,
    PROJECT_ID,
    DATABASES: {
        NOTE: '67ff05a9000296822396',
        VAULT: 'passwordManagerDb',
        FLOW: 'kylrixflow',
        CHAT: 'chat'
    },
    TABLES: {
        NOTE: {
            USERS: '67ff05c900247b5673d3',
            NOTES: '67ff05f3002502ef239e',
            TAGS: '67ff06280034908cf08a',
            APIKEYS: '67ff064400263631ffe4',
            COMMENTS: 'comments',
            EXTENSIONS: 'extensions',
            REACTIONS: 'reactions',
            COLLABORATORS: 'collaborators',
            ACTIVITY_LOG: 'activityLog',
            SETTINGS: 'settings',
            SUBSCRIPTIONS: 'subscriptions',
            NOTE_TAGS: 'note_tags',
            NOTE_REVISIONS: 'note_revisions',
            BLOGPOSTS: '67ff065a003e2bb950f7'
        },
        VAULT: {
            CREDENTIALS: 'credentials',
            TOTP_SECRETS: 'totpSecrets',
            FOLDERS: 'folders',
            SECURITY_LOGS: 'securityLogs',
            USER: 'user',
            KEYCHAIN: 'keychain'
        },
        FLOW: {
            TASKS: 'tasks',
            EVENTS: 'events',
            GUESTS: 'eventGuests'
        }
    },
    BUCKETS: {
        PROFILE_PICTURES: 'profile_pictures',
        NOTES_ATTACHMENTS: 'notes_attachments',
        BLOG_MEDIA: 'blog_media',
        EXTENSION_ASSETS: 'extension_assets',
        BACKUPS: 'backups',
        TEMP_UPLOADS: 'temp_uploads'
    },
    SYSTEM: {
        DOMAIN: 'kylrixnote.space',
        AUTH_SUBDOMAIN: 'accounts',
        RP_NAME: 'kylrixnote',
        RP_ID: 'kylrixnote.space'
    }
};
