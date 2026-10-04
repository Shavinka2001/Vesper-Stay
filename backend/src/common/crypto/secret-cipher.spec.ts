import { randomBytes } from 'crypto';
import {
  decryptWithKey,
  encryptWithKey,
  parseEncryptionKey,
} from '@common/crypto/secret-cipher';

const KEY = randomBytes(32);

describe('secret cipher (AES-256-GCM)', () => {
  it('round-trips a secret', () => {
    const secret = 'EAAG...whatsapp-token...xyz';
    const blob = encryptWithKey(secret, KEY);
    expect(blob).not.toContain(secret);
    expect(decryptWithKey(blob, KEY)).toBe(secret);
  });

  it('produces a different blob each time (random IV)', () => {
    const a = encryptWithKey('same', KEY);
    const b = encryptWithKey('same', KEY);
    expect(a).not.toBe(b);
    expect(decryptWithKey(a, KEY)).toBe('same');
    expect(decryptWithKey(b, KEY)).toBe('same');
  });

  it('rejects tampered ciphertext (auth tag)', () => {
    const blob = encryptWithKey('secret', KEY);
    const [iv, tag, data] = blob.split(':');
    const flipped = Buffer.from(data!, 'base64');
    flipped[0] = ((flipped[0] ?? 0) ^ 0xff) & 0xff;
    const tampered = `${iv}:${tag}:${flipped.toString('base64')}`;
    expect(() => decryptWithKey(tampered, KEY)).toThrow();
  });

  it('fails to decrypt with the wrong key', () => {
    const blob = encryptWithKey('secret', KEY);
    expect(() => decryptWithKey(blob, randomBytes(32))).toThrow();
  });

  it('rejects malformed blobs', () => {
    expect(() => decryptWithKey('not-valid', KEY)).toThrow('Malformed');
  });
});

describe('parseEncryptionKey', () => {
  it('accepts 64-char hex', () => {
    expect(parseEncryptionKey('a'.repeat(64))).toHaveLength(32);
  });

  it('accepts base64 that decodes to 32 bytes', () => {
    expect(parseEncryptionKey(randomBytes(32).toString('base64'))).toHaveLength(
      32,
    );
  });

  it('rejects a missing or wrong-length key', () => {
    expect(() => parseEncryptionKey(undefined)).toThrow('not set');
    expect(() => parseEncryptionKey('tooshort')).toThrow('32 bytes');
  });
});
