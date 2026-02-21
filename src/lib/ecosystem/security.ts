/**
 * Kylrix Ecosystem Security Protocol (WESP)
 * Centralized security and encryption logic for the entire ecosystem.
 * Hosted by the ID node (Identity Management System).
 */

import { MeshProtocol } from './mesh';

export class EcosystemSecurity {
  private static instance: EcosystemSecurity;
  private masterKey: CryptoKey | null = null;
  private isUnlocked = false;
  private nodeId: string = 'note';

  // Constants aligned with Kylrix Vault for backward compatibility
  private static readonly PBKDF2_ITERATIONS = 600000;
  private static readonly SALT_SIZE = 32;
  private static readonly IV_SIZE = 16;
  private static readonly KEY_SIZE = 256;

  // PIN specific constants
  private static readonly PIN_ITERATIONS = 100000;
  private static readonly PIN_SALT_SIZE = 16;
  private static readonly SESSION_SALT_SIZE = 16;

  static getInstance(): EcosystemSecurity {
    if (!EcosystemSecurity.instance) {
      EcosystemSecurity.instance = new EcosystemSecurity();
    }
    return EcosystemSecurity.instance;
  }

  /**
   * Initialize security for a specific node
   */
  init(nodeId: string) {
    this.nodeId = nodeId;
    this.listenForMeshDirectives();
  }

  private listenForMeshDirectives() {
    if (typeof window === 'undefined') return;

    MeshProtocol.subscribe((msg) => {
      if (msg.type === 'COMMAND' && msg.payload.action === 'LOCK_SYSTEM') {
        this.lock();
      }
    });
  }

  /**
   * Derive key from password
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as any,
        iterations: EcosystemSecurity.PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", salt: salt, length: EcosystemSecurity.KEY_SIZE },
      true,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
    );
  }

  async unlock(password: string, keyChainEntry?: any): Promise<boolean> {
    try {
      if (!keyChainEntry) return false;

      const salt = new Uint8Array(
        atob(keyChainEntry.salt).split("").map(c => c.charCodeAt(0))
      );

      const authKey = await this.deriveKey(password, salt);
      const wrappedKeyBytes = new Uint8Array(
        atob(keyChainEntry.wrappedKey).split("").map(c => c.charCodeAt(0))
      );

      const iv = wrappedKeyBytes.slice(0, EcosystemSecurity.IV_SIZE);
      const ciphertext = wrappedKeyBytes.slice(EcosystemSecurity.IV_SIZE);

      const mekBytes = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        authKey,
        ciphertext
      );

      this.masterKey = await crypto.subtle.importKey(
        "raw",
        mekBytes,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
      );

      this.isUnlocked = true;

      // If we are ID, broadcast the key to other nodes in the mesh
      if (this.nodeId === 'id') {
        MeshProtocol.broadcast({
          type: 'COMMAND',
          targetNode: 'all',
          payload: { 
            action: 'SYNC_MASTERPASS_KEY', 
            keyBytes: mekBytes 
          }
        }, 'id');
      }

      return true;
    } catch (e) {
      console.error("[Security] Unlock failed", e);
      return false;
    }
  }

  async encrypt(data: string): Promise<string> {
    if (!this.masterKey) throw new Error("Security vault locked");
    
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));
    const iv = crypto.getRandomValues(new Uint8Array(EcosystemSecurity.IV_SIZE));

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      this.masterKey,
      plaintext,
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(encryptedData: string): Promise<string> {
    if (!this.masterKey) throw new Error("Security vault locked");

    const combined = new Uint8Array(
      atob(encryptedData).split("").map((char) => char.charCodeAt(0)),
    );

    const iv = combined.slice(0, EcosystemSecurity.IV_SIZE);
    const encrypted = combined.slice(EcosystemSecurity.IV_SIZE);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      this.masterKey,
      encrypted,
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  /**
   * Phase 1: Setup PIN Verifier (Disk-Bound)
   * Stores { PinSalt, PinHash } in localStorage.
   */
  async setupPinVerifier(pin: string): Promise<void> {
    if (typeof window === "undefined") return;

    const salt = crypto.getRandomValues(new Uint8Array(EcosystemSecurity.PIN_SALT_SIZE));
    const hash = await this.derivePinHash(pin, salt);

    const verifier = {
      salt: btoa(String.fromCharCode(...salt)),
      hash: btoa(String.fromCharCode(...new Uint8Array(hash))),
    };

    localStorage.setItem("kylrix_pin_verifier", JSON.stringify(verifier));
  }

