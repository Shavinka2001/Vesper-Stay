import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Authenticated symmetric encryption for secrets at rest (e.g. per-tenant
 * WhatsApp / OTA access tokens). AES-256-GCM gives confidentiality AND
 * tamper detection — decryption throws if the ciphertext was modified.
 *
 * Wire format: "<iv>:<authTag>:<ciphertext>", each part base64. The IV is
 * random per message, so encrypting the same token twice yields different
 * blobs (no leakage of equal values).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // GCM standard nonce length

/** Decode a 32-byte key from hex (64 chars) or base64. */
export function parseEncryptionKey(raw: string | undefined): Buffer {
  if (!raw || raw.trim() === '') {
    throw new Error('CREDENTIALS_ENC_KEY is not set');
  }
  const value = raw.trim();
  const buf = /^[0-9a-fA-F]{64}$/.test(value)
    ? Buffer.from(value, 'hex')
    : Buffer.from(value, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      'CREDENTIALS_ENC_KEY must decode to 32 bytes (64 hex chars or base64)',
    );
  }
  return buf;
}

export function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptWithKey(blob: string, key: Buffer): string {
  const [ivB64, tagB64, dataB64] = blob.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed ciphertext');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
