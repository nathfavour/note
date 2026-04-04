import { PROJECT_ID, ENDPOINT } from '../../generated/appwrite/constants';

export const APPWRITE_CONFIG = {
    ENDPOINT,
    PROJECT_ID,
    DATABASES: {
        NOTE: '67ff05a9000296822396',
        KYLRIXNOTE: '67ff05a9000296822396', // Alias for WalletService
        VAULT: 'passwordManagerDb',
        PASSWORD_MANAGER: 'passwordManagerDb', // Alias for WalletService
        FLOW: 'whisperrflow',
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
            BLOGPOSTS: '67ff065a003e2bb950f7',
            WALLET_MAP: 'walletMap' // Added for WalletService
        },
        KYLRIXNOTE: { // Alias for WalletService
            USERS: '67ff05c900247b5673d3',
            ACTIVITY_LOG: 'activityLog',
            WALLET_MAP: 'walletMap'
        },
        VAULT: {
            CREDENTIALS: 'credentials',
            TOTP_SECRETS: 'totpSecrets',
            FOLDERS: 'folders',
            SECURITY_LOGS: 'securityLogs',
            USER: 'user',
            KEYCHAIN: 'keychain',
            WALLETS: 'wallets' // Added for WalletService
        },
        PASSWORD_MANAGER: { // Alias for WalletService
            KEYCHAIN: 'keychain',
            IDENTITIES: 'identities',
            WALLETS: 'wallets',
            KEY_MAPPING: 'key_mapping'
        },
        FLOW: {
            TASKS: 'tasks',
            EVENTS: 'events',
            GUESTS: 'eventGuests'
        },
        CHAT: {
            USERS: 'users',
            PROFILES: 'profiles',
            CONVERSATIONS: 'conversations',
            MESSAGES: 'messages',
            EPOCHS: 'epochs',
            ACCOUNT_EVENTS: 'accountEvents',
            CALL_LOGS: 'call_logs',
            APP_ACTIVITY: 'app_activity',
            CALL_LINKS: 'call_links',
            FOLLOWS: 'follows',
            MOMENTS: 'moments',
            INTERACTIONS: 'interactions',
            CONTACTS: 'contacts'
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
    FUNCTIONS: {
        PERMISSION_UPDATER: 'permission-updater',
        CLAIM_GHOST_NOTES: 'claim-ghost-notes',
        SEARCH_USERS: '69a582720012957d2027',
        SYNC_USER_PROFILE: '69a583ac002b674685b0',
        NOTIFY_ON_SHARE: '69a58c1c001c39695bf6',
        NOTIFY_ON_SOCIAL_ACTIVITY: '69a6bf6200180e70aca1',
        FLOW_EVENT_SYNC: '69a6c28f003bb7d7e054',
        LOG_SECURITY_EVENT: '69a6c45a002085baa8dd',
        SYNC_SUBSCRIPTION_STATUS: '69a6c56d00203438232c',
        ACCOUNT_CLEANUP: '69a6c6fc001dc877979d',
        CONNECT_CALL_CLEANUP: '69a6c841000b2c5aaae3'
    },
    SYSTEM: {
        DOMAIN: 'kylrix.space',
        AUTH_SUBDOMAIN: 'accounts',
        RP_NAME: 'kylrix',
        RP_ID: 'kylrix.space'
    }
};