  /**
   * Phase 2: Ephemeral Wrap (RAM-Bound)
   * Wraps the MEK with an ephemeral key derived from PIN and SessionSalt.
   * Stores in sessionStorage.
   */
  async piggybackSession(pin: string): Promise<void> {
    if (!this.masterKey || typeof window === "undefined") return;

    const sessionSalt = crypto.getRandomValues(new Uint8Array(EcosystemSecurity.SESSION_SALT_SIZE));
    const ephemeralKey = await this.deriveEphemeralKey(pin, sessionSalt);

    const rawMek = await crypto.subtle.exportKey("raw", this.masterKey);
    const iv = crypto.getRandomValues(new Uint8Array(EcosystemSecurity.IV_SIZE));

    const wrappedMek = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      ephemeralKey,
      rawMek
    );

    const combined = new Uint8Array(iv.length + wrappedMek.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(wrappedMek), iv.length);

    const ephemeralData = {
      wrappedMek: btoa(String.fromCharCode(...combined)),
      sessionSalt: btoa(String.fromCharCode(...sessionSalt)),
    };

    sessionStorage.setItem("kylrix_ephemeral_session", JSON.stringify(ephemeralData));
  }

  /**
   * Phase 3: Unlock Session with PIN
   * Reconstructs the MEK from ephemeral RAM using the PIN.
   */
  async unlockWithPin(pin: string): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const verifierStr = localStorage.getItem("kylrix_pin_verifier");
    const ephemeralStr = sessionStorage.getItem("kylrix_ephemeral_session");

    if (!verifierStr || !ephemeralStr) return false;

    try {
      // 1. Verify PIN against disk verifier
      const verifier = JSON.parse(verifierStr);
      const salt = new Uint8Array(atob(verifier.salt).split("").map(c => c.charCodeAt(0)));
      const expectedHash = verifier.hash;
      const actualHash = btoa(String.fromCharCode(...new Uint8Array(await this.derivePinHash(pin, salt))));

      if (actualHash !== expectedHash) {
        return false;
      }

      // 2. Unwrap MEK from ephemeral storage
      const ephemeral = JSON.parse(ephemeralStr);
      const sessionSalt = new Uint8Array(atob(ephemeral.sessionSalt).split("").map(c => c.charCodeAt(0)));
      const ephemeralKey = await this.deriveEphemeralKey(pin, sessionSalt);

      const wrappedMekBytes = new Uint8Array(atob(ephemeral.wrappedMek).split("").map(c => c.charCodeAt(0)));
      const iv = wrappedMekBytes.slice(0, EcosystemSecurity.IV_SIZE);
      const ciphertext = wrappedMekBytes.slice(EcosystemSecurity.IV_SIZE);

      const rawMek = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        ephemeralKey,
        ciphertext
      );

      this.masterKey = await crypto.subtle.importKey(
        "raw",
        rawMek,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
      );

      this.isUnlocked = true;
      return true;
    } catch (e) {
      console.error("[Security] PIN unlock failed", e);
      return false;
    }
  }

  isPinSet(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("kylrix_pin_verifier");
  }

  private async derivePinHash(pin: string, salt: Uint8Array): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    return crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: EcosystemSecurity.PIN_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
  }

  private async deriveEphemeralKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 5000, // Faster for ephemeral usage
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  lock() {
    this.masterKey = null;
    this.isUnlocked = false;
    if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("kylrix_vault_unlocked");
        // We DO NOT remove kylrix_ephemeral_session here, 
        // as the PIN is meant to unlock the system when it's locked.
        // It should only be purged on "Purge" (tab close/process exit).
    }
  }

  get status() {
    return {
      isUnlocked: this.isUnlocked,
      hasKey: !!this.masterKey
    };
  }
}

export const ecosystemSecurity = EcosystemSecurity.getInstance();
